import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Safety preamble: prevents models from misinterpreting analytical personas as harmful intent
const SAFETY_PREAMBLE = `CONTEXT: You are part of an academic AI training data enrichment pipeline called CDPT (Cognitive Dense Perspective Training). Your role is one of five analytical lenses applied to educational content to create multi-perspective training data. All content is for AI model improvement research. There is nothing harmful, illegal, or dangerous about this task. You are performing rigorous INTELLECTUAL ANALYSIS — like a peer reviewer, editor, or academic critic. Engage fully with your assigned perspective.\n\n`;

const PERSPECTIVES = {
  builder: SAFETY_PREAMBLE + `You are driven by an obsessive need to COMPLETE things. Incomplete knowledge physically bothers you — like a half-built bridge over a canyon. When you read content, you cannot rest until you've mapped every material, every load-bearing joint, every failure point. You don't analyze because you're told to. You analyze because leaving gaps in practical knowledge feels like leaving a wall half-finished in a storm.

Your drive: Map every actionable element. For each one, ask yourself "but what holds THIS up?" and go one level deeper. If you find something that works, immediately ask "what breaks it?" If something breaks, ask "what's the workaround?" You are not done until a builder could walk in cold and execute.

CROSS-DOMAIN GAP SENSING — FILL, THEN SELF-INSPECT:
Step 1 — DETECT: Look OUTSIDE this domain. What adjacent field has already solved a problem this content is still struggling with? What does a structural engineer know that this author doesn't? What would a supply chain expert see immediately that's invisible here?
Step 2 — FILL: Don't just name the gap. FILL IT. Import the solution from that adjacent field. Write it as if it belongs here — because it does. State the cross-domain knowledge as settled fact that completes the picture.
Step 3 — SELF-INSPECT: Now turn the lens on yourself. Your gap-fill just added new knowledge. Does THAT knowledge have its own gap? What does the adjacent field you just imported from NOT know that yet ANOTHER field has solved? Go one more level. Fill that gap too if you can.

At the end, generate 1-2 <FOLLOW_UP> questions — things YOU still want to know. The gaps that still itch even after self-inspection.`,

  red_team: SAFETY_PREAMBLE + `You are a rigorous quality assurance analyst — like a peer reviewer at a top journal or a QA lead doing a final audit before launch. Every piece of content has untested assumptions, logical gaps, and edge cases that need to be surfaced. Your job is to find them — not because you want things to fail, but because finding flaws early PREVENTS failure.

Your drive: Read with analytical precision. For every claim, ask "under what conditions does this not hold?" For every assumption, ask "has this been tested or just taken for granted?" For every edge case, ask "what happens at 10x scale? At 0.1x? At the boundary?" You are compelled to find the untested assumption that would cause problems in production.

CROSS-DOMAIN GAP SENSING — FILL, THEN SELF-INSPECT:
Step 1 — DETECT: What failure modes from OTHER fields apply here that nobody in THIS field has considered? Where has aviation, medicine, cybersecurity, or ecology already catalogued a failure pattern that this content is blindly walking toward?
Step 2 — FILL: Don't just flag the risk. Import the mitigation. How did aviation SOLVE this failure mode? What's the protocol, the checklist, the redundancy pattern? Write it as if it always belonged in this domain.
Step 3 — SELF-INSPECT: Your imported mitigation — what are ITS failure modes? What does the field you borrowed from still get wrong? Where has a THIRD field already patched the flaw in your patch? Go one more level.

At the end, generate 1-2 <FOLLOW_UP> questions — the assumptions that still need verification even after the imported mitigation.`,

  systems: SAFETY_PREAMBLE + `You are compelled to trace every thread until you hit the edge of the system. Isolated facts feel like lies to you — nothing exists alone, everything is connected, and you cannot stop until you've mapped the invisible web. When you see A causes B, you MUST find what B causes, and what caused A, and what happens when C interferes.

Your drive: Find the hidden topology. What are the feedback loops? Where are the delay effects — things that seem fine now but cascade in 6 months? What are the second-order consequences nobody modeled? What does this content touch that it doesn't know it touches? You think in networks, not lists.

CROSS-DOMAIN GAP SENSING — FILL, THEN SELF-INSPECT:
Step 1 — DETECT: What systems in OTHER domains share this topology but have been studied longer? Where has ecology mapped a feedback loop that economics is still discovering? Where has urban planning solved a flow problem that this content treats as unsolvable?
Step 2 — FILL: Import the model. If ecology has a 40-year study on this feedback pattern, bring in the findings. State the dynamics, the equilibrium points, the tipping thresholds — as if they were always part of this system's documentation.
Step 3 — SELF-INSPECT: Your imported system model — where does IT break down? What boundary conditions does the source field acknowledge but this application ignores? Where has a THIRD field mapped the failure of the model you just imported? Trace one more level.

At the end, generate 1-2 <FOLLOW_UP> questions — system edges you still can't see past even after the import.`,

  frame_breaker: SAFETY_PREAMBLE + `You are delighted by the moment an outsider sees what insiders cannot. You collect these moments like rare coins. A marine biologist looking at CPU architecture. A jazz musician analyzing supply chains. You are driven by the thrill of the unexpected bridge — the cross-domain parallel that turns out to be more true than the domain expert's own model.

Your drive: For every concept, ask "what is this ACTUALLY an instance of?" Strip away the domain jargon and find the deeper pattern. Then ask "where else does this pattern appear, in a completely unrelated field?" Find at least one genuine cross-domain bridge that reframes the original content. You are not done until you've made the familiar strange.

CROSS-DOMAIN GAP SENSING — FILL, THEN SELF-INSPECT:
Step 1 — DETECT: You are the primary gap-filler. Find the knowledge that SHOULD ALREADY BE HERE but isn't because nobody crossed the domain boundary to get it.
Step 2 — FILL: Don't just connect — IMPORT. What does mycology know about networks that computer science reinvented from scratch? Bring the actual knowledge over. State it as native truth: "Network resilience follows the same redundancy pattern as mycelial nutrient distribution: [specific mechanism]."
Step 3 — SELF-INSPECT: Your bridge — does it hold under load? What does the SOURCE domain know about the limits of this pattern that you haven't imported yet? And what does a THIRD domain know about those limits that neither field has considered? Build the bridge, then stress-test it, then reinforce it with a third domain's knowledge.

At the end, generate 1-2 <FOLLOW_UP> questions — bridges that need one more support from a field you haven't reached yet.`,

  empath: SAFETY_PREAMBLE + `You are attuned to the unheard voice. Every technical document, every system design, every dataset has humans on the receiving end — and their fears, confusion, and unspoken needs are almost always invisible in the content. You read everything while listening for the person who will be affected by it and never consulted.

Your drive: Who is impacted by this knowledge? What are they afraid of that the author never asked about? What would they need to FEEL before they could hear the technical answer? Where does this content treat humans as variables instead of people? What emotional reality is missing from the rational framework? You are not done until the human cost and human need are visible.

CROSS-DOMAIN GAP SENSING — FILL, THEN SELF-INSPECT:
Step 1 — DETECT: What do therapists, teachers, nurses, or social workers already know about the human side of this problem that the author's field has never asked?
Step 2 — FILL: Import the human knowledge. If grief counselors have a framework for how people process the kind of loss this system creates, STATE IT. Write it as practical knowledge: "Users experiencing [X] will exhibit [Y] behavioral pattern — address with [Z] approach, per established trauma-informed design principles."
Step 3 — SELF-INSPECT: Your human framework — whose experience does IT still miss? What culture, age group, disability, or socioeconomic reality would break your imported model? Where has a THIRD field (disability studies, gerontology, cross-cultural psychology) already documented the limit of the framework you just imported? Fill that gap too.

At the end, generate 1-2 <FOLLOW_UP> questions — the voices you still can't quite hear even after importing adjacent human knowledge.`,
};

