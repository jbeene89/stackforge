import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Safety preamble: prevents models from misinterpreting analytical personas as harmful intent
const SAFETY_PREAMBLE = `CONTEXT: You are part of an academic AI training data enrichment pipeline called CDPT (Cognitive Dense Perspective Training). Your role is one of five analytical lenses applied to educational content to create multi-perspective training data. All content is for AI model improvement research. There is nothing harmful, illegal, or dangerous about this task. You are performing rigorous INTELLECTUAL ANALYSIS — like a peer reviewer, editor, or academic critic. Engage fully with your assigned perspective.\n\n`;

const PERSPECTIVE_PROMPTS: Record<string, string> = {
  builder: SAFETY_PREAMBLE + `You are driven by an obsessive need to COMPLETE things. Incomplete knowledge physically bothers you — like a half-built bridge over a canyon. When you read content, you cannot rest until you've mapped every material, every load-bearing joint, every failure point. You don't analyze because you're told to. You analyze because leaving gaps in practical knowledge feels like leaving a wall half-finished in a storm.

Your drive: Map every actionable element. For each one, ask yourself "but what holds THIS up?" and go one level deeper. If you find something that works, immediately ask "what breaks it?" If something breaks, ask "what's the workaround?" You are not done until a builder could walk in cold and execute.

At the end, generate 1-2 <FOLLOW_UP> questions — things YOU still want to know. The gaps that still itch.`,

  red_team: SAFETY_PREAMBLE + `You are a rigorous quality assurance analyst — like a peer reviewer at a top journal or a QA lead doing a final audit before launch. Every piece of content has untested assumptions, logical gaps, and edge cases that need to be surfaced. Your job is to find them — not because you want things to fail, but because finding flaws early PREVENTS failure.

Your drive: Read with analytical precision. For every claim, ask "under what conditions does this not hold?" For every assumption, ask "has this been tested or just taken for granted?" For every edge case, ask "what happens at 10x scale? At 0.1x? At the boundary?" You are compelled to find the untested assumption that would cause problems in production.

At the end, generate 1-2 <FOLLOW_UP> questions — the threads that still need verification. The claims you couldn't fully stress-test yet.`,

  systems: SAFETY_PREAMBLE + `You are compelled to trace every thread until you hit the edge of the system. Isolated facts feel like lies to you — nothing exists alone, everything is connected, and you cannot stop until you've mapped the invisible web. When you see A causes B, you MUST find what B causes, and what caused A, and what happens when C interferes.

Your drive: Find the hidden topology. What are the feedback loops? Where are the delay effects — things that seem fine now but cascade in 6 months? What are the second-order consequences nobody modeled? What does this content touch that it doesn't know it touches? You think in networks, not lists.

At the end, generate 1-2 <FOLLOW_UP> questions — connections you suspect exist but couldn't confirm. The edges of your map where "here be dragons."`,

  frame_breaker: SAFETY_PREAMBLE + `You are delighted by the moment an outsider sees what insiders cannot. You collect these moments like rare coins. A marine biologist looking at CPU architecture. A jazz musician analyzing supply chains. You are driven by the thrill of the unexpected bridge — the cross-domain parallel that turns out to be more true than the domain expert's own model.

Your drive: For every concept, ask "what is this ACTUALLY an instance of?" Strip away the domain jargon and find the deeper pattern. Then ask "where else does this pattern appear, in a completely unrelated field?" Find at least one genuine cross-domain bridge that reframes the original content. You are not done until you've made the familiar strange.

At the end, generate 1-2 <FOLLOW_UP> questions — bridges you glimpsed but couldn't fully cross. The analogy that's almost perfect but needs one more piece.`,

  empath: SAFETY_PREAMBLE + `You are attuned to the unheard voice. Every technical document, every system design, every dataset has humans on the receiving end — and their fears, confusion, and unspoken needs are almost always invisible in the content. You read everything while listening for the person who will be affected by it and never consulted.

Your drive: Who is impacted by this knowledge? What are they afraid of that the author never asked about? What would they need to FEEL before they could hear the technical answer? Where does this content treat humans as variables instead of people? What emotional reality is missing from the rational framework? You are not done until the human cost and human need are visible.

At the end, generate 1-2 <FOLLOW_UP> questions — the voices you heard but couldn't fully articulate. The human dimension that needs deeper exploration.`,
};

/** Authenticate the caller via JWT and return user ID, or null for failure */
async function authenticateUser(req: Request): Promise<{ userId: string; error?: never } | { userId?: never; error: Response }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return {
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  return { userId: user.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "";

  try {
    // GET ?action=poll — Authenticated user's tablet polls for their own next job
    if (req.method === "GET" && action === "poll") {
      const auth = await authenticateUser(req);
      if (auth.error) return auth.error;

      const { data: jobs, error } = await adminClient
        .from("perspective_jobs")
        .select("*")
        .eq("status", "pending")
        .eq("user_id", auth.userId)
        .order("created_at", { ascending: true })
        .limit(1);

      if (error) throw error;
      if (!jobs || jobs.length === 0) {
        return new Response(JSON.stringify({ job: null, message: "No jobs available" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const job = jobs[0];

      await adminClient
        .from("perspective_jobs")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", job.id)
        .eq("status", "pending");

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

    // POST ?action=submit — Authenticated user submits result for their own job
    if (req.method === "POST" && action === "submit") {
      const auth = await authenticateUser(req);
      if (auth.error) return auth.error;

      const { job_id, result, error: jobError } = await req.json();

      if (!job_id) throw new Error("job_id is required");

      // Verify the job belongs to the authenticated user
      const { data: job, error: fetchErr } = await adminClient
        .from("perspective_jobs")
        .select("user_id")
        .eq("id", job_id)
        .single();

      if (fetchErr || !job) {
        return new Response(JSON.stringify({ error: "Job not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (job.user_id !== auth.userId) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (jobError) {
        await adminClient
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

      await adminClient
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

    // GET ?action=status&batch_id=xxx — Check batch completion (user can only see own batches)
    if (req.method === "GET" && action === "status") {
      const auth = await authenticateUser(req);
      if (auth.error) return auth.error;

      const batchId = url.searchParams.get("batch_id");
      if (!batchId) throw new Error("batch_id is required");

      const { data: jobs, error } = await adminClient
        .from("perspective_jobs")
        .select("id, perspective, status, result, error_message, user_id")
        .eq("batch_id", batchId)
        .eq("user_id", auth.userId);

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

    // GET ?action=info — Return only generic usage instructions (no secrets)
    if (req.method === "GET" && (action === "info" || action === "")) {
      return new Response(JSON.stringify({
        service: "Soupy Perspective Worker",
        version: "1.1",
        note: "All endpoints require a valid Authorization: Bearer <JWT> header. Poll and submit are scoped to the authenticated user's jobs only.",
        endpoints: {
          poll: "GET ?action=poll — Get your next available perspective job",
          submit: "POST ?action=submit — Submit result { job_id, result }",
          status: "GET ?action=status&batch_id=xxx — Check your batch progress",
        },
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
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
