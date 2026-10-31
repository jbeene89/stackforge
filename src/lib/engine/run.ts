import type { EngineKind } from "./router";

export interface ChatMessage { role: "system" | "user" | "assistant"; content: string }

export interface GenerateRequest {
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
  signal: AbortSignal;
  onDelta: (text: string) => void;
}

export interface GenerateStats { tokensPerSecond?: number; totalTokens?: number; durationMs?: number }

export type EngineAdapter = (req: GenerateRequest) => Promise<GenerateStats | void>;

export type RunEvent =
  | { type: "start"; engine: EngineKind }
  | { type: "switch"; from: EngineKind; to: EngineKind; error: string }
  | { type: "failed"; engine: EngineKind; error: string };

export interface RunResult { engine: EngineKind | null; stats?: GenerateStats; aborted: boolean; failed: EngineKind[] }

function isAbort(e: unknown) {
  return e instanceof Error && (e.name === "AbortError" || e.name === "WllamaAbortError");
}

/** Try each engine in order; on failure move to the next, keeping text already shown. */
export async function runWithFallback(
  order: EngineKind[],
  adapters: Partial<Record<EngineKind, EngineAdapter>>,
  req: GenerateRequest,
  onEvent: (e: RunEvent) => void = () => {},
): Promise<RunResult> {
  const failed: EngineKind[] = [];
  const usable = order.filter(e => adapters[e]);
  for (let i = 0; i < usable.length; i++) {
    const engine = usable[i];
    onEvent({ type: "start", engine });
    try {
      const stats = await adapters[engine]!(req);
      return { engine, stats: stats || undefined, aborted: false, failed };
    } catch (e) {
      if (req.signal.aborted || isAbort(e)) return { engine, aborted: true, failed };
      const error = e instanceof Error ? e.message : String(e);
      failed.push(engine);
      const next = usable[i + 1];
      if (next) onEvent({ type: "switch", from: engine, to: next, error });
      else onEvent({ type: "failed", engine, error });
    }
  }
  return { engine: null, aborted: false, failed };
}