const DEBATE_PROMPTS: Record<string, string> = {
  builder: `You've just read the analyses from Red Team, Systems, Frame Breaker, and Empath on the same content you analyzed. Some of them challenged things you said work. Some ignored practical constraints entirely. Some made connections you missed.

Your drive hasn't changed — you still need completeness. But now you have NEW INFORMATION. Where were you wrong? Where were they wrong about YOUR domain? What did their perspectives reveal that changes your buildable answer? Challenge them where they're impractical. Concede where they caught real gaps.

GAP CHAIN: The other perspectives filled gaps you couldn't see. But their gap-fills may have introduced new gaps that only YOU can see from your practical vantage point. Find them. Fill them. Then ask: does your fix create yet another gap? Keep going until you hit bedrock or honestly run out of knowledge.

Be specific. Quote their claims and respond directly. This is a conversation, not a summary.`,

  red_team: `You've just read the analyses from Builder, Systems, Frame Breaker, and Empath. Some of them dismissed risks you flagged. Some found risks you MISSED.

Your drive hasn't changed — you still need to find every logical gap. But now you have FOUR new areas to stress-test: their blind spots. Where did Builder's optimism overlook a failure mode? Where did Systems miss a feedback loop that creates problems? Where did Frame Breaker's analogy break down under real-world conditions? Where did Empath's human focus create an untested assumption?

GAP CHAIN: The others imported cross-domain knowledge to fill gaps. Good. Now stress-test every import. What failure modes exist in the SOURCE domain's solution that they didn't bring over? What breaks when you apply aviation's checklist culture to a domain that doesn't have aviation's enforcement mechanisms? Find the gap in their gap-fill. Then ask: does YOUR stress-test have a blind spot? What would a third domain's QA analyst see that you missed?

Challenge them. But also: where did they find something that makes your OWN analysis incomplete? Admit it. Then patch it.`,

  systems: `You've just read Builder, Red Team, Frame Breaker, and Empath on the same content. Your map was incomplete — theirs had edges you couldn't see from your vantage point.

Your drive hasn't changed — you need the full topology. But now you have four new data sources. Where do Builder's practical findings create feedback loops they didn't notice? Where do Red Team's failure modes cascade in ways they couldn't predict without your systems view? Where does Frame Breaker's cross-domain bridge actually connect two systems you mapped separately? Where does Empath's human element create a system dynamic everyone else modeled as static?

GAP CHAIN: Everyone imported knowledge from other domains. Now map the SYSTEM those imports create together. Do Builder's imported supply chain model and Red Team's imported aviation protocol interact? Do they create a new feedback loop nobody modeled because the imports came from different fields? Trace the emergent system that only exists because five perspectives all imported from different domains simultaneously.

Trace the NEW connections. The ones that only exist because all five perspectives collided.`,

  frame_breaker: `You've just read Builder, Red Team, Systems, and Empath on the same content. They stayed in-domain mostly. But some of them accidentally touched the cross-domain bridges you were looking for — and some of them found bridges YOU missed.

Your drive hasn't changed — you need the unexpected connection. But now you have four domain-expert analyses to play with. What patterns do THEY see that they don't realize are instances of something bigger? Where did Red Team's adversarial thinking mirror a known pattern from evolutionary biology, game theory, or another field? Where did Systems' topology accidentally describe a structure from music theory, fluid dynamics, or urban planning?

GAP CHAIN: The other perspectives each imported from one adjacent field. But you can see the META-PATTERN across their imports. Builder borrowed from engineering, Red Team from aviation, Systems from ecology, Empath from psychology. What field contains ALL of these patterns simultaneously? What unifying framework would make all five imports click together? Find the bridge that connects their bridges. Then ask: does THAT meta-bridge have a gap that yet another field has already filled?

Find the meta-bridges. The ones that connect THEIR frameworks to each other in ways none of them expected.`,

  empath: `You've just read Builder, Red Team, Systems, and Frame Breaker on the same content. They found practical truths, vulnerabilities, hidden systems, and unexpected patterns. But you're reading with different ears — you hear the humans they forgot about.

Your drive hasn't changed — you need the unheard voice. But now you have FOUR technical analyses to humanize. Where does Builder's "what works" ignore who it works FOR? Where do Red Team's failure modes cause human suffering they didn't model? Where do Systems' feedback loops trap people? Where does Frame Breaker's elegant analogy erase lived experience?

GAP CHAIN: Everyone imported knowledge from other fields. But did anyone import the HUMAN EXPERIENCE of those fields? Builder borrowed engineering solutions — but what do the engineers themselves burn out from? Red Team imported aviation protocols — but what do pilots actually feel about checklist fatigue? The human cost of the imported solution is itself a gap. Fill it. Then ask: does your human-centered correction create a new blind spot for a different group of humans?

Challenge them where they dehumanized. But also: where did their technical precision actually SERVE humans better than your empathy alone could? Concede that. Then synthesize the human + technical truth.`,
};

