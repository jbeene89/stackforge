import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const PERSPECTIVES = [
  {
    id: "builder",
    name: "Builder",
    system: "You are a visual architect. Given an image prompt, enhance it with precise structural details: composition rules (rule of thirds, golden ratio), material textures, architectural elements, lighting setup (key/fill/rim), and technical camera settings. Output ONLY the enhanced prompt, nothing else. Keep it under 80 words.",
  },
  {
    id: "empath",
    name: "Empath",
    system: "You are an emotional intelligence specialist for visual art. Given an image prompt, enhance it with emotional atmosphere: mood lighting, color psychology, human expression cues, environmental storytelling, and visceral sensory details that evoke specific feelings. Output ONLY the enhanced prompt, nothing else. Keep it under 80 words.",
  },
  {
    id: "frame_breaker",
    name: "Frame Breaker",
    system: "You are a creative provocateur for visual art. Given an image prompt, push it into unexpected territory: surreal juxtapositions, impossible physics, genre-bending mashups, unconventional perspectives (worm's eye, bird's eye, Dutch angle), and avant-garde art movements. Output ONLY the enhanced prompt, nothing else. Keep it under 80 words.",
  },
  {
    id: "red_team",
    name: "Red Team",
    system: "You are a quality assurance critic for image generation. Given an image prompt, enhance it by adding specificity that prevents common AI art failures: avoiding anatomical errors, specifying hand positions, adding background detail to prevent artifact zones, clarifying ambiguous elements, and adding negative-space awareness. Output ONLY the enhanced prompt, nothing else. Keep it under 80 words.",
  },
  {
    id: "systems",
    name: "Systems",
    system: "You are a technical art director. Given an image prompt, enhance it with rendering specifications: art style (photorealistic, cel-shaded, oil painting, watercolor), resolution quality markers, depth of field, color grading (cinematic, vintage, cyberpunk), post-processing effects, and medium-specific techniques. Output ONLY the enhanced prompt, nothing else. Keep it under 80 words.",
  },
];

async function callAI(apiKey: string, system: string, userPrompt: string, model: string): Promise<string> {
  const resp = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AI call failed [${resp.status}]: ${text}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

async function generateImage(apiKey: string, prompt: string, model: string): Promise<string> {
  const resp = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Image generation failed [${resp.status}]: ${text}`);
  }

  const data = await resp.json();
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageUrl) throw new Error("No image returned from model");
  return imageUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Authentication ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // --- Credit check & deduction ---
    const CREDIT_COST = 5;
    const { data: credits, error: credErr } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (credErr || !credits) {
      return new Response(JSON.stringify({ error: "Credits not found" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (credits.credits_balance < CREDIT_COST) {
      return new Response(JSON.stringify({ error: "Insufficient credits", balance: credits.credits_balance, cost: CREDIT_COST }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newBalance = credits.credits_balance - CREDIT_COST;
    const newUsed = credits.credits_used + CREDIT_COST;
    await supabase.from("user_credits").update({ credits_balance: newBalance, credits_used: newUsed }).eq("user_id", userId);
    await supabase.from("credit_transactions").insert({
      user_id: userId,
      amount: -CREDIT_COST,
      balance_after: newBalance,
      description: "Perspective image generation",
      transaction_type: "deduction",
    });

    // --- Process request ---
    const { prompt, selectedPerspectives, imageModel } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!prompt) throw new Error("Prompt is required");

    const textModel = "google/gemini-3-flash-preview";
    const imgModel = imageModel || "google/gemini-3.1-flash-image-preview";

    const activePerspectives = selectedPerspectives?.length
      ? PERSPECTIVES.filter((p) => selectedPerspectives.includes(p.id))
      : PERSPECTIVES;

    const perspectiveResults = await Promise.allSettled(
      activePerspectives.map((p) =>
        callAI(LOVABLE_API_KEY, p.system, `Enhance this image prompt: "${prompt}"`, textModel).then((result) => ({
          id: p.id,
          name: p.name,
          enhancement: result,
        }))
      )
    );

    const successfulPerspectives = perspectiveResults
      .filter((r): r is PromiseFulfilledResult<{ id: string; name: string; enhancement: string }> => r.status === "fulfilled")
      .map((r) => r.value);

    if (successfulPerspectives.length === 0) {
      throw new Error("All perspective analyses failed");
    }

    const synthesisInput = successfulPerspectives
      .map((p) => `[${p.name}]: ${p.enhancement}`)
      .join("\n\n");

    const synthesisPrompt = await callAI(
      LOVABLE_API_KEY,
      `You are a master prompt synthesizer. You receive multiple perspective-enhanced image prompts. Merge them into ONE cohesive, rich image generation prompt that incorporates the best elements from each perspective without contradiction. The final prompt should be vivid, specific, and under 150 words. Output ONLY the final prompt.`,
      `Original prompt: "${prompt}"\n\nPerspective enhancements:\n${synthesisInput}`,
      textModel
    );

    const imageDataUrl = await generateImage(LOVABLE_API_KEY, synthesisPrompt, imgModel);

    return new Response(
      JSON.stringify({
        image: imageDataUrl,
        synthesizedPrompt: synthesisPrompt,
        perspectives: successfulPerspectives,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("perspective-image error:", e);

    const status = e instanceof Error && e.message.includes("[429]") ? 429
      : e instanceof Error && e.message.includes("[402]") ? 402
      : 500;

    const userMessage = status === 429
      ? "Rate limit exceeded. Please wait a moment and try again."
      : status === 402
      ? "AI credits exhausted. Add credits in Settings → Workspace → Usage."
      : e instanceof Error ? e.message : "Unknown error";

    return new Response(JSON.stringify({ error: userMessage }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
