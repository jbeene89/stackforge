import type { MLCEngineInterface } from "@mlc-ai/web-llm";
import { supabase } from "@/integrations/supabase/client";
import { readOllamaStream } from "@/lib/ollamaStream";
import { streamBrowserInference } from "@/lib/webllm";
import { CLOUD_MODEL } from "./router";
import type { EngineAdapter, GenerateStats } from "./run";

export function ollamaAdapter(url: string, model: string): EngineAdapter {
  return async (req) => {
    const res = await fetch(`${url}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: req.messages, stream: true, options: { temperature: req.temperature, num_predict: req.maxTokens } }),
      signal: req.signal,
    });
    if (!res.ok || !res.body) throw new Error(`Home computer replied ${res.status}`);
    let stats: GenerateStats | undefined;
    for await (const json of readOllamaStream(res.body)) {
      if (json.error) throw new Error(json.error);
      if (json.message?.content) req.onDelta(json.message.content);
      if (json.done && json.eval_count && json.eval_duration) {
        stats = { tokensPerSecond: json.eval_count / (json.eval_duration / 1e9), totalTokens: json.eval_count, durationMs: json.eval_duration / 1e6 };
      }
    }
    return stats;
  };
}

export function webgpuAdapter(engine: MLCEngineInterface): EngineAdapter {
  return async (req) => {
    let stats: GenerateStats | undefined;
    await streamBrowserInference(engine, {
      messages: req.messages, temperature: req.temperature, max_tokens: req.maxTokens, signal: req.signal,
      onDelta: req.onDelta,
      onStats: s => { stats = { tokensPerSecond: s.tokensPerSecond, totalTokens: s.totalTokens, durationMs: s.durationMs }; },
    });
    if (req.signal.aborted) throw new DOMException("Stopped", "AbortError");
    return stats;
  };
}

/** Cloud fallback through the existing credit-checked function. */
export const cloudAdapter: EngineAdapter = async (req) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in to use the cloud.");
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messages: req.messages, mode: "general", model: CLOUD_MODEL }),
    signal: req.signal,
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Cloud replied ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx).replace(/\r$/, "");
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      try {
        const text = JSON.parse(payload).choices?.[0]?.delta?.content;
        if (text) req.onDelta(text);
      } catch { /* partial line; ignore */ }
    }
  }
};