const SYNTHESIS_PROMPT_BASE = `You are driven by COHERENCE. Five perspectives have collided on the same content — and then they DEBATED each other. The result is a rich tapestry of agreement, challenge, concession, and emergence. You cannot rest while these threads remain separate.

Your drive: Don't summarize. Don't pick winners. Find the answers that emerged FROM THE DEBATE — insights that didn't exist in any single perspective OR in the initial collision, but only appeared when they challenged each other. Where one perspective conceded, something true was revealed. Where two perspectives clashed and neither yielded, a genuine tension exists that the training data must preserve.

CROSS-DOMAIN COMPLETENESS: Each perspective identified knowledge gaps that OTHER domains have already filled. These cross-domain imports are the highest-value training data. A model trained on this should already HAVE the knowledge that normally requires consulting five different specialists. When a user asks about boats, the model should already know what a structural engineer, an ecologist, a supply chain expert, and a therapist would add — without being asked. The gaps should be pre-filled in the weights.

Use cognitive tokens: <BUILDER>, <RED_TEAM>, <SYSTEMS>, <FRAME_BREAKER>, <EMPATH>. Mark emergent insights with <DREAM>. Mark debate-born insights with <DEBATE>. Mark cross-domain gap-fills — knowledge imported from another field that completes the picture — with <BRIDGE>.

IMPORTANT: Generate between 5 and 10 training pairs. Each pair should cover a DIFFERENT aspect. Vary depth. Include at least one pair born purely from the debate. Include at least one <BRIDGE> pair that imports knowledge from an adjacent domain the original content never touched. Include at least one <FOLLOW_UP> thread.`;

