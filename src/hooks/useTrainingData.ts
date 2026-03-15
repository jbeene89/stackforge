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
      const { data, error } = await supabase.functions.invoke("scrape-for-training", { body: params });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["dataset-samples", vars.dataset_id] });
      qc.invalidateQueries({ queryKey: ["training-datasets"] });
      toast.success(`Extracted ${data.extracted} five-perspective training pairs`);
    },
    onError: (e: Error) => toast.error(e.message),
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
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { url: string; dataset_id: string; domain_hint?: string }) => {
      const { data, error } = await supabase.functions.invoke("scrape-for-training", { body: params });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["dataset-samples", vars.dataset_id] });
      qc.invalidateQueries({ queryKey: ["training-datasets"] });
      toast.success(`Extracted ${data.extracted} five-perspective training pairs`);
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

// Generate Python training script
export function generateTrainingScript(job: TrainingJob, dataset: TrainingDataset): string {
  const hp = job.hyperparameters || {};
  return `#!/usr/bin/env python3
"""
SoupyForge Local Training Script — Five Perspective Pipeline
Model: ${job.base_model}
Method: ${job.method}
Dataset: ${dataset.name}
Generated: ${new Date().toISOString()}

Prerequisites:
  pip install unsloth transformers datasets torch trl
"""

import json
from pathlib import Path

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
    with open(path, "r") as f:
        for line in f:
            samples.append(json.loads(line))
    print(f"Loaded {len(samples)} training samples")
    return samples

def train_with_unsloth():
    from unsloth import FastLanguageModel
    from trl import SFTTrainer
    from transformers import TrainingArguments
    from datasets import Dataset

    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=BASE_MODEL,
        max_seq_length=HYPERPARAMS["max_seq_length"],
        load_in_4bit=True,
    )

    # Add perspective tokens so the model learns cognitive mode switches
    tokenizer.add_special_tokens({"additional_special_tokens": SPECIAL_TOKENS})
    model.resize_token_embeddings(len(tokenizer))

    model = FastLanguageModel.get_peft_model(
        model,
        r=HYPERPARAMS["lora_rank"],
        lora_alpha=HYPERPARAMS["lora_alpha"],
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    )

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

    print("\\n🔥 Starting training with Five Perspective Pipeline tokens...")
    trainer.train()

    model.save_pretrained(f"{OUTPUT_DIR}/lora")
    print(f"\\n✅ LoRA adapter saved to {OUTPUT_DIR}/lora")

    model.save_pretrained_gguf(f"{OUTPUT_DIR}/gguf", tokenizer, quantization_method="q4_k_m")
    print(f"✅ GGUF model saved to {OUTPUT_DIR}/gguf")

if __name__ == "__main__":
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    print(f"🧠 SoupyForge Local Trainer — Five Perspective Pipeline")
    print(f"   Model: {BASE_MODEL}")
    print(f"   Method: ${job.method}")
    print(f"   Epochs: {HYPERPARAMS['epochs']}")
    print(f"   Learning Rate: {HYPERPARAMS['learning_rate']}")
    print(f"   Special Tokens: {len(SPECIAL_TOKENS)} perspective markers")
    print()
    train_with_unsloth()
`;
}
