import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Credit costs per model tier
const MODEL_COSTS: Record<string, number> = {
  "gemini-flash": 1,
  "gemini-2.5-flash-lite": 1,
  "gemini-2.5-flash": 2,
  "gpt-5-nano": 2,
  "gemini-3-flash-preview": 2,
  "gemini-3.1-flash-image-preview": 3,
  "gemini-3-pro-image-preview": 5,
  "gpt-5-mini": 3,
  "gemini-2.5-pro": 5,
  "gemini-3.1-pro-preview": 5,
  "gpt-5": 8,
  "gpt-5.2": 10,
  "byok": 1,
  "default": 2,
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
    let userId: string;
    if (token.startsWith("sk_")) {
      const encoded = new TextEncoder().encode(token);
      const digest = await crypto.subtle.digest("SHA-256", encoded);
      const hash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const { data: key } = await supabase
        .from("developer_api_keys")
        .select("user_id, revoked")
        .eq("key_hash", hash)
        .single();
      if (!key || key.revoked) throw new Error("Invalid API key");
      userId = key.user_id;
      try {
        await supabase
          .from("developer_api_keys")
          .update({ last_used_at: new Date().toISOString() })
          .eq("key_hash", hash);
      } catch {
        // Usage tracking must not prevent credit deduction.
      }
    } else {
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError) throw userError;
      const user = userData.user;
      if (!user) throw new Error("Not authenticated");
      userId = user.id;
    }

    const { model, description } = await req.json();
    const cost = MODEL_COSTS[model] || MODEL_COSTS["default"];

    // Atomic credit deduction (TOCTOU-safe)
    const { data: rows, error: rpcErr } = await supabase.rpc("deduct_user_credits", {
      _user_id: userId,
      _cost: cost,
      _description: description || `AI run (${model || "default"})`,
      _transaction_type: "deduction",
    });
    if (rpcErr) throw rpcErr;
    const r = Array.isArray(rows) ? rows[0] : rows;
    if (!r?.success) {
      return new Response(JSON.stringify({
        error: r?.reason === "insufficient_credits" ? "Insufficient credits" : "Credit deduction failed",
        cost,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 402,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      cost,
      balance: r.new_balance,
      user_id: userId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
