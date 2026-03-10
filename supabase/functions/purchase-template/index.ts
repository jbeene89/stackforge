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

    // Check if already purchased
    const { data: existing } = await supabase
      .from("template_purchases")
      .select("id")
      .eq("buyer_id", buyerId)
      .eq("template_id", template_id)
      .limit(1);
    if (existing && existing.length > 0) throw new Error("Already purchased");

    // Check buyer credits
    const { data: buyerCredits, error: credErr } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", buyerId)
      .single();
    if (credErr || !buyerCredits) throw new Error("Could not fetch credits");
    if (buyerCredits.credits_balance < price) throw new Error("Insufficient credits");

    // Deduct from buyer
    const newBuyerBalance = buyerCredits.credits_balance - price;
    await supabase
      .from("user_credits")
      .update({ credits_balance: newBuyerBalance, credits_used: buyerCredits.credits_used + price })
      .eq("user_id", buyerId);

    // Log buyer transaction
    await supabase.from("credit_transactions").insert({
      user_id: buyerId,
      amount: -price,
      balance_after: newBuyerBalance,
      description: `Purchased template: ${template.name}`,
      transaction_type: "purchase",
    });

    // Credit the seller
    const { data: sellerCredits } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", template.creator_id)
      .single();

    if (sellerCredits) {
      const sellerEarning = price; // seller gets full price
      const newSellerBalance = sellerCredits.credits_balance + sellerEarning;
      await supabase
        .from("user_credits")
        .update({ credits_balance: newSellerBalance })
        .eq("user_id", template.creator_id);

      await supabase.from("credit_transactions").insert({
        user_id: template.creator_id,
        amount: sellerEarning,
        balance_after: newSellerBalance,
        description: `Sale: ${template.name}`,
        transaction_type: "sale",
      });
    }

    // Record purchase
    await supabase.from("template_purchases").insert({
      buyer_id: buyerId,
      template_id: template_id,
      credits_paid: price,
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
