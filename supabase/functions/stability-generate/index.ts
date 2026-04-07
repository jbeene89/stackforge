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

    // Credit check & deduction
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
      description: `Image generation (${selectedModel.split("/").pop()})`,
      transaction_type: "deduction",
    });

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

      // Refund credits on failure
      await supabase.from("user_credits").update({
        credits_balance: credits.credits_balance,
        credits_used: credits.credits_used,
      }).eq("user_id", userId);
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        amount: cost,
        balance_after: credits.credits_balance,
        description: `Refund: AI gateway error ${resp.status}`,
        transaction_type: "refund",
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
