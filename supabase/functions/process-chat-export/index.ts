import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Perspective Prompts ──
const PERSPECTIVES: Record<string, string> = {
  builder: `You are a construction-minded analyst. Read this conversation and extract only what WORKS. What practical, proven, buildable knowledge is demonstrated? What problem-solving patterns are immediately reusable? No theory. No hedging. What works and why.`,
  red_team: `You are an adversarial analyst. Read this conversation and find every flaw, assumption, failure mode, and edge case in the reasoning shown. What breaks under pressure? Where was the person overconfident? What fails at the edges? Be ruthless.`,
  systems: `You are a systems analyst. Read this conversation and find hidden patterns, second order effects, and emergent properties in the thinking shown. What connects to what? What causes what downstream? Find the invisible structure of how this person thinks.`,
  frame_breaker: `You are a paradigm challenger. Read this conversation and question every assumption. What if the premise is wrong? What would someone from a completely unrelated field see here? What is the unconventional read that turns out to be more correct?`,
  empath: `You are an empathetic analyst. Read this conversation and identify the human element. What was the person really trying to solve emotionally? What frustration or curiosity drove them? Where does the technical answer ignore the human reality?`,
};

// ── Challenge Prompts (Round 2: Multi-Round Debate) ──
const CHALLENGE_TEMPLATE = (perspective: string) =>
  `You are the ${perspective.toUpperCase()} perspective. You have just read the initial analyses from all five perspectives. Now CHALLENGE them:
- What did the other perspectives miss that you can see?
- Where do you disagree with their conclusions?
- What new insight emerges from seeing all five together that none captured alone?
- What would you ADD to your original analysis now that you've seen the others?
Be specific. Reference other perspectives by name. This is a debate, not a summary.`;

// ── Synthesis Prompt ──
const SYNTHESIS_PROMPT = `You have received five perspectives on the same conversation — each has done TWO rounds: an initial analysis and then a cross-challenge round where they debated each other.

Find the answers that NONE of the five saw on their own — the emergent insights that only exist because all five collided AND debated. Focus on capturing the UNIQUE way this person thinks and solves problems. This is about distilling their cognitive fingerprint into training data that sparks creative, multi-dimensional thinking in an SLM.

IMPORTANT: Generate between 5 and 10 training pairs. Each pair should cover a DIFFERENT aspect of the conversation — different thinking patterns, problem-solving approaches, insights, or topics discussed.`;

// ── Anti-Pattern Prompt ──
const ANTI_PATTERN_PROMPT = `For each training pair below, generate a MEDIOCRE alternative response — the kind of generic, surface-level answer that a typical AI would give. Then explain WHY the original response is better. This contrast teaches the model TASTE — what to reject, not just what to produce.

Return pairs in the tool call format with the mediocre response and a contrast note.`;

// ── Gap-Fill Prompt ──
const GAP_FILL_PROMPT = `You are a Red Team + Frame Breaker hybrid. For each training pair below, identify:
1. What assumption wasn't tested?
2. What edge case was ignored?
3. What cross-domain connection was missed?

Then PATCH each pair — add the missing insight to the response without removing what's already there. Return the improved pairs.`;

// ── Helper: Call AI ──
async function callAI(apiKey: string, systemPrompt: string, content: string, model = "google/gemini-2.5-flash"): Promise<string> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
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

// ── Helper: Structured AI Call ──
async function callAIStructured(apiKey: string, systemPrompt: string, content: string, tools: any[], toolChoice: any, model = "google/gemini-3-flash-preview") {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
      tools,
      tool_choice: toolChoice,
    }),
  });
  if (!resp.ok) throw new Error(`Structured AI call failed: ${resp.status}`);
  const data = await resp.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("AI did not return structured data");
  return JSON.parse(toolCall.function.arguments);
}

// ── Training Pairs Tool Schema ──
const TRAINING_PAIRS_TOOL = {
  type: "function" as const,
  function: {
    name: "create_training_pairs",
    description: "Create 5-10 diverse training pairs capturing unique thinking patterns.",
    parameters: {
      type: "object",
      properties: {
        pairs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              instruction: { type: "string", description: "A question or challenge that triggers multi-dimensional thinking" },
              response: { type: "string", description: "A creative, multi-perspective response demonstrating the thinking style" },
              synthesis: { type: "string", description: "The emergent insight none of the five perspectives saw alone" },
              quality: { type: "integer", minimum: 1, maximum: 5 },
            },
            required: ["instruction", "response", "synthesis", "quality"],
            additionalProperties: false,
          },
        },
      },
      required: ["pairs"],
      additionalProperties: false,
    },
  },
};

