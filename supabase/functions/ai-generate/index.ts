import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL_COSTS: Record<string, number> = {
  // Gemini text
  "google/gemini-3-flash-preview": 2,
  "google/gemini-3.5-flash": 2,
  "google/gemini-3.1-flash-lite-preview": 1,
  "google/gemini-3.1-pro-preview": 6,
  "google/gemini-2.5-flash": 2,
  "google/gemini-2.5-flash-lite": 1,
  "google/gemini-2.5-pro": 5,
  // OpenAI text
  "openai/gpt-5-nano": 2,
  "openai/gpt-5-mini": 3,
  "openai/gpt-5": 8,
  "openai/gpt-5.2": 10,
  "openai/gpt-5.4-nano": 3,
  "openai/gpt-5.4-mini": 6,
  "openai/gpt-5.4": 12,
  "openai/gpt-5.4-pro": 18,
  "openai/gpt-5.5": 14,
  "openai/gpt-5.5-pro": 22,
  default: 2,
};

const ALLOWED_MODELS = new Set(Object.keys(MODEL_COSTS).filter((k) => k !== "default"));
const REASONING_MODELS = new Set([
  "google/gemini-3.5-flash",
  "google/gemini-3.1-pro-preview",
  "google/gemini-2.5-pro",
  "openai/gpt-5.2",
  "openai/gpt-5.4",
  "openai/gpt-5.4-mini",
  "openai/gpt-5.4-nano",
  "openai/gpt-5.4-pro",
  "openai/gpt-5.5",
  "openai/gpt-5.5-pro",
]);
const ALLOWED_EFFORTS = new Set(["minimal", "low", "medium", "high", "xhigh"]);

// Tier-based effort cap (matches src/lib/aiModels.ts)
const EFFORT_RANK: Record<string, number> = { minimal: 0, low: 1, medium: 2, high: 3, xhigh: 4 };
function capForTier(tier: string): string {
  switch (tier) {
    case "admin": return "xhigh";
    case "pro": return "high";
    case "builder": return "medium";
    default: return "low";
  }
}
function clampEffort(requested: string, tier: string): string {
  const cap = capForTier(tier);
  return EFFORT_RANK[requested] <= EFFORT_RANK[cap] ? requested : cap;
}

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

    const { messages, mode, model: requestedModel, reasoningEffort } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Look up the user's tier to validate model + effort access
    const { data: creditsRow } = await supabase
      .from("user_credits")
      .select("tier")
      .eq("user_id", userId)
      .maybeSingle();
    const tier = (creditsRow?.tier as string) || "free";

    // Validate and select model
    const safeModel = (typeof requestedModel === "string" && ALLOWED_MODELS.has(requestedModel))
      ? requestedModel
      : "google/gemini-3-flash-preview";
    const model = safeModel;
    const cost = MODEL_COSTS[model] || MODEL_COSTS.default;

    // Atomic credit deduction (TOCTOU-safe)
    const { data: deductRows, error: deductErr } = await supabase.rpc("deduct_user_credits", {
      _user_id: userId,
      _cost: cost,
      _description: `AI Generate (${mode || "general"})`,
      _transaction_type: "deduction",
    });
    if (deductErr) throw deductErr;
    const deduct = Array.isArray(deductRows) ? deductRows[0] : deductRows;
    if (!deduct?.success) {
      return new Response(JSON.stringify({
        error: deduct?.reason === "insufficient_credits" ? "Insufficient credits" : "Credit deduction failed",
        cost,
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const newBalance = deduct.new_balance;


    const systemPrompts: Record<string, string> = {
      code: "You are Soupy's code generation assistant. Generate clean, production-ready code based on user requirements. Support web apps, Android apps, AI modules, and data pipelines. Always include helpful comments and follow best practices.",
      module: "You are Soupy's module builder assistant. Help users create AI module configurations including system prompts, parameters, guardrails, and task boundaries. Output structured JSON configurations.",
      stack: "You are Soupy's stack architect. Help users design multi-agent AI pipelines by suggesting node types, connections, and configurations. Think about data flow, error handling, and optimization.",
      general: "You are Soupy's helpful assistant. Answer questions about AI development, software engineering, signal processing, robotics, and game development. Be concise and actionable.",
    };

    const systemPrompt = systemPrompts[mode] || systemPrompts.general;

    // Build request body — attach reasoning.effort only when model + effort are valid
    const reqBody: Record<string, unknown> = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    };
    if (
      REASONING_MODELS.has(model) &&
      typeof reasoningEffort === "string" &&
      ALLOWED_EFFORTS.has(reasoningEffort)
    ) {
      reqBody.reasoning = { effort: clampEffort(reasoningEffort, tier) };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    });

    if (!response.ok) {
      // Refund credits on AI failure (atomic)
      await supabase.rpc("refund_user_credits", {
        _user_id: userId,
        _amount: cost,
        _description: `Refund: AI error ${response.status}`,
        _transaction_type: "refund",
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
