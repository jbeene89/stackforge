import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const COST = 2; // credits per assistant reply (Gemini flash tier)
const MAX_MESSAGES = 60;
const MAX_CHARS_PER_MESSAGE = 4000;

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const messages = body?.messages;
    const domain = typeof body?.domain_hint === "string" ? body.domain_hint.slice(0, 200) : "";
    const persona = typeof body?.persona === "string" ? body.persona.slice(0, 2000) : "";

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: `Max ${MAX_MESSAGES} messages` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const cleanMessages: ChatMessage[] = [];
    for (const m of messages) {
      if (!m || typeof m !== "object") continue;
      const role = m.role;
      const content = typeof m.content === "string" ? m.content : "";
      if (role !== "user" && role !== "assistant" && role !== "system") continue;
      if (!content.trim()) continue;
      cleanMessages.push({ role, content: content.slice(0, MAX_CHARS_PER_MESSAGE) });
    }
    if (cleanMessages.length === 0) {
      return new Response(JSON.stringify({ error: "No valid messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduct credits atomically
    const { data: deductRows, error: deductErr } = await supabase.rpc("deduct_user_credits", {
      _user_id: userId,
      _cost: COST,
      _description: `Dataset Live Chat${domain ? ` (${domain})` : ""}`,
      _transaction_type: "deduction",
    });
    if (deductErr) throw deductErr;
    const deduct = Array.isArray(deductRows) ? deductRows[0] : deductRows;
    if (!deduct?.success) {
      return new Response(
        JSON.stringify({
          error: deduct?.reason === "insufficient_credits" ? "Insufficient credits" : "Credit deduction failed",
          cost: COST,
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = [
      "You are a conversational partner whose entire purpose is to help the user generate high-quality training pairs for a small language model.",
      domain ? `The dataset's domain is: ${domain}.` : "",
      persona ? `Adopt this persona/style:\n${persona}` : "",
      "Reply naturally and helpfully. Keep answers focused, factual, and self-contained — each reply will be saved as the 'output' for a training pair, paired with the user's last message as the 'input'.",
      "Avoid disclaimers like 'as an AI'. Avoid restating the question. Match the user's tone and depth.",
    ]
      .filter(Boolean)
      .join("\n\n");

    const reqBody = {
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: systemPrompt }, ...cleanMessages],
      stream: false,
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    });

    if (!aiResp.ok) {
      // Refund on failure
      await supabase.rpc("refund_user_credits", {
        _user_id: userId,
        _amount: COST,
        _description: `Refund: dataset-live-chat ${aiResp.status}`,
        _transaction_type: "refund",
      });
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit, try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await aiResp.text();
      console.error("dataset-live-chat AI error:", aiResp.status, txt);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const reply = data?.choices?.[0]?.message?.content ?? "";

    if (!reply.trim()) {
      await supabase.rpc("refund_user_credits", {
        _user_id: userId,
        _amount: COST,
        _description: "Refund: dataset-live-chat empty reply",
        _transaction_type: "refund",
      });
      return new Response(JSON.stringify({ error: "AI returned an empty reply" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ reply, credits_charged: COST, new_balance: deduct.new_balance }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("dataset-live-chat fatal:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
