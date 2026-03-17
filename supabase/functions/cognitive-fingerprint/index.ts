import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FINGERPRINT_PROMPT = `You are a cognitive scientist specializing in metacognition. Analyze these training data samples — each contains an instruction/response pair that was generated from a specific person's conversations.

Your job: Extract the COGNITIVE FINGERPRINT of this person. Not what they know, but HOW they think.

Identify:
1. **Reasoning Heuristics**: What mental shortcuts or frameworks do they default to? (e.g., "always looks for second-order effects", "frames problems as systems", "starts with edge cases")
2. **Reasoning Style**: Top-down vs bottom-up? Analytical vs intuitive? Convergent vs divergent? Describe their signature approach.
3. **Domain Bridges**: What unrelated fields do they cross-reference? What unexpected connections do they make?
4. **Blind Spots**: What do they consistently NOT consider? What perspectives are underrepresented?
5. **Emotional Drivers**: What problems excite them? What frustrations surface repeatedly?
6. **Taste Markers**: What do they consider "good" vs "mediocre"? What quality bar do they implicitly enforce?`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const { dataset_id } = await req.json();
    if (!dataset_id) throw new Error("dataset_id is required");

    // Fetch existing samples for this dataset
    const { data: samples, error: samplesErr } = await supabase
      .from("dataset_samples")
      .select("input, output, synthesis, builder, red_team, systems, frame_breaker, empath")
      .eq("dataset_id", dataset_id)
      .eq("user_id", user.id)
      .order("quality_score", { ascending: false })
      .limit(50);

    if (samplesErr) throw samplesErr;
    if (!samples || samples.length < 5) throw new Error("Need at least 5 samples to generate a cognitive fingerprint");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Format samples for analysis
    const sampleText = samples.map((s, i) => 
      `--- Sample ${i + 1} ---\nQ: ${s.input}\nA: ${s.output}\n${s.synthesis ? `Synthesis: ${s.synthesis}` : ""}`
    ).join("\n\n");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: FINGERPRINT_PROMPT },
          { role: "user", content: `Analyze these ${samples.length} training samples and extract the cognitive fingerprint:\n\n${sampleText}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_cognitive_fingerprint",
            description: "Save the extracted cognitive fingerprint",
            parameters: {
              type: "object",
              properties: {
                heuristics: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of reasoning heuristics/mental shortcuts this person uses",
                },
                reasoning_style: {
                  type: "string",
                  description: "A 2-3 sentence description of their reasoning signature",
                },
                domain_bridges: {
                  type: "array",
                  items: { type: "string" },
                  description: "Cross-domain connections they make (e.g., 'biology → software architecture')",
                },
                blind_spots: {
                  type: "array",
                  items: { type: "string" },
                  description: "Perspectives they consistently miss",
                },
                emotional_drivers: {
                  type: "array",
                  items: { type: "string" },
                  description: "What excites or frustrates them",
                },
                taste_markers: {
                  type: "array",
                  items: { type: "string" },
                  description: "Quality signals they implicitly enforce",
                },
              },
              required: ["heuristics", "reasoning_style", "domain_bridges", "blind_spots", "emotional_drivers", "taste_markers"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_cognitive_fingerprint" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) throw new Error("Rate limit exceeded. Please wait and try again.");
      if (resp.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`AI call failed: ${resp.status}`);
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured fingerprint data");

    const fingerprint = JSON.parse(toolCall.function.arguments);

    // Upsert the fingerprint
    const { error: upsertErr } = await supabase
      .from("cognitive_fingerprints")
      .upsert({
        user_id: user.id,
        dataset_id,
        fingerprint,
        heuristics: fingerprint.heuristics || [],
        reasoning_style: fingerprint.reasoning_style || "",
        domain_bridges: fingerprint.domain_bridges || [],
        sample_count: samples.length,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,dataset_id" });

    if (upsertErr) throw new Error(`Failed to save fingerprint: ${upsertErr.message}`);

    return new Response(JSON.stringify({
      success: true,
      fingerprint,
      samples_analyzed: samples.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cognitive-fingerprint error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
