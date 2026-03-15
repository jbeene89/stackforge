import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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

// Datasets
export function useDatasets() {
  return useQuery({
    queryKey: ["training-datasets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_datasets" as any)
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as unknown as TrainingDataset[];
    },
  });
}

export function useDataset(id: string) {
  return useQuery({
    queryKey: ["training-datasets", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_datasets" as any)
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as unknown as TrainingDataset;
    },
    enabled: !!id,
  });
}

export function useCreateDataset() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (ds: { name: string; description?: string; domain?: string; format?: string }) => {
      const { data, error } = await supabase
        .from("training_datasets" as any)
        .insert({ ...ds, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TrainingDataset;
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
      const { error } = await supabase.from("training_datasets" as any).delete().eq("id", id);
      if (error) throw error;
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
      const { data, error } = await supabase
        .from("dataset_samples" as any)
        .select("*")
        .eq("dataset_id", datasetId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as DatasetSample[];
    },
    enabled: !!datasetId,
  });
}

export function useCreateSample() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (sample: { dataset_id: string; input: string; output: string; quality_score?: number }) => {
      const { data, error } = await supabase
        .from("dataset_samples" as any)
        .insert({ ...sample, user_id: user!.id, status: "approved" } as any)
        .select()
        .single();
      if (error) throw error;
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
      const { error } = await supabase.from("dataset_samples" as any).delete().eq("id", id);
      if (error) throw error;
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
    mutationFn: async (params: { url: string; dataset_id: string; domain_hint?: string }) => {
      const { data, error } = await supabase.functions.invoke("scrape-for-training", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["dataset-samples", vars.dataset_id] });
      qc.invalidateQueries({ queryKey: ["training-datasets"] });
      toast.success(`Extracted ${data.extracted} training pairs`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Training Jobs
export function useTrainingJobs() {
  return useQuery({
    queryKey: ["training-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_jobs" as any)
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as unknown as TrainingJob[];
    },
  });
}

export function useCreateTrainingJob() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (job: { dataset_id: string; name: string; base_model?: string; method?: string; hyperparameters?: Record<string, any> }) => {
      const { data, error } = await supabase
        .from("training_jobs" as any)
        .insert({ ...job, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TrainingJob;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training-jobs"] });
      toast.success("Training job created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Export dataset as JSONL
export function exportDatasetAsJsonl(samples: DatasetSample[], datasetName: string) {
  const lines = samples
    .filter(s => s.status === "approved")
    .map(s => JSON.stringify({
      messages: [
        { role: "user", content: s.input },
        { role: "assistant", content: s.output },
      ]
    }));
  
  const blob = new Blob([lines.join("\n")], { type: "application/jsonl" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${datasetName.toLowerCase().replace(/\s+/g, "-")}-dataset.jsonl`;
  a.click();
  URL.revokeObjectURL(url);
}

// Generate Python training script
export function generateTrainingScript(job: TrainingJob, dataset: TrainingDataset): string {
  const hp = job.hyperparameters || {};
  return `#!/usr/bin/env python3
"""
SoupyForge Local Training Script
Model: ${job.base_model}
Method: ${job.method}
Dataset: ${dataset.name}
Generated: ${new Date().toISOString()}

Prerequisites:
  pip install unsloth transformers datasets torch
  # or for llama.cpp:
  pip install llama-cpp-python
"""

import json
from pathlib import Path

# === Configuration ===
BASE_MODEL = "${job.base_model}"
DATASET_FILE = "${dataset.name.toLowerCase().replace(/\s+/g, "-")}-dataset.jsonl"
OUTPUT_DIR = "./output/${job.name.toLowerCase().replace(/\s+/g, "-")}"

HYPERPARAMS = {
    "epochs": ${hp.epochs || 3},
    "learning_rate": ${hp.learning_rate || 0.0002},
    "batch_size": ${hp.batch_size || 4},
    "lora_rank": ${hp.lora_rank || 16},
    "lora_alpha": ${(hp.lora_rank || 16) * 2},
    "warmup_steps": 10,
    "max_seq_length": 2048,
}

def load_dataset(path):
    """Load JSONL dataset exported from SoupyForge."""
    samples = []
    with open(path, "r") as f:
        for line in f:
            samples.append(json.loads(line))
    print(f"Loaded {len(samples)} training samples")
    return samples

def train_with_unsloth():
    """Fine-tune using Unsloth (4x faster LoRA training)."""
    from unsloth import FastLanguageModel
    from trl import SFTTrainer
    from transformers import TrainingArguments
    from datasets import Dataset

    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=BASE_MODEL,
        max_seq_length=HYPERPARAMS["max_seq_length"],
        load_in_4bit=True,
    )

    model = FastLanguageModel.get_peft_model(
        model,
        r=HYPERPARAMS["lora_rank"],
        lora_alpha=HYPERPARAMS["lora_alpha"],
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    )

    # Load and format data
    raw = load_dataset(DATASET_FILE)
    formatted = []
    for sample in raw:
        msgs = sample["messages"]
        text = tokenizer.apply_chat_template(msgs, tokenize=False, add_generation_prompt=False)
        formatted.append({"text": text})

    dataset = Dataset.from_list(formatted)

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=HYPERPARAMS["max_seq_length"],
        args=TrainingArguments(
            output_dir=OUTPUT_DIR,
            num_train_epochs=HYPERPARAMS["epochs"],
            per_device_train_batch_size=HYPERPARAMS["batch_size"],
            learning_rate=HYPERPARAMS["learning_rate"],
            warmup_steps=HYPERPARAMS["warmup_steps"],
            logging_steps=5,
            save_strategy="epoch",
            fp16=True,
        ),
    )

    print("\\n🔥 Starting training...")
    trainer.train()

    # Save in multiple formats
    model.save_pretrained(f"{OUTPUT_DIR}/lora")
    print(f"\\n✅ LoRA adapter saved to {OUTPUT_DIR}/lora")

    # Export to GGUF for llama.cpp
    model.save_pretrained_gguf(f"{OUTPUT_DIR}/gguf", tokenizer, quantization_method="q4_k_m")
    print(f"✅ GGUF model saved to {OUTPUT_DIR}/gguf")

if __name__ == "__main__":
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    print(f"🧠 SoupyForge Local Trainer")
    print(f"   Model: {BASE_MODEL}")
    print(f"   Method: ${job.method}")
    print(f"   Epochs: {HYPERPARAMS['epochs']}")
    print(f"   Learning Rate: {HYPERPARAMS['learning_rate']}")
    print()
    train_with_unsloth()
`;
}
