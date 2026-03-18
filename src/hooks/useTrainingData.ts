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
SoupyForge Local Training Script - Five Perspective Pipeline
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
    if torch.cuda.is_available():
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

    model = FastLanguageModel.get_peft_model(
        model,
        r=HYPERPARAMS["lora_rank"],
        lora_alpha=HYPERPARAMS["lora_alpha"],
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
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

    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=HYPERPARAMS["lora_rank"],
        lora_alpha=HYPERPARAMS["lora_alpha"],
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
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


if __name__ == "__main__":
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    print(f"SoupyForge Local Trainer - Five Perspective Pipeline")
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
    else:
        print("Non-NVIDIA environment detected - using CPU fallback path.")
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
SoupyForge Selective Unlearning Script - Local Only (Ollama)
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
    parser = argparse.ArgumentParser(description="SoupyForge Selective Unlearning")
    parser.add_argument("--pairs-per-target", type=int, default=DEFAULT_PAIRS_PER_TARGET,
                        help="Number of DPO pairs to generate per target behavior")
    parser.add_argument("--negative-lora", action="store_true",
                        help="Also generate negative LoRA training data for task vector subtraction")
    parser.add_argument("--output", default=OUTPUT_DIR, help="Output directory")
    args = parser.parse_args()

    Path(args.output).mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("SoupyForge Selective Unlearning - 100%% Local")
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
