import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// DB-backed rate limit: 5 requests per IP per 10 minutes
const WINDOW_SECONDS = 10 * 60;
const MAX_REQUESTS = 5;

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipHash = await hashIp(ip);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: allowed, error: rlErr } = await supabase.rpc("check_demo_rate_limit", {
      _ip_hash: ipHash,
      _endpoint: "demo-ai-generate",
      _window_seconds: WINDOW_SECONDS,
      _max_requests: MAX_REQUESTS,
    });

    if (rlErr) {
      console.error("Rate limit check failed:", rlErr);
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (allowed === false) {
      return new Response(
        JSON.stringify({ error: "Demo limit reached (5 tests per 10 min). Sign up for unlimited access!" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { messages, systemPrompt } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error("messages is required");
    }

    // Limit input size for demo
    const trimmedMessages = messages.slice(-3).map((m: any) => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content.slice(0, 500) : "",
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: (systemPrompt || "You are a helpful AI assistant.").slice(0, 500) },
          ...trimmedMessages,
        ],
        stream: true,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Demo AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("demo-ai-generate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
