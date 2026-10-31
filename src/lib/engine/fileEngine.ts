// Runs the user's own GGUF model file in the browser (llama.cpp compiled to WebAssembly).
// Uses the graphics chip when available, otherwise the processor.
import type { Wllama } from "@wllama/wllama";
import type { GenerateRequest, GenerateStats } from "./run";
import { sortModelParts } from "./label";

let instance: Wllama | null = null;
let loadedName: string | null = null;

export function getLoadedFileModel(): string | null {
  return instance?.isModelLoaded() ? loadedName : null;
}

export async function loadFileModel(name: string, parts: Blob[] | File[]): Promise<void> {
  await unloadFileModel();
  const { Wllama, LoggerWithoutDebug } = await import("@wllama/wllama");
  // Served from public/ so the binary is never bundled; version-pinned to the installed package.
  const w = new Wllama({ default: "/wasm/wllama-3.8.1.wasm" }, { logger: LoggerWithoutDebug, suppressNativeLog: true });
  const ordered = parts.every(p => "name" in p) ? sortModelParts(parts as File[]) : parts;
  await w.loadModel(ordered as Blob[], { n_ctx: 2048 });
  instance = w;
  loadedName = name;
}

export async function unloadFileModel(): Promise<void> {
  if (instance) {
    try { await instance.exit(); } catch { /* ignore */ }
  }
  instance = null;
  loadedName = null;
}

export async function generateWithFile(req: GenerateRequest): Promise<GenerateStats> {
  if (!instance?.isModelLoaded()) throw new Error("Your model file isn't loaded.");
  const start = performance.now();
  let tokens = 0;
  const stream = await instance.createChatCompletion({
    messages: req.messages,
    temperature: req.temperature,
    max_tokens: req.maxTokens,
    stream: true,
    abortSignal: req.signal,
  });
  for await (const chunk of stream) {
    const text = chunk.choices?.[0]?.delta?.content;
    if (text) { tokens++; req.onDelta(text); }
  }
  const durationMs = Math.max(1, performance.now() - start);
  return { tokensPerSecond: tokens / (durationMs / 1000), totalTokens: tokens, durationMs };
}
