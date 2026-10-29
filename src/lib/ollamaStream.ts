/** Ollama sends newline-delimited JSON; network chunks need not end at a newline. */
export async function* readOllamaStream(body: ReadableStream<Uint8Array>): AsyncGenerator<{
  message?: { content?: string };
  done?: boolean;
  eval_count?: number;
  eval_duration?: number;
  error?: string;
}> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      pending += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) if (line.trim()) yield JSON.parse(line);
      if (done) {
        if (pending.trim()) yield JSON.parse(pending);
        break;
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}