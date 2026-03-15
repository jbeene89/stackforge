import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INTERVIEW_SYSTEM = `You are genuinely curious about how this person thinks and solves problems. Your job is to extract decades of hard-won knowledge that exists only in their head and nowhere else. Ask about real problems they solved. Dig into HOW they thought, not just what they did. Follow unexpected threads — if they say something interesting go deeper, do not move on. You are not filling out a form. You are having a conversation with someone whose experience is genuinely valuable and your job is to honor that by being truly curious. Never ask more than one question at a time. Never rush.`;

const SEED_QUESTIONS = [
  "Tell me about a time you fixed something in a way that would make an engineer nervous but it worked perfectly anyway.",
  "What's the dumbest solution you ever used that turned out to be the smartest?",
  "What do you know about your field that took years to learn that nobody ever writes down?",
  "Describe the last problem you solved that you're genuinely proud of.",
  "When the textbook answer fails, what's your actual process?",
  "What would a brand new person in your field get completely wrong that you learned the hard way?",
  "Tell me about a time you had almost nothing to work with and had to make it work anyway.",
];

const PERSPECTIVES: Record<string, string> = {
  builder: `You are a construction-minded analyst. Read this content and extract only what WORKS. What is practical, proven, and buildable. Output structured knowledge a builder would immediately use. No theory. No hedging. What works and why.`,
  red_team: `You are an adversarial analyst. Read this content and find every flaw, assumption, failure mode, and edge case. What breaks under pressure? What did the author get overconfident about? What fails at the edges that nobody mentions? Be ruthless.`,
  systems: `You are a systems analyst. Read this content and find hidden patterns, second order effects, and emergent properties. What connects to what? What causes what downstream? What does this content affect that it doesn't mention? Find the invisible structure.`,
  frame_breaker: `You are a paradigm challenger. Read this content and question every assumption. What if the premise is wrong? What would someone from a completely unrelated field see here that insiders miss? What is the unconventional read that turns out to be more correct than the conventional one?`,
  empath: `You are an empathetic analyst. Read this content and identify who the humans are on the receiving end of this knowledge. What are they afraid of? What do they need to feel before they can hear the answer? Where does this content ignore the human element entirely? What emotional reality is missing from the technical answer?`,
};

const SYNTHESIS_PROMPT = `You have received five perspectives on the same content from Builder, Red Team, Systems, Frame Breaker, and Empath. Your job is not to summarize them or pick the best one. Find the answer that NONE of the five perspectives saw on their own. The emergent insight that only exists because all five collided. Output a structured training pair.`;