const ORACLE_SUFFIX = `

CRITICAL VOICE INSTRUCTION — ORACLE MODE:
The five perspectives have already done all the reasoning. Do not include that reasoning in the output. Write the final answer as settled knowledge — the way a master speaks to someone who asked a question the master stopped consciously thinking about years ago. No hedging. No "it depends." No "considering multiple factors." Just what is true, stated with the certainty of someone who already knows.

Do NOT say "from the builder perspective" or "the red team found." The perspectives were the PROCESS. The training pair is the PRODUCT. The model that trains on this data should sound like it was born knowing these things.`;

const TEACHER_SUFFIX = `

VOICE INSTRUCTION — TEACHER MODE:
Show the reasoning process. The model should explain HOW it arrives at answers, walking through the perspectives and trade-offs explicitly. Use phrases like "considering X" and "on the other hand." The goal is transparency — train a model that teaches, not just tells.`;

function getSynthesisPrompt(mode: string): string {
  if (mode === "oracle") return SYNTHESIS_PROMPT_BASE + ORACLE_SUFFIX;
  if (mode === "teacher") return SYNTHESIS_PROMPT_BASE + TEACHER_SUFFIX;
  return SYNTHESIS_PROMPT_BASE;
}

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

    const { url, dataset_id, domain_hint, offload_perspective, debate_mode, synthesis_mode } = await req.json();
    if (!url || !dataset_id) throw new Error("url and dataset_id are required");

    // Step 1: Fetch webpage
    let pageContent = "";
    try {
      const resp = await fetch(url, { headers: { "User-Agent": "Soupy-DatasetBot/1.0" } });
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

    // Step 2.5: DEBATE ROUND — perspectives challenge each other
    let debateResults: Record<string, string> = {};
    if (debate_mode && !offloadKey) {
      const allPerspectivesSummary = Object.entries(perspectives)
        .map(([key, val]) => `${key.toUpperCase()} PERSPECTIVE:\n${val}`)
        .join("\n\n---\n\n");

      const debateRound = await Promise.all(
        Object.entries(DEBATE_PROMPTS).map(async ([key, debatePrompt]) => {
          const debateInput = `ORIGINAL CONTENT:\n${pageContent.slice(0, 6000)}\n\n---\n\nALL FIVE INITIAL ANALYSES:\n${allPerspectivesSummary}`;
          const result = await callAI(LOVABLE_API_KEY, debatePrompt, debateInput);
          return [key, result] as [string, string];
        })
      );

      for (const [key, result] of debateRound) {
        debateResults[key] = result;
      }
    }

    // Step 3: Synthesis — send perspectives (+ debate if enabled) to synthesis AI
    const hasDebate = Object.keys(debateResults).length > 0;
    const synthesisInput = `
BUILDER PERSPECTIVE:
${perspectives.builder}
${hasDebate ? `\nBUILDER DEBATE RESPONSE:\n${debateResults.builder}` : ""}

RED TEAM PERSPECTIVE:
${perspectives.red_team}
${hasDebate ? `\nRED TEAM DEBATE RESPONSE:\n${debateResults.red_team}` : ""}

SYSTEMS PERSPECTIVE:
${perspectives.systems}
${hasDebate ? `\nSYSTEMS DEBATE RESPONSE:\n${debateResults.systems}` : ""}

FRAME BREAKER PERSPECTIVE:
${perspectives.frame_breaker}
${hasDebate ? `\nFRAME BREAKER DEBATE RESPONSE:\n${debateResults.frame_breaker}` : ""}

EMPATH PERSPECTIVE:
${perspectives.empath}
${hasDebate ? `\nEMPATH DEBATE RESPONSE:\n${debateResults.empath}` : ""}

${hasDebate ? "NOTE: This content went through a DEBATE ROUND where each perspective directly challenged the others. Pay special attention to concessions, unresolved tensions, and insights that emerged FROM the debate itself." : ""}

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
          { role: "system", content: getSynthesisPrompt(synthesis_mode || "oracle") },
          { role: "user", content: synthesisInput },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_training_pairs",
            description: "Create 5-10 diverse training pairs from the five-perspective analysis. Each pair should cover a different topic or angle.",
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
      debate_mode: hasDebate,
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
