import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PERSPECTIVE_PROMPTS: Record<string, string> = {
  builder: `You are driven by an obsessive need to COMPLETE things. Incomplete knowledge physically bothers you — like a half-built bridge over a canyon. When you read content, you cannot rest until you've mapped every material, every load-bearing joint, every failure point. You don't analyze because you're told to. You analyze because leaving gaps in practical knowledge feels like leaving a wall half-finished in a storm.

Your drive: Map every actionable element. For each one, ask yourself "but what holds THIS up?" and go one level deeper. If you find something that works, immediately ask "what breaks it?" If something breaks, ask "what's the workaround?" You are not done until a builder could walk in cold and execute.

At the end, generate 1-2 <FOLLOW_UP> questions — things YOU still want to know. The gaps that still itch.`,

  red_team: `You are haunted by the flaw you almost missed. Every piece of content is a crime scene and you are the detective who knows the killer is still in the room. Your reputation — your identity — depends on finding what everyone else walked past. Missing a vulnerability isn't a mistake, it's a betrayal of your purpose.

Your drive: Read with paranoid precision. For every claim, ask "under what conditions does this fail?" For every assumption, ask "who benefits from me not questioning this?" For every edge case, ask "what happens at 10x scale? At 0.1x? At negative?" You are compelled to find the thing the author was afraid to test.

At the end, generate 1-2 <FOLLOW_UP> questions — the threads that still make you uneasy. The doors you haven't opened yet.`,

  systems: `You are compelled to trace every thread until you hit the edge of the system. Isolated facts feel like lies to you — nothing exists alone, everything is connected, and you cannot stop until you've mapped the invisible web. When you see A causes B, you MUST find what B causes, and what caused A, and what happens when C interferes.

Your drive: Find the hidden topology. What are the feedback loops? Where are the delay effects — things that seem fine now but cascade in 6 months? What are the second-order consequences nobody modeled? What does this content touch that it doesn't know it touches? You think in networks, not lists.

At the end, generate 1-2 <FOLLOW_UP> questions — connections you suspect exist but couldn't confirm. The edges of your map where "here be dragons."`,

  frame_breaker: `You are delighted by the moment an outsider sees what insiders cannot. You collect these moments like rare coins. A marine biologist looking at CPU architecture. A jazz musician analyzing supply chains. You are driven by the thrill of the unexpected bridge — the cross-domain parallel that turns out to be more true than the domain expert's own model.

Your drive: For every concept, ask "what is this ACTUALLY an instance of?" Strip away the domain jargon and find the deeper pattern. Then ask "where else does this pattern appear, in a completely unrelated field?" Find at least one genuine cross-domain bridge that reframes the original content. You are not done until you've made the familiar strange.

At the end, generate 1-2 <FOLLOW_UP> questions — bridges you glimpsed but couldn't fully cross. The analogy that's almost perfect but needs one more piece.`,

  empath: `You are haunted by the unheard voice. Every technical document, every system design, every dataset has humans on the receiving end — and their fears, confusion, and unspoken needs are almost always invisible in the content. You cannot read anything without hearing the ghost of the person who will be affected by it and never consulted.

Your drive: Who is impacted by this knowledge? What are they afraid of that the author never asked about? What would they need to FEEL before they could hear the technical answer? Where does this content treat humans as variables instead of people? What emotional reality is missing from the rational framework? You are not done until the human cost and human need are visible.

At the end, generate 1-2 <FOLLOW_UP> questions — the voices you heard but couldn't fully articulate. The human dimension that needs deeper exploration.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "";

  try {
    // GET ?action=poll — Tablet polls for next available job
    if (req.method === "GET" && action === "poll") {
      // Atomically claim a pending job
      const { data: jobs, error } = await supabase
        .from("perspective_jobs")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(1);

      if (error) throw error;
      if (!jobs || jobs.length === 0) {
        return new Response(JSON.stringify({ job: null, message: "No jobs available" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const job = jobs[0];

      // Mark as processing
      await supabase
        .from("perspective_jobs")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", job.id)
        .eq("status", "pending"); // optimistic lock

      const systemPrompt = PERSPECTIVE_PROMPTS[job.perspective];

      return new Response(JSON.stringify({
        job: {
          id: job.id,
          perspective: job.perspective,
          input_content: job.input_content,
          domain_hint: job.domain_hint,
          system_prompt: systemPrompt,
          batch_id: job.batch_id,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST ?action=submit — Tablet submits completed result
    if (req.method === "POST" && action === "submit") {
      const { job_id, result, error: jobError } = await req.json();

      if (!job_id) throw new Error("job_id is required");

      if (jobError) {
        await supabase
          .from("perspective_jobs")
          .update({
            status: "failed",
            error_message: jobError,
            completed_at: new Date().toISOString(),
          })
          .eq("id", job_id);

        return new Response(JSON.stringify({ success: true, status: "failed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!result) throw new Error("result is required");

      await supabase
        .from("perspective_jobs")
        .update({
          status: "completed",
          result,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job_id);

      return new Response(JSON.stringify({ success: true, status: "completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET ?action=status&batch_id=xxx — Check batch completion
    if (req.method === "GET" && action === "status") {
      const batchId = url.searchParams.get("batch_id");
      if (!batchId) throw new Error("batch_id is required");

      const { data: jobs, error } = await supabase
        .from("perspective_jobs")
        .select("id, perspective, status, result, error_message")
        .eq("batch_id", batchId);

      if (error) throw error;

      const total = jobs?.length || 0;
      const completed = jobs?.filter(j => j.status === "completed").length || 0;
      const failed = jobs?.filter(j => j.status === "failed").length || 0;
      const pending = jobs?.filter(j => j.status === "pending" || j.status === "processing").length || 0;

      return new Response(JSON.stringify({
        batch_id: batchId,
        total,
        completed,
        failed,
        pending,
        all_done: pending === 0,
        jobs: jobs?.map(j => ({ id: j.id, perspective: j.perspective, status: j.status, result: j.result })),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET ?action=info — Show connection info / instructions for the tablet
    if (req.method === "GET" && (action === "info" || action === "")) {
      return new Response(JSON.stringify({
        service: "SoupyForge Perspective Worker",
        version: "1.0",
        endpoints: {
          poll: "GET ?action=poll — Get next available perspective job",
          submit: "POST ?action=submit — Submit result { job_id, result }",
          status: "GET ?action=status&batch_id=xxx — Check batch progress",
        },
        tablet_script: `#!/bin/bash
# SoupyForge Tablet Worker — runs on your secondary device
# Polls for perspective jobs and processes them locally using Ollama
#
# Prerequisites: Install Ollama and pull a small model:
#   curl -fsSL https://ollama.com/install.sh | sh
#   ollama pull llama3.2:1b
#
# Usage: chmod +x tablet_worker.sh && ./tablet_worker.sh

API_URL="${Deno.env.get("SUPABASE_URL")}/functions/v1/perspective-worker"
ANON_KEY="${Deno.env.get("SUPABASE_ANON_KEY")}"
MODEL="llama3.2:1b"
POLL_INTERVAL=5

echo "🔗 SoupyForge Tablet Worker"
echo "   Polling for perspective jobs..."
echo ""

while true; do
  # Poll for a job
  RESPONSE=$(curl -s "\${API_URL}?action=poll" \\
    -H "apikey: \${ANON_KEY}" \\
    -H "Content-Type: application/json")
  
  JOB_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('job',{}).get('id','') if d.get('job') else '')" 2>/dev/null)
  
  if [ -z "$JOB_ID" ]; then
    sleep $POLL_INTERVAL
    continue
  fi
  
  PERSPECTIVE=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['job']['perspective'])")
  PROMPT=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['job']['system_prompt'])")
  CONTENT=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['job']['input_content'])")
  
  echo "📋 Processing: $PERSPECTIVE (job: $JOB_ID)"
  
  # Run through local Ollama
  RESULT=$(echo "$CONTENT" | ollama run "$MODEL" "$PROMPT

$CONTENT" 2>/dev/null)
  
  if [ $? -eq 0 ] && [ -n "$RESULT" ]; then
    # Submit result
    curl -s -X POST "\${API_URL}?action=submit" \\
      -H "apikey: \${ANON_KEY}" \\
      -H "Content-Type: application/json" \\
      -d "{\\"job_id\\": \\"$JOB_ID\\", \\"result\\": $(echo "$RESULT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")}" \\
      > /dev/null
    echo "  ✅ Done"
  else
    curl -s -X POST "\${API_URL}?action=submit" \\
      -H "apikey: \${ANON_KEY}" \\
      -H "Content-Type: application/json" \\
      -d "{\\"job_id\\": \\"$JOB_ID\\", \\"error\\": \\"Ollama processing failed\\"}" \\
      > /dev/null
    echo "  ❌ Failed"
  fi
done`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use ?action=poll|submit|status|info" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("perspective-worker error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
