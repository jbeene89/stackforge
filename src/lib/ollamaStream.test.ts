import { describe, expect, it } from "vitest";
import { readOllamaStream } from "./ollamaStream";

describe("Ollama stream parsing", () => {
  it("preserves split JSON, UTF-8 text, and a final record without a newline", async () => {
    const bytes = new TextEncoder().encode('{"message":{"content":"café"}}\n{"done":true,"eval_count":7}');
    const body = new ReadableStream<Uint8Array>({ start(controller) {
      for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
      controller.close();
    } });
    const records = [];
    for await (const record of readOllamaStream(body)) records.push(record);
    expect(records).toEqual([{ message: { content: "café" } }, { done: true, eval_count: 7 }]);
  });
  it("does not silently swallow malformed responses", async () => {
    const body = new ReadableStream<Uint8Array>({ start(controller) {
      controller.enqueue(new TextEncoder().encode("not-json\n")); controller.close();
    } });
    await expect(readOllamaStream(body).next()).rejects.toThrow();
  });
});