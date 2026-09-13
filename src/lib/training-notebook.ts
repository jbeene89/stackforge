export const TRAINING_NOTEBOOK_KEY = "soupylab:training-notebook:v1";
export const MAX_TRAINING_PAIRS = 100;
export const MAX_PAIR_CHARACTERS = 4_000;
export const MAX_TRAINING_IMPORT_BYTES = 6 * 1024 * 1024;

export interface TrainingPairText {
  prompt: string;
  response: string;
}

export interface TrainingPair extends TrainingPairText {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface NotebookStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface NotebookState {
  pairs: TrainingPair[];
  snapshot: string | null;
  error: string | null;
}

export interface ImportProblem {
  line: number | null;
  message: string;
}

export interface TrainingImportResult {
  pairs: TrainingPairText[];
  errors: ImportProblem[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

export function validateTrainingPair(value: unknown): string | null {
  if (!isRecord(value) || typeof value.prompt !== "string" || typeof value.response !== "string") {
    return "The prompt and ideal response must both be text.";
  }
  if (!value.prompt.trim()) return "Add a prompt before saving.";
  if (!value.response.trim()) return "Add the ideal response before saving.";
  if (value.prompt.length > MAX_PAIR_CHARACTERS) return "Shorten the prompt to 4,000 characters or fewer.";
  if (value.response.length > MAX_PAIR_CHARACTERS) return "Shorten the ideal response to 4,000 characters or fewer.";
  return null;
}

function pairKey(pair: TrainingPairText): string {
  return JSON.stringify([pair.prompt.trim(), pair.response.trim()]);
}

export function findDuplicateTrainingPair(pairs: TrainingPair[], candidate: TrainingPairText, editingId?: string | null): TrainingPair | undefined {
  const key = pairKey(candidate);
  return pairs.find((pair) => pair.id !== editingId && pairKey(pair) === key);
}

function readJsonlPair(value: unknown): TrainingPairText | null {
  if (!isRecord(value)) return null;
  // Match the messages format exported by the existing SLM Lab training kit.
  // Reject extra turns/fields rather than silently dropping a user's training data.
  if (hasOnlyKeys(value, ["messages"]) && Array.isArray(value.messages) && value.messages.length === 2) {
    const [prompt, response] = value.messages;
    if (isRecord(prompt) && isRecord(response)
      && hasOnlyKeys(prompt, ["role", "content"]) && hasOnlyKeys(response, ["role", "content"])
      && prompt.role === "user" && response.role === "assistant"
      && typeof prompt.content === "string" && typeof response.content === "string") {
      return { prompt: prompt.content, response: response.content };
    }
  }
  if (hasOnlyKeys(value, ["prompt", "response"]) && typeof value.prompt === "string" && typeof value.response === "string") {
    return { prompt: value.prompt, response: value.response };
  }
  if (hasOnlyKeys(value, ["instruction", "output"]) && typeof value.instruction === "string" && typeof value.output === "string") {
    return { prompt: value.instruction, response: value.output };
  }
  return null;
}

/** JSON is treated only as text data. An invalid import never returns partial pairs. */
export function parseTrainingJsonl(text: string, existing: TrainingPair[] = []): TrainingImportResult {
  const fail = (message: string): TrainingImportResult => ({ pairs: [], errors: [{ line: null, message }] });
  if (text.length > MAX_TRAINING_IMPORT_BYTES || new TextEncoder().encode(text).byteLength > MAX_TRAINING_IMPORT_BYTES) {
    return fail("Choose a JSONL file smaller than 6 MB.");
  }
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines.length > 1_000) return fail("Remove excess blank lines. A notebook import can contain up to 100 examples and 1,000 lines.");
  const pairs: TrainingPairText[] = [];
  const errors: ImportProblem[] = [];
  const seen = new Map<string, number>();
  const savedKeys = new Set(existing.map(pairKey));
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].trim()) continue;
    const line = index + 1;
    let raw: unknown;
    try {
      raw = JSON.parse(lines[index]);
    } catch {
      errors.push({ line, message: "This line is not valid JSON. Put one complete example on each line; use double quotes and escape line breaks inside text." });
      if (errors.length >= 10) break;
      continue;
    }
    const pair = readJsonlPair(raw);
    if (!pair) {
      errors.push({ line, message: 'Use exactly two messages (user, then assistant), or only "prompt" and "response", or only "instruction" and "output". All content must be text; extra fields and turns are not supported.' });
    } else {
      const error = validateTrainingPair(pair);
      const key = pairKey(pair);
      if (error) errors.push({ line, message: error });
      else if (savedKeys.has(key)) errors.push({ line, message: "This example is already saved. Remove this line or edit the saved example." });
      else if (seen.has(key)) errors.push({ line, message: `This example repeats line ${seen.get(key)}. Remove one copy.` });
      else if (pairs.length + existing.length >= MAX_TRAINING_PAIRS) {
        errors.push({ line, message: `This would exceed 100 saved examples. There is room for ${Math.max(0, MAX_TRAINING_PAIRS - existing.length)} more; split the file or delete saved examples first.` });
      } else {
        pairs.push(pair);
        seen.set(key, line);
      }
    }
    if (errors.length >= 10) break;
  }
  if (errors.length) return { pairs: [], errors };
  if (!pairs.length) return fail("No examples found. Add one JSON object per line, or use Try example to create your first pair.");
  return { pairs, errors: [] };
}

