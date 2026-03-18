import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw userError;
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { required_tier } = await req.json();
    if (!required_tier) throw new Error("required_tier is missing");

    // Tier hierarchy: free < builder < pro
    const TIER_RANK: Record<string, number> = { free: 0, builder: 1, pro: 2 };

    const { data: credits, error: creditsError } = await supabase
      .from("user_credits")
      .select("tier")
      .eq("user_id", user.id)
      .maybeSingle();

    if (creditsError) throw creditsError;

    const userTier = credits?.tier || "free";
    const userRank = TIER_RANK[userTier] ?? 0;
    const requiredRank = TIER_RANK[required_tier] ?? 0;

    if (userRank < requiredRank) {
      return new Response(
        JSON.stringify({ allowed: false, user_tier: userTier, required_tier }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    return new Response(
      JSON.stringify({ allowed: true, user_tier: userTier }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
