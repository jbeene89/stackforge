import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PERSPECTIVE_PROMPTS: Record<string, string> = {
  builder: `You are a construction-minded analyst. Read this content and extract only what WORKS. What is practical, proven, and buildable. Output structured knowledge a builder would immediately use. No theory. No hedging. What works and why.`,
  red_team: `You are an adversarial analyst. Read this content and find every flaw, assumption, failure mode, and edge case. What breaks under pressure? What did the author get overconfident about? What fails at the edges that nobody mentions? Be ruthless.`,
  systems: `You are a systems analyst. Read this content and find hidden patterns, second order effects, and emergent properties. What connects to what? What causes what downstream? What does this content affect that it doesn't mention? Find the invisible structure.`,
  frame_breaker: `You are a paradigm challenger. Read this content and question every assumption. What if the premise is wrong? What would someone from a completely unrelated field see here that insiders miss? What is the unconventional read that turns out to be more correct than the conventional one?`,
  empath: `You are an empathetic analyst. Read this content and identify who the humans are on the receiving end of this knowledge. What are they afraid of? What do they need to feel before they can hear the answer? Where does this content ignore the human element entirely? What emotional reality is missing from the technical answer?`,
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
