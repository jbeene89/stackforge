import { describe, expect, it, vi } from "vitest";
import { planRoute, canRunFileInBrowser, BROWSER_FILE_LIMIT_BYTES, CLOUD_COST } from "./router";
import { runWithFallback } from "./run";
import { buildModelLabel, parseModelLabel, buildModelfile, sortModelParts } from "./label";

const allReady = { ollama: true, webgpu: true, file: true };

describe("Smart Switch route", () => {
  it("prefers home computer, then device chip, then own file, then cloud", () => {
    expect(planRoute({ ready: allReady, offlineOnly: false, signedIn: true })).toEqual(["ollama", "webgpu", "file", "cloud"]);
  });
  it("Stay offline blocks the cloud completely", () => {
    expect(planRoute({ ready: {}, offlineOnly: true, signedIn: true })).toEqual([]);
    expect(planRoute({ ready: allReady, offlineOnly: true, signedIn: true })).not.toContain("cloud");
  });
  it("cloud needs a signed-in account", () => {
    expect(planRoute({ ready: {}, offlineOnly: false, signedIn: false })).toEqual([]);
  });
  it("runs the user's own model first when it is loaded", () => {
    expect(planRoute({ ready: allReady, offlineOnly: false, signedIn: true, preferOwnModel: true })[0]).toBe("file");
  });
  it("skips engines that already failed", () => {
    expect(planRoute({ ready: allReady, offlineOnly: true, signedIn: true, failed: ["ollama"] })).toEqual(["webgpu", "file"]);
  });
  it("cloud replies cost 1 credit", () => expect(CLOUD_COST).toBe(1));
});

describe("browser file size limit", () => {
  it("accepts files up to 2 GB and rejects a single larger file", () => {
    expect(canRunFileInBrowser(BROWSER_FILE_LIMIT_BYTES)).toBe(true);
    expect(canRunFileInBrowser(BROWSER_FILE_LIMIT_BYTES + 1)).toBe(false);
    expect(canRunFileInBrowser(3 * 1024 ** 3, 1024 ** 3)).toBe(true);
    expect(canRunFileInBrowser(0)).toBe(false);
  });
});

describe("fallback", () => {
  const req = () => ({ messages: [], temperature: 0.7, maxTokens: 64, signal: new AbortController().signal, onDelta: vi.fn() });
  it("switches to the next engine when one fails mid-answer", async () => {
    const events: string[] = [];
    const r = req();
    const result = await runWithFallback(["ollama", "webgpu"], {
      ollama: async q => { q.onDelta("Hel"); throw new Error("closed"); },
      webgpu: async q => { q.onDelta("Hello"); },
    }, r, e => events.push(e.type));
    expect(result.engine).toBe("webgpu");
    expect(result.failed).toEqual(["ollama"]);
    expect(events).toEqual(["start", "switch", "start"]);
    expect(r.onDelta).toHaveBeenCalledWith("Hel");
  });
  it("does not fall back when the user presses Stop", async () => {
    const c = new AbortController();
    const webgpu = vi.fn();
    const result = await runWithFallback(["ollama", "webgpu"], {
      ollama: async () => { c.abort(); throw new DOMException("x", "AbortError"); }, webgpu,
    }, { ...req(), signal: c.signal });
    expect(result.aborted).toBe(true);
    expect(webgpu).not.toHaveBeenCalled();
  });
  it("reports failure when every engine fails", async () => {
    const result = await runWithFallback(["file"], { file: async () => { throw new Error("oom"); } }, req());
    expect(result.engine).toBeNull();
  });
});

describe("model label card", () => {
  it("round-trips and rejects foreign files", () => {
    const label = buildModelLabel({ name: "Vet Claims Helper", baseModel: "Qwen/Qwen3-0.6B", systemPrompt: "Be brief." });
    expect(label.file).toBe("vet-claims-helper.Q4_K_M.gguf");
    expect(parseModelLabel(JSON.stringify(label))?.systemPrompt).toBe("Be brief.");
    expect(parseModelLabel('{"name":"x"}')).toBeNull();
    expect(parseModelLabel("not json")).toBeNull();
    expect(buildModelfile(label)).toContain('SYSTEM """Be brief."""');
  });
  it("orders split parts numerically", () => {
    const parts = sortModelParts([{ name: "m-00010-of-00010.gguf" }, { name: "m-00002-of-00010.gguf" }, { name: "m-00001-of-00010.gguf" }]);
    expect(parts.map(p => p.name)[0]).toBe("m-00001-of-00010.gguf");
    expect(parts.map(p => p.name)[2]).toBe("m-00010-of-00010.gguf");
  });
});
