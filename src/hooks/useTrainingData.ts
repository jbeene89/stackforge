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
    mutationFn: async (params: { url: string; dataset_id: string; domain_hint?: string; offload_perspective?: string }) => {
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

// Map short model IDs to valid Hugging Face Hub repo identifiers
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

  return `#!/usr/bin/env python3
"""
SoupyForge Local Training Script — Five Perspective Pipeline
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

# Hugging Face auth — required for gated models like Llama
# Run: pip install huggingface_hub && huggingface-cli login
# Or set HF_TOKEN environment variable
HF_TOKEN = os.environ.get("HF_TOKEN", None)

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

def check_hardware():
    import torch
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        vram = torch.cuda.get_device_properties(0).total_mem / 1e9
        print(f"  NVIDIA CUDA GPU: {gpu_name} ({vram:.1f} GB VRAM)")
        return "cuda"
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        print("  Apple Silicon detected (MPS) — using CPU fallback path")
        return "mps"
    else:
        import psutil
        ram = psutil.virtual_memory().total / 1e9
        print(f"  CPU mode — {ram:.0f} GB RAM available")
        return "cpu"

def train_with_unsloth():
    """NVIDIA CUDA path — uses Unsloth for fast LoRA fine-tuning."""
    try:
        from unsloth import FastLanguageModel
    except Exception as e:
        print(f"⚠️  Unsloth unavailable ({e})")
        print("   Falling back to CPU-compatible training path.\n")
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
            logging_steps=1,
            save_strategy="epoch",
            fp16=True,
            gradient_accumulation_steps=${cpuOffload ? 4 : 1},
        ),
    )

    print("\\n🔥 Starting GPU training with Unsloth...")
    trainer.train()
    model.save_pretrained(f"{OUTPUT_DIR}/lora")
    print(f"\\n✅ LoRA adapter saved to {OUTPUT_DIR}/lora")

    try:
        model.save_pretrained_gguf(f"{OUTPUT_DIR}/gguf", tokenizer, quantization_method="q4_k_m")
        print(f"✅ GGUF model saved to {OUTPUT_DIR}/gguf")
        print(f"   Run with: ollama create mymodel -f {OUTPUT_DIR}/gguf/Modelfile")
    except Exception as e:
        print(f"⚠️  GGUF export skipped: {e}")


def train_cpu_fallback():
    """CPU path — uses transformers + PEFT directly (no Unsloth needed)."""
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
    from peft import LoraConfig, get_peft_model, TaskType
    from trl import SFTTrainer
    from datasets import Dataset

    print("\\n🖥️  CPU-only mode: using transformers + PEFT (no Unsloth)")
    print("   This will be slower but works without a GPU.\\n")

    os.environ["CUDA_VISIBLE_DEVICES"] = ""

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True, token=HF_TOKEN)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.float32,
        device_map="cpu",
        trust_remote_code=True,
        token=HF_TOKEN,
    )

    tokenizer.add_special_tokens({"additional_special_tokens": SPECIAL_TOKENS})
    model.resize_token_embeddings(len(tokenizer))

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
            logging_steps=1,
            save_strategy="epoch",
            fp16=False,
            no_cuda=True,
            gradient_accumulation_steps=8,
            dataloader_num_workers=0,
        ),
    )

    print("\\n🔥 Starting CPU training with Five Perspective Pipeline tokens...")
    print(f"   Batch size: {HYPERPARAMS['batch_size']} (x8 gradient accumulation)")
    trainer.train()

    model.save_pretrained(f"{OUTPUT_DIR}/lora")
    tokenizer.save_pretrained(f"{OUTPUT_DIR}/lora")
    print(f"\\n✅ LoRA adapter saved to {OUTPUT_DIR}/lora")
    print(f"   To merge: use peft merge_and_unload() then export to GGUF manually")


if __name__ == "__main__":
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    print(f"🧠 SoupyForge Local Trainer — Five Perspective Pipeline")
    print(f"   Model: {BASE_MODEL}")
    print(f"   Method: ${job.method}")
    print(f"   Hardware: ${hwProfile}")
    print(f"   Epochs: {HYPERPARAMS['epochs']}")
    print(f"   Learning Rate: {HYPERPARAMS['learning_rate']}")
    print(f"   Seq Length: {HYPERPARAMS['max_seq_length']}")
    print(f"   Special Tokens: {len(SPECIAL_TOKENS)} perspective markers")
    print()
    hw = check_hardware()
    print()

    if USE_CPU_ONLY:
        train_cpu_fallback()
    elif hw == "cuda":
        train_with_unsloth()
    else:
        print("⚠️  Non-NVIDIA environment detected — using CPU fallback path.\n")
        train_cpu_fallback()
`;
}
