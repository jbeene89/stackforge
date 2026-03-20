import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Maps Stripe product IDs → internal tier config
const PRODUCT_TIER_MAP: Record<string, { tier: string; allowance: number }> = {
  prod_U7Tj3A5CVbhw4c: { tier: "builder", allowance: 500 },
  prod_U7A4PumaFQmKPQ: { tier: "pro", allowance: 2000 },
};

const TOPUP_PRODUCT_MAP: Record<string, number> = {
  prod_UBSxWZJuoZCE7F: 100,
  prod_UBSygVKYUgUs90: 500,
  prod_UBSyqxTOHs9qct: 1500,
};

const FREE_TIER = { tier: "free", allowance: 50 };

const log = (step: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    log("ERROR", "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return new Response("Server misconfigured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    log("Signature verification failed", { error: (err as Error).message });
    return new Response(`Webhook signature verification failed`, { status: 400 });
  }

  log("Event received", { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        await syncSubscription(stripe, supabase, session.customer as string);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(stripe, supabase, subscription.customer as string);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        log("Payment failed", { customer: invoice.customer });
        // Optionally downgrade immediately or after grace period
        break;
      }

      default:
        log("Unhandled event type", { type: event.type });
    }
  } catch (err) {
    log("Error processing event", { error: (err as Error).message });
    return new Response("Webhook handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

async function syncSubscription(
  stripe: Stripe,
  supabase: ReturnType<typeof createClient>,
  customerId: string
) {
  log("Syncing subscription", { customerId });

  // Get customer email from Stripe
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || !customer.email) {
    log("Customer deleted or no email", { customerId });
    return;
  }

  // Find the user by email in profiles
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    log("Error listing users", { error: userError.message });
    return;
  }

  const user = userData.users.find((u) => u.email === customer.email);
  if (!user) {
    log("No user found for email", { email: customer.email });
    return;
  }

  // Check for active subscription
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  let tierConfig = FREE_TIER;

  if (subscriptions.data.length > 0) {
    const sub = subscriptions.data[0];
    const productId = sub.items.data[0].price.product as string;
    tierConfig = PRODUCT_TIER_MAP[productId] || FREE_TIER;
    log("Active subscription found", { productId, tier: tierConfig.tier });
  } else {
    log("No active subscription, reverting to free tier");
  }

  // Update user_credits
  const { error: updateError } = await supabase
    .from("user_credits")
    .update({
      tier: tierConfig.tier,
      monthly_allowance: tierConfig.allowance,
      credits_balance: tierConfig.allowance,
      credits_used: 0,
      last_reset_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (updateError) {
    log("Error updating user_credits", { error: updateError.message });
    return;
  }

  // Log credit transaction
  await supabase.from("credit_transactions").insert({
    user_id: user.id,
    amount: tierConfig.allowance,
    balance_after: tierConfig.allowance,
    description: `Subscription synced → ${tierConfig.tier} tier`,
    transaction_type: "subscription_sync",
  });

  log("User credits synced", { userId: user.id, tier: tierConfig.tier });
}
