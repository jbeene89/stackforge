import { beforeEach, describe, expect, it, vi } from "vitest";
import { BROWSER_MODELS, checkWebGPU, resolveBrowserModelId, streamBrowserInference } from "./webllm";
import type { MLCEngineInterface } from "@mlc-ai/web-llm";

describe("browser inference", () => {
  beforeEach(() => vi.restoreAllMocks());
  it("falls back from retired choices while preserving valid saved choices", () => {
    expect(resolveBrowserModelId("TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC")).toBe("Qwen3-0.6B-q4f16_1-MLC");
    expect(resolveBrowserModelId("Llama-3.2-1B-Instruct-q4f16_1-MLC")).toBe("Llama-3.2-1B-Instruct-q4f16_1-MLC");
    expect(new Set(BROWSER_MODELS.map(model => model.model_id)).size).toBe(BROWSER_MODELS.length);
  });
  it("checks for an actual GPU adapter rather than only the API", async () => {
    const requestAdapter = vi.fn().mockResolvedValue(null);
    Object.defineProperty(navigator, "gpu", { configurable: true, value: { requestAdapter } });
    expect(await checkWebGPU()).toBe(false);
    requestAdapter.mockResolvedValue({});
    expect(await checkWebGPU()).toBe(true);
    Reflect.deleteProperty(navigator, "gpu");
  });
  it("interrupts the engine on stop and uses reported completion tokens", async () => {
    const controller = new AbortController();
    const interruptGenerate = vi.fn().mockResolvedValue(undefined);
    const engine = { interruptGenerate, chat: { completions: { create: vi.fn(async () => (async function* () {
      yield { choices: [{ delta: { content: "Hello" } }], usage: { completion_tokens: 3 } };
      controller.abort();
    })()) } } } as unknown as MLCEngineInterface;
    const onDelta = vi.fn(); const onStats = vi.fn();
    await streamBrowserInference(engine, { messages: [], signal: controller.signal, onDelta, onStats });
    expect(onDelta).toHaveBeenCalledWith("Hello");
    expect(interruptGenerate).toHaveBeenCalledOnce();
    expect(onStats).toHaveBeenCalledWith(expect.objectContaining({ totalTokens: 3 }));
  });
});