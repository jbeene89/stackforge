import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RETENTION_COUPON_ID = "Oy54dBJg"; // 25% off for 3 months

const log = (step: string, details?: unknown) => {
  console.log(`[MANAGE-SUB] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw userError;
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { action } = await req.json();
    log("Action requested", { action, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) throw new Error("No Stripe customer found");
    const customerId = customers.data[0].id;

    // Get active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    // Also check paused subscriptions
    const pausedSubs = await stripe.subscriptions.list({
      customer: customerId,
      limit: 5,
    });
    const pausedSub = pausedSubs.data.find(
      (s) => s.pause_collection !== null && s.pause_collection !== undefined
    );

    const activeSub = subscriptions.data[0] || pausedSub;
    if (!activeSub) throw new Error("No active subscription found");

    const subId = activeSub.id;
    const productId = activeSub.items.data[0].price.product as string;

    switch (action) {
      case "pause": {
        // Pause for 1 billing cycle
        await stripe.subscriptions.update(subId, {
          pause_collection: {
            behavior: "void",
            resumes_at: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
          },
        });
        log("Subscription paused", { subId });
        return respond({ success: true, message: "Membership paused for 30 days" });
      }

      case "resume": {
        await stripe.subscriptions.update(subId, {
          pause_collection: null as any,
        });
        log("Subscription resumed", { subId });
        return respond({ success: true, message: "Membership resumed" });
      }

      case "apply_retention_discount": {
        // Check if coupon already applied
        if (activeSub.discount?.coupon?.id === RETENTION_COUPON_ID) {
          return respond({
            success: false,
            message: "Discount already applied to your subscription",
            already_discounted: true,
          });
        }

        await stripe.subscriptions.update(subId, {
          coupon: RETENTION_COUPON_ID,
        });
        log("Retention coupon applied", { subId, couponId: RETENTION_COUPON_ID });
        return respond({
          success: true,
          message: "25% discount applied for the next 3 months!",
        });
      }

      case "cancel": {
        // Cancel at end of period (not immediately)
        await stripe.subscriptions.update(subId, {
          cancel_at_period_end: true,
        });
        log("Subscription set to cancel at period end", { subId });
        return respond({
          success: true,
          message: "Your membership will end at the current billing period",
        });
      }

      case "status": {
        const isPaused = activeSub.pause_collection !== null && activeSub.pause_collection !== undefined;
        const hasDiscount = !!activeSub.discount;
        const cancelAtEnd = activeSub.cancel_at_period_end;
        const periodEnd = new Date(activeSub.current_period_end * 1000).toISOString();
        const resumesAt = isPaused && activeSub.pause_collection?.resumes_at
          ? new Date(activeSub.pause_collection.resumes_at * 1000).toISOString()
          : null;

        return respond({
          success: true,
          is_paused: isPaused,
          has_discount: hasDiscount,
          discount_name: activeSub.discount?.coupon?.name || null,
          cancel_at_period_end: cancelAtEnd,
          period_end: periodEnd,
          resumes_at: resumesAt,
          product_id: productId,
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    log("Error", { message: (error as Error).message });
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  function respond(data: Record<string, unknown>) {
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
