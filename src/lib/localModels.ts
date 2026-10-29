/** Hugging Face training IDs and Ollama runtime tags are deliberately separate. */
export interface LocalModel {
  id: string;
  label: string;
  params: string;
  family: string;
  kind: "text" | "vision";
  trainable: boolean;
  ollama?: string;
  description: string;
  downloadGB?: number;
  memoryGB?: number;
}

export const LOCAL_MODELS: LocalModel[] = [
  { id: "Qwen/Qwen3-0.6B", label: "Qwen 3 0.6B", params: "0.6B", family: "qwen", kind: "text", trainable: true, ollama: "qwen3:0.6b", description: "Tiny general-purpose text model", downloadGB: 0.523, memoryGB: 2 },
  { id: "Qwen/Qwen3-1.7B", label: "Qwen 3 1.7B", params: "1.7B", family: "qwen", kind: "text", trainable: true, ollama: "qwen3:1.7b", description: "Compact multilingual text and reasoning", downloadGB: 1.4, memoryGB: 3 },
  { id: "Qwen/Qwen3-4B", label: "Qwen 3 4B", params: "4B", family: "qwen", kind: "text", trainable: true, ollama: "qwen3:4b", description: "More capacity for reasoning and code", downloadGB: 2.5, memoryGB: 5 },
  { id: "google/gemma-3-270m-it", label: "Gemma 3 270M", params: "270M", family: "gemma", kind: "text", trainable: true, ollama: "gemma3:270m", description: "Very small text model for constrained hardware", downloadGB: 0.292, memoryGB: 1 },
  { id: "google/gemma-3-1b-it", label: "Gemma 3 1B", params: "1B", family: "gemma", kind: "text", trainable: true, ollama: "gemma3:1b", description: "Lightweight text-only Gemma", downloadGB: 0.806, memoryGB: 2 },
  { id: "microsoft/Phi-4-mini-instruct", label: "Phi 4 Mini", params: "3.8B", family: "phi", kind: "text", trainable: true, description: "Instruction-tuned compact reasoning model" },
  { id: "meta-llama/Llama-3.2-1B-Instruct", label: "Llama 3.2 1B", params: "1B", family: "llama", kind: "text", trainable: true, ollama: "llama3.2:1b", description: "Established lightweight compatibility choice", downloadGB: 1.3, memoryGB: 3 },
  { id: "meta-llama/Llama-3.2-3B-Instruct", label: "Llama 3.2 3B", params: "3B", family: "llama", kind: "text", trainable: true, ollama: "llama3.2:3b", description: "Established general-purpose compatibility choice", downloadGB: 2, memoryGB: 4 },
  { id: "Qwen/Qwen2.5-1.5B-Instruct", label: "Qwen 2.5 1.5B", params: "1.5B", family: "qwen", kind: "text", trainable: true, ollama: "qwen2.5:1.5b", description: "Compatibility choice for existing training kits", downloadGB: 1, memoryGB: 3 },
  { id: "Qwen/Qwen3.5-0.8B", label: "Qwen 3.5 0.8B", params: "0.8B", family: "qwen", kind: "vision", trainable: false, ollama: "qwen3.5:0.8b", description: "Small text-and-image model for local Ollama", downloadGB: 1.3, memoryGB: 3 },
  { id: "Qwen/Qwen3.5-2B", label: "Qwen 3.5 2B", params: "2B", family: "qwen", kind: "vision", trainable: false, ollama: "qwen3.5:2b", description: "Compact text-and-image model for local Ollama", downloadGB: 3.1, memoryGB: 5 },
  { id: "google/gemma-3-4b-it", label: "Gemma 3 4B", params: "4B", family: "gemma", kind: "vision", trainable: false, ollama: "gemma3:4b", description: "Text and image understanding; larger hardware budget", downloadGB: 3.4, memoryGB: 6 },
];

export const TRAINING_MODELS = LOCAL_MODELS.filter(model => model.trainable && model.kind === "text");
export const OLLAMA_LOCAL_MODELS = LOCAL_MODELS.filter(model => model.ollama);

const LEGACY_TRAINING_IDS: Record<string, string> = {
  "llama-3.2-1b": "meta-llama/Llama-3.2-1B",
  "llama-3.2-3b": "meta-llama/Llama-3.2-3B",
  "qwen2.5-0.5b": "Qwen/Qwen2.5-0.5B",
  "qwen2.5-1.5b": "Qwen/Qwen2.5-1.5B",
  "qwen2.5-3b": "Qwen/Qwen2.5-3B",
  "gemma-2-2b": "google/gemma-2-2b",
  "phi-3-mini": "microsoft/phi-3-mini-4k-instruct",
  "mistral-7b": "mistralai/Mistral-7B-v0.3",
};

export function resolveTrainingModelId(id: string): string {
  return LEGACY_TRAINING_IDS[id] ?? id;
}