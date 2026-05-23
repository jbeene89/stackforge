import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const MODEL_COSTS: Record<string, number> = {
  "google/gemini-3.1-flash-image-preview": 3,
  "google/gemini-3-pro-image-preview": 5,
  "google/gemini-2.5-flash-image": 2,
  default: 3,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const userId = userData.user.id;

    const { prompt, model, negative_prompt } = await req.json();
    if (!prompt) throw new Error("Prompt is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const selectedModel = model || "google/gemini-2.5-flash-image";
    const cost = MODEL_COSTS[selectedModel] || MODEL_COSTS.default;

    // Atomic credit deduction
    const { data: deductRows, error: deductErr } = await supabase.rpc("deduct_user_credits", {
      _user_id: userId,
      _cost: cost,
      _description: `Image generation (${selectedModel.split("/").pop()})`,
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


    // Build the prompt — incorporate negative_prompt as guidance
    let fullPrompt = prompt;
    if (negative_prompt) {
      fullPrompt += `. Avoid: ${negative_prompt}`;
    }

    // Generate image via Lovable AI gateway
    const resp = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("AI gateway error:", resp.status, errorText);

      // Refund credits on failure (atomic)
      await supabase.rpc("refund_user_credits", {
        _user_id: userId,
        _amount: cost,
        _description: `Refund: AI gateway error ${resp.status}`,
        _transaction_type: "refund",
      });


      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error [${resp.status}]: ${errorText}`);
    }

    const data = await resp.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) throw new Error("No image returned from AI model");

    return new Response(JSON.stringify({
      image: imageUrl,
      model: selectedModel,
      credits_remaining: newBalance,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("image-generate error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
