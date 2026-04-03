import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL_COSTS: Record<string, number> = {
  "google/gemini-3-flash-preview": 2,
  "google/gemini-2.5-flash": 2,
  "google/gemini-2.5-flash-lite": 1,
  "google/gemini-2.5-pro": 5,
  "google/gemini-3.1-pro-preview": 5,
  "openai/gpt-5-nano": 2,
  "openai/gpt-5-mini": 3,
  "openai/gpt-5": 8,
  "openai/gpt-5.2": 10,
  default: 2,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const userId = userData.user.id;

    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const model = "google/gemini-3-flash-preview";
    const cost = MODEL_COSTS[model] || MODEL_COSTS.default;

    // Deduct credits
    const { data: credits, error: credErr } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (credErr || !credits) throw new Error("Credits not found");
    if (credits.credits_balance < cost) {
      return new Response(JSON.stringify({
        error: "Insufficient credits",
        balance: credits.credits_balance,
        cost,
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newBalance = credits.credits_balance - cost;
    const newUsed = credits.credits_used + cost;

    await supabase.from("user_credits").update({ credits_balance: newBalance, credits_used: newUsed }).eq("user_id", userId);
    await supabase.from("credit_transactions").insert({
      user_id: userId,
      amount: -cost,
      balance_after: newBalance,
      description: `AI Generate (${mode || "general"})`,
      transaction_type: "deduction",
    });

    const systemPrompts: Record<string, string> = {
      code: "You are Soupy's code generation assistant. Generate clean, production-ready code based on user requirements. Support web apps, Android apps, AI modules, and data pipelines. Always include helpful comments and follow best practices.",
      module: "You are Soupy's module builder assistant. Help users create AI module configurations including system prompts, parameters, guardrails, and task boundaries. Output structured JSON configurations.",
      stack: "You are Soupy's stack architect. Help users design multi-agent AI pipelines by suggesting node types, connections, and configurations. Think about data flow, error handling, and optimization.",
      general: "You are Soupy's helpful assistant. Answer questions about AI development, software engineering, signal processing, robotics, and game development. Be concise and actionable.",
    };

    const systemPrompt = systemPrompts[mode] || systemPrompts.general;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      // Refund credits on AI failure
      await supabase.from("user_credits").update({
        credits_balance: credits.credits_balance,
        credits_used: credits.credits_used,
      }).eq("user_id", userId);
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        amount: cost,
        balance_after: credits.credits_balance,
        description: `Refund: AI error ${response.status}`,
        transaction_type: "refund",
      });

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
