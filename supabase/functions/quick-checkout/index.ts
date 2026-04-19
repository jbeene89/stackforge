import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Pricing — kept on the server so client can't tamper.
// USD cents. Credits derived at $0.025/credit (matches existing $2.50/100cr starter pack).
const SLM_BASE_USD = 900; // $9.00 minimum to compile + bundle a small SLM
const SLM_PARAM_TIER_USD: Record<string, number> = {
  small: 0, medium: 600, large: 1500,
};
const SLM_DOMAIN_DEPTH_USD: Record<string, number> = {
  shallow: 0, standard: 400, deep: 1200,
};

const PAIRS_PER_UNIT_USD = 8; // 8¢ per generated training pair
const PAIRS_MIN_USD = 500;    // $5 minimum charge
const PAIRS_FILE_HANDLING_USD = 150; // $1.50 per file processed
const PAIRS_URL_HANDLING_USD = 50;   // 50¢ per URL scraped

function calcPriceCents(flow: string, config: any): number {
  if (flow === "slm") {
    const size = String(config.size ?? "small");
    const depth = String(config.depth ?? "shallow");
    return SLM_BASE_USD + (SLM_PARAM_TIER_USD[size] ?? 0) + (SLM_DOMAIN_DEPTH_USD[depth] ?? 0);
  }
  if (flow === "pairs") {
    const pairs = Math.max(0, Math.floor(Number(config.estimated_pairs ?? 0)));
    const files = Math.max(0, Math.floor(Number(config.file_count ?? 0)));
    const urls = Math.max(0, Math.floor(Number(config.url_count ?? 0)));
    const raw = pairs * PAIRS_PER_UNIT_USD + files * PAIRS_FILE_HANDLING_USD + urls * PAIRS_URL_HANDLING_USD;
    return Math.max(PAIRS_MIN_USD, raw);
  }
  return 0;
}

function centsToCredits(cents: number): number {
  // $0.025 per credit → 40 credits per $1
  return Math.ceil((cents / 100) * 40);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user?.email) throw new Error("Auth failed");
    const user = userData.user;

    const body = await req.json();
    const { action, flow, config, payment_method, job_id } = body;

    // ----- ACTION: quote -----
    if (action === "quote") {
      const cents = calcPriceCents(flow, config);
      return new Response(
        JSON.stringify({ price_cents: cents, price_credits: centsToCredits(cents) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ----- ACTION: checkout -----
    if (action === "checkout") {
      const cents = calcPriceCents(flow, config);
      const credits = centsToCredits(cents);

      // Create the job row first (server-trusted price)
      const { data: job, error: jobErr } = await supabase
        .from("paid_quick_jobs")
        .insert({
          user_id: user.id,
          flow,
          config,
          price_cents: cents,
          price_credits: credits,
          payment_method,
          status: "pending",
        })
        .select()
        .single();
      if (jobErr) throw jobErr;

      // Pay with credits
      if (payment_method === "credits") {
        const { data: creds, error: cErr } = await supabase
          .from("user_credits")
          .select("credits_balance, credits_used")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cErr) throw cErr;
        const balance = creds?.credits_balance ?? 0;
        if (balance < credits) {
          await supabase.from("paid_quick_jobs").delete().eq("id", job.id);
          return new Response(
            JSON.stringify({ error: "Not enough credits", needed: credits, balance }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const newBal = balance - credits;
        await supabase.from("user_credits").update({
          credits_balance: newBal,
          credits_used: (creds?.credits_used ?? 0) + credits,
        }).eq("user_id", user.id);
        await supabase.from("credit_transactions").insert({
          user_id: user.id,
          amount: -credits,
          balance_after: newBal,
          description: `Quick ${flow === "slm" ? "SLM bundle" : "Training pairs"} purchase`,
          transaction_type: "deduction",
        });
        await supabase.from("paid_quick_jobs").update({
          status: "paid",
          paid_at: new Date().toISOString(),
        }).eq("id", job.id);

        return new Response(
          JSON.stringify({ paid: true, job_id: job.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Pay with Stripe
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) throw new Error("Stripe not configured");
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      const customerId = customers.data[0]?.id;

      const origin = req.headers.get("origin") || "https://soupylab.com";
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: {
              name: flow === "slm"
                ? `Specific SLM — ${config.base_model ?? "custom"} / ${config.domain ?? "custom"}`
                : `Training Pairs — ${config.estimated_pairs ?? 0} pairs`,
              description: flow === "slm"
                ? "One-shot specialist SLM compile + bundle (downloadable)."
                : "One-shot training pair compilation (JSONL download).",
            },
            unit_amount: cents,
          },
          quantity: 1,
        }],
        mode: "payment",
        metadata: { job_id: job.id, user_id: user.id, flow },
        success_url: `${origin}/${flow === "slm" ? "quick-slm" : "quick-pairs"}?paid=1&job=${job.id}`,
        cancel_url: `${origin}/${flow === "slm" ? "quick-slm" : "quick-pairs"}?canceled=1`,
      });

      await supabase.from("paid_quick_jobs").update({
        stripe_session_id: session.id,
      }).eq("id", job.id);

      return new Response(
        JSON.stringify({ url: session.url, job_id: job.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ----- ACTION: confirm (called after Stripe redirect to mark paid) -----
    if (action === "confirm") {
      const { data: job } = await supabase
        .from("paid_quick_jobs")
        .select("*")
        .eq("id", job_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!job) throw new Error("Job not found");
      if (job.status !== "pending") {
        return new Response(JSON.stringify({ status: job.status, job }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) throw new Error("Stripe not configured");
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      const session = await stripe.checkout.sessions.retrieve(job.stripe_session_id!);
      if (session.payment_status === "paid") {
        await supabase.from("paid_quick_jobs").update({
          status: "paid",
          paid_at: new Date().toISOString(),
        }).eq("id", job.id);
        return new Response(JSON.stringify({ status: "paid", job }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ status: "pending", job }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action");
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
