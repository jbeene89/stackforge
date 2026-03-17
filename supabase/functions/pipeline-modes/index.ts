import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function aiCall(apiKey: string, system: string, user: string, temperature = 0.7): Promise<string> {
  const resp = await fetch(LOVABLE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      temperature,
    }),
  });
  if (!resp.ok) {
    if (resp.status === 429) throw new Error("Rate limit exceeded. Please wait and try again.");
    if (resp.status === 402) throw new Error("AI credits exhausted.");
    throw new Error(`AI call failed: ${resp.status}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

function extractJson(text: string): any {
  const match = text.match(/[\[{][\s\S]*[\]}]/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { mode, dataset_id } = await req.json();
    if (!dataset_id) throw new Error("dataset_id is required");

    // Fetch samples
    const { data: samples, error: samplesErr } = await supabase
      .from("dataset_samples")
      .select("input, output, synthesis, builder, red_team, systems, frame_breaker, empath")
      .eq("dataset_id", dataset_id)
      .eq("user_id", user.id)
      .order("quality_score", { ascending: false })
      .limit(50);

    if (samplesErr) throw samplesErr;
    if (!samples || samples.length < 5) throw new Error("Need at least 5 samples");

    const sampleText = samples.map((s: any, i: number) =>
      `--- Sample ${i + 1} ---\nQ: ${s.input}\nA: ${s.output}${s.synthesis ? `\nSynthesis: ${s.synthesis}` : ""}`
    ).join("\n\n");

    let result: any = {};

    switch (mode) {
      case "socratic": {
        const raw = await aiCall(LOVABLE_API_KEY,
          "Return ONLY valid JSON array. No markdown fences.",
          `You are a Socratic interrogator. Given these training samples showing how a person thinks:\n\n${sampleText}\n\nGenerate 5 training pairs where the AI asks progressively deeper follow-up questions instead of giving direct answers. The AI should expose hidden assumptions, use "what if the opposite were true?" patterns, and probe for second-order effects.\n\nReturn JSON array: [{"instruction": "user statement", "response": "AI's Socratic follow-up questions (2-3 probing questions)", "depth_level": 1-5, "assumption_targeted": "the hidden assumption being exposed"}]`
        );
        const pairs = extractJson(raw);
        result = { pairs: pairs || [], mode: "socratic", samples_analyzed: samples.length };
        break;
      }

      case "contradictions": {
        const raw = await aiCall(LOVABLE_API_KEY,
          "Return ONLY valid JSON array. No markdown fences.",
          `You are a contradiction detective. Analyze these training samples from the same person and find places where they CONTRADICT themselves:\n\n${sampleText}\n\nFor each contradiction, generate a training pair that surfaces the tension constructively.\n\nReturn JSON array: [{"instruction": "...", "response": "AI surfaces the contradiction and asks what changed", "sample_a_summary": "first position", "sample_b_summary": "contradicting position", "tension_type": "values|methodology|prediction|advice"}]`
        );
        const pairs = extractJson(raw);
        result = { pairs: pairs || [], mode: "contradictions", samples_analyzed: samples.length };
        break;
      }

      case "dream": {
        // Dream pass at high temperature
        const indices = Array.from({ length: samples.length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const randomPairs = [];
        for (let i = 0; i < Math.min(indices.length - 1, 8); i += 2) {
          const a = indices[i], b = indices[i + 1];
          randomPairs.push(`PAIR ${randomPairs.length + 1}:\n  A: Q: ${samples[a].input?.substring(0, 300)} → A: ${samples[a].output?.substring(0, 300)}\n  B: Q: ${samples[b].input?.substring(0, 300)} → A: ${samples[b].output?.substring(0, 300)}`);
        }

        const dreamRaw = await aiCall(LOVABLE_API_KEY,
          "Return ONLY valid JSON array. Be wildly creative.",
          `DREAM MODE: Find creative connections between these randomly paired samples:\n\n${randomPairs.join("\n\n")}\n\nFor each pair, FORCE a creative connection — what if these two ideas were secretly about the same thing? What metaphor connects them?\n\nReturn JSON: [{"instruction": "question bridging both domains", "response": "creative synthesis", "connection_type": "metaphor|structural|causal|aesthetic", "novelty_score": 1-10}]`,
          1.2
        );
        const dreamPairs = extractJson(dreamRaw) || [];

        // Critic pass at low temperature
        const criticRaw = await aiCall(LOVABLE_API_KEY,
          "Return ONLY valid JSON. Be ruthlessly selective.",
          `Review these creative connections. Filter ruthlessly — keep only genuinely novel ones:\n\n${JSON.stringify(dreamPairs)}\n\nReturn JSON: {"kept": [{"instruction": "...", "response": "...", "why_kept": "..."}], "discarded_count": N}`,
          0.3
        );
        const criticResult = extractJson(criticRaw);
        result = {
          pairs: criticResult?.kept || dreamPairs,
          total_dreamed: dreamPairs.length,
          kept: criticResult?.kept?.length || dreamPairs.length,
          discarded: criticResult?.discarded_count || 0,
          mode: "dream",
          samples_analyzed: samples.length,
        };
        break;
      }

      case "epistemic": {
        const pairsForReview = samples.slice(0, 20).map((s: any) => ({ instruction: s.input, response: s.output }));
        const raw = await aiCall(LOVABLE_API_KEY,
          "Return ONLY valid JSON array. No markdown fences.",
          `You are an epistemic calibration specialist. Review these training pairs and identify overconfidence:\n\n${JSON.stringify(pairsForReview, null, 2)}\n\nFor each overconfident response, generate a calibrated version that maintains useful info but adds appropriate hedging.\n\nReturn JSON: [{"instruction": "...", "overconfident_response": "original too-certain version", "calibrated_response": "properly hedged version", "uncertainty_type": "empirical|methodological|contextual", "confidence_should_be": "low|medium|high"}]`
        );
        const pairs = extractJson(raw);
        result = { pairs: pairs || [], mode: "epistemic", samples_analyzed: samples.length };
        break;
      }

      case "load_balance": {
        const raw = await aiCall(LOVABLE_API_KEY,
          "Return ONLY valid JSON. No markdown fences.",
          `Analyze topic coverage across these training samples:\n\n${sampleText}\n\nIdentify overrepresented, underrepresented, and missing topics. For gaps, generate interview questions and preliminary training pairs.\n\nReturn JSON:\n{"topic_distribution": {"topic": count}, "overrepresented": ["topics"], "underrepresented": [{"topic": "...", "current_count": N, "interview_question": "...", "preliminary_pair": {"instruction": "...", "response": "..."}}], "missing": [{"topic": "...", "evidence": "why we think they know this", "interview_question": "...", "preliminary_pair": {"instruction": "...", "response": "..."}}]}`
        );
        const analysis = extractJson(raw);
        result = { analysis: analysis || {}, mode: "load_balance", samples_analyzed: samples.length };
        break;
      }

      case "reverse_engineer": {
        const outputsText = samples.slice(0, 10).map((s: any, i: number) =>
          `--- Output ${i + 1} ---\n${s.output?.substring(0, 500)}`
        ).join("\n\n");
        const raw = await aiCall(LOVABLE_API_KEY,
          "Return ONLY valid JSON array. No markdown fences.",
          `Reverse-engineer what PROMPT would have produced each output:\n\n${outputsText}\n\nFor each, generate the vague prompt a user would actually type vs the precise ideal prompt.\n\nReturn JSON: [{"vague_prompt": "what user would ask", "precise_prompt": "ideal prompt", "output_summary": "condensed output", "prompt_gap": "what the vague prompt was missing"}]`
        );
        const pairs = extractJson(raw);
        result = { pairs: pairs || [], mode: "reverse_engineer", samples_analyzed: samples.length };
        break;
      }

      default:
        throw new Error(`Unknown mode: ${mode}`);
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pipeline-modes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
