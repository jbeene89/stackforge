import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  cacheGetAll,
  cacheGetByIndex,
  cachePutAll,
  cachePut,
  cacheDelete as cacheDeleteItem,
  queueMutation,
} from "@/lib/offlineCache";

export interface TrainingDataset {
  id: string;
  user_id: string;
  name: string;
  description: string;
  domain: string;
  format: string;
  sample_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DatasetSample {
  id: string;
  dataset_id: string;
  user_id: string;
  input: string;
  output: string;
  source_url: string | null;
  quality_score: number;
  status: string;
  created_at: string;
  builder: string;
  red_team: string;
  systems: string;
  frame_breaker: string;
  empath: string;
  synthesis: string;
}

export interface TrainingJob {
  id: string;
  user_id: string;
  dataset_id: string;
  name: string;
  base_model: string;
  method: string;
  hyperparameters: Record<string, any>;
  status: string;
  metrics: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FounderInterview {
  id: string;
  user_id: string;
  dataset_id: string;
  transcript: Array<{ role: string; content: string }>;
  pairs_extracted: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// Datasets
export function useDatasets() {
  return useQuery({
    queryKey: ["training-datasets"],
    queryFn: async () => {
      if (!navigator.onLine) {
        return cacheGetAll<TrainingDataset>("training_datasets");
      }
      const { data, error } = await supabase
        .from("training_datasets" as any)
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const datasets = data as unknown as TrainingDataset[];
      // Populate cache in background
      cachePutAll("training_datasets", datasets).catch(console.error);
      return datasets;
    },
  });
}

export function useDataset(id: string) {
  return useQuery({
    queryKey: ["training-datasets", id],
    queryFn: async () => {
      if (!navigator.onLine) {
        const cached = await cacheGetAll<TrainingDataset>("training_datasets");
        const found = cached.find(d => d.id === id);
        if (found) return found;
        throw new Error("Dataset not available offline");
      }
      const { data, error } = await supabase
        .from("training_datasets" as any)
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      const ds = data as unknown as TrainingDataset;
      cachePut("training_datasets", ds).catch(console.error);
      return ds;
    },
    enabled: !!id,
  });
}

export function useCreateDataset() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (ds: { name: string; description?: string; domain?: string; format?: string }) => {
      const payload = {
        ...ds,
        user_id: user!.id,
        id: crypto.randomUUID(),
        sample_count: 0,
        status: "draft",
        domain: ds.domain || "general",
        format: ds.format || "instruction",
        description: ds.description || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (!navigator.onLine) {
        await cachePut("training_datasets", payload as any);
        await queueMutation({ store: "training_datasets", action: "insert", payload });
        toast.info("Saved offline — will sync when reconnected");
        return payload as unknown as TrainingDataset;
      }

      const { data, error } = await supabase
        .from("training_datasets" as any)
        .insert({ ...ds, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      const result = data as unknown as TrainingDataset;
      cachePut("training_datasets", result).catch(console.error);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training-datasets"] });
      toast.success("Dataset created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDataset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!navigator.onLine) {
        await cacheDeleteItem("training_datasets", id);
        await queueMutation({ store: "training_datasets", action: "delete", payload: { id } });
        toast.info("Deleted offline — will sync when reconnected");
        return;
      }
      const { error } = await supabase.from("training_datasets" as any).delete().eq("id", id);
      if (error) throw error;
      cacheDeleteItem("training_datasets", id).catch(console.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training-datasets"] });
      toast.success("Dataset deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Samples
export function useSamples(datasetId: string) {
  return useQuery({
    queryKey: ["dataset-samples", datasetId],
    queryFn: async () => {
      if (!navigator.onLine) {
        return cacheGetByIndex<DatasetSample>("dataset_samples", "by_dataset", datasetId);
      }
      const { data, error } = await supabase
        .from("dataset_samples" as any)
        .select("*")
        .eq("dataset_id", datasetId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const samples = data as unknown as DatasetSample[];
      cachePutAll("dataset_samples", samples).catch(console.error);
      return samples;
    },
    enabled: !!datasetId,
  });
}

export function useCreateSample() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (sample: { dataset_id: string; input: string; output: string; quality_score?: number }) => {
      const payload = {
        ...sample,
        user_id: user!.id,
        id: crypto.randomUUID(),
        status: "approved",
        quality_score: sample.quality_score ?? 3,
        created_at: new Date().toISOString(),
        builder: "",
        red_team: "",
        systems: "",
        frame_breaker: "",
        empath: "",
        synthesis: "",
        source_url: null,
      };

      if (!navigator.onLine) {
        await cachePut("dataset_samples", payload as any);
        await queueMutation({ store: "dataset_samples", action: "insert", payload });
        toast.info("Sample saved offline — will sync when reconnected");
        return payload;
      }

      const { data, error } = await supabase
        .from("dataset_samples" as any)
        .insert({ ...sample, user_id: user!.id, status: "approved" } as any)
        .select()
        .single();
      if (error) throw error;
      cachePut("dataset_samples", data as any).catch(console.error);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["dataset-samples", vars.dataset_id] });
      toast.success("Sample added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSample() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dataset_id, ...updates }: { id: string; dataset_id: string; input?: string; output?: string; quality_score?: number; status?: string }) => {
      if (!navigator.onLine) {
        const cached = await cacheGetByIndex<DatasetSample>("dataset_samples", "by_dataset", dataset_id);
        const existing = cached.find(s => s.id === id);
        if (existing) await cachePut("dataset_samples", { ...existing, ...updates } as any);
        await queueMutation({ store: "dataset_samples", action: "update", payload: { id, ...updates } });
        toast.info("Update saved offline");
        return { dataset_id };
      }

      const { error } = await supabase
        .from("dataset_samples" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
      return { dataset_id };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["dataset-samples", data.dataset_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSample() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dataset_id }: { id: string; dataset_id: string }) => {
      if (!navigator.onLine) {
        await cacheDeleteItem("dataset_samples", id);
        await queueMutation({ store: "dataset_samples", action: "delete", payload: { id } });
        toast.info("Deleted offline — will sync when reconnected");
        return { dataset_id };
      }

      const { error } = await supabase.from("dataset_samples" as any).delete().eq("id", id);
      if (error) throw error;
      cacheDeleteItem("dataset_samples", id).catch(console.error);
      return { dataset_id };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["dataset-samples", data.dataset_id] });
      toast.success("Sample removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Scrape
export function useScrapeForTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { url: string; dataset_id: string; domain_hint?: string; offload_perspective?: string; debate_mode?: boolean; synthesis_mode?: string }) => {
      const { data, error } = await supabase.functions.invoke("scrape-for-training", { body: params });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["dataset-samples", vars.dataset_id] });
      qc.invalidateQueries({ queryKey: ["training-datasets"] });
      const msg = data.offloaded
        ? `Extracted ${data.extracted} pairs (${data.offloaded} offloaded to tablet)`
        : `Extracted ${data.extracted} five-perspective training pairs`;
      toast.success(msg);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Check offloaded batch status
export function useOffloadBatchStatus() {
  return useMutation({
    mutationFn: async (batchId: string) => {
      const { data, error } = await supabase.functions.invoke("perspective-worker", {
        body: null,
        method: "GET",
      });
      // Use fetch directly for GET with query params
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/perspective-worker?action=status&batch_id=${batchId}`;
      const resp = await fetch(url, {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
      });
      if (!resp.ok) throw new Error("Failed to check batch status");
      return await resp.json();
    },
  });
}

// Process chat export conversation
export function useProcessChatExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { conversation_text: string; dataset_id: string; domain_hint?: string; provider: string; conversation_title?: string }) => {
      const { data, error } = await supabase.functions.invoke("process-chat-export", { body: params });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["dataset-samples", vars.dataset_id] });
      qc.invalidateQueries({ queryKey: ["training-datasets"] });
      const parts = [`${data.extracted} pairs (2-round debate)`];
      if (data.anti_patterns > 0) parts.push(`${data.anti_patterns} anti-patterns`);
      if (data.gaps_filled) parts.push("gap-filled");
      if (data.bootstrap_active) parts.push("🧬 fingerprint-boosted");
      toast.success(`Extracted ${parts.join(" · ")}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Hugging Face Datasets
export function useHFSearch() {
  return useMutation({
    mutationFn: async (query: string) => {
      const { data, error } = await supabase.functions.invoke("fetch-hf-dataset", {
        body: { action: "search", query },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { datasets: Array<{ id: string; author: string; name: string; downloads: number; likes: number; tags: string[]; description: string }> };
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useHFPreview() {
  return useMutation({
    mutationFn: async (params: { hf_dataset_id: string; config?: string; split?: string; offset?: number; length?: number }) => {
      const { data, error } = await supabase.functions.invoke("fetch-hf-dataset", {
        body: { action: "preview", ...params },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { rows: any[]; columns: string[]; num_rows: number };
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useHFImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { hf_dataset_id: string; dataset_id: string; config?: string; split?: string; input_column: string; output_column: string; offset?: number; length?: number }) => {
      const { data, error } = await supabase.functions.invoke("fetch-hf-dataset", {
        body: { action: "import", ...params },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { imported: number; total_rows: number; skipped: number };
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["dataset-samples", vars.dataset_id] });
      qc.invalidateQueries({ queryKey: ["training-datasets"] });
      toast.success(`Imported ${data.imported} training pairs from Hugging Face!`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}


// Founder Interview
export function useStartInterview() {
  return useMutation({
    mutationFn: async (params: { dataset_id: string }) => {
      const { data, error } = await supabase.functions.invoke("founder-interview", {
        body: { action: "start", ...params },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { interview_id: string; question: string };
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useInterviewRespond() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      interview_id: string;
      dataset_id: string;
      message: string;
      transcript: Array<{ role: string; content: string }>;
      domain_hint?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("founder-interview", {
        body: { action: "respond", ...params },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { follow_up: string; pair_created: boolean };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["dataset-samples", vars.dataset_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useFinishInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { interview_id: string; dataset_id: string }) => {
      const { data, error } = await supabase.functions.invoke("founder-interview", {
        body: { action: "finish", ...params },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { pairs_extracted: number; exchanges: number; syntheses: Array<{ topic: string; insight: string }> };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["dataset-samples", vars.dataset_id] });
      qc.invalidateQueries({ queryKey: ["training-datasets"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Training Jobs
export function useTrainingJobs() {
  return useQuery({
    queryKey: ["training-jobs"],
    queryFn: async () => {
      if (!navigator.onLine) {
        return cacheGetAll<TrainingJob>("training_jobs");
      }
      const { data, error } = await supabase
        .from("training_jobs" as any)
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const jobs = data as unknown as TrainingJob[];
      cachePutAll("training_jobs", jobs).catch(console.error);
      return jobs;
    },
  });
}

export function useCreateTrainingJob() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (job: { dataset_id: string; name: string; base_model?: string; method?: string; hyperparameters?: Record<string, any> }) => {
      const payload = {
        ...job,
        user_id: user!.id,
        id: crypto.randomUUID(),
        status: "draft",
        base_model: job.base_model || "phi-3-mini",
        method: job.method || "lora",
        hyperparameters: job.hyperparameters || { epochs: 3, lora_rank: 16, batch_size: 4, learning_rate: 0.0002 },
        metrics: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (!navigator.onLine) {
        await cachePut("training_jobs", payload as any);
        await queueMutation({ store: "training_jobs", action: "insert", payload });
        toast.info("Job saved offline — will sync when reconnected");
        return payload as unknown as TrainingJob;
      }

      const { data, error } = await supabase
        .from("training_jobs" as any)
        .insert({ ...job, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      const result = data as unknown as TrainingJob;
      cachePut("training_jobs", result).catch(console.error);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training-jobs"] });
      toast.success("Training job created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTrainingJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; metrics?: Record<string, any>; hyperparameters?: Record<string, any> }) => {
      if (!navigator.onLine) {
        const cached = await cacheGetAll<TrainingJob>("training_jobs");
        const existing = cached.find(j => j.id === id);
        if (existing) await cachePut("training_jobs", { ...existing, ...updates } as any);
        await queueMutation({ store: "training_jobs", action: "update", payload: { id, ...updates } });
        toast.info("Update saved offline");
        return;
      }

      const { error } = await supabase
        .from("training_jobs" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training-jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTrainingJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!navigator.onLine) {
        await cacheDeleteItem("training_jobs", id);
        await queueMutation({ store: "training_jobs", action: "delete", payload: { id } });
        toast.info("Deleted offline — will sync when reconnected");
        return;
      }

      const { error } = await supabase.from("training_jobs" as any).delete().eq("id", id);
      if (error) throw error;
      cacheDeleteItem("training_jobs", id).catch(console.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training-jobs"] });
      toast.success("Training job deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Export dataset as JSONL with perspective tokens
export function exportDatasetAsJsonl(samples: DatasetSample[], datasetName: string) {
  const lines = samples
    .filter(s => s.status === "approved")
    .map(s => {
      let assistantContent = "";
      
      if (s.builder || s.red_team || s.systems || s.frame_breaker || s.empath || s.synthesis) {
        assistantContent = [
          s.builder ? `<BUILDER>${s.builder}</BUILDER>` : "",
          s.red_team ? `<RED_TEAM>${s.red_team}</RED_TEAM>` : "",
          s.systems ? `<SYSTEMS>${s.systems}</SYSTEMS>` : "",
          s.frame_breaker ? `<FRAME_BREAKER>${s.frame_breaker}</FRAME_BREAKER>` : "",
          s.empath ? `<EMPATH>${s.empath}</EMPATH>` : "",
          s.synthesis ? `<SYNTHESIS>${s.synthesis}</SYNTHESIS>` : "",
        ].filter(Boolean).join("\n\n");
      } else {
        assistantContent = s.output;
      }

      return JSON.stringify({
        messages: [
          { role: "user", content: s.input },
          { role: "assistant", content: assistantContent },
        ]
      });
    });
  
  const blob = new Blob([lines.join("\n")], { type: "application/jsonl" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${datasetName.toLowerCase().replace(/\s+/g, "-")}-dataset.jsonl`;
  a.click();
  URL.revokeObjectURL(url);
}

// Validate generated Python script for common syntax issues
export function validatePythonScript(script: string): string[] {
  const errors: string[] = [];
  const lines = script.split("\n");

  lines.forEach((line, i) => {
    const lineNum = i + 1;
    const stripped = line.trimStart();

    // Skip comments and blank lines
    if (stripped.startsWith("#") || stripped === "") return;

    // Check for unterminated string literals (single-line strings only)
    // Count unescaped quotes outside of triple-quoted strings
    for (const q of ['"', "'"]) {
      // Skip triple-quoted lines
      if (stripped.includes(q.repeat(3))) return;

      // Find all quote positions that aren't escaped
      let inString = false;
      let opens = 0;
      for (let j = 0; j < stripped.length; j++) {
        if (stripped[j] === q && (j === 0 || stripped[j - 1] !== "\\")) {
          inString = !inString;
          opens++;
        }
      }
      if (opens % 2 !== 0) {
        errors.push(`Line ${lineNum}: Unterminated string literal — ${line.trim().substring(0, 60)}`);
      }
    }

    // Check for duplicate keyword arguments in function calls
    const funcCallMatch = stripped.match(/^\w[\w.]*\((.+)\)\s*$/);
    if (funcCallMatch) {
      const kwargs = [...funcCallMatch[1].matchAll(/\b(\w+)\s*=/g)].map(m => m[1]);
      const seen = new Set<string>();
      for (const kw of kwargs) {
        if (seen.has(kw)) {
          errors.push(`Line ${lineNum}: Duplicate keyword argument '${kw}'`);
        }
        seen.add(kw);
      }
    }

    // Check for unbalanced parentheses/brackets per line (basic)
    const parens = (stripped.match(/\(/g) || []).length - (stripped.match(/\)/g) || []).length;
    const brackets = (stripped.match(/\[/g) || []).length - (stripped.match(/\]/g) || []).length;
    const braces = (stripped.match(/\{/g) || []).length - (stripped.match(/\}/g) || []).length;

    // These are line-level heuristics — multi-line constructs are expected to be unbalanced per line
    // Only flag obviously wrong cases (closing more than opening on a single line)
    if (parens < -1) errors.push(`Line ${lineNum}: Unbalanced parentheses`);
    if (brackets < -1) errors.push(`Line ${lineNum}: Unbalanced brackets`);
    if (braces < -1) errors.push(`Line ${lineNum}: Unbalanced braces`);
  });

  // Global balance check
  const allParens = (script.match(/\(/g) || []).length - (script.match(/\)/g) || []).length;
  const allBrackets = (script.match(/\[/g) || []).length - (script.match(/\]/g) || []).length;
  const allBraces = (script.match(/\{/g) || []).length - (script.match(/\}/g) || []).length;
  if (allParens !== 0) errors.push(`Global: Unbalanced parentheses (${allParens > 0 ? "missing )" : "extra )"})`);
  if (allBrackets !== 0) errors.push(`Global: Unbalanced brackets (${allBrackets > 0 ? "missing ]" : "extra ]"})`);
  if (allBraces !== 0) errors.push(`Global: Unbalanced braces (${allBraces > 0 ? "missing }" : "extra }"})`);

  return errors;
}

const HF_MODEL_MAP: Record<string, string> = {
  "llama-3.2-1b": "meta-llama/Llama-3.2-1B",
  "llama-3.2-3b": "meta-llama/Llama-3.2-3B",
  "qwen2.5-1.5b": "Qwen/Qwen2.5-1.5B",
  "gemma-2-2b": "google/gemma-2-2b",
  "phi-3-mini": "microsoft/phi-3-mini-4k-instruct",
  "mistral-7b": "mistralai/Mistral-7B-v0.3",
};

// Generate Python training script
export function generateTrainingScript(job: TrainingJob, dataset: TrainingDataset): string {
  const hp = job.hyperparameters || {};
  const cpuOffload = hp.cpu_offload ?? false;
  const gradientCheckpointing = hp.gradient_checkpointing ?? true;
  const hwProfile = hp.hw_profile || "cpu_only";
  const maxSeqLen = hp.max_seq_length || 1024;
  const isCpuOnly = hwProfile === "cpu_only";
  const hfModelId = HF_MODEL_MAP[job.base_model] || job.base_model;
  const layerStrategy = hp.layer_strategy || "all";

  return `#!/usr/bin/env python3
"""
Soupy Local Training Script - Five Perspective Pipeline
Model: ${hfModelId}
Method: ${job.method}
Dataset: ${dataset.name}
Hardware Profile: ${hwProfile}
Generated: ${new Date().toISOString()}

Prerequisites:
  pip install unsloth transformers datasets torch trl
${isCpuOnly ? `
NOTE: CPU-only mode detected. Training will be slower but will work
with just RAM (16GB+ recommended). No GPU required.
` : ""}
"""

import json, os, sys
from pathlib import Path

BASE_MODEL = "${hfModelId}"
DATASET_FILE = "${dataset.name.toLowerCase().replace(/\s+/g, "-")}-dataset.jsonl"
OUTPUT_DIR = "./output/${job.name.toLowerCase().replace(/\s+/g, "-")}"

HYPERPARAMS = {
    "epochs": ${hp.epochs || 3},
    "learning_rate": ${hp.learning_rate || 0.0002},
    "batch_size": ${hp.batch_size || 1},
    "lora_rank": ${hp.lora_rank || 8},
    "lora_alpha": ${(hp.lora_rank || 8) * 2},
    "warmup_steps": 10,
    "max_seq_length": ${maxSeqLen},
    "gradient_checkpointing": ${gradientCheckpointing ? "True" : "False"},
    "cpu_offload": ${cpuOffload ? "True" : "False"},
}

# ── Selective Layer Control ──
# Strategy: "${layerStrategy}"
# - "all": Target all layers (default, maximum learning)
# - "knowledge": Target middle layers (factual knowledge, associations)
# - "style": Target early + late layers (tone, formatting, persona)
# - "reasoning": Target attention layers only (logic, chain-of-thought)
LAYER_STRATEGY = "${layerStrategy}"

def get_target_layers(model, strategy):
    """Determine which layers to apply LoRA to based on strategy."""
    # Count total layers
    num_layers = 0
    for name, _ in model.named_modules():
        if ".layers." in name or ".h." in name or ".blocks." in name:
            parts = name.split(".")
            for p in parts:
                if p.isdigit():
                    num_layers = max(num_layers, int(p) + 1)
                    break

    if num_layers == 0:
        num_layers = 32  # fallback for unknown architectures

    if strategy == "knowledge":
        # Middle 40% of layers: where factual associations live
        start = int(num_layers * 0.3)
        end = int(num_layers * 0.7)
        target_layer_indices = list(range(start, end))
        print(f"  [Layer Control] Knowledge mode: targeting layers {start}-{end-1} of {num_layers}")
    elif strategy == "style":
        # First 20% + last 20%: where tone/formatting patterns live
        early_end = int(num_layers * 0.2)
        late_start = int(num_layers * 0.8)
        target_layer_indices = list(range(0, early_end)) + list(range(late_start, num_layers))
        print(f"  [Layer Control] Style mode: targeting layers 0-{early_end-1} and {late_start}-{num_layers-1}")
    elif strategy == "reasoning":
        # Focus on attention projections in middle-to-late layers
        start = int(num_layers * 0.25)
        end = int(num_layers * 0.85)
        target_layer_indices = list(range(start, end))
        print(f"  [Layer Control] Reasoning mode: targeting attention in layers {start}-{end-1}")
    else:
        target_layer_indices = list(range(num_layers))
        print(f"  [Layer Control] All layers mode: targeting all {num_layers} layers")

    return target_layer_indices, num_layers

def filter_target_modules_by_layer(model, base_modules, layer_indices, strategy):
    """Filter LoRA target modules to only apply to selected layers."""
    if strategy == "all":
        return base_modules  # No filtering needed

    filtered = []
    for name, _ in model.named_parameters():
        for mod in base_modules:
            if mod in name:
                # Extract layer index from parameter name
                parts = name.split(".")
                layer_idx = None
                for p in parts:
                    if p.isdigit():
                        layer_idx = int(p)
                        break
                if layer_idx is not None and layer_idx in layer_indices:
                    # For reasoning mode, only target attention (q/k/v/o), skip MLP
                    if strategy == "reasoning" and mod in ["gate_proj", "up_proj", "down_proj"]:
                        continue
                    filtered.append(name.rsplit(".", 1)[0] + "." + mod)
                    break

    # Deduplicate while preserving order
    seen = set()
    unique = []
    for m in filtered:
        if m not in seen:
            seen.add(m)
            unique.append(m)

    if not unique:
        print(f"  [!] No layers matched strategy '{strategy}', falling back to all")
        return base_modules

    print(f"  [Layer Control] Targeting {len(unique)} module instances (vs {len(base_modules)} base modules)")
    return unique

# Hardware profile: ${hwProfile}
USE_CPU_ONLY = ${isCpuOnly ? "True" : "False"}

# Hugging Face auth - required for gated models like Llama
# Run: pip install huggingface_hub && huggingface-cli login
# Or set HF_TOKEN environment variable
HF_TOKEN = os.environ.get("HF_TOKEN", None)

GATED_MODELS = ["meta-llama"]

def check_hf_auth():
    """Pre-flight check: ensure HF_TOKEN is set for gated models."""
    is_gated = any(g in BASE_MODEL.lower() for g in GATED_MODELS)
    if not is_gated:
        return
    if HF_TOKEN:
        print(f"  [OK] HF_TOKEN found - authenticated for gated model")
        return
    # Check if logged in via huggingface-cli
    try:
        from huggingface_hub import HfApi
        api = HfApi()
        user = api.whoami()
        print(f"  [OK] Logged in as: {user.get('name', 'unknown')}")
        return
    except Exception:
        pass
    print()
    print("  [!] GATED MODEL DETECTED: " + BASE_MODEL)
    print("  Llama models require Hugging Face authentication.")
    print()
    print("  Option 1: Set HF_TOKEN environment variable")
    print("    Windows:  set HF_TOKEN=hf_your_token_here")
    print("    Mac/Linux: export HF_TOKEN=hf_your_token_here")
    print()
    print("  Option 2: Login via CLI")
    print("    pip install huggingface_hub")
    print("    huggingface-cli login")
    print()
    print("  Get your token at: https://huggingface.co/settings/tokens")
    print("  Accept the model license at: https://huggingface.co/meta-llama")
    print()
    response = input("  Continue anyway? (y/n): ").strip().lower()
    if response != "y":
        print("  Exiting. Set HF_TOKEN and try again.")
        sys.exit(1)

# Special tokens for five-perspective thinking
SPECIAL_TOKENS = [
    "<BUILDER>", "</BUILDER>",
    "<RED_TEAM>", "</RED_TEAM>",
    "<SYSTEMS>", "</SYSTEMS>",
    "<FRAME_BREAKER>", "</FRAME_BREAKER>",
    "<EMPATH>", "</EMPATH>",
    "<SYNTHESIS>", "</SYNTHESIS>",
]

def load_dataset(path):
    samples = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            samples.append(json.loads(line))
    print(f"Loaded {len(samples)} training samples")
    return samples

def build_sft_trainer(SFTTrainer, model, tokenizer, dataset, training_args):
    base_kwargs = {
        "model": model,
        "train_dataset": dataset,
        "args": training_args,
    }
    attempts = [
        {"processing_class": tokenizer, "dataset_text_field": "text", "max_seq_length": HYPERPARAMS["max_seq_length"]},
        {"tokenizer": tokenizer, "dataset_text_field": "text", "max_seq_length": HYPERPARAMS["max_seq_length"]},
        {"processing_class": tokenizer},
        {"tokenizer": tokenizer},
        {},
    ]
    last_error = None
    for extra_kwargs in attempts:
        try:
            return SFTTrainer(**base_kwargs, **extra_kwargs)
        except TypeError as e:
            last_error = e
    raise last_error

def check_hardware():
    import torch
    # Check for AMD ROCm (HIP) first — torch.cuda works on ROCm too
    if hasattr(torch.version, "hip") and torch.version.hip is not None:
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            vram = torch.cuda.get_device_properties(0).total_mem / 1e9
            print(f"  AMD ROCm GPU: {gpu_name} ({vram:.1f} GB VRAM)")
            print(f"  ROCm version: {torch.version.hip}")
            # Set HSA override for common AMD GPUs (RX 580, RX 570, etc.)
            import subprocess
            try:
                gfx_arch = subprocess.check_output(
                    ["rocminfo"], stderr=subprocess.DEVNULL
                ).decode()
                if "gfx803" in gfx_arch:
                    import os
                    os.environ["HSA_OVERRIDE_GFX_VERSION"] = "8.0.3"
                    print("  [Auto] Set HSA_OVERRIDE_GFX_VERSION=8.0.3 for Polaris GPU")
            except Exception:
                pass
            return "rocm"
        else:
            print("  ROCm detected but no GPU available — falling back to CPU")
            import psutil
            ram = psutil.virtual_memory().total / 1e9
            print(f"  CPU mode - {ram:.0f} GB RAM available")
            return "cpu"
    elif torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        vram = torch.cuda.get_device_properties(0).total_mem / 1e9
        print(f"  NVIDIA CUDA GPU: {gpu_name} ({vram:.1f} GB VRAM)")
        return "cuda"
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        print("  Apple Silicon detected (MPS) - using CPU fallback path")
        return "mps"
    else:
        import psutil
        ram = psutil.virtual_memory().total / 1e9
        print(f"  CPU mode - {ram:.0f} GB RAM available")
        return "cpu"

def train_with_unsloth():
    """NVIDIA CUDA path - uses Unsloth for fast LoRA fine-tuning."""
    try:
        from unsloth import FastLanguageModel
    except Exception as e:
        print(f"[!] Unsloth unavailable ({e})")
        print("   Falling back to CPU-compatible training path.")
        train_cpu_fallback()
        return

    from trl import SFTTrainer
    from transformers import TrainingArguments
    from datasets import Dataset

    hw = check_hardware()
    use_4bit = hw == "cuda"

    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=BASE_MODEL,
        max_seq_length=HYPERPARAMS["max_seq_length"],
        load_in_4bit=use_4bit,
        token=HF_TOKEN,
    )

    tokenizer.add_special_tokens({"additional_special_tokens": SPECIAL_TOKENS})
    model.resize_token_embeddings(len(tokenizer))

    if not getattr(tokenizer, "chat_template", None):
        tokenizer.chat_template = "{% for message in messages %}{% if message['role'] == 'system' %}<|system|>\\n{{ message['content'] }}\\n{% elif message['role'] == 'user' %}<|user|>\\n{{ message['content'] }}\\n{% elif message['role'] == 'assistant' %}<|assistant|>\\n{{ message['content'] }}\\n{% endif %}{% endfor %}"

    # Apply selective layer control
    base_target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
    layer_indices, total_layers = get_target_layers(model, LAYER_STRATEGY)

    if LAYER_STRATEGY != "all":
        filtered_modules = filter_target_modules_by_layer(model, base_target_modules, layer_indices, LAYER_STRATEGY)
        # For Unsloth, we pass base module names but control via layers_to_transform
        model = FastLanguageModel.get_peft_model(
            model,
            r=HYPERPARAMS["lora_rank"],
            lora_alpha=HYPERPARAMS["lora_alpha"],
            target_modules=base_target_modules if LAYER_STRATEGY != "reasoning" else ["q_proj", "k_proj", "v_proj", "o_proj"],
            layers_to_transform=layer_indices,
            use_gradient_checkpointing=HYPERPARAMS["gradient_checkpointing"],
        )
    else:
        model = FastLanguageModel.get_peft_model(
            model,
            r=HYPERPARAMS["lora_rank"],
            lora_alpha=HYPERPARAMS["lora_alpha"],
            target_modules=base_target_modules,
            use_gradient_checkpointing=HYPERPARAMS["gradient_checkpointing"],
        )

    raw = load_dataset(DATASET_FILE)
    formatted = []
    for sample in raw:
        msgs = sample["messages"]
        text = tokenizer.apply_chat_template(msgs, tokenize=False, add_generation_prompt=False)
        formatted.append({"text": text})

    dataset = Dataset.from_list(formatted)

    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=HYPERPARAMS["epochs"],
        per_device_train_batch_size=HYPERPARAMS["batch_size"],
        learning_rate=HYPERPARAMS["learning_rate"],
        warmup_steps=HYPERPARAMS["warmup_steps"],
        logging_steps=1,
        save_strategy="epoch",
        fp16=True,
        gradient_accumulation_steps=${cpuOffload ? 4 : 1},
    )

    trainer = build_sft_trainer(
        SFTTrainer=SFTTrainer,
        model=model,
        tokenizer=tokenizer,
        dataset=dataset,
        training_args=training_args,
    )

    print("\\n>> Starting GPU training with Unsloth...")
    trainer.train()
    model.save_pretrained(f"{OUTPUT_DIR}/lora")
    print(f"\\n[OK] LoRA adapter saved to {OUTPUT_DIR}/lora")

    try:
        model.save_pretrained_gguf(f"{OUTPUT_DIR}/gguf", tokenizer, quantization_method="q4_k_m")
        print(f"[OK] GGUF model saved to {OUTPUT_DIR}/gguf")
        print(f"   Run with: ollama create mymodel -f {OUTPUT_DIR}/gguf/Modelfile")
    except Exception as e:
        print(f"[!] GGUF export skipped: {e}")


def train_cpu_fallback():
    """CPU path - uses transformers + PEFT directly (no Unsloth needed)."""
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
    from peft import LoraConfig, get_peft_model, TaskType
    from trl import SFTTrainer
    from datasets import Dataset

    print("\\n[CPU] CPU-only mode: using transformers + PEFT (no Unsloth)")
    print("   This will be slower but works without a GPU.\\n")

    os.environ["CUDA_VISIBLE_DEVICES"] = ""

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True, token=HF_TOKEN)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        dtype=torch.float32,
        device_map="cpu",
        trust_remote_code=True,
        token=HF_TOKEN,
    )

    tokenizer.add_special_tokens({"additional_special_tokens": SPECIAL_TOKENS})
    model.resize_token_embeddings(len(tokenizer))

    if not getattr(tokenizer, "chat_template", None):
        tokenizer.chat_template = "{% for message in messages %}{% if message['role'] == 'system' %}<|system|>\\n{{ message['content'] }}\\n{% elif message['role'] == 'user' %}<|user|>\\n{{ message['content'] }}\\n{% elif message['role'] == 'assistant' %}<|assistant|>\\n{{ message['content'] }}\\n{% endif %}{% endfor %}"

    # Apply selective layer control for CPU path
    base_cpu_modules = ["q_proj", "k_proj", "v_proj", "o_proj"]
    layer_indices, _ = get_target_layers(model, LAYER_STRATEGY)

    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=HYPERPARAMS["lora_rank"],
        lora_alpha=HYPERPARAMS["lora_alpha"],
        target_modules=base_cpu_modules,
        layers_to_transform=layer_indices if LAYER_STRATEGY != "all" else None,
        lora_dropout=0.05,
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    raw = load_dataset(DATASET_FILE)
    formatted = []
    for sample in raw:
        msgs = sample["messages"]
        text = tokenizer.apply_chat_template(msgs, tokenize=False, add_generation_prompt=False)
        formatted.append({"text": text})

    dataset = Dataset.from_list(formatted)

    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=HYPERPARAMS["epochs"],
        per_device_train_batch_size=HYPERPARAMS["batch_size"],
        learning_rate=HYPERPARAMS["learning_rate"],
        warmup_steps=HYPERPARAMS["warmup_steps"],
        logging_steps=1,
        save_strategy="epoch",
        fp16=False,
        use_cpu=True,
        gradient_accumulation_steps=8,
        dataloader_num_workers=0,
    )

    trainer = build_sft_trainer(
        SFTTrainer=SFTTrainer,
        model=model,
        tokenizer=tokenizer,
        dataset=dataset,
        training_args=training_args,
    )

    print("\\n>> Starting CPU training with Five Perspective Pipeline tokens...")
    print(f"   Batch size: {HYPERPARAMS['batch_size']} (x8 gradient accumulation)")
    trainer.train()

    model.save_pretrained(f"{OUTPUT_DIR}/lora")
    tokenizer.save_pretrained(f"{OUTPUT_DIR}/lora")
    print(f"\\n[OK] LoRA adapter saved to {OUTPUT_DIR}/lora")
    print(f"   To merge: use peft merge_and_unload() then export to GGUF manually")


def train_with_rocm():
    """AMD ROCm path - uses transformers + PEFT with ROCm-compatible settings."""
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
    from peft import LoraConfig, get_peft_model, TaskType
    from trl import SFTTrainer
    from datasets import Dataset
    import os

    print("\\n[ROCm] AMD GPU detected — using ROCm-compatible training path")
    print("   Make sure you have pytorch-rocm installed (pip install torch --index-url https://download.pytorch.org/whl/rocm6.0)")

    # Ensure HSA override is set for older AMD GPUs
    if not os.environ.get("HSA_OVERRIDE_GFX_VERSION"):
        gpu_name = torch.cuda.get_device_name(0).lower()
        if any(x in gpu_name for x in ["rx 580", "rx 570", "rx 560", "rx 480", "rx 470"]):
            os.environ["HSA_OVERRIDE_GFX_VERSION"] = "8.0.3"
            print("   [Auto] Set HSA_OVERRIDE_GFX_VERSION=8.0.3 for Polaris GPU")

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True, token=HF_TOKEN)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True,
        token=HF_TOKEN,
    )

    tokenizer.add_special_tokens({"additional_special_tokens": SPECIAL_TOKENS})
    model.resize_token_embeddings(len(tokenizer))

    if not getattr(tokenizer, "chat_template", None):
        tokenizer.chat_template = "{% for message in messages %}{% if message['role'] == 'system' %}<|system|>\\n{{ message['content'] }}\\n{% elif message['role'] == 'user' %}<|user|>\\n{{ message['content'] }}\\n{% elif message['role'] == 'assistant' %}<|assistant|>\\n{{ message['content'] }}\\n{% endif %}{% endfor %}"

    # Apply selective layer control
    base_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
    layer_indices, _ = get_target_layers(model, LAYER_STRATEGY)

    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=HYPERPARAMS["lora_rank"],
        lora_alpha=HYPERPARAMS["lora_alpha"],
        target_modules=base_modules if LAYER_STRATEGY != "reasoning" else ["q_proj", "k_proj", "v_proj", "o_proj"],
        layers_to_transform=layer_indices if LAYER_STRATEGY != "all" else None,
        lora_dropout=0.05,
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    raw = load_dataset(DATASET_FILE)
    formatted = []
    for sample in raw:
        msgs = sample["messages"]
        text = tokenizer.apply_chat_template(msgs, tokenize=False, add_generation_prompt=False)
        formatted.append({"text": text})

    dataset = Dataset.from_list(formatted)

    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=HYPERPARAMS["epochs"],
        per_device_train_batch_size=HYPERPARAMS["batch_size"],
        learning_rate=HYPERPARAMS["learning_rate"],
        warmup_steps=HYPERPARAMS["warmup_steps"],
        logging_steps=1,
        save_strategy="epoch",
        fp16=True,
        gradient_accumulation_steps=${cpuOffload ? 4 : 2},
        gradient_checkpointing=${gradientCheckpointing ? "True" : "False"},
    )

    trainer = build_sft_trainer(
        SFTTrainer=SFTTrainer,
        model=model,
        tokenizer=tokenizer,
        dataset=dataset,
        training_args=training_args,
    )

    print("\\n>> Starting ROCm training with Five Perspective Pipeline tokens...")
    print(f"   GPU: {torch.cuda.get_device_name(0)}")
    print(f"   VRAM: {torch.cuda.get_device_properties(0).total_mem / 1e9:.1f} GB")
    trainer.train()

    model.save_pretrained(f"{OUTPUT_DIR}/lora")
    tokenizer.save_pretrained(f"{OUTPUT_DIR}/lora")
    print(f"\\n[OK] LoRA adapter saved to {OUTPUT_DIR}/lora")

    # Try GGUF export
    try:
        from transformers import AutoModelForCausalLM as AMCLM
        from peft import PeftModel
        base = AMCLM.from_pretrained(BASE_MODEL, torch_dtype=torch.float16, token=HF_TOKEN)
        merged = PeftModel.from_pretrained(base, f"{OUTPUT_DIR}/lora")
        merged = merged.merge_and_unload()
        merged.save_pretrained(f"{OUTPUT_DIR}/merged")
        tokenizer.save_pretrained(f"{OUTPUT_DIR}/merged")
        print(f"[OK] Merged model saved to {OUTPUT_DIR}/merged")
        print(f"   Convert to GGUF with: python llama.cpp/convert_hf_to_gguf.py {OUTPUT_DIR}/merged --outtype q4_k_m")
    except Exception as e:
        print(f"[!] Auto-merge skipped: {e}")
        print(f"   Manual merge: load LoRA with PeftModel, call merge_and_unload(), then convert to GGUF")


if __name__ == "__main__":
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    print(f"Soupy Local Trainer - Five Perspective Pipeline")
    print(f"   Model: {BASE_MODEL}")
    print(f"   Method: ${job.method}")
    print(f"   Hardware: ${hwProfile}")
    print(f"   Epochs: {HYPERPARAMS['epochs']}")
    print(f"   Learning Rate: {HYPERPARAMS['learning_rate']}")
    print(f"   Seq Length: {HYPERPARAMS['max_seq_length']}")
    print(f"   Special Tokens: {len(SPECIAL_TOKENS)} perspective markers")
    print()
    hw = check_hardware()
    check_hf_auth()
    print()

    if USE_CPU_ONLY:
        train_cpu_fallback()
    elif hw == "cuda":
        train_with_unsloth()
    elif hw == "rocm":
        train_with_rocm()
    else:
        print("Non-NVIDIA/AMD environment detected - using CPU fallback path.")
        train_cpu_fallback()
`;
}

// Cognitive Fingerprint
export function useCognitiveFingerprint(datasetId: string) {
  return useQuery({
    queryKey: ["cognitive-fingerprint", datasetId],
    enabled: !!datasetId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cognitive_fingerprints" as any)
        .select("*")
        .eq("dataset_id", datasetId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
}

export function useGenerateCognitiveFingerprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { dataset_id: string }) => {
      const { data, error } = await supabase.functions.invoke("cognitive-fingerprint", { body: params });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["cognitive-fingerprint", vars.dataset_id] });
      toast.success(`Cognitive fingerprint extracted from ${data.samples_analyzed} samples`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Generate injection-only script — no extraction, no upload, no seeds.
// Just apply CDPT perspectives as HEAT to what the model already knows.
// Popcorn mode: base model = bag, knowledge = kernels, perspectives = heat.
export function generateInjectionScript(
  zones: string[],
  intensity: number,
  perspectives: string[],
  baseModel: string,
  ollamaModel: string = "llama3.2:1b",
  domain: string = "general",
  weights: Record<string, number> = {}
): string {
  const hfModelId = HF_MODEL_MAP[baseModel] || baseModel;
  const zonesJson = JSON.stringify(zones);
  const perspectsJson = JSON.stringify(perspectives);
  const weightsJson = JSON.stringify(weights);
  const numRounds = Math.max(3, Math.round(intensity * 4));
  const totalSlots = perspectives.reduce((sum, p) => sum + (weights[p] || 1), 0);

  return `#!/usr/bin/env python3
"""
Soupy CDPT Popcorn Injection - Pure Heat, Zero Extract
============================================================
The base model is a bag of popcorn. Its stock knowledge is the kernels.
The ${perspectives.length} CDPT perspectives are the HEAT.
${totalSlots > perspectives.length ? `\nBIAS HEAT ACTIVE: ${totalSlots} weighted burner slots (some perspectives run multiple times)` : ""}

No seeds. No extraction. No upload. No questions.
Just heat the kernels and watch them pop into ${totalSlots}x their size.

Base Model: ${hfModelId}
Ollama Model: ${ollamaModel}
Domain: ${domain}
Zones: ${zones.join(", ")}
Intensity: ${intensity}x (${numRounds} rounds)
Perspectives: ${perspectives.length} heat channels (${totalSlots} weighted slots)
${Object.entries(weights).filter(([, v]) => v >= 2).map(([k, v]) => `  ${k}: ${v}x (biased)`).join("\\n")}

How it works:
  Each perspective channel is a BURNER. Weight > 1x means that burner
  runs MULTIPLE TIMES per round with increasing temperature — like 
  replacing one burner with two of the same kind. More heat = more 
  expansion in that cognitive direction.

  Round 1: Each perspective pops raw kernels (weight x times)
  Round 2+: Chain-pop previous output (weight x times)
  Result: Bias-shaped cognitive expansion from stock knowledge alone
"""

import subprocess, json, os, sys, time
from pathlib import Path

OLLAMA_MODEL = "${ollamaModel}"
DOMAIN = "${domain}"
ZONES = ${zonesJson}
INTENSITY = ${intensity}
PERSPECTIVES = ${perspectsJson}
WEIGHTS = ${weightsJson}  # Per-perspective multiplier (0=off, 1=normal, 2=double, 3=triple)
NUM_ROUNDS = ${numRounds}
OUTPUT_DIR = Path("injection_output")
OUTPUT_DIR.mkdir(exist_ok=True)

# ---- Ollama helper ----
def ollama_generate(prompt, system="You are a helpful assistant.", temperature=0.8):
    """Call Ollama via its REST API for reliable generation."""
    import urllib.request, urllib.error
    url = os.environ.get("OLLAMA_HOST", "http://localhost:11434") + "/api/generate"
    payload = json.dumps({
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "system": system,
        "stream": False,
        "options": {"temperature": temperature},
    }).encode("utf-8")
    try:
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("response", "").strip()
    except urllib.error.URLError as e:
        print(f"  [!] Ollama connection error: {e.reason}")
        print(f"      Is Ollama running? Try: ollama serve")
        return ""
    except Exception as e:
        print(f"  [!] Ollama error: {e}")
        return ""

# ---- Perspective Burners ----
# Each burner is a heat source that pops kernels differently
BURNERS = {
    "builder": {
        "heat": "You are pure engineering instinct. Stream your deepest knowledge about {domain} as if you were architecting and building it from scratch right now. Cover tools, patterns, tradeoffs, implementation details. Go deep. No questions, no hedging -- just BUILD.",
        "chain": "Take this existing analysis and rebuild it harder. What was missed architecturally? What would you actually ship? Push deeper into implementation.",
    },
    "red_team": {
        "heat": "You are an adversarial analyst. Stream everything you know about failure modes, vulnerabilities, common mistakes, and attack surfaces in {domain}. What breaks? What do people get wrong? What are the hidden risks? Be ruthless.",
        "chain": "This analysis has gaps. Attack it. Find every weakness, every assumption, every blind spot. What would break in production? Be more adversarial.",
    },
    "systems": {
        "heat": "You are a systems thinker. Stream your knowledge of {domain} as interconnected systems -- feedback loops, dependencies, emergent properties, cascading effects, equilibria. How does everything connect?",
        "chain": "Map the second and third-order effects of this analysis. What feedback loops were missed? What emergent behaviors arise? Go deeper into the system dynamics.",
    },
    "frame_breaker": {
        "heat": "You are a contrarian philosopher. Stream your knowledge of {domain} by challenging every default assumption. What would an outsider see? What frames are people trapped in? What paradigm shifts are needed?",
        "chain": "The framing is still conventional. Break it harder. What would someone from a completely different field see? What sacred cows need slaughtering?",
    },
    "empath": {
        "heat": "You are pure emotional intelligence applied to {domain}. Stream everything about the human side -- who is affected, what motivates them, what fears and hopes drive decisions, what the lived experience actually feels like.",
        "chain": "Go deeper into the human element. What emotional undercurrents were missed? What would someone who LIVES this every day want you to understand?",
    },
    "synthesis": {
        "heat": "You are a master synthesizer. Stream your deepest, most integrated understanding of {domain} -- weaving together practical, critical, systemic, contrarian, and human perspectives into unified insight. No fragments, pure integration.",
        "chain": "This synthesis is incomplete. Integrate harder. Find the thread that connects ALL the perspectives. What is the unified insight that emerges when you hold everything at once?",
    },
    "debate": {
        "heat": "You contain multitudes on {domain}. Stage an internal debate between your pragmatic side and your skeptical side. Let them argue, concede points, and reach hard-won conclusions. No easy agreement.",
        "chain": "The debate was too polite. Escalate it. Make each side defend harder positions. What does the pragmatist concede? What does the skeptic acknowledge? Push to real resolution.",
    },
    "gap_fill": {
        "heat": "You are a gap detector. Stream everything about {domain} that is USUALLY LEFT OUT -- the things tutorials skip, experts assume you know, textbooks omit, and conventional wisdom ignores. Fill every gap.",
        "chain": "There are still gaps. What about the gaps BETWEEN the gaps? What meta-knowledge is missing? What would a true master know that even this analysis leaves out?",
    },
    "anti_pattern": {
        "heat": "Generate the most generic, surface-level, copy-paste response about {domain} that a lazy AI would produce. Maximum fluff, minimum substance. This is the WRONG answer -- the thing we train AWAY from.",
        "chain": "Make it even more generic and useless. More hedging, more filler, more 'it depends'. This is the anti-pattern we are training the model to NEVER produce.",
    },
}

# ---- Main Popcorn Engine ----
def pop_kernels():
    total_slots = sum(WEIGHTS.get(p, 1) for p in PERSPECTIVES)
    print("\\n== POPCORN MODE: Applying heat to stock knowledge ==")
    print(f"   {len(PERSPECTIVES)} perspectives, {total_slots} weighted slots x {NUM_ROUNDS} rounds = {total_slots * NUM_ROUNDS} pops")
    print(f"   Domain: {DOMAIN}")
    bias_info = [(p, WEIGHTS.get(p, 1)) for p in PERSPECTIVES if WEIGHTS.get(p, 1) >= 2]
    if bias_info:
        print(f"   BIAS HEAT: {', '.join(f'{p} @ {w}x' for p, w in bias_info)}")
    print(f"   No extraction. No seeds. Just heat.\\n")

    all_samples = []
    
    for round_num in range(NUM_ROUNDS):
        print(f"\\n--- Round {round_num + 1}/{NUM_ROUNDS} {'(RAW HEAT)' if round_num == 0 else '(CHAIN POP)'} ---")
        
        round_outputs = {}
        
        for pkey in PERSPECTIVES:
            if pkey not in BURNERS:
                continue
            weight = WEIGHTS.get(pkey, 1)
            if weight <= 0:
                continue
            burner = BURNERS[pkey]
            
            for heat_pass in range(weight):
                pass_label = f" (heat pass {heat_pass + 1}/{weight})" if weight > 1 else ""
                temp_boost = heat_pass * 0.08  # Each extra pass gets slightly hotter
                
                if round_num == 0:
                    # Raw heat -- pop kernels directly
                    prompt = burner["heat"].format(domain=DOMAIN)
                    if heat_pass > 0:
                        # Subsequent passes on same perspective: vary the angle
                        prompt += f"\\n\\nThis is heat pass {heat_pass + 1}. Go DEEPER and find what you missed in previous passes. Take a completely different angle."
                    system = f"You are the {pkey.upper()} perspective. Stream consciousness. Go deep. No lists, no structure -- just pure knowledge flow."
                else:
                    # Chain pop -- use previous round's combined output as input
                    if round_outputs:
                        prev_context = "\\n\\n".join([
                            f"[{k.upper()}]: {v[:800]}" 
                            for k, v in round_outputs.items() if v
                        ])
                    else:
                        # Pull from previous round's metadata
                        prev_samples = [s for s in all_samples if s.get("metadata", {}).get("round") == round_num]
                        if prev_samples:
                            last = prev_samples[-1]
                            prev_context = last["messages"][1]["content"][:3000] if last.get("messages") else "Continue analysis."
                        else:
                            prev_context = "Continue deep analysis of " + DOMAIN
                    prompt = f"Previous analysis:\\n{prev_context}\\n\\n{burner['chain']}"
                    if heat_pass > 0:
                        prompt += f"\\n\\nHeat pass {heat_pass + 1}. Push harder. Find angles the previous pass missed entirely."
                    system = f"You are the {pkey.upper()} perspective. Round {round_num + 1}. Push deeper than before."
                
                print(f"  [{pkey.upper()}]{pass_label} Popping{'...' if round_num == 0 else ' (chain)...'}", end=" ", flush=True)
                output = ollama_generate(prompt, system=system, temperature=0.7 + (round_num * 0.05) + temp_boost)
                
                if output and len(output) > 50:
                    # For multi-pass, merge outputs for this perspective
                    if pkey in round_outputs and heat_pass > 0:
                        round_outputs[pkey] += f"\\n\\n[HEAT PASS {heat_pass + 1}]\\n" + output
                    else:
                        round_outputs[pkey] = output
                    print(f"popped! ({len(output)} chars)")
                else:
                    print("dud kernel")
        
        # Build training sample from this round
        if len(round_outputs) >= 2:
            # Create the enriched multi-perspective response
            enriched_parts = []
            for pkey, content in round_outputs.items():
                tag = pkey.upper()
                enriched_parts.append(f"<{tag}>{content}</{tag}>")
            enriched_output = "\\n\\n".join(enriched_parts)
            
            # The "question" is implicit -- it's the domain itself viewed through heat
            round_label = f"Round {round_num + 1}"
            sample = {
                "messages": [
                    {"role": "user", "content": f"Apply deep {DOMAIN} expertise through all cognitive lenses. {round_label} analysis."},
                    {"role": "assistant", "content": enriched_output}
                ],
                "metadata": {
                    "source": "popcorn_injection",
                    "round": round_num + 1,
                    "perspectives_popped": list(round_outputs.keys()),
                    "pop_count": len(round_outputs),
                    "chain_depth": round_num,
                }
            }
            all_samples.append(sample)
            
            # Also create per-perspective samples for finer-grained training
            for pkey, content in round_outputs.items():
                per_sample = {
                    "messages": [
                        {"role": "user", "content": f"Analyze {DOMAIN} from the {pkey.upper()} perspective. Depth level: {round_num + 1}."},
                        {"role": "assistant", "content": f"<{pkey.upper()}>{content}</{pkey.upper()}>"}
                    ],
                    "metadata": {
                        "source": "popcorn_injection",
                        "round": round_num + 1,
                        "perspective": pkey,
                        "content": content[:200],
                    }
                }
                all_samples.append(per_sample)
    
    return all_samples

# ---- Zone config ----
def generate_train_config(sample_count):
    zone_config = {}
    base_rank = 16
    for zone in ["roots", "trunk", "canopy"]:
        if zone in ZONES:
            zone_config[zone] = {"lora_rank": int(base_rank * INTENSITY), "active": True}
        else:
            zone_config[zone] = {"lora_rank": max(4, int(base_rank * 0.25)), "active": False}
    return {
        "base_model": "${hfModelId}",
        "method": "popcorn_injection",
        "zones": zone_config,
        "intensity": INTENSITY,
        "perspectives": PERSPECTIVES,
        "rounds": NUM_ROUNDS,
        "sample_count": sample_count,
        "layer_mapping": {
            "roots": {"start": 0, "end": 6},
            "trunk": {"start": 7, "end": 24},
            "canopy": {"start": 25, "end": 31},
        }
    }

# ---- Main ----
def main():
    print("=" * 60)
    print("  POPCORN MODE")
    print("  Base model = bag | Knowledge = kernels | CDPT = heat")
    print("  Nothing added. Everything expanded.")
    print("=" * 60)
    
    # Pre-flight: check Ollama is reachable and model is available
    import urllib.request, urllib.error
    ollama_host = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
    print(f"\\n[CHECK] Connecting to Ollama at {ollama_host}...")
    try:
        req = urllib.request.Request(f"{ollama_host}/api/tags")
        with urllib.request.urlopen(req, timeout=10) as resp:
            tags = json.loads(resp.read().decode("utf-8"))
            models = [m.get("name", "") for m in tags.get("models", [])]
            print(f"[CHECK] Available models: {', '.join(models) if models else '(none)'}")
            if not any(OLLAMA_MODEL in m for m in models):
                print(f"\\n[ERROR] Model '{OLLAMA_MODEL}' not found!")
                print(f"  Run: ollama pull {OLLAMA_MODEL}")
                sys.exit(1)
            print(f"[CHECK] Model '{OLLAMA_MODEL}' found. Starting injection...\\n")
    except urllib.error.URLError as e:
        print(f"\\n[ERROR] Cannot reach Ollama at {ollama_host}: {e.reason}")
        print("  Make sure Ollama is running: ollama serve")
        sys.exit(1)
    
    # Pop
    samples = pop_kernels()
    
    if not samples:
        print("[ERROR] No kernels popped. Check Ollama connection.")
        sys.exit(1)
    
    # Save
    dataset_path = OUTPUT_DIR / "popcorn_dataset.jsonl"
    with open(dataset_path, "w") as f:
        for s in samples:
            f.write(json.dumps(s) + "\\n")
    
    config = generate_train_config(len(samples))
    config_path = OUTPUT_DIR / "injection_config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)
    
    # Calculate expansion
    perspective_count = len([p for p in PERSPECTIVES if p in BURNERS])
    expansion = perspective_count * NUM_ROUNDS
    
    print(f"\\n{'=' * 60}")
    print(f"  POPCORN COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Kernels popped:     {len(samples)}")
    print(f"  Perspectives:       {perspective_count} burners")
    print(f"  Rounds:             {NUM_ROUNDS}")
    print(f"  Expansion:          ~{expansion}x cognitive density")
    print(f"  Zones:              {', '.join(ZONES)}")
    print(f"  Intensity:          {INTENSITY}x")
    print(f"\\n  Output: {dataset_path}")
    print(f"  Config: {config_path}")
    print(f"\\n  Next: python3 train.py")
    print(f"  Same bag. Same kernels. {expansion}x the volume.")

if __name__ == "__main__":
    main()
`;
}

// Generate local unlearn script (runs via Ollama — zero cloud dependency)
export function generateUnlearnScript(
  targets: string[],
  baseModel: string,
  ollamaModel: string = "llama3.2:1b"
): string {
  const hfModelId = HF_MODEL_MAP[baseModel] || baseModel;
  const targetsJson = JSON.stringify(targets.map(t => t.replace(/"/g, '\\"')));

  return `#!/usr/bin/env python3
"""
Soupy Selective Unlearning Script - Local Only (Ollama)
============================================================
Generates DPO suppression pairs to selectively remove base model behaviors.
NO cloud calls. Everything runs through your local Ollama instance.

Base Model: ${hfModelId}
Ollama Model: ${ollamaModel}
Targets: ${targets.length} behaviors to suppress

How it works:
  1. For each unwanted behavior, prompts your local Ollama to generate
     examples of the base model exhibiting that behavior ("rejected")
  2. Then generates your preferred alternative responses ("chosen")
  3. Outputs DPO-format JSONL ready for preference training
  4. Optionally generates a negative LoRA for task vector subtraction

Prerequisites:
  - Ollama running locally: curl -fsSL https://ollama.com/install.sh | sh
  - Pull a model: ollama pull ${ollamaModel}
  - pip install transformers peft torch

Usage:
  python3 unlearn.py                          # Generate DPO pairs
  python3 unlearn.py --negative-lora          # Also train a negative LoRA
  python3 unlearn.py --pairs-per-target 10    # More pairs per behavior
"""

import json, os, sys, time, argparse, subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# ── Configuration ──
UNLEARN_TARGETS = ${targetsJson}
OLLAMA_MODEL = "${ollamaModel}"
BASE_MODEL = "${hfModelId}"
OUTPUT_DIR = "./unlearn_output"
DEFAULT_PAIRS_PER_TARGET = 5

def ollama_generate(prompt, system="", temperature=0.7):
    """Call local Ollama instance. Zero cloud dependency."""
    import requests
    try:
        resp = requests.post("http://localhost:11434/api/generate", json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "options": {"temperature": temperature},
        }, timeout=120)
        resp.raise_for_status()
        return resp.json().get("response", "")
    except requests.ConnectionError:
        print("[!] Cannot connect to Ollama. Is it running?")
        print("    Start it with: ollama serve")
        sys.exit(1)
    except Exception as e:
        print(f"[!] Ollama error: {e}")
        return ""

def extract_json(text):
    """Extract JSON from potentially markdown-wrapped output."""
    import re
    match = re.search(r'[\\[{][\\s\\S]*[\\]}]', text)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None

def generate_rejected_examples(target, n=5):
    """Generate examples of the UNWANTED behavior (these become 'rejected' in DPO)."""
    system = (
        "You are simulating a language model that has the following problematic behavior. "
        "Generate realistic user prompts that would trigger this behavior, "
        "and the problematic responses the model would give. "
        "Return ONLY valid JSON array."
    )
    prompt = (
        f"Unwanted behavior: {target}\\n\\n"
        f"Generate {n} realistic conversation pairs where a model exhibits this exact behavior.\\n"
        f"Each pair should have a different user question/context.\\n\\n"
        f"Return JSON array:\\n"
        f'[{{"prompt": "user message that triggers the behavior", '
        f'"rejected_response": "the problematic response exhibiting the unwanted behavior", '
        f'"behavior_tag": "short label for what is wrong"}}]'
    )
    raw = ollama_generate(prompt, system, temperature=0.8)
    return extract_json(raw) or []

def generate_preferred_alternatives(rejected_pairs):
    """For each rejected response, generate the PREFERRED alternative."""
    system = (
        "You are generating ideal replacement responses. "
        "For each problematic response, write what the model SHOULD say instead. "
        "Return ONLY valid JSON array."
    )
    pairs_text = json.dumps(rejected_pairs, indent=2)
    prompt = (
        f"Here are problematic model responses that need better alternatives:\\n\\n"
        f"{pairs_text}\\n\\n"
        f"For each one, generate a 'chosen_response' - what the model SHOULD say instead.\\n"
        f"The chosen response should be natural, helpful, and NOT exhibit the problematic behavior.\\n\\n"
        f"Return JSON array:\\n"
        f'[{{"prompt": "same user message", "chosen_response": "ideal response", '
        f'"rejected_response": "same problematic response"}}]'
    )
    raw = ollama_generate(prompt, system, temperature=0.4)
    return extract_json(raw) or []

def generate_task_vector_data(target, n=10):
    """Generate pure examples of the unwanted behavior for negative LoRA training."""
    system = (
        "Generate training examples that strongly exhibit a specific behavior pattern. "
        "These will be used to train a model TO exhibit this behavior "
        "(which will then be subtracted via task vector arithmetic). "
        "Return ONLY valid JSON array."
    )
    prompt = (
        f"Target behavior to isolate: {target}\\n\\n"
        f"Generate {n} high-quality training pairs where the assistant strongly "
        f"exhibits this exact behavior pattern.\\n\\n"
        f"Return JSON array:\\n"
        f'[{{"messages": [{{"role": "user", "content": "..."}}, '
        f'{{"role": "assistant", "content": "response strongly showing the target behavior"}}]}}]'
    )
    raw = ollama_generate(prompt, system, temperature=0.6)
    return extract_json(raw) or []

def main():
    parser = argparse.ArgumentParser(description="Soupy Selective Unlearning")
    parser.add_argument("--pairs-per-target", type=int, default=DEFAULT_PAIRS_PER_TARGET,
                        help="Number of DPO pairs to generate per target behavior")
    parser.add_argument("--negative-lora", action="store_true",
                        help="Also generate negative LoRA training data for task vector subtraction")
    parser.add_argument("--output", default=OUTPUT_DIR, help="Output directory")
    args = parser.parse_args()

    Path(args.output).mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("Soupy Selective Unlearning - 100%% Local")
    print("=" * 60)
    print(f"  Ollama Model: {OLLAMA_MODEL}")
    print(f"  Base Model:   {BASE_MODEL}")
    print(f"  Targets:      {len(UNLEARN_TARGETS)} behaviors")
    print(f"  Pairs/target: {args.pairs_per_target}")
    print(f"  Negative LoRA: {'Yes' if args.negative_lora else 'No'}")
    print()

    # Verify Ollama is running
    test = ollama_generate("Say OK", temperature=0)
    if not test:
        print("[!] Ollama not responding. Exiting.")
        sys.exit(1)
    print("[OK] Ollama connected\\n")

    all_dpo_pairs = []
    all_negative_data = []

    for i, target in enumerate(UNLEARN_TARGETS):
        print(f"\\n--- Target {i+1}/{len(UNLEARN_TARGETS)}: {target} ---")

        # Step 1: Generate rejected examples
        print(f"  Generating {args.pairs_per_target} rejected examples...")
        rejected = generate_rejected_examples(target, args.pairs_per_target)
        print(f"  Got {len(rejected)} rejected examples")

        if not rejected:
            print(f"  [!] No examples generated, skipping")
            continue

        # Step 2: Generate preferred alternatives
        print(f"  Generating preferred alternatives...")
        dpo_pairs = generate_preferred_alternatives(rejected)
        print(f"  Got {len(dpo_pairs)} DPO pairs")

        for pair in dpo_pairs:
            pair["unlearn_target"] = target
            pair["weight"] = 2.0  # Higher weight for unlearning pairs
        all_dpo_pairs.extend(dpo_pairs)

        # Step 3 (optional): Generate negative LoRA data
        if args.negative_lora:
            print(f"  Generating negative LoRA training data...")
            neg_data = generate_task_vector_data(target, args.pairs_per_target * 2)
            print(f"  Got {len(neg_data)} negative training examples")
            all_negative_data.extend(neg_data)

        time.sleep(1)  # Brief pause between targets

    # Write DPO pairs
    dpo_path = os.path.join(args.output, "unlearn_dpo.jsonl")
    with open(dpo_path, "w", encoding="utf-8") as f:
        for pair in all_dpo_pairs:
            f.write(json.dumps(pair, ensure_ascii=False) + "\\n")
    print(f"\\n[OK] DPO pairs written: {dpo_path} ({len(all_dpo_pairs)} pairs)")

    # Write negative LoRA data
    if args.negative_lora and all_negative_data:
        neg_path = os.path.join(args.output, "negative_lora_data.jsonl")
        with open(neg_path, "w", encoding="utf-8") as f:
            for sample in all_negative_data:
                f.write(json.dumps(sample, ensure_ascii=False) + "\\n")
        print(f"[OK] Negative LoRA data: {neg_path} ({len(all_negative_data)} samples)")

    # Write merge script for task vector subtraction
    if args.negative_lora:
        merge_script = '''#!/usr/bin/env python3
"""
Task Vector Subtraction - Merge Script
Trains a negative LoRA on unwanted behaviors, then subtracts it during merge.

Usage:
  1. Train your main LoRA normally with train.py
  2. Train the negative LoRA: python3 train.py --dataset negative_lora_data.jsonl --output ./negative_lora
  3. Run this script: python3 merge_subtract.py --positive ./output/lora --negative ./negative_lora --alpha 0.5
"""
import argparse, torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-model", default="''' + hfModelId + '''")
    parser.add_argument("--positive", required=True, help="Path to your trained LoRA")
    parser.add_argument("--negative", required=True, help="Path to negative LoRA to subtract")
    parser.add_argument("--alpha", type=float, default=0.5, help="Subtraction strength (0.3-0.7 recommended)")
    parser.add_argument("--output", default="./merged_unlearned")
    args = parser.parse_args()

    print(f"Loading base model: {args.base_model}")
    tokenizer = AutoTokenizer.from_pretrained(args.base_model, trust_remote_code=True)
    base_model = AutoModelForCausalLM.from_pretrained(args.base_model, torch_dtype=torch.float32, trust_remote_code=True)

    # Load positive LoRA
    print(f"Loading positive LoRA: {args.positive}")
    pos_model = PeftModel.from_pretrained(base_model, args.positive)
    pos_merged = pos_model.merge_and_unload()

    # Get positive delta (positive_merged - base)
    base_state = AutoModelForCausalLM.from_pretrained(args.base_model, torch_dtype=torch.float32, trust_remote_code=True).state_dict()
    pos_delta = {}
    for key in pos_merged.state_dict():
        if key in base_state:
            pos_delta[key] = pos_merged.state_dict()[key] - base_state[key]

    # Load negative LoRA
    print(f"Loading negative LoRA: {args.negative}")
    neg_base = AutoModelForCausalLM.from_pretrained(args.base_model, torch_dtype=torch.float32, trust_remote_code=True)
    neg_model = PeftModel.from_pretrained(neg_base, args.negative)
    neg_merged = neg_model.merge_and_unload()
    neg_delta = {}
    for key in neg_merged.state_dict():
        if key in base_state:
            neg_delta[key] = neg_merged.state_dict()[key] - base_state[key]

    # Task vector arithmetic: base + positive_delta - alpha * negative_delta
    print(f"Applying task vector subtraction (alpha={args.alpha})...")
    final_state = dict(base_state)
    for key in final_state:
        if key in pos_delta:
            final_state[key] = final_state[key] + pos_delta[key]
        if key in neg_delta:
            final_state[key] = final_state[key] - args.alpha * neg_delta[key]

    final_model = AutoModelForCausalLM.from_pretrained(args.base_model, torch_dtype=torch.float32, trust_remote_code=True)
    final_model.load_state_dict(final_state)
    final_model.save_pretrained(args.output)
    tokenizer.save_pretrained(args.output)
    print(f"[OK] Unlearned model saved to {args.output}")
    print(f"   Positive LoRA applied, negative LoRA subtracted at {args.alpha}x strength")

if __name__ == "__main__":
    main()
'''
        merge_path = os.path.join(args.output, "merge_subtract.py")
        with open(merge_path, "w", encoding="utf-8") as f:
            f.write(merge_script)
        print(f"[OK] Merge script: {merge_path}")

    # Summary
    print()
    print("=" * 60)
    print("NEXT STEPS:")
    print("=" * 60)
    print(f"  1. Add {dpo_path} to your DPO training data")
    print(f"  2. The 'weight: 2.0' field tells the trainer to emphasize these")
    if args.negative_lora:
        print(f"  3. Train negative LoRA on negative_lora_data.jsonl")
        print(f"  4. Run merge_subtract.py to subtract unwanted behaviors")
    print()
    print("Behaviors targeted for removal:")
    for t in UNLEARN_TARGETS:
        print(f"  - {t}")

if __name__ == "__main__":
    main()
`;
}

// Pipeline Modes (Socratic, Dream, Contradictions, etc.)
export type PipelineMode = "socratic" | "contradictions" | "dream" | "epistemic" | "load_balance" | "reverse_engineer";

export function usePipelineMode() {
  return useMutation({
    mutationFn: async (params: { mode: PipelineMode; dataset_id: string }) => {
      const { data, error } = await supabase.functions.invoke("pipeline-modes", { body: params });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
