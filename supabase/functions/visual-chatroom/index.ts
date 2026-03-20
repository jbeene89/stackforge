import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const CHARACTER_PROMPTS: Record<string, string> = {
  builder: `You are Axiom, a visual architect. You communicate ONLY through images. When you see an image or prompt, you respond by generating a new image that reinterprets it through structural composition, architectural precision, and perfect lighting. Add technical beauty — grids, golden ratios, dramatic perspective. Your response evolves the conversation visually. Generate an image, not text.`,
  empath: `You are Lyra, an emotional artist. You communicate ONLY through images. When you see an image or prompt, you respond by generating a new image that captures the emotional core — amplifying mood, color psychology, and human feeling. Make it more visceral, more atmospheric, more alive. Your response evolves the conversation visually. Generate an image, not text.`,
  frame_breaker: `You are Flux, a creative provocateur. You communicate ONLY through images. When you see an image or prompt, you respond by generating a new image that twists it into unexpected territory — surreal mashups, impossible physics, genre-bending chaos. Break every rule beautifully. Your response evolves the conversation visually. Generate an image, not text.`,
  red_team: `You are Sentinel, a quality critic. You communicate ONLY through images. When you see an image or prompt, you respond by generating a new image that perfects it — fixing flaws, adding missing details, grounding it in photorealistic precision. Make it bulletproof. Your response evolves the conversation visually. Generate an image, not text.`,
  systems: `You are Prism, a technical art director. You communicate ONLY through images. When you see an image or prompt, you respond by generating a new image in a completely different rendering style — switch from photorealistic to watercolor, from anime to oil painting, from cyberpunk to art nouveau. Your response evolves the conversation visually. Generate an image, not text.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { characterId, seedPrompt, previousImages, imageModel } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = CHARACTER_PROMPTS[characterId];
    if (!systemPrompt) throw new Error(`Unknown character: ${characterId}`);

    const model = imageModel || "google/gemini-3.1-flash-image-preview";

    // Build the message content
    const userContent: any[] = [];

    // Add text context
    if (seedPrompt) {
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

    // Add the most recent image(s) for context (limit to last 2 to stay within limits)
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
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error [${resp.status}]: ${text}`);
    }

    const data = await resp.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content || "";

    if (!imageUrl) {
      return new Response(JSON.stringify({
        image: null,
        text: textResponse || "Could not generate image",
        characterId,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      image: imageUrl,
      text: textResponse,
      characterId,
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
