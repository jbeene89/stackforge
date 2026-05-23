import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
    const buyerId = userData.user?.id;
    if (!buyerId) throw new Error("Not authenticated");

    const { template_id } = await req.json();
    if (!template_id) throw new Error("template_id required");

    // Get template
    const { data: template, error: tplErr } = await supabase
      .from("marketplace_templates")
      .select("*")
      .eq("id", template_id)
      .eq("status", "published")
      .single();
    if (tplErr || !template) throw new Error("Template not found");
    if (template.creator_id === buyerId) throw new Error("Cannot buy your own template");

    const price = template.price_credits;

    // Record purchase first — unique constraint on (buyer_id, template_id)
    // makes this the atomic guard against duplicate purchases / race conditions.
    const { error: purchaseErr } = await supabase.from("template_purchases").insert({
      buyer_id: buyerId,
      template_id: template_id,
      credits_paid: price,
    });
    if (purchaseErr) {
      // 23505 = unique_violation -> already purchased
      if ((purchaseErr as { code?: string }).code === "23505") {
        throw new Error("Already purchased");
      }
      throw purchaseErr;
    }

    // Atomic credit deduction
    const { data: deductRows, error: deductErr } = await supabase.rpc("deduct_user_credits", {
      _user_id: buyerId,
      _cost: price,
      _description: `Purchased template: ${template.name}`,
      _transaction_type: "purchase",
    });
    if (deductErr) {
      // Roll back the purchase row
      await supabase.from("template_purchases")
        .delete()
        .eq("buyer_id", buyerId)
        .eq("template_id", template_id);
      throw deductErr;
    }
    const deduct = Array.isArray(deductRows) ? deductRows[0] : deductRows;
    if (!deduct?.success) {
      await supabase.from("template_purchases")
        .delete()
        .eq("buyer_id", buyerId)
        .eq("template_id", template_id);
      return new Response(
        JSON.stringify({ error: "Insufficient credits" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 }
      );
    }
    const newBuyerBalance = deduct.new_balance;

    // Credit the seller (atomic)
    await supabase.rpc("refund_user_credits", {
      _user_id: template.creator_id,
      _amount: price,
      _description: `Sale: ${template.name}`,
      _transaction_type: "sale",
    });


    // Increment downloads
    await supabase
      .from("marketplace_templates")
      .update({ downloads: (template.downloads || 0) + 1 })
      .eq("id", template_id);

    // Handle referral revenue share
    const { data: referral } = await supabase
      .from("referrals")
      .select("*")
      .eq("referred_user_id", buyerId)
      .single();

    if (referral) {
      const shareAmount = Math.floor(price * (Number(referral.revenue_share_pct) / 100));
      if (shareAmount > 0) {
        // Credit referrer
        const { data: referrerCredits } = await supabase
          .from("user_credits")
          .select("*")
          .eq("user_id", referral.referrer_id)
          .single();

        if (referrerCredits) {
          const newRefBalance = referrerCredits.credits_balance + shareAmount;
          await supabase
            .from("user_credits")
            .update({ credits_balance: newRefBalance })
            .eq("user_id", referral.referrer_id);

          await supabase.from("credit_transactions").insert({
            user_id: referral.referrer_id,
            amount: shareAmount,
            balance_after: newRefBalance,
            description: `Referral bonus from purchase: ${template.name}`,
            transaction_type: "referral",
          });

          await supabase.from("referral_earnings").insert({
            referrer_id: referral.referrer_id,
            referred_user_id: buyerId,
            source_type: "purchase",
            amount: shareAmount,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, template_data: template.template_data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
