import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";
const COST_PER_DOMAIN = 2; // credits per domain probed

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error("Not authenticated");

    const { domains, model_label } = await req.json();
    if (!Array.isArray(domains) || domains.length === 0)
      throw new Error("domains must be a non-empty array");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Credit check
    const totalCost = domains.length * COST_PER_DOMAIN;
    const { data: credits, error: credErr } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (credErr || !credits) throw new Error("Credits not found");
    if (credits.credits_balance < totalCost) {
      return new Response(
        JSON.stringify({
          error: "Insufficient credits",
          balance: credits.credits_balance,
          cost: totalCost,
        }),
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Deduct credits up front
    const newBalance = credits.credits_balance - totalCost;
    const newUsed = credits.credits_used + totalCost;
    await supabase
      .from("user_credits")
      .update({ credits_balance: newBalance, credits_used: newUsed })
      .eq("user_id", user.id);
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -totalCost,
      balance_after: newBalance,
      description: `Knowledge Refinery: ${domains.length} domains`,
      transaction_type: "deduction",
    });

    // Generate probes per domain and call AI
    const allPairs: any[] = [];
    let refundDomains = 0;

    for (const domain of domains) {
      const probes = [
        `What are the fundamental principles of ${domain}?`,
        `Explain a common misconception in ${domain}.`,
        `What is the most important recent development in ${domain}?`,
        `How does ${domain} intersect with everyday life?`,
        `Describe the key terminology a beginner should know in ${domain}.`,
        `What are the major open problems in ${domain}?`,
      ];

      const systemPrompt = `You are a knowledge extraction engine. The user will ask a series of questions about "${domain}". For each question, provide a thorough, information-dense answer that captures the core knowledge a small language model should retain about this topic. Be specific, cite key concepts, use precise terminology. No fluff — pure knowledge density.`;

      try {
        const resp = await fetch(GATEWAY, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: probes
                  .map((q, i) => `Question ${i + 1}: ${q}`)
                  .join("\n\n"),
              },
            ],
            temperature: 0.3,
          }),
        });

        if (!resp.ok) {
          console.error(
            `AI error for domain ${domain}: ${resp.status}`,
          );
          refundDomains++;
          continue;
        }

        const data = await resp.json();
        const fullResponse =
          data.choices?.[0]?.message?.content || "";

        // Split the response into individual Q/A pairs
        // The model typically numbers its answers
        probes.forEach((q, i) => {
          // Try to extract the answer for this question
          const questionNum = i + 1;
          const nextNum = i + 2;
          const pattern = new RegExp(
            `(?:Question\\s*${questionNum}|${questionNum}[.):])\\s*([\\s\\S]*?)(?=(?:Question\\s*${nextNum}|${nextNum}[.):])\\s|$)`,
            "i",
          );
          const match = fullResponse.match(pattern);
          const answer = match
            ? match[1].trim()
            : i === probes.length - 1
              ? fullResponse.split(/\d+[.):]/).pop()?.trim() || fullResponse
              : "";

          if (answer && answer.length > 20) {
            allPairs.push({
              input: q,
              output: answer,
              _meta: {
                source_model: model_label || "unknown",
                domain,
                extraction_type: "probe",
              },
            });
          }
        });
      } catch (e) {
        console.error(`Domain ${domain} failed:`, e);
        refundDomains++;
      }
    }

    // Refund credits for failed domains
    if (refundDomains > 0) {
      const refundAmount = refundDomains * COST_PER_DOMAIN;
      const refundBalance = newBalance + refundAmount;
      await supabase
        .from("user_credits")
        .update({
          credits_balance: refundBalance,
          credits_used: newUsed - refundAmount,
        })
        .eq("user_id", user.id);
      await supabase.from("credit_transactions").insert({
        user_id: user.id,
        amount: refundAmount,
        balance_after: refundBalance,
        description: `Refund: ${refundDomains} failed domain(s)`,
        transaction_type: "refund",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        pairs: allPairs,
        domains_processed: domains.length - refundDomains,
        domains_failed: refundDomains,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("knowledge-extract error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