export function exportTrainingJsonl(pairs: TrainingPairText[]): string {
  return pairs.map((pair) => JSON.stringify({
    messages: [
      { role: "user", content: pair.prompt },
      { role: "assistant", content: pair.response },
    ],
  })).join("\n");
}

function validateStoredPairs(value: unknown): value is TrainingPair[] {
  if (!Array.isArray(value) || value.length > MAX_TRAINING_PAIRS) return false;
  const ids = new Set<string>();
  const keys = new Set<string>();
  for (const pair of value) {
    if (!isRecord(pair) || !hasOnlyKeys(pair, ["id", "prompt", "response", "createdAt", "updatedAt"])
      || validateTrainingPair(pair) !== null
      || typeof pair.id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(pair.id)
      || typeof pair.createdAt !== "string" || !Number.isFinite(Date.parse(pair.createdAt))
      || typeof pair.updatedAt !== "string" || !Number.isFinite(Date.parse(pair.updatedAt))) return false;
    const key = pairKey(pair as unknown as TrainingPair);
    if (ids.has(pair.id) || keys.has(key)) return false;
    ids.add(pair.id);
    keys.add(key);
  }
  return true;
}

export function loadTrainingNotebook(storage?: NotebookStorage): NotebookState {
  let snapshot: string | null = null;
  try {
    snapshot = (storage ?? window.localStorage).getItem(TRAINING_NOTEBOOK_KEY);
    if (snapshot === null) return { pairs: [], snapshot, error: null };
    const data: unknown = JSON.parse(snapshot);
    if (!isRecord(data) || !hasOnlyKeys(data, ["version", "pairs"]) || data.version !== 1 || !validateStoredPairs(data.pairs)) {
      throw new Error("Invalid notebook");
    }
    return { pairs: data.pairs, snapshot, error: null };
  } catch {
    return {
      pairs: [], snapshot,
      error: "Your saved notebook could not be read. Existing data has been left untouched. You can keep drafting, then retry loading before saving.",
    };
  }
}

/** Call only after a deliberate Save/Delete action; never from an effect. */
export function saveTrainingNotebook(pairs: TrainingPair[], expectedSnapshot: string | null, storage?: NotebookStorage): { snapshot: string | null; error: string | null } {
  if (!validateStoredPairs(pairs)) return { snapshot: expectedSnapshot, error: "These examples could not be saved. Check that each has a prompt and response, with no duplicates and no more than 100 examples." };
  try {
    const target = storage ?? window.localStorage;
    if (target.getItem(TRAINING_NOTEBOOK_KEY) !== expectedSnapshot) {
      return { snapshot: expectedSnapshot, error: "Saved examples changed in another window. Reload saved examples before trying again. Your draft stays here." };
    }
    const snapshot = JSON.stringify({ version: 1, pairs });
    target.setItem(TRAINING_NOTEBOOK_KEY, snapshot);
    return { snapshot, error: null };
  } catch {
    return { snapshot: expectedSnapshot, error: "Not saved: device storage is full or unavailable. Your draft is still here. Free some space or copy your text before leaving, then try saving again." };
  }
}

export function createTrainingPair(text: TrainingPairText): TrainingPair {
  const now = new Date().toISOString();
  const id = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `pair_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  return { id, prompt: text.prompt, response: text.response, createdAt: now, updatedAt: now };
}
