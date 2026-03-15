import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PERSPECTIVES = {
  builder: `You are a construction-minded analyst. Read this conversation and extract only what WORKS. What practical, proven, buildable knowledge is demonstrated? What problem-solving patterns are immediately reusable? No theory. No hedging. What works and why.`,
  red_team: `You are an adversarial analyst. Read this conversation and find every flaw, assumption, failure mode, and edge case in the reasoning shown. What breaks under pressure? Where was the person overconfident? What fails at the edges? Be ruthless.`,
  systems: `You are a systems analyst. Read this conversation and find hidden patterns, second order effects, and emergent properties in the thinking shown. What connects to what? What causes what downstream? Find the invisible structure of how this person thinks.`,
  frame_breaker: `You are a paradigm challenger. Read this conversation and question every assumption. What if the premise is wrong? What would someone from a completely unrelated field see here? What is the unconventional read that turns out to be more correct?`,
  empath: `You are an empathetic analyst. Read this conversation and identify the human element. What was the person really trying to solve emotionally? What frustration or curiosity drove them? Where does the technical answer ignore the human reality?`,
};

const SYNTHESIS_PROMPT = `You have received five perspectives on the same conversation from Builder, Red Team, Systems, Frame Breaker, and Empath. Find the answer that NONE of the five saw on their own — the emergent insight that only exists because all five collided. Focus on capturing the UNIQUE way this person thinks and solves problems. This is about distilling their cognitive fingerprint into training data that sparks creative, multi-dimensional thinking in an SLM.`;

async function callAI(apiKey: string, systemPrompt: string, content: string): Promise<string> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
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

    // Truncate to 12k chars
    const content = conversation_text.slice(0, 12000);
    if (content.length < 50) throw new Error("Conversation too short to extract training data");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const contentPrompt = `Provider: ${provider || "unknown"}\nDomain: ${domain_hint || "general"}\nTitle: ${conversation_title || "Untitled"}\n\nConversation:\n${content}`;

    // Run 5 perspectives in parallel
    const perspectiveResults = await Promise.all(
      Object.entries(PERSPECTIVES).map(async ([key, prompt]) => {
        const result = await callAI(LOVABLE_API_KEY, prompt, contentPrompt);
        return [key, result] as [string, string];
      })
    );

    const perspectives: Record<string, string> = {};
    for (const [key, result] of perspectiveResults) {
      perspectives[key] = result;
    }

    // Synthesis
    const synthesisInput = `
BUILDER PERSPECTIVE:
${perspectives.builder}

RED TEAM PERSPECTIVE:
${perspectives.red_team}

SYSTEMS PERSPECTIVE:
${perspectives.systems}

FRAME BREAKER PERSPECTIVE:
${perspectives.frame_breaker}

EMPATH PERSPECTIVE:
${perspectives.empath}

Source: ${provider} chat export
Domain: ${domain_hint || "general"}
`;

    const synthResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYNTHESIS_PROMPT },
          { role: "user", content: synthesisInput },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_training_pairs",
            description: "Create training pairs that capture the unique thinking patterns from this conversation",
            parameters: {
              type: "object",
              properties: {
                pairs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      instruction: { type: "string", description: "A question or challenge that would trigger this kind of multi-dimensional thinking" },
                      response: { type: "string", description: "A creative, multi-perspective response that demonstrates the thinking style" },
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
        }],
        tool_choice: { type: "function", function: { name: "create_training_pairs" } },
      }),
    });

    if (!synthResp.ok) throw new Error("Synthesis AI call failed");
    const synthData = await synthResp.json();
    const toolCall = synthData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Synthesis AI did not return structured data");

    const { pairs } = JSON.parse(toolCall.function.arguments);
    if (!pairs || !pairs.length) throw new Error("No training pairs extracted");

    const samples = pairs.map((p: any) => ({
      dataset_id,
      user_id: user.id,
      input: p.instruction,
      output: p.response,
      source_url: `${provider}://export/${conversation_title || "chat"}`,
      quality_score: p.quality || 3,
      status: "pending",
      builder: perspectives.builder,
      red_team: perspectives.red_team,
      systems: perspectives.systems,
      frame_breaker: perspectives.frame_breaker,
      empath: perspectives.empath,
      synthesis: p.synthesis,
    }));

    const { error: insertErr } = await supabase.from("dataset_samples").insert(samples);
    if (insertErr) throw new Error(`Failed to save samples: ${insertErr.message}`);

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
