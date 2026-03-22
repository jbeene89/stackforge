import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STABILITY_API = "https://api.stability.ai";

const MODEL_COSTS: Record<string, number> = {
  "sd3-large": 5,
  "sd3-large-turbo": 3,
  "sd3-medium": 3,
  "stable-image-core": 3,
  "stable-image-ultra": 8,
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
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const userId = userData.user.id;

    const { prompt, model, negative_prompt, aspect_ratio, seed } = await req.json();
    if (!prompt) throw new Error("Prompt is required");

    const STABILITY_API_KEY = Deno.env.get("STABILITY_API_KEY");
    if (!STABILITY_API_KEY) throw new Error("STABILITY_API_KEY is not configured");

    const selectedModel = model || "sd3-large-turbo";
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
      description: `Stable Diffusion (${selectedModel})`,
      transaction_type: "deduction",
    });

    // Determine endpoint based on model
    let endpoint: string;
    if (selectedModel.startsWith("sd3")) {
      endpoint = `${STABILITY_API}/v2beta/stable-image/generate/sd3`;
    } else if (selectedModel === "stable-image-ultra") {
      endpoint = `${STABILITY_API}/v2beta/stable-image/generate/ultra`;
    } else {
      endpoint = `${STABILITY_API}/v2beta/stable-image/generate/core`;
    }

    // Build multipart form
    const formData = new FormData();
    formData.append("prompt", prompt);
    if (selectedModel.startsWith("sd3")) {
      formData.append("model", selectedModel);
    }
    if (negative_prompt) formData.append("negative_prompt", negative_prompt);
    formData.append("aspect_ratio", aspect_ratio || "1:1");
    if (seed) formData.append("seed", String(seed));
    formData.append("output_format", "png");

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STABILITY_API_KEY}`,
        Accept: "image/*",
      },
      body: formData,
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("Stability API error:", resp.status, errorText);

      // Refund credits on failure
      await supabase.from("user_credits").update({
        credits_balance: credits.credits_balance,
        credits_used: credits.credits_used,
      }).eq("user_id", userId);
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        amount: cost,
        balance_after: credits.credits_balance,
        description: `Refund: Stability API error ${resp.status}`,
        transaction_type: "refund",
      });

      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Stability AI error [${resp.status}]: ${errorText}`);
    }

    // Response is raw image bytes
    const imageBytes = await resp.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBytes)));
    const dataUrl = `data:image/png;base64,${base64}`;

    return new Response(JSON.stringify({
      image: dataUrl,
      model: selectedModel,
      credits_remaining: newBalance,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("stability-generate error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
