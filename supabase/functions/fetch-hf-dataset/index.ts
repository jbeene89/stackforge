import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HF_DATASETS_API = "https://huggingface.co/api/datasets";
const HF_ROWS_API = "https://datasets-server.huggingface.co/rows";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { action } = body;

    // ── ACTION: search ──
    if (action === "search") {
      const { query, limit = 20 } = body;
      if (!query) throw new Error("query is required");

      // Search HF datasets, filter for instruction/chat/qa datasets
      const searchUrl = `${HF_DATASETS_API}?search=${encodeURIComponent(query)}&sort=downloads&direction=-1&limit=${limit}`;
      const resp = await fetch(searchUrl, {
        headers: { "User-Agent": "SoupyForge-DatasetBot/1.0" },
      });
      if (!resp.ok) throw new Error(`HuggingFace API error: ${resp.status}`);

      const datasets = await resp.json();

      // Return simplified dataset info
      const results = datasets.map((ds: any) => ({
        id: ds.id,
        author: ds.author || ds.id.split("/")[0],
        name: ds.id.split("/").pop(),
        downloads: ds.downloads || 0,
        likes: ds.likes || 0,
        tags: ds.tags?.slice(0, 8) || [],
        description: ds.description?.slice(0, 200) || "",
        lastModified: ds.lastModified,
      }));

      return new Response(JSON.stringify({ datasets: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: preview ──
    if (action === "preview") {
      const { hf_dataset_id, config, split, offset = 0, length = 10 } = body;
      if (!hf_dataset_id) throw new Error("hf_dataset_id is required");

      const params = new URLSearchParams({
        dataset: hf_dataset_id,
        config: config || "default",
        split: split || "train",
        offset: String(offset),
        length: String(length),
      });

      const resp = await fetch(`${HF_ROWS_API}?${params}`, {
        headers: { "User-Agent": "SoupyForge-DatasetBot/1.0" },
      });

      if (!resp.ok) {
        // Try without config
        params.delete("config");
        const retry = await fetch(`${HF_ROWS_API}?${params}`, {
          headers: { "User-Agent": "SoupyForge-DatasetBot/1.0" },
        });
        if (!retry.ok) throw new Error(`Could not fetch dataset rows: ${retry.status}`);
        const retryData = await retry.json();
        return new Response(JSON.stringify({
          rows: retryData.rows?.slice(0, length) || [],
          columns: retryData.features?.map((f: any) => f.feature?.name || f.name) || Object.keys(retryData.rows?.[0]?.row || {}),
          num_rows: retryData.num_rows_total || retryData.rows?.length || 0,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await resp.json();
      return new Response(JSON.stringify({
        rows: data.rows?.slice(0, length) || [],
        columns: data.features?.map((f: any) => f.feature?.name || f.name) || Object.keys(data.rows?.[0]?.row || {}),
        num_rows: data.num_rows_total || data.rows?.length || 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: import ──
    if (action === "import") {
      const { hf_dataset_id, dataset_id, config, split, input_column, output_column, offset = 0, length = 100 } = body;
      if (!hf_dataset_id || !dataset_id || !input_column || !output_column) {
        throw new Error("hf_dataset_id, dataset_id, input_column, and output_column are required");
      }

      // Fetch rows from HF
      const params = new URLSearchParams({
        dataset: hf_dataset_id,
        config: config || "default",
        split: split || "train",
        offset: String(offset),
        length: String(Math.min(length, 200)), // Cap at 200 per batch
      });

      const resp = await fetch(`${HF_ROWS_API}?${params}`, {
        headers: { "User-Agent": "SoupyForge-DatasetBot/1.0" },
      });

      if (!resp.ok) {
        // Try without config
        params.delete("config");
        const retry = await fetch(`${HF_ROWS_API}?${params}`, {
          headers: { "User-Agent": "SoupyForge-DatasetBot/1.0" },
        });
        if (!retry.ok) throw new Error(`Could not fetch dataset rows: ${retry.status}`);
        const data = await retry.json();
        return await processAndInsertRows(supabase, data, user.id, dataset_id, input_column, output_column, hf_dataset_id);
      }

      const data = await resp.json();
      return await processAndInsertRows(supabase, data, user.id, dataset_id, input_column, output_column, hf_dataset_id);
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    console.error("fetch-hf-dataset error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processAndInsertRows(
  supabase: any,
  data: any,
  userId: string,
  datasetId: string,
  inputCol: string,
  outputCol: string,
  hfDatasetId: string,
) {
  const rows = data.rows || [];
  if (rows.length === 0) throw new Error("No rows found in dataset");

  // Map rows to samples — handle nested conversation format too
  const samples: any[] = [];
  for (const row of rows) {
    const r = row.row || row;
    let input = "";
    let output = "";

    // Handle direct column mapping
    if (r[inputCol] !== undefined && r[outputCol] !== undefined) {
      input = typeof r[inputCol] === "string" ? r[inputCol] : JSON.stringify(r[inputCol]);
      output = typeof r[outputCol] === "string" ? r[outputCol] : JSON.stringify(r[outputCol]);
    }
    // Handle "messages" or "conversations" array format
    else if (r.messages && Array.isArray(r.messages)) {
      const userMsgs = r.messages.filter((m: any) => m.role === "user" || m.from === "human");
      const assistMsgs = r.messages.filter((m: any) => m.role === "assistant" || m.from === "gpt" || m.from === "assistant");
      if (userMsgs.length > 0) input = userMsgs[0].content || userMsgs[0].value || "";
      if (assistMsgs.length > 0) output = assistMsgs[0].content || assistMsgs[0].value || "";
    }
    else if (r.conversations && Array.isArray(r.conversations)) {
      const userMsgs = r.conversations.filter((m: any) => m.from === "human" || m.role === "user");
      const assistMsgs = r.conversations.filter((m: any) => m.from === "gpt" || m.from === "assistant" || m.role === "assistant");
      if (userMsgs.length > 0) input = userMsgs[0].value || userMsgs[0].content || "";
      if (assistMsgs.length > 0) output = assistMsgs[0].value || assistMsgs[0].content || "";
    }

    // Skip empty or too-short pairs
    if (input.length < 5 || output.length < 5) continue;

    // Truncate very long content
    input = input.slice(0, 4000);
    output = output.slice(0, 8000);

    samples.push({
      dataset_id: datasetId,
      user_id: userId,
      input,
      output,
      source_url: `https://huggingface.co/datasets/${hfDatasetId}`,
      quality_score: 4,
      status: "approved",
    });
  }

  if (samples.length === 0) throw new Error("No valid training pairs could be extracted from the rows");

  // Insert in batches of 50
  let inserted = 0;
  for (let i = 0; i < samples.length; i += 50) {
    const batch = samples.slice(i, i + 50);
    const { error } = await supabase.from("dataset_samples").insert(batch);
    if (error) throw new Error(`Failed to save samples: ${error.message}`);
    inserted += batch.length;
  }

  // Update sample count
  const { count } = await supabase
    .from("dataset_samples")
    .select("id", { count: "exact", head: true })
    .eq("dataset_id", datasetId);

  await supabase
    .from("training_datasets")
    .update({ sample_count: count || 0 })
    .eq("id", datasetId);

  return new Response(JSON.stringify({
    success: true,
    imported: inserted,
    total_rows: rows.length,
    skipped: rows.length - inserted,
    source: `https://huggingface.co/datasets/${hfDatasetId}`,
  }), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
      "Content-Type": "application/json",
    },
  });
}
