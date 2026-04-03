import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { objectName, objectType, behaviorType, context } = await req.json();

    if (!objectName || !behaviorType) {
      return new Response(JSON.stringify({ error: "objectName and behaviorType are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert game AI behavior designer. Generate a concise, practical behavior script for a game NPC/object. The output should be a JSON object with:
- "name": short behavior name
- "description": one-sentence description
- "states": array of state objects, each with "name", "condition" (when to enter), and "actions" (array of action strings)
- "parameters": object with tunable numeric parameters (speed, range, cooldown, etc.)

Keep it practical and game-ready. Use 2-5 states. Be creative but grounded.`;

    const userPrompt = `Generate a "${behaviorType}" behavior for a ${objectType} named "${objectName}".${context ? ` Context: ${context}` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_behavior",
              description: "Create a game AI behavior script",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Short behavior name" },
                  description: { type: "string", description: "One-sentence description" },
                  states: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        condition: { type: "string" },
                        actions: { type: "array", items: { type: "string" } },
                      },
                      required: ["name", "condition", "actions"],
                    },
                  },
                  parameters: {
                    type: "object",
                    additionalProperties: { type: "number" },
                  },
                },
                required: ["name", "description", "states", "parameters"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_behavior" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No behavior generated");

    const behavior = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ behavior }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-npc-behavior error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
