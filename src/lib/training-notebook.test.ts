import { describe, expect, it } from "vitest";
import {
  createTrainingPair,
  exportTrainingJsonl,
  findDuplicateTrainingPair,
  loadTrainingNotebook,
  MAX_PAIR_CHARACTERS,
  MAX_TRAINING_IMPORT_BYTES,
  parseTrainingJsonl,
  saveTrainingNotebook,
  TRAINING_NOTEBOOK_KEY,
  type TrainingPair,
} from "./training-notebook";

function memoryStorage(initial: string | null = null) {
  let value = initial;
  return {
    getItem(key: string) { expect(key).toBe(TRAINING_NOTEBOOK_KEY); return value; },
    setItem(key: string, next: string) { expect(key).toBe(TRAINING_NOTEBOOK_KEY); value = next; },
  };
}

const pair = (prompt = "How do I start?", response = "Choose one small step.") => createTrainingPair({ prompt, response });

describe("training notebook JSONL", () => {
  it("round-trips multiline text, quotes, unicode and code through the SLM messages format", () => {
    const source = [pair('Explain "café" 🧡\nThen show a newline.', 'Keep the whitespace:\n  const answer = "yes";\n'), pair("Second question", "Second answer")];
    const exported = exportTrainingJsonl(source);
    const first = JSON.parse(exported.split("\n")[0]);
    expect(first.messages).toEqual([{ role: "user", content: source[0].prompt }, { role: "assistant", content: source[0].response }]);
    const result = parseTrainingJsonl(`\uFEFF${exported.replace(/\n/g, "\r\n")}\r\n`);
    expect(result.errors).toEqual([]);
    expect(result.pairs).toEqual(source.map(({ prompt, response }) => ({ prompt, response })));
  });

  it("accepts the two explicit plain-pair formats", () => {
    const result = parseTrainingJsonl('{"prompt":"One","response":"Answer one"}\n{"instruction":"Two","output":"Answer two"}');
    expect(result.errors).toEqual([]);
    expect(result.pairs).toEqual([{ prompt: "One", response: "Answer one" }, { prompt: "Two", response: "Answer two" }]);
  });

  it("rejects the entire import with physical line numbers when a row is malformed", () => {
    const result = parseTrainingJsonl('\n{"prompt":"Valid","response":"Answer"}\nnot-json\n{"prompt":"Missing response"}');
    expect(result.pairs).toEqual([]);
    expect(result.errors.map((error) => error.line)).toEqual([3, 4]);
    expect(result.errors[0].message).toContain("one complete example");
  });

  it("rejects unsupported conversation turns, extra fields, arrays and non-text values", () => {
    const rows = [
      { messages: [{ role: "system", content: "Keep me" }, { role: "user", content: "Question" }, { role: "assistant", content: "Answer" }] },
      { prompt: "Question", response: "Answer", metadata: "Do not silently drop" },
      [],
      { prompt: "Question", response: 42 },
      { messages: [{ role: "assistant", content: "Answer" }, { role: "user", content: "Question" }] },
    ];
    const result = parseTrainingJsonl(rows.map((row) => JSON.stringify(row)).join("\n"));
    expect(result.pairs).toEqual([]);
    expect(result.errors.map((error) => error.line)).toEqual([1, 2, 3, 4, 5]);
  });

  it("treats markup and executable-looking text strictly as data", () => {
    const source = pair('<script>throw new Error("never execute")</script>', '${fetch("https://example.invalid")}');
    expect(parseTrainingJsonl(exportTrainingJsonl([source])).pairs).toEqual([{ prompt: source.prompt, response: source.response }]);
    expect(parseTrainingJsonl('{"prompt":"p","response":"r","__proto__":{}}').errors).toHaveLength(1);
  });

  it("reports duplicates within a file and against saved examples without partial additions", () => {
    const saved = pair("Already saved", "Saved answer");
    const duplicateRows = [pair("New question", "New answer"), pair(" New question ", "New answer"), saved];
    const result = parseTrainingJsonl(exportTrainingJsonl(duplicateRows), [saved]);
    expect(result.pairs).toEqual([]);
    expect(result.errors.map((error) => error.line)).toEqual([2, 3]);
    expect(result.errors[0].message).toContain("repeats line 1");
    expect(result.errors[1].message).toContain("already saved");
    expect(findDuplicateTrainingPair([saved], saved, saved.id)).toBeUndefined();
    expect(findDuplicateTrainingPair([saved], saved)).toBe(saved);
  });

  it("enforces nonempty fields, per-field limits, file size and remaining notebook capacity", () => {
    const result = parseTrainingJsonl(exportTrainingJsonl([pair(" ", "Answer"), pair("Question", "x".repeat(MAX_PAIR_CHARACTERS + 1))]));
    expect(result.pairs).toEqual([]);
    expect(result.errors).toHaveLength(2);
    expect(parseTrainingJsonl("x".repeat(MAX_TRAINING_IMPORT_BYTES + 1)).errors[0].message).toContain("6 MB");
    const fullNotebook = Array.from({ length: 100 }, (_, index) => pair(`Question ${index}`, "Answer"));
    const capacity = parseTrainingJsonl(exportTrainingJsonl([pair("Extra", "Answer")]), fullNotebook);
    expect(capacity.pairs).toEqual([]);
    expect(capacity.errors[0].message).toContain("room for 0 more");
  });
});

