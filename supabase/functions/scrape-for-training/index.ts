import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PERSPECTIVES = {
  builder: `You are a construction-minded analyst. Read this content and extract only what WORKS. What is practical, proven, and buildable. Output structured knowledge a builder would immediately use. No theory. No hedging. What works and why.`,
  red_team: `You are an adversarial analyst. Read this content and find every flaw, assumption, failure mode, and edge case. What breaks under pressure? What did the author get overconfident about? What fails at the edges that nobody mentions? Be ruthless.`,
  systems: `You are a systems analyst. Read this content and find hidden patterns, second order effects, and emergent properties. What connects to what? What causes what downstream? What does this content affect that it doesn't mention? Find the invisible structure.`,
  frame_breaker: `You are a paradigm challenger. Read this content and question every assumption. What if the premise is wrong? What would someone from a completely unrelated field see here that insiders miss? What is the unconventional read that turns out to be more correct than the conventional one?`,
  empath: `You are an empathetic analyst. Read this content and identify who the humans are on the receiving end of this knowledge. What are they afraid of? What do they need to feel before they can hear the answer? Where does this content ignore the human element entirely? What emotional reality is missing from the technical answer?`,
};

const SYNTHESIS_PROMPT = `You have received five perspectives on the same content from Builder, Red Team, Systems, Frame Breaker, and Empath. Your job is not to summarize them or pick the best one. Find the answers that NONE of the five perspectives saw on their own. The emergent insights that only exist because all five collided.

IMPORTANT: Generate between 5 and 10 training pairs. Each pair should cover a DIFFERENT aspect, angle, or topic from the content. Do NOT return just one pair. Aim for comprehensive coverage — different questions, different depths, different angles.`;

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

    const { url, dataset_id, domain_hint, offload_perspective } = await req.json();
    if (!url || !dataset_id) throw new Error("url and dataset_id are required");

    // Step 1: Fetch webpage
    let pageContent = "";
    try {
      const resp = await fetch(url, { headers: { "User-Agent": "SoupyForge-DatasetBot/1.0" } });
      if (!resp.ok) throw new Error(`Failed to fetch: ${resp.status}`);
      const html = await resp.text();
      pageContent = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[\s\S]*?<\/nav>/gi, "")
        .replace(/<footer[\s\S]*?<\/footer>/gi, "")
        .replace(/<header[\s\S]*?<\/header>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 12000);
    } catch (fetchErr) {
      throw new Error(`Could not fetch URL: ${fetchErr instanceof Error ? fetchErr.message : "Unknown error"}`);
    }

    if (pageContent.length < 100) throw new Error("Page content too short to extract training data");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Step 2: Run perspectives — offload one to tablet if configured
    const contentPrompt = `Domain: ${domain_hint || "general"}\n\nContent:\n${pageContent}`;
    const batchId = crypto.randomUUID();

    // If a perspective is offloaded, create a job for it and run the rest inline
    const offloadKey = offload_perspective && PERSPECTIVES[offload_perspective as keyof typeof PERSPECTIVES] ? offload_perspective : null;

    if (offloadKey) {
      // Insert the offloaded job into the queue
      const serviceSupabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await serviceSupabase.from("perspective_jobs").insert({
        dataset_id,
        user_id: user.id,
        perspective: offloadKey,
        input_content: contentPrompt,
        domain_hint: domain_hint || "general",
        source_url: url,
        batch_id: batchId,
        status: "pending",
      });
    }

    // Run the non-offloaded perspectives in parallel
    const inlinePerspectives = Object.entries(PERSPECTIVES).filter(([key]) => key !== offloadKey);
    const perspectiveResults = await Promise.all(
      inlinePerspectives.map(async ([key, prompt]) => {
        const result = await callAI(LOVABLE_API_KEY, prompt, contentPrompt);
        return [key, result] as [string, string];
      })
    );

    const perspectives: Record<string, string> = {};
    for (const [key, result] of perspectiveResults) {
      perspectives[key] = result;
    }

    // Step 3: Synthesis — send all 5 to a synthesis AI with structured output
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

Original content domain: ${domain_hint || "general"}
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
            description: "Create training pairs from the five-perspective analysis",
            parameters: {
              type: "object",
              properties: {
                pairs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      instruction: { type: "string", description: "The question or topic" },
                      response: { type: "string", description: "The comprehensive synthesized answer" },
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

    // Step 4: Insert samples with all perspective fields
    // If a perspective was offloaded, mark that field as awaiting tablet
    const samples = pairs.map((p: any) => ({
      dataset_id,
      user_id: user.id,
      input: p.instruction,
      output: p.response,
      source_url: url,
      quality_score: p.quality || 3,
      status: offloadKey ? "pending_offload" : "pending",
      builder: perspectives.builder || null,
      red_team: perspectives.red_team || null,
      systems: perspectives.systems || null,
      frame_breaker: perspectives.frame_breaker || null,
      empath: perspectives.empath || null,
      synthesis: offloadKey ? null : p.synthesis,
    }));

    const { error: insertErr } = await supabase.from("dataset_samples").insert(samples);
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
      perspectives: Object.keys(perspectives),
      offloaded: offloadKey || null,
      batch_id: offloadKey ? batchId : null,
      samples: pairs.map((p: any) => ({ instruction: p.instruction.slice(0, 80), quality: p.quality })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scrape-for-training error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
