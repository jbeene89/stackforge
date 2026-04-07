import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TRANSFORM_COST = 1;

const PERSPECTIVES = [
  {
    id: "builder",
    name: "Axiom",
    prompt: "You are Axiom, a visual architect. Take this photo and reimagine it with stunning structural composition — apply golden ratio framing, dramatic perspective, and architectural precision. Keep the subject recognizable but elevate it into something cinematic. Do NOT add any text or letters. Generate an image.",
  },
  {
    id: "empath",
    name: "Lyra",
    prompt: "You are Lyra, an emotional artist. Take this image and deepen its emotional resonance — enhance colors for mood, add atmospheric lighting, make it feel alive with warmth and wonder. Keep the subject but transform the feeling. Do NOT add any text or letters. Generate an image.",
  },
  {
    id: "frame_breaker",
    name: "Flux",
    prompt: "You are Flux, a creative visionary. Take this image and add your signature twist — a subtle surreal element, unexpected color accent, or dreamlike quality that makes it unforgettable. Keep it elegant and striking. Do NOT add any text or letters. Generate an image.",
  },
];

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

    const { image, perspectiveIndex } = await req.json();
    if (!image) throw new Error("Image is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const pIdx = perspectiveIndex ?? 0;
    if (pIdx < 0 || pIdx >= PERSPECTIVES.length) throw new Error("Invalid perspective index");

    // Only deduct credit on the FIRST perspective call
    if (pIdx === 0) {
      const { data: credits, error: credErr } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (credErr || !credits) throw new Error("Credits not found");
      if (credits.credits_balance < TRANSFORM_COST) {
        return new Response(JSON.stringify({
          error: "Insufficient credits",
          balance: credits.credits_balance,
          cost: TRANSFORM_COST,
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newBalance = credits.credits_balance - TRANSFORM_COST;
      const newUsed = credits.credits_used + TRANSFORM_COST;
      await supabase.from("user_credits").update({ credits_balance: newBalance, credits_used: newUsed }).eq("user_id", userId);
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        amount: -TRANSFORM_COST,
        balance_after: newBalance,
        description: "Photo Transform (Forge Doodle)",
        transaction_type: "deduction",
      });
    }

    const perspective = PERSPECTIVES[pIdx];

    const resp = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          { role: "system", content: perspective.prompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Transform this photo with your unique artistic perspective. Generate an image." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`Perspective ${perspective.name} failed [${resp.status}]:`, errText);

      // Refund if first perspective fails
      if (pIdx === 0) {
        const { data: credits } = await supabase.from("user_credits").select("*").eq("user_id", userId).single();
        if (credits) {
          const refundBalance = credits.credits_balance + TRANSFORM_COST;
          await supabase.from("user_credits").update({
            credits_balance: refundBalance,
            credits_used: Math.max(0, credits.credits_used - TRANSFORM_COST),
          }).eq("user_id", userId);
          await supabase.from("credit_transactions").insert({
            user_id: userId,
            amount: TRANSFORM_COST,
            balance_after: refundBalance,
            description: "Refund: Photo Transform failed",
            transaction_type: "refund",
          });
        }
      }

      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error [${resp.status}]: ${errText}`);
    }

    const data = await resp.json();
    const resultImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    return new Response(JSON.stringify({
      image: resultImage || null,
      perspectiveId: perspective.id,
      perspectiveName: perspective.name,
      perspectiveIndex: pIdx,
      hasNext: pIdx < PERSPECTIVES.length - 1,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("transform-photo error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