describe("training notebook persistence", () => {
  it("reads without writing and saves only through the explicit save function", () => {
    const storage = memoryStorage();
    expect(loadTrainingNotebook(storage)).toEqual({ pairs: [], snapshot: null, error: null });
    const draft = pair();
    expect(storage.getItem(TRAINING_NOTEBOOK_KEY)).toBeNull();
    const result = saveTrainingNotebook([draft], null, storage);
    expect(result.error).toBeNull();
    expect(loadTrainingNotebook(storage).pairs).toEqual([draft]);
    expect(JSON.parse(result.snapshot!).version).toBe(1);
  });

  it("leaves unreadable, future-version and malformed saved data untouched", () => {
    for (const value of ["broken-json", JSON.stringify({ version: 2, pairs: [] }), JSON.stringify({ version: 1, pairs: [{ prompt: "P", response: "R" }] })]) {
      const storage = memoryStorage(value);
      const result = loadTrainingNotebook(storage);
      expect(result.error).toContain("left untouched");
      expect(result.pairs).toEqual([]);
      expect(storage.getItem(TRAINING_NOTEBOOK_KEY)).toBe(value);
    }
  });

  it("reports quota or unavailable storage without pretending the draft was saved", () => {
    const original = JSON.stringify({ version: 1, pairs: [pair("Existing", "Safe")] });
    const quotaStorage = {
      getItem: () => original,
      setItem: () => { throw new DOMException("Full", "QuotaExceededError"); },
    };
    const draft = pair("Unsaved", "Keep this draft");
    const result = saveTrainingNotebook([draft], original, quotaStorage);
    expect(result.error).toContain("Not saved");
    expect(result.snapshot).toBe(original);
    expect(draft.response).toBe("Keep this draft");
    expect(loadTrainingNotebook(quotaStorage).pairs[0].prompt).toBe("Existing");
    const unavailable = { getItem: () => { throw new Error("Storage blocked"); }, setItem: () => { throw new Error("Storage blocked"); } };
    expect(loadTrainingNotebook(unavailable).error).not.toBeNull();
    expect(saveTrainingNotebook([draft], null, unavailable).error).toContain("Not saved");
  });

  it("does not overwrite another window’s newly saved examples", () => {
    const storage = memoryStorage();
    const otherPair = pair("Another window", "This must survive");
    const otherSave = saveTrainingNotebook([otherPair], null, storage);
    const staleSave = saveTrainingNotebook([pair()], null, storage);
    expect(staleSave.error).toContain("another window");
    expect(storage.getItem(TRAINING_NOTEBOOK_KEY)).toBe(otherSave.snapshot);
  });

  it("rejects invalid updates and duplicate identities before touching storage", () => {
    const storage = memoryStorage();
    const first = pair();
    const second: TrainingPair = { ...pair("Different", "Answer"), id: first.id };
    expect(saveTrainingNotebook([first, second], null, storage).error).not.toBeNull();
    expect(saveTrainingNotebook([{ ...first, response: "" }], null, storage).error).not.toBeNull();
    expect(storage.getItem(TRAINING_NOTEBOOK_KEY)).toBeNull();
  });
});