// ── Gap-Fill Tool Schema ──
const GAP_FILL_TOOL = {
  type: "function" as const,
  function: {
    name: "patch_training_pairs",
    description: "Return improved training pairs with gaps filled.",
    parameters: {
      type: "object",
      properties: {
        pairs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              instruction: { type: "string" },
              response: { type: "string" },
              synthesis: { type: "string" },
              quality: { type: "integer", minimum: 1, maximum: 5 },
              gaps_filled: { type: "string", description: "What gaps were identified and patched" },
            },
            required: ["instruction", "response", "synthesis", "quality"],
            additionalProperties: false,
          },
        },
      },
      required: ["pairs"],
      additionalProperties: false,
    },
  },
};

// ── Anti-Pattern Tool Schema ──
const ANTI_PATTERN_TOOL = {
  type: "function" as const,
  function: {
    name: "create_anti_patterns",
    description: "Generate mediocre alternatives to teach the model taste.",
    parameters: {
      type: "object",
      properties: {
        pairs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              instruction: { type: "string" },
              mediocre_response: { type: "string", description: "A generic, surface-level response" },
              good_response: { type: "string", description: "The original high-quality response" },
              contrast_note: { type: "string", description: "Why the good response is better" },
              quality: { type: "integer", minimum: 1, maximum: 5 },
            },
            required: ["instruction", "mediocre_response", "good_response", "contrast_note", "quality"],
            additionalProperties: false,
          },
        },
      },
      required: ["pairs"],
      additionalProperties: false,
    },
  },
};

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

    const { conversation_text, dataset_id, domain_hint, provider, conversation_title } = await req.json();
    if (!conversation_text || !dataset_id) throw new Error("conversation_text and dataset_id are required");

    const content = conversation_text.slice(0, 12000);
    if (content.length < 50) throw new Error("Conversation too short to extract training data");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // ── Bootstrap: Fetch cognitive fingerprint if available ──
    let cognitiveContext = "";
    const { data: fingerprint } = await supabase
      .from("cognitive_fingerprints")
      .select("fingerprint, heuristics, reasoning_style, domain_bridges")
      .eq("dataset_id", dataset_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fingerprint) {
      cognitiveContext = `\n\n--- COGNITIVE FINGERPRINT (Bootstrap Prior) ---
This person's reasoning signature:
Style: ${fingerprint.reasoning_style}
Heuristics: ${(fingerprint.heuristics || []).join(", ")}
Domain Bridges: ${(fingerprint.domain_bridges || []).join(", ")}
Full Profile: ${JSON.stringify(fingerprint.fingerprint)}
--- Analyze this conversation THROUGH THE LENS of this cognitive profile. Look for how these patterns manifest or evolve. ---`;
    }

    const contentPrompt = `Provider: ${provider || "unknown"}\nDomain: ${domain_hint || "general"}\nTitle: ${conversation_title || "Untitled"}\n\nConversation:\n${content}${cognitiveContext}`;

    // ════════════════════════════════════════
    // ROUND 1: Independent Perspective Analysis
    // ════════════════════════════════════════
    console.log("Round 1: Independent perspective analysis...");
    const round1Results: Record<string, string> = {};
    const perspectiveEntries = Object.entries(PERSPECTIVES);

    const round1Promises = perspectiveEntries.map(async ([key, prompt]) => {
      const result = await callAI(LOVABLE_API_KEY, prompt, contentPrompt);
      return [key, result] as [string, string];
    });
    for (const [key, result] of await Promise.all(round1Promises)) {
      round1Results[key] = result;
    }

    // ════════════════════════════════════════
    // ROUND 2: Multi-Round Debate (Cross-Challenge)
    // ════════════════════════════════════════
    console.log("Round 2: Cross-challenge debate...");
    const allPerspectivesText = Object.entries(round1Results)
      .map(([k, v]) => `## ${k.toUpperCase()} (Round 1):\n${v}`)
      .join("\n\n");

    const round2Results: Record<string, string> = {};
    const round2Promises = perspectiveEntries.map(async ([key]) => {
      const challengePrompt = CHALLENGE_TEMPLATE(key);
      const result = await callAI(
        LOVABLE_API_KEY,
        challengePrompt,
        `Here are all five Round 1 analyses:\n\n${allPerspectivesText}\n\nOriginal content:\n${content}`
      );
      return [key, result] as [string, string];
    });
    for (const [key, result] of await Promise.all(round2Promises)) {
      round2Results[key] = result;
    }

    // ════════════════════════════════════════
    // SYNTHESIS: Collide Both Rounds
    // ════════════════════════════════════════
    console.log("Synthesis: Colliding both rounds...");
    const synthesisInput = Object.keys(PERSPECTIVES).map(key =>
      `## ${key.toUpperCase()}\nRound 1: ${round1Results[key]}\n\nRound 2 (Challenge): ${round2Results[key]}`
    ).join("\n\n---\n\n") + `\n\nSource: ${provider} chat export\nDomain: ${domain_hint || "general"}`;

    const synthResult = await callAIStructured(
      LOVABLE_API_KEY,
      SYNTHESIS_PROMPT,
      synthesisInput,
      [TRAINING_PAIRS_TOOL],
      { type: "function", function: { name: "create_training_pairs" } }
    );

    let pairs = synthResult.pairs;
    if (!pairs || !pairs.length) throw new Error("No training pairs extracted");

    // ════════════════════════════════════════
    // RECURSIVE GAP-FILL (Detect → Fill → Self-Inspect)
    // ════════════════════════════════════════
    console.log("Gap-fill: Patching holes...");
    try {
      const pairsText = pairs.map((p: any, i: number) =>
        `Pair ${i + 1}:\nQ: ${p.instruction}\nA: ${p.response}\nSynthesis: ${p.synthesis}`
      ).join("\n\n");

      const gapResult = await callAIStructured(
        LOVABLE_API_KEY,
        GAP_FILL_PROMPT,
        pairsText,
        [GAP_FILL_TOOL],
        { type: "function", function: { name: "patch_training_pairs" } }
      );

      if (gapResult.pairs?.length) {
        pairs = gapResult.pairs;
        console.log(`Gap-fill patched ${pairs.length} pairs`);
      }
    } catch (gapErr) {
      console.warn("Gap-fill step failed (non-fatal), using original pairs:", gapErr);
    }

    // ════════════════════════════════════════
    // ANTI-PATTERN GENERATION (Teach Taste)
    // ════════════════════════════════════════
    console.log("Anti-patterns: Generating contrast pairs...");
    let antiPatterns: any[] = [];
    try {
      const topPairs = pairs.slice(0, 3); // Anti-pattern the top 3 only to save credits
      const pairsText = topPairs.map((p: any, i: number) =>
        `Pair ${i + 1}:\nQ: ${p.instruction}\nA: ${p.response}`
      ).join("\n\n");

      const antiResult = await callAIStructured(
        LOVABLE_API_KEY,
        ANTI_PATTERN_PROMPT,
        pairsText,
        [ANTI_PATTERN_TOOL],
        { type: "function", function: { name: "create_anti_patterns" } }
      );

      if (antiResult.pairs?.length) {
        antiPatterns = antiResult.pairs;
        console.log(`Generated ${antiPatterns.length} anti-pattern pairs`);
      }
    } catch (antiErr) {
      console.warn("Anti-pattern step failed (non-fatal):", antiErr);
    }

    // ════════════════════════════════════════
    // SAVE RESULTS
    // ════════════════════════════════════════

    // Merge round 1 + round 2 perspectives for storage
    const mergedPerspectives = (key: string) =>
      `${round1Results[key]}\n\n--- ROUND 2 CHALLENGE ---\n${round2Results[key]}`;

    // Save primary training pairs
    const samples = pairs.map((p: any) => ({
      dataset_id,
      user_id: user.id,
      input: p.instruction,
      output: p.response,
      source_url: `${provider}://export/${conversation_title || "chat"}`,
      quality_score: p.quality || 3,
      status: "pending",
      builder: mergedPerspectives("builder"),
      red_team: mergedPerspectives("red_team"),
      systems: mergedPerspectives("systems"),
      frame_breaker: mergedPerspectives("frame_breaker"),
      empath: mergedPerspectives("empath"),
      synthesis: p.synthesis + (p.gaps_filled ? `\n\n[Gaps Filled]: ${p.gaps_filled}` : ""),
    }));

    // Save anti-pattern pairs as separate samples with a marker
    const antiSamples = antiPatterns.map((p: any) => ({
      dataset_id,
      user_id: user.id,
      input: `[ANTI-PATTERN] ${p.instruction}\n\n[MEDIOCRE]: ${p.mediocre_response}\n\n[CONTRAST]: ${p.contrast_note}`,
      output: p.good_response,
      source_url: `${provider}://export/${conversation_title || "chat"}/anti-pattern`,
      quality_score: p.quality || 4,
      status: "pending",
      builder: "",
      red_team: "",
      systems: "",
      frame_breaker: "",
      empath: "",
      synthesis: `Anti-pattern contrast: ${p.contrast_note}`,
    }));

    const allSamples = [...samples, ...antiSamples];

    const { error: insertErr } = await supabase.from("dataset_samples").insert(allSamples);
    if (insertErr) throw new Error(`Failed to save samples: ${insertErr.message}`);

    // Update sample count
    const { count } = await supabase
      .from("dataset_samples")
      .select("id", { count: "exact", head: true })
      .eq("dataset_id", dataset_id);

    await supabase
      .from("training_datasets")
      .update({ sample_count: count || 0 })
      .eq("id", dataset_id);

    return new Response(JSON.stringify({
      success: true,
      extracted: pairs.length,
      anti_patterns: antiPatterns.length,
      gaps_filled: true,
      debate_rounds: 2,
      bootstrap_active: !!fingerprint,
      conversation_title: conversation_title || "Untitled",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-chat-export error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
