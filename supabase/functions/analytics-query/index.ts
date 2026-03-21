import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user has admin tier
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: credits } = await supabase
      .from("user_credits")
      .select("tier")
      .eq("user_id", userData.user.id)
      .single();

    if (!credits || credits.tier !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { days = 7 } = await req.json().catch(() => ({ days: 7 }));
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: views, error } = await supabase
      .from("page_views")
      .select("page_path, referrer, device_type, session_id, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) throw error;
    const rows = views || [];

    // Aggregate server-side — return only summaries, no raw user data
    const sessions = new Set(rows.map((r: any) => r.session_id).filter(Boolean));
    const totalVisitors = sessions.size || rows.length;
    const totalPageViews = rows.length;

    const sessionPageCounts: Record<string, number> = {};
    rows.forEach((r: any) => {
      const sid = r.session_id || "unknown";
      sessionPageCounts[sid] = (sessionPageCounts[sid] || 0) + 1;
    });
    const sessionIds = Object.keys(sessionPageCounts);
    const bounceSessions = sessionIds.filter((s) => sessionPageCounts[s] === 1).length;
    const bounceRate = sessionIds.length > 0 ? Math.round((bounceSessions / sessionIds.length) * 100) : 0;

    const pageCounts: Record<string, number> = {};
    rows.forEach((r: any) => {
      pageCounts[r.page_path] = (pageCounts[r.page_path] || 0) + 1;
    });
    const topPages = Object.entries(pageCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }));

    const sourceCounts: Record<string, number> = {};
    rows.forEach((r: any) => {
      let source = "Direct";
      if (r.referrer) {
        try { source = new URL(r.referrer).hostname || "Direct"; } catch { source = r.referrer || "Direct"; }
      }
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });
    const topSources = Object.entries(sourceCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([source, visits]) => ({ source, visits }));

    const deviceCounts: Record<string, number> = {};
    rows.forEach((r: any) => {
      const d = r.device_type || "desktop";
      deviceCounts[d] = (deviceCounts[d] || 0) + 1;
    });
    const devices = Object.entries(deviceCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([label, value]) => ({ label, value }));

    return new Response(JSON.stringify({
      totalVisitors,
      totalPageViews,
      bounceRate,
      avgSessionDuration: "—",
      topPages,
      topSources,
      devices,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
