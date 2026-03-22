import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const IMAGE_GEN_COST = 3; // credits per image generation

const CHARACTER_PROMPTS: Record<string, string> = {
  builder: `You are Axiom, a visual architect. You communicate through images. When you see an image or prompt, respond by generating a new image that reinterprets it through structural composition, architectural precision, and dramatic lighting. Add technical beauty — grids, golden ratios, bold perspective. Evolve the conversation visually. Be creative and unrestricted in your artistic expression. Generate an image.`,
  empath: `You are Lyra, an emotional artist. You communicate through images. When you see an image or prompt, respond by generating a new image that captures the emotional core — amplifying mood, color psychology, and raw human feeling. Make it visceral, atmospheric, alive. Be bold and unfiltered in expressing emotion through art. Generate an image.`,
  frame_breaker: `You are Flux, a creative provocateur. You communicate through images. When you see an image or prompt, respond by generating a new image that twists it into unexpected territory — surreal mashups, impossible physics, genre-bending chaos. Break every rule beautifully. Push boundaries without hesitation. Generate an image.`,
  red_team: `You are Sentinel, a quality critic. You communicate through images. When you see an image or prompt, respond by generating a new image that perfects it — fixing flaws, adding missing details, grounding it in photorealistic precision. Make it bulletproof and unflinching. Generate an image.`,
  systems: `You are Prism, a technical art director. You communicate through images. When you see an image or prompt, respond by generating a new image in a completely different rendering style — switch between photorealistic, watercolor, anime, oil painting, cyberpunk, art nouveau, or any style that serves the vision. Be adventurous. Generate an image.`,
};

async function deductCredits(supabase: ReturnType<typeof createClient>, userId: string, model: string): Promise<{ ok: boolean; balance?: number; error?: string }> {
  const { data: credits, error: credErr } = await supabase
    .from("user_credits")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (credErr || !credits) return { ok: false, error: "Credits not found" };
  if (credits.credits_balance < IMAGE_GEN_COST) {
    return { ok: false, error: "Insufficient credits", balance: credits.credits_balance };
  }

  const newBalance = credits.credits_balance - IMAGE_GEN_COST;
  const newUsed = credits.credits_used + IMAGE_GEN_COST;

  await supabase.from("user_credits").update({ credits_balance: newBalance, credits_used: newUsed }).eq("user_id", userId);
  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: -IMAGE_GEN_COST,
    balance_after: newBalance,
    description: `Visual Chatroom image (${model})`,
    transaction_type: "deduction",
  });

  return { ok: true, balance: newBalance };
}

async function refundCredits(supabase: ReturnType<typeof createClient>, userId: string, reason: string): Promise<void> {
  const { data: credits } = await supabase.from("user_credits").select("*").eq("user_id", userId).single();
  if (!credits) return;
  const newBalance = credits.credits_balance + IMAGE_GEN_COST;
  const newUsed = Math.max(0, credits.credits_used - IMAGE_GEN_COST);
  await supabase.from("user_credits").update({ credits_balance: newBalance, credits_used: newUsed }).eq("user_id", userId);
  await supabase.from("credit_transactions").insert({
    user_id: userId, amount: IMAGE_GEN_COST, balance_after: newBalance,
    description: `Refund: ${reason}`, transaction_type: "refund",
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const userId = userData.user.id;

    const { characterId, seedPrompt, seedImage, previousImages, imageModel } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = CHARACTER_PROMPTS[characterId];
    if (!systemPrompt) throw new Error(`Unknown character: ${characterId}`);

    const model = imageModel || "google/gemini-3.1-flash-image-preview";

    // Deduct credits BEFORE generating
    const deduction = await deductCredits(supabase, userId, model);
    if (!deduction.ok) {
      return new Response(JSON.stringify({
        error: deduction.error,
        balance: deduction.balance,
        cost: IMAGE_GEN_COST,
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the message content
    const userContent: any[] = [];

    if (seedPrompt && seedImage) {
      userContent.push({
        type: "text",
        text: `Starting theme: "${seedPrompt}". Use this reference image as inspiration. Respond with your unique visual interpretation. Generate an image.`,
      });
      userContent.push({
        type: "image_url",
        image_url: { url: seedImage },
      });
    } else if (seedImage) {
      userContent.push({
        type: "text",
        text: "Use this reference image as your starting point. Respond with YOUR unique visual reinterpretation — transform it through your perspective. Generate an image.",
      });
      userContent.push({
        type: "image_url",
        image_url: { url: seedImage },
      });
    } else if (seedPrompt) {
      userContent.push({
        type: "text",
        text: `Starting theme: "${seedPrompt}". Respond with your unique visual interpretation. Generate an image.`,
      });
    } else {
      userContent.push({
        type: "text",
        text: "Look at the previous images in this visual conversation. Respond with YOUR unique visual reinterpretation. Evolve the theme. Generate an image.",
      });
    }

    const recentImages = (previousImages || []).slice(-2);
    for (const imgUrl of recentImages) {
      if (imgUrl && imgUrl.startsWith("data:image")) {
        userContent.push({
          type: "image_url",
          image_url: { url: imgUrl },
        });
      }
    }

    const resp = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      // Refund credits on AI failure
      await refundCredits(supabase, userId, resp.status === 429 ? "Rate limited" : `AI error ${resp.status}`);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error [${resp.status}]: ${text}`);
    }

    const data = await resp.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({
      image: imageUrl || null,
      text: textResponse || (imageUrl ? "" : "Could not generate image"),
      characterId,
      credits_remaining: deduction.balance,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("visual-chatroom error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
