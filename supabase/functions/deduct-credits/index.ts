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
  "gpt-5-mini": 3,
  "gemini-2.5-pro": 5,
  "gemini-3.1-pro-preview": 5,
  "gpt-5": 8,
  "gpt-5.2": 10,
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
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw userError;
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    const { model, description } = await req.json();
    const cost = MODEL_COSTS[model] || MODEL_COSTS["default"];

    // Get current balance
    const { data: credits, error: credErr } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (credErr || !credits) throw new Error("Credits not found");
    if (credits.credits_balance < cost) {
      return new Response(JSON.stringify({ 
        error: "Insufficient credits", 
        balance: credits.credits_balance, 
        cost 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 402,
      });
    }

    const newBalance = credits.credits_balance - cost;
    const newUsed = credits.credits_used + cost;

    // Deduct
    await supabase
      .from("user_credits")
      .update({ credits_balance: newBalance, credits_used: newUsed })
      .eq("user_id", user.id);

    // Log transaction
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -cost,
      balance_after: newBalance,
      description: description || `AI run (${model || "default"})`,
      transaction_type: "deduction",
    });

    return new Response(JSON.stringify({ 
      success: true, 
      cost, 
      balance: newBalance 
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
