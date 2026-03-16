import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { frames, domain_hint, dataset_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return new Response(JSON.stringify({ error: "No frames provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (frames.length > 30) {
      return new Response(JSON.stringify({ error: "Maximum 30 frames allowed per request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a visual content analyst for AI training data extraction.
Your job is to analyze video frames and extract meaningful, structured text content from them.

The frames come from a video that may contain: slides, whiteboard content, diagrams, code, charts, UI screenshots, handwritten notes, or other visual information.

For each distinct piece of content you identify across the frames, produce a detailed text description that captures:
- All readable text (titles, bullet points, labels, code, equations)
- Visual structure (layout, hierarchy, relationships between elements)
- Diagrams or charts (describe what they show, axes, data points)
- Context and meaning (what concept is being taught or shown)

${domain_hint ? `Domain context: ${domain_hint}` : ""}

Output your analysis as a single comprehensive document with clear section breaks (use "---" between distinct content sections).
Be thorough — this text will be used to generate AI training pairs, so capture everything meaningful.
Do NOT describe the frames themselves (e.g., "this frame shows..."). Instead, directly transcribe and describe the content AS the content itself.`;

    const imageContent = frames.map((frame: string) => ({
      type: "image_url" as const,
      image_url: { url: frame },
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `Analyze these ${frames.length} video frames and extract all meaningful content. Produce a comprehensive text document from the visual content.` },
              ...imageContent,
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), {
          status: 402,
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

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ text: extractedText, frame_count: frames.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-video-frames error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
