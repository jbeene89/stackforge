import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REFERRAL_BONUS_NEW_USER = 25;
const REFERRAL_BONUS_REFERRER = 25;

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
    const newUser = userData.user;
    if (!newUser) throw new Error("Not authenticated");

    const { referral_code } = await req.json();
    if (!referral_code || referral_code.length < 6 || referral_code.length > 20) {
      return new Response(JSON.stringify({ error: "Invalid referral code" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Look up referrer by referral_code column (indexed)
    const { data: referrerProfile, error: lookupErr } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("referral_code", referral_code)
      .neq("user_id", newUser.id)
      .maybeSingle();

    if (lookupErr || !referrerProfile) {
      return new Response(JSON.stringify({ error: "Referral code not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const referrerId = referrerProfile.user_id;

    // Check if referral already exists
    const { data: existing } = await supabase
      .from("referrals")
      .select("id")
      .eq("referrer_id", referrerId)
      .eq("referred_user_id", newUser.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ message: "Referral already processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create referral record
    await supabase.from("referrals").insert({
      referrer_id: referrerId,
      referred_user_id: newUser.id,
    });

    // Grant bonus to new user
    const { data: newUserCredits } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", newUser.id)
      .single();

    if (newUserCredits) {
      const newBalance = newUserCredits.credits_balance + REFERRAL_BONUS_NEW_USER;
      await supabase
        .from("user_credits")
        .update({ credits_balance: newBalance })
        .eq("user_id", newUser.id);

      await supabase.from("credit_transactions").insert({
        user_id: newUser.id,
        amount: REFERRAL_BONUS_NEW_USER,
        balance_after: newBalance,
        description: "Referral signup bonus",
        transaction_type: "referral_bonus",
      });
    }

    // Grant bonus to referrer
    const { data: referrerCredits } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", referrerId)
      .single();

    if (referrerCredits) {
      const refBalance = referrerCredits.credits_balance + REFERRAL_BONUS_REFERRER;
      await supabase
        .from("user_credits")
        .update({ credits_balance: refBalance })
        .eq("user_id", referrerId);

      await supabase.from("credit_transactions").insert({
        user_id: referrerId,
        amount: REFERRAL_BONUS_REFERRER,
        balance_after: refBalance,
        description: "Referral bonus — new user signed up",
        transaction_type: "referral_bonus",
      });

      // Log earning
      await supabase.from("referral_earnings").insert({
        referrer_id: referrerId,
        referred_user_id: newUser.id,
        amount: REFERRAL_BONUS_REFERRER,
        source_type: "signup_bonus",
      });
    }

    return new Response(JSON.stringify({
      success: true,
      bonus: REFERRAL_BONUS_NEW_USER,
      message: `You got ${REFERRAL_BONUS_NEW_USER} bonus credits from a referral!`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "An error occurred processing the referral" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
