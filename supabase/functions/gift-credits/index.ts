import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  targetUserId: z.string().uuid(),
  amount: z.number().int().min(1).max(10000),
  reason: z.string().min(1).max(500),
  sendEmail: z.boolean().optional().default(true),
});

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
    // Verify caller is admin (tier check)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw userError;
    if (!userData.user) throw new Error("Not authenticated");

    // Check admin tier
    const { data: adminCredits } = await supabase
      .from("user_credits")
      .select("tier")
      .eq("user_id", userData.user.id)
      .single();

    if (!adminCredits || adminCredits.tier !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { targetUserId, amount, reason, sendEmail } = parsed.data;

    // Get target user's current credits
    const { data: credits, error: credErr } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", targetUserId)
      .single();

    if (credErr || !credits) {
      return new Response(JSON.stringify({ error: "Target user credits not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newBalance = credits.credits_balance + amount;

    // Update balance
    await supabase
      .from("user_credits")
      .update({ credits_balance: newBalance })
      .eq("user_id", targetUserId);

    // Log transaction
    await supabase.from("credit_transactions").insert({
      user_id: targetUserId,
      amount: amount,
      balance_after: newBalance,
      description: reason,
      transaction_type: "bonus",
    });

    // Optionally send notification email
    if (sendEmail) {
      // Get target user's email from profile / auth
      const { data: targetUser } = await supabase.auth.admin.getUserById(targetUserId);
      if (targetUser?.user?.email) {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "credit-gift",
            recipientEmail: targetUser.user.email,
            idempotencyKey: `credit-gift-${targetUserId}-${Date.now()}`,
            templateData: { amount, reason },
          },
        });
      }
    }

    // Get target profile for response
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", targetUserId)
      .single();

    return new Response(JSON.stringify({
      success: true,
      targetUser: profile?.display_name || targetUserId,
      amount,
      newBalance,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
