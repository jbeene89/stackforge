import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const { url, dataset_id, domain_hint } = await req.json();
    if (!url || !dataset_id) throw new Error("url and dataset_id are required");

    // Step 1: Fetch the webpage content
    let pageContent = "";
    try {
      const resp = await fetch(url, {
        headers: { "User-Agent": "SoupyForge-DatasetBot/1.0" },
      });
      if (!resp.ok) throw new Error(`Failed to fetch: ${resp.status}`);
      const html = await resp.text();
      // Simple HTML-to-text extraction
      pageContent = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[\s\S]*?<\/nav>/gi, "")
        .replace(/<footer[\s\S]*?<\/footer>/gi, "")
        .replace(/<header[\s\S]*?<\/header>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 12000); // Cap content for AI processing
    } catch (fetchErr) {
      throw new Error(`Could not fetch URL: ${fetchErr instanceof Error ? fetchErr.message : "Unknown error"}`);
    }

    if (pageContent.length < 100) {
      throw new Error("Page content too short to extract training data");
    }

    // Step 2: Use AI to extract training pairs
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const extractionPrompt = `You are a training data extractor. Given the following web page content, extract 3-8 high-quality instruction/response training pairs suitable for fine-tuning a small language model.

Domain hint: ${domain_hint || "general"}

Rules:
- Each pair should have a clear "instruction" (what a user would ask) and "response" (ideal answer)
- Make instructions diverse: questions, commands, analysis requests
- Responses should be detailed, accurate, and drawn from the source content
- Skip trivial or repetitive content
- Output ONLY valid JSON

Web page content:
${pageContent}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: extractionPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "extract_training_pairs",
            description: "Extract instruction/response training pairs from web content",
            parameters: {
              type: "object",
              properties: {
                pairs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      instruction: { type: "string" },
                      response: { type: "string" },
                      quality: { type: "integer", minimum: 1, maximum: 5 }
                    },
                    required: ["instruction", "response", "quality"],
                    additionalProperties: false
                  }
                }
              },
              required: ["pairs"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_training_pairs" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) throw new Error("Rate limit exceeded. Please wait and try again.");
      if (aiResp.status === 402) throw new Error("AI credits exhausted.");
      throw new Error("AI extraction failed");
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured data");

    const { pairs } = JSON.parse(toolCall.function.arguments);
    if (!pairs || !pairs.length) throw new Error("No training pairs extracted");

    // Step 3: Insert samples into database
    const samples = pairs.map((p: any) => ({
      dataset_id,
      user_id: user.id,
      input: p.instruction,
      output: p.response,
      source_url: url,
      quality_score: p.quality || 3,
      status: "pending",
    }));

    const { error: insertErr } = await supabase.from("dataset_samples").insert(samples);
    if (insertErr) throw new Error(`Failed to save samples: ${insertErr.message}`);

    // Update sample count
    const { count } = await supabase
      .from("dataset_samples")
      .select("id", { count: "exact", head: true })
      .eq("dataset_id", dataset_id);

    await supabase
      .from("training_datasets")
      .update({ sample_count: count || 0 })
      .eq("id", dataset_id);

    return new Response(JSON.stringify({
      success: true,
      extracted: pairs.length,
      samples: pairs.map((p: any) => ({ instruction: p.instruction.slice(0, 80), quality: p.quality })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scrape-for-training error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
