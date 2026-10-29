import { describe, expect, it } from "vitest";
import { LOCAL_MODELS, TRAINING_MODELS, resolveTrainingModelId } from "./localModels";

describe("local model compatibility", () => {
  it("keeps image models out of text-only training and includes compact vision choices", () => {
    expect(LOCAL_MODELS.find(model => model.id === "Qwen/Qwen3.5-0.8B")).toMatchObject({ kind: "vision", ollama: "qwen3.5:0.8b", trainable: false });
    expect(TRAINING_MODELS.every(model => model.kind === "text")).toBe(true);
    expect(TRAINING_MODELS.some(model => model.id === "Qwen/Qwen3-0.6B")).toBe(true);
  });
  it("resolves old aliases to real checkpoints without changing custom model IDs", () => {
    expect(resolveTrainingModelId("qwen2.5-0.5b")).toBe("Qwen/Qwen2.5-0.5B");
    expect(resolveTrainingModelId("qwen2.5-3b")).toBe("Qwen/Qwen2.5-3B");
    expect(resolveTrainingModelId("llama-3.2-3b")).toBe("meta-llama/Llama-3.2-3B");
    expect(resolveTrainingModelId("/home/models/custom")).toBe("/home/models/custom");
  });
});