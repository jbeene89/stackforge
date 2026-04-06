// WebLLM browser-based inference engine
// Runs GGUF models entirely in-browser via WebGPU — no server needed

import type {
  MLCEngineInterface,
  InitProgressReport,
  ChatCompletionChunk,
} from "@mlc-ai/web-llm";

export interface WebLLMModel {
  model_id: string;
  label: string;
  size: string;
  vram: string;
}

// Curated list of small models suitable for browser inference
export const BROWSER_MODELS: WebLLMModel[] = [
  { model_id: "SmolLM2-360M-Instruct-q4f16_1-MLC", label: "SmolLM2 360M", size: "~250 MB", vram: "~512 MB" },
  { model_id: "SmolLM2-1.7B-Instruct-q4f16_1-MLC", label: "SmolLM2 1.7B", size: "~1 GB", vram: "~2 GB" },
  { model_id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", label: "Qwen 2.5 1.5B", size: "~1 GB", vram: "~2 GB" },
  { model_id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama 3.2 1B", size: "~700 MB", vram: "~1.5 GB" },
  { model_id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", label: "Llama 3.2 3B", size: "~1.8 GB", vram: "~3 GB" },
  { model_id: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC", label: "TinyLlama 1.1B", size: "~700 MB", vram: "~1 GB" },
  { model_id: "Phi-3.5-mini-instruct-q4f16_1-MLC", label: "Phi 3.5 Mini", size: "~2 GB", vram: "~4 GB" },
];

let engineInstance: MLCEngineInterface | null = null;
let currentModelId: string | null = null;

export function isWebGPUAvailable(): boolean {
  return "gpu" in navigator;
}

export async function loadModel(
  modelId: string,
  onProgress?: (report: InitProgressReport) => void
): Promise<MLCEngineInterface> {
  // Dynamically import to avoid bundling if unused
  const { CreateMLCEngine } = await import("@mlc-ai/web-llm");

  // Reuse existing engine if same model
  if (engineInstance && currentModelId === modelId) {
    return engineInstance;
  }

  // Unload previous model
  if (engineInstance) {
    try { await engineInstance.unload(); } catch { /* ignore */ }
    engineInstance = null;
    currentModelId = null;
  }

  const engine = await CreateMLCEngine(modelId, {
    initProgressCallback: onProgress,
  });

  engineInstance = engine;
  currentModelId = modelId;
  return engine;
}

export async function unloadModel(): Promise<void> {
  if (engineInstance) {
    try { await engineInstance.unload(); } catch { /* ignore */ }
    engineInstance = null;
    currentModelId = null;
  }
}

export interface BrowserInferenceOptions {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  max_tokens?: number;
  onDelta: (text: string) => void;
  onStats?: (stats: { tokensPerSecond: number; totalTokens: number; durationMs: number }) => void;
  signal?: AbortSignal;
}

export async function streamBrowserInference(
  engine: MLCEngineInterface,
  options: BrowserInferenceOptions
): Promise<void> {
  const { messages, temperature = 0.7, max_tokens = 512, onDelta, onStats, signal } = options;

  const startTime = performance.now();
  let totalTokens = 0;

  const chunks = await engine.chat.completions.create({
    messages,
    temperature,
    max_tokens,
    stream: true,
    stream_options: { include_usage: true },
  });

  for await (const chunk of chunks as AsyncIterable<ChatCompletionChunk>) {
    if (signal?.aborted) break;

    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) {
      totalTokens++;
      onDelta(delta);
    }

    if (chunk.usage) {
      totalTokens = chunk.usage.completion_tokens || totalTokens;
    }
  }

  const durationMs = performance.now() - startTime;
  onStats?.({
    tokensPerSecond: totalTokens / (durationMs / 1000),
    totalTokens,
    durationMs,
  });
}

export function getLoadedModelId(): string | null {
  return currentModelId;
}
