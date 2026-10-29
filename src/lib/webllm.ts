// WebLLM browser-based inference engine
// Runs MLC-compiled models entirely in-browser via WebGPU — no server needed

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
  { model_id: "Qwen3-0.6B-q4f16_1-MLC", label: "Qwen 3 0.6B", size: "~400 MB", vram: "~1.4 GB" },
  { model_id: "Qwen3-1.7B-q4f16_1-MLC", label: "Qwen 3 1.7B", size: "~1.1 GB", vram: "~2.1 GB" },
  { model_id: "Qwen3-4B-q4f16_1-MLC", label: "Qwen 3 4B", size: "~2.5 GB", vram: "~3.5 GB" },
  { model_id: "SmolLM2-360M-Instruct-q4f16_1-MLC", label: "SmolLM2 360M", size: "~250 MB", vram: "~600 MB" },
  { model_id: "SmolLM2-1.7B-Instruct-q4f16_1-MLC", label: "SmolLM2 1.7B", size: "~1 GB", vram: "~2 GB" },
  { model_id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", label: "Qwen 2.5 1.5B", size: "~1 GB", vram: "~2 GB" },
  { model_id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama 3.2 1B", size: "~700 MB", vram: "~1.5 GB" },
  { model_id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", label: "Llama 3.2 3B", size: "~1.8 GB", vram: "~3 GB" },
  { model_id: "Phi-3.5-mini-instruct-q4f16_1-MLC", label: "Phi 3.5 Mini", size: "~2 GB", vram: "~4 GB" },
];

let engineInstance: MLCEngineInterface | null = null;
let currentModelId: string | null = null;
let loadingPromise: Promise<MLCEngineInterface> | null = null;

export function resolveBrowserModelId(saved: string | null): string {
  return BROWSER_MODELS.find(model => model.model_id === saved)?.model_id ?? BROWSER_MODELS[0].model_id;
}

export function isWebGPUAvailable(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export async function checkWebGPU(): Promise<boolean> {
  if (!isWebGPUAvailable()) return false;
  try {
    const gpu = (navigator as Navigator & { gpu: { requestAdapter(): Promise<unknown> } }).gpu;
    return Boolean(await gpu.requestAdapter());
  } catch { return false; }
}

export async function loadModel(
  modelId: string,
  onProgress?: (report: InitProgressReport) => void
): Promise<MLCEngineInterface> {
  // Dynamically import to avoid bundling if unused
  const { CreateMLCEngine, prebuiltAppConfig } = await import("@mlc-ai/web-llm");

  if (!BROWSER_MODELS.some(model => model.model_id === modelId)) {
    throw new Error("Choose a supported browser model.");
  }
  if (loadingPromise) {
    await loadingPromise;
    return loadModel(modelId, onProgress);
  }

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

  loadingPromise = (async () => {
    if (!(await checkWebGPU())) throw new Error("No compatible GPU found. Try Ollama instead.");
    const engine = await CreateMLCEngine(modelId, {
      initProgressCallback: onProgress,
      appConfig: { ...prebuiltAppConfig, useIndexedDBCache: true },
    });
    engineInstance = engine;
    currentModelId = modelId;
    return engine;
  })();
  try { return await loadingPromise; }
  finally { loadingPromise = null; }
}

export async function unloadModel(): Promise<void> {
  if (loadingPromise) await loadingPromise.catch(() => undefined);
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
  if (signal?.aborted) return;
  const interrupt = () => { void engine.interruptGenerate().catch(() => undefined); };
  signal?.addEventListener("abort", interrupt, { once: true });

  try {
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

  } finally {
    signal?.removeEventListener("abort", interrupt);
  }
  const durationMs = Math.max(1, performance.now() - startTime);
  onStats?.({
    tokensPerSecond: totalTokens / (durationMs / 1000),
    totalTokens,
    durationMs,
  });
}

export function getLoadedModelId(): string | null {
  return currentModelId;
}