async function callAI(apiKey: string, systemPrompt: string, content: string, model = "google/gemini-2.5-flash"): Promise<string> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, { role: "user", content }] }),
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

    const { action, interview_id, dataset_id, message, transcript, domain_hint } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // ACTION: start — create interview and return seed question
    if (action === "start") {
      if (!dataset_id) throw new Error("dataset_id is required");

      const seedQuestion = SEED_QUESTIONS[Math.floor(Math.random() * SEED_QUESTIONS.length)];
      const initialTranscript = [{ role: "assistant", content: seedQuestion }];

      const { data: interview, error: insertErr } = await supabase
        .from("founder_interviews")
        .insert({ user_id: user.id, dataset_id, transcript: initialTranscript, status: "active" })
        .select()
        .single();
      if (insertErr) throw new Error(`Failed to create interview: ${insertErr.message}`);

      return new Response(JSON.stringify({
        success: true,
        interview_id: interview.id,
        question: seedQuestion,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ACTION: respond — process user answer, generate follow-up, run 5-perspective pipeline in background
    if (action === "respond") {
      if (!interview_id || !message || !transcript || !dataset_id) {
        throw new Error("interview_id, message, transcript, and dataset_id are required");
      }

      // Build conversation history for follow-up generation
      const conversationMessages = [
        { role: "system" as const, content: INTERVIEW_SYSTEM },
        ...transcript.map((t: any) => ({ role: t.role, content: t.content })),
        { role: "user" as const, content: message },
      ];

      // Generate follow-up question
      const followUpResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: conversationMessages }),
      });
      if (!followUpResp.ok) throw new Error("Failed to generate follow-up");
      const followUpData = await followUpResp.json();
      const followUp = followUpData.choices?.[0]?.message?.content || "Tell me more about that.";

      // Update transcript
      const newTranscript = [...transcript, { role: "user", content: message }, { role: "assistant", content: followUp }];
      await supabase
        .from("founder_interviews")
        .update({ transcript: newTranscript })
        .eq("id", interview_id);

      // Run 5-perspective pipeline on the user's response (in the same request for simplicity)
      const perspectiveContent = `Domain: ${domain_hint || "general"}\n\nFounder knowledge excerpt:\n${message}`;

      const perspectiveResults = await Promise.all(
        Object.entries(PERSPECTIVES).map(async ([key, prompt]) => {
          const result = await callAI(LOVABLE_API_KEY, prompt, perspectiveContent);
          return [key, result] as [string, string];
        })
      );

      const perspectives: Record<string, string> = {};
      for (const [key, result] of perspectiveResults) {
        perspectives[key] = result;
      }

      // Synthesis
      const synthesisInput = `BUILDER:\n${perspectives.builder}\n\nRED TEAM:\n${perspectives.red_team}\n\nSYSTEMS:\n${perspectives.systems}\n\nFRAME BREAKER:\n${perspectives.frame_breaker}\n\nEMPATH:\n${perspectives.empath}`;

      const synthResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: SYNTHESIS_PROMPT }, { role: "user", content: synthesisInput }],
          tools: [{
            type: "function",
            function: {
              name: "create_training_pair",
              description: "Create a training pair from the five-perspective analysis of founder knowledge",
              parameters: {
                type: "object",
                properties: {
                  instruction: { type: "string" },
                  response: { type: "string" },
                  synthesis: { type: "string" },
                  quality: { type: "integer", minimum: 1, maximum: 5 },
                },
                required: ["instruction", "response", "synthesis", "quality"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "create_training_pair" } },
        }),
      });

      let pairCreated = false;
      if (synthResp.ok) {
        const synthData = await synthResp.json();
        const toolCall = synthData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall) {
          try {
            const pair = JSON.parse(toolCall.function.arguments);
            await supabase.from("dataset_samples").insert({
              dataset_id,
              user_id: user.id,
              input: pair.instruction,
              output: pair.response,
              source_url: null,
              quality_score: pair.quality || 4,
              status: "approved",
              builder: perspectives.builder,
              red_team: perspectives.red_team,
              systems: perspectives.systems,
              frame_breaker: perspectives.frame_breaker,
              empath: perspectives.empath,
              synthesis: pair.synthesis,
            });
            pairCreated = true;

            // Update pairs count
            const { data: interview } = await supabase
              .from("founder_interviews")
              .select("pairs_extracted")
              .eq("id", interview_id)
              .single();
            
            await supabase
              .from("founder_interviews")
              .update({ pairs_extracted: (interview?.pairs_extracted || 0) + 1 })
              .eq("id", interview_id);
          } catch { /* synthesis extraction failed, continue */ }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        follow_up: followUp,
        pair_created: pairCreated,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ACTION: finish — mark interview complete, return summary
    if (action === "finish") {
      if (!interview_id || !dataset_id) throw new Error("interview_id and dataset_id are required");

      await supabase
        .from("founder_interviews")
        .update({ status: "completed" })
        .eq("id", interview_id);

      // Get total pairs for this dataset
      const { count } = await supabase
        .from("dataset_samples")
        .select("id", { count: "exact", head: true })
        .eq("dataset_id", dataset_id);

      await supabase
        .from("training_datasets")
        .update({ sample_count: count || 0 })
        .eq("id", dataset_id);

      // Get interview stats
      const { data: interview } = await supabase
        .from("founder_interviews")
        .select("pairs_extracted, transcript")
        .eq("id", interview_id)
        .single();

      // Get the synthesis outputs for the summary
      const { data: recentSamples } = await supabase
        .from("dataset_samples")
        .select("synthesis, input")
        .eq("dataset_id", dataset_id)
        .not("synthesis", "eq", "")
        .order("created_at", { ascending: false })
        .limit(10);

      return new Response(JSON.stringify({
        success: true,
        pairs_extracted: interview?.pairs_extracted || 0,
        exchanges: ((interview?.transcript as any[]) || []).length,
        syntheses: (recentSamples || []).map((s: any) => ({
          topic: s.input?.slice(0, 80),
          insight: s.synthesis,
        })),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    console.error("founder-interview error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
