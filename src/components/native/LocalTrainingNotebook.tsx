import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { BookOpen, Check, Copy, Download, FileUp, LockKeyhole, NotebookPen, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { exportTrainingData } from "@/lib/export-training-data";
import {
  createTrainingPair,
  exportTrainingJsonl,
  findDuplicateTrainingPair,
  loadTrainingNotebook,
  MAX_PAIR_CHARACTERS,
  MAX_TRAINING_IMPORT_BYTES,
  MAX_TRAINING_PAIRS,
  parseTrainingJsonl,
  saveTrainingNotebook,
  validateTrainingPair,
  type TrainingImportResult,
  type TrainingPair,
} from "@/lib/training-notebook";

const inputClass = "w-full min-w-0 rounded-xl border border-white/15 bg-[#111418] px-4 py-3 text-base leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20";
const secondaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-orange-400/60 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed disabled:opacity-40";
const primaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-400 px-5 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-40";
const STARTER_PAIR = {
  prompt: "Explain a training example in plain language.",
  response: "A training example is a question paired with the answer you want an AI to learn from. Write both clearly, check the facts, and keep each example focused on one idea.",
};

interface Notice {
  kind: "success" | "error" | "info";
  text: string;
}

export function LocalTrainingNotebook() {
  const [notebook, setNotebook] = useState(loadTrainingNotebook);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importName, setImportName] = useState("");
  const [importResult, setImportResult] = useState<TrainingImportResult | null>(null);
  const [reading, setReading] = useState(false);
  const [exportText, setExportText] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const exportRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const editingPair = notebook.pairs.find((pair) => pair.id === editingId);
  const hasDraft = Boolean(prompt || response);
  const dirty = prompt !== (editingPair?.prompt ?? "") || response !== (editingPair?.response ?? "");
  const filteredPairs = notebook.pairs.filter((pair) => `${pair.prompt}\n${pair.response}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const storageError = notebook.error;

  function persist(pairs: TrainingPair[]): boolean {
    if (notebook.error) {
      setNotice({ kind: "error", text: "Reload your saved examples first. Your draft has been kept here." });
      return false;
    }
    const result = saveTrainingNotebook(pairs, notebook.snapshot);
    if (result.error) {
      setNotice({ kind: "error", text: result.error });
      return false;
    }
    setNotebook({ pairs, snapshot: result.snapshot, error: null });
    setExportText(null);
    return true;
  }

  function clearDraft() {
    setPrompt("");
    setResponse("");
    setEditingId(null);
    setNotice(null);
  }

  function saveExample(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = { prompt, response };
    const problem = validateTrainingPair(text);
    if (problem) { setNotice({ kind: "error", text: problem }); return; }
    if (findDuplicateTrainingPair(notebook.pairs, text, editingId)) {
      setNotice({ kind: "error", text: "That exact example is already saved. Change the text or find it in your saved examples to edit it." });
      return;
    }
    if (!editingId && notebook.pairs.length >= MAX_TRAINING_PAIRS) {
      setNotice({ kind: "error", text: "Your notebook has 100 examples. Export a backup, then delete an example to make room." });
      return;
    }
    const next = editingId
      ? notebook.pairs.map((pair) => pair.id === editingId ? { ...pair, ...text, updatedAt: new Date().toISOString() } : pair)
      : [...notebook.pairs, createTrainingPair(text)];
    if (!persist(next)) return;
    clearDraft();
    setImportResult(null);
    setNotice({ kind: "success", text: editingId ? "Your changes are saved on this device." : "Example saved on this device. Ready for your next one." });
  }

  function openExample(pair: TrainingPair) {
    if (dirty) {
      setNotice({ kind: "info", text: "Save or clear your current draft before opening another example. Your writing is still here." });
      promptRef.current?.focus();
      return;
    }
    setPrompt(pair.prompt);
    setResponse(pair.response);
    setEditingId(pair.id);
    setNotice(null);
    promptRef.current?.focus();
    promptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function removeExample(pair: TrainingPair) {
    if (!persist(notebook.pairs.filter((saved) => saved.id !== pair.id))) return;
    if (editingId === pair.id) setEditingId(null);
    setDeleteId(null);
    setImportResult(null);
    setNotice({ kind: "success", text: editingId === pair.id ? "Saved example deleted. The copy in your open draft is still here." : "Example deleted from this device." });
  }

  function reloadSaved() {
    const loaded = loadTrainingNotebook();
    setNotebook(loaded);
    setEditingId(null);
    setDeleteId(null);
    setImportResult(null);
    setExportText(null);
    setNotice(loaded.error ? null : { kind: "info", text: "Saved examples reloaded. Any open draft has been kept as a new example." });
  }

  function reviewImport() {
    setImportResult(parseTrainingJsonl(importText, notebook.pairs));
  }

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_TRAINING_IMPORT_BYTES) {
      setImportResult({ pairs: [], errors: [{ line: null, message: "Choose a JSONL file smaller than 6 MB. Your pasted text has been kept." }] });
      return;
    }
    setReading(true);
    try {
      const text = await file.text();
      setImportText(text);
      setImportName(file.name);
      setImportResult(parseTrainingJsonl(text, notebook.pairs));
    } catch {
      setImportResult({ pairs: [], errors: [{ line: null, message: "This file could not be opened. Try choosing it again, or paste its JSONL text below." }] });
    } finally {
      setReading(false);
    }
  }

  function saveImport() {
    // Recheck against the latest saved examples; a reviewed preview may be stale.
    const result = parseTrainingJsonl(importText, notebook.pairs);
    setImportResult(result);
    if (result.errors.length) return;
    if (!persist([...notebook.pairs, ...result.pairs.map(createTrainingPair)])) return;
    setImportText("");
    setImportName("");
    setImportResult(null);
    setImportOpen(false);
    setNotice({ kind: "success", text: `${result.pairs.length} ${result.pairs.length === 1 ? "example" : "examples"} saved on this device. Your open draft is unchanged.` });
  }

  function prepareExport() {
    setExportText(exportTrainingJsonl(notebook.pairs));
    setNotice(null);
  }

  async function downloadExport() {
    if (exportText === null) return;
    setExporting(true);
    try {
      const result = await exportTrainingData(exportText);
      setNotice({ kind: "info", text: result === "shared" ? "Export opened. Use your device’s share options to keep or send the file. You can also copy the text below." : "Download started. If no file appears, use Copy JSONL or select the text below." });
    } catch {
      setNotice({ kind: "info", text: "Export wasn’t completed. Your data is still below; copy it or select the text to save it elsewhere." });
    } finally {
      setExporting(false);
    }
  }

  async function copyExport() {
    if (exportText === null) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(exportText);
      setNotice({ kind: "success", text: "JSONL copied. Paste it into a text file to keep a backup." });
    } catch {
      exportRef.current?.focus();
      exportRef.current?.select();
      setNotice({ kind: "info", text: "Automatic copying is unavailable. The export text is selected; use your device’s Copy command." });
    }
  }

  return (
    <section aria-labelledby="local-notebook-title" className="overflow-hidden rounded-3xl border border-white/10 bg-[#191d22] text-zinc-100 shadow-xl shadow-black/10">
      <div className="h-1 bg-gradient-to-r from-orange-400 via-amber-300 to-orange-400/10" />
      <div className="space-y-7 p-4 sm:p-7">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-orange-300"><NotebookPen className="h-5 w-5" aria-hidden="true" /> Local notebook</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-sm text-emerald-200"><LockKeyhole className="h-4 w-4" aria-hidden="true" /> Works offline</span>
          </div>
          <div>
            <h2 id="local-notebook-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">Your AI, in your words.</h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-300">Write a prompt and the answer you would want an AI to learn from. Build your collection here, then export it for SLM training.</p>
          </div>
          <details className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-zinc-300">
            <summary className="min-h-11 cursor-pointer content-center font-medium text-zinc-100">What is a training example?</summary>
            <p className="mt-2 leading-relaxed">It is a question or instruction paired with your preferred answer. You write both sides. Saving an example does not train a model or generate a reply. Nothing in this notebook is sent to an AI service.</p>
          </details>
        </header>

        {storageError && (
          <div role="alert" className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm leading-relaxed text-amber-100">
            <p>{storageError}</p>
            <button type="button" className={`${secondaryButton} mt-3`} onClick={reloadSaved}>Retry loading saved examples</button>
          </div>
        )}

        <form onSubmit={saveExample} className="space-y-5" aria-label={editingId ? "Edit training example" : "New training example"}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold"><Plus className="h-5 w-5 text-orange-300" aria-hidden="true" />{editingId ? "Edit your example" : "Create an example"}</h3>
            <span className="text-sm text-zinc-400">{dirty ? "Unsaved draft" : editingId ? "Saved example open" : "Nothing saved automatically"}</span>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label htmlFor="training-prompt" className="text-sm font-semibold">Prompt</label>
              <span className="text-sm tabular-nums text-zinc-400">{prompt.length.toLocaleString()} / 4,000</span>
            </div>
            <textarea ref={promptRef} id="training-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} maxLength={MAX_PAIR_CHARACTERS} className={`${inputClass} resize-y`} placeholder="What would you ask your AI?" aria-describedby="training-prompt-help" />
            <p id="training-prompt-help" className="mt-2 text-sm leading-relaxed text-zinc-400">A question or instruction. Keep it focused on one idea.</p>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label htmlFor="training-response" className="text-sm font-semibold">Ideal response</label>
              <span className="text-sm tabular-nums text-zinc-400">{response.length.toLocaleString()} / 4,000</span>
            </div>
            <textarea id="training-response" value={response} onChange={(event) => setResponse(event.target.value)} rows={5} maxLength={MAX_PAIR_CHARACTERS} className={`${inputClass} resize-y`} placeholder="Write the answer you would want it to give…" aria-describedby="training-response-help" />
            <p id="training-response-help" className="mt-2 text-sm leading-relaxed text-zinc-400">Your wording, knowledge, and style. Check the facts before you save.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button type="submit" disabled={Boolean(storageError)} className={primaryButton} title="Keep this example on this device only."><Save className="h-4 w-4" aria-hidden="true" />{editingId ? "Save changes" : "Save example"}</button>
            <button type="button" className={secondaryButton} onClick={clearDraft} disabled={!hasDraft && !editingId}><X className="h-4 w-4" aria-hidden="true" />{editingId ? "Discard changes" : "Clear draft"}</button>
            {!hasDraft && !editingId && <button type="button" className={secondaryButton} onClick={() => { setPrompt(STARTER_PAIR.prompt); setResponse(STARTER_PAIR.response); setNotice({ kind: "info", text: "A sample pair is in your draft. Edit it as you like; it is only saved if you choose Save example." }); promptRef.current?.focus(); }}><BookOpen className="h-4 w-4" aria-hidden="true" />Try example</button>}
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">Saved only when you choose Save. Up to 100 examples, with 4,000 characters per field. Stored on this device, separate from your account. Export a backup before clearing app data or uninstalling.</p>
        </form>

        {notice && <div role={notice.kind === "error" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm leading-relaxed ${notice.kind === "error" ? "border-rose-300/25 bg-rose-300/10 text-rose-100" : notice.kind === "success" ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" : "border-orange-300/25 bg-orange-300/10 text-orange-100"}`}>{notice.text}{notice.kind === "error" && <button type="button" className={`${secondaryButton} mt-3 flex`} onClick={reloadSaved}>Reload saved examples</button>}</div>}

        <div className="space-y-4 border-t border-white/10 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Saved examples <span className="ml-2 text-sm font-normal tabular-nums text-zinc-400">{notebook.pairs.length} / 100</span></h3>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={secondaryButton} aria-expanded={importOpen} aria-controls="notebook-import" onClick={() => setImportOpen(!importOpen)}><FileUp className="h-4 w-4" aria-hidden="true" />Import</button>
              <button type="button" className={secondaryButton} disabled={!notebook.pairs.length} onClick={prepareExport} title="Prepare your saved examples as a file for training or backup."><Download className="h-4 w-4" aria-hidden="true" />Export JSONL</button>
            </div>
          </div>

          {importOpen && (
            <div id="notebook-import" className="space-y-4 rounded-2xl border border-orange-300/20 bg-black/15 p-4">
              <h4 className="text-base font-semibold">Bring your examples with you</h4>
              <p className="text-sm leading-relaxed text-zinc-300">JSONL is a text file with one example on each line. Choose a file or paste its contents. Review it, then choose Save imported examples. Nothing is uploaded.</p>
              <input ref={fileRef} type="file" accept=".jsonl,.ndjson,.txt,application/x-ndjson,application/json,text/plain" className="hidden" onChange={readFile} tabIndex={-1} />
              <button type="button" disabled={reading} className={secondaryButton} onClick={() => fileRef.current?.click()}><FileUp className="h-4 w-4" aria-hidden="true" />{reading ? "Reading file…" : "Choose JSONL file"}</button>
              <p className="text-sm text-zinc-400">Up to 6 MB. {importName ? `Opened: ${importName}` : "If the file picker is unavailable, paste your text below."}</p>
              <div>
                <label htmlFor="notebook-import-text" className="mb-2 block text-sm font-semibold">JSONL text</label>
                <textarea id="notebook-import-text" className={`${inputClass} resize-y font-mono text-sm`} rows={5} maxLength={MAX_TRAINING_IMPORT_BYTES} value={importText} disabled={reading} spellCheck={false} placeholder={'{"prompt":"Your question","response":"Your preferred answer"}'} onChange={(event) => { setImportText(event.target.value); setImportResult(null); setImportName(""); }} />
              </div>
              <details className="text-sm text-zinc-300">
                <summary className="min-h-11 cursor-pointer content-center font-medium">Supported file formats</summary>
                <p className="mt-2 leading-relaxed">Each line can contain only prompt and response, only instruction and output, or a messages list with exactly one user message followed by one assistant message. Extra fields and conversation turns are rejected so no content is silently dropped.</p>
              </details>
              <button type="button" className={secondaryButton} onClick={reviewImport} disabled={reading || !importText.trim()}><Check className="h-4 w-4" aria-hidden="true" />Check and review</button>
              {importResult && importResult.errors.length > 0 && <div role="alert" className="space-y-2 rounded-xl border border-rose-300/20 bg-rose-300/5 p-4 text-sm text-rose-100"><p className="font-semibold">Nothing imported. Fix these lines and check again.</p><ul className="list-disc space-y-2 pl-5">{importResult.errors.map((error, index) => <li key={`${error.line}-${index}`}>{error.line !== null ? `Line ${error.line}: ` : ""}{error.message}</li>)}</ul>{importResult.errors.length >= 10 && <p>Showing the first 10 issues. Check again after correcting them.</p>}</div>}
              {importResult && importResult.errors.length === 0 && importResult.pairs.length > 0 && <div className="space-y-3"><p className="text-sm font-semibold text-emerald-200">{importResult.pairs.length} {importResult.pairs.length === 1 ? "example is" : "examples are"} ready for your review.</p><div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-white/10 p-2">{importResult.pairs.map((pair, index) => <details key={index} className="rounded-lg bg-white/5 p-3 text-sm"><summary className="min-h-11 cursor-pointer break-words font-medium">Example {index + 1}: {pair.prompt.slice(0, 120)}{pair.prompt.length > 120 ? "…" : ""}</summary><p className="mt-3 font-semibold text-orange-200">Prompt</p><p className="mt-1 whitespace-pre-wrap break-words leading-relaxed">{pair.prompt}</p><p className="mt-3 font-semibold text-orange-200">Ideal response</p><p className="mt-1 whitespace-pre-wrap break-words leading-relaxed text-zinc-300">{pair.response}</p></details>)}</div><button type="button" className={primaryButton} disabled={Boolean(storageError)} onClick={saveImport}><Save className="h-4 w-4" aria-hidden="true" />Save {importResult.pairs.length} imported {importResult.pairs.length === 1 ? "example" : "examples"}</button></div>}
            </div>
          )}

          {exportText !== null && <div className="space-y-4 rounded-2xl border border-orange-300/20 bg-black/15 p-4"><div className="flex items-center justify-between gap-3"><h4 className="text-base font-semibold">Your training file</h4><button type="button" className={`${secondaryButton} px-3`} aria-label="Close export" onClick={() => setExportText(null)}><X className="h-4 w-4" aria-hidden="true" /></button></div><p className="text-sm leading-relaxed text-zinc-300">Includes all {notebook.pairs.length} saved examples in the SLM Lab messages format. Unsaved drafts are not included. Export or copy the text into a .jsonl file.</p><div className="flex flex-wrap gap-2"><button type="button" className={primaryButton} onClick={downloadExport} disabled={exporting}><Download className="h-4 w-4" aria-hidden="true" />{exporting ? "Opening export…" : "Export file"}</button><button type="button" className={secondaryButton} onClick={copyExport}><Copy className="h-4 w-4" aria-hidden="true" />Copy JSONL</button></div><label htmlFor="notebook-export-text" className="block text-sm font-semibold">Export text · available for manual copying</label><textarea ref={exportRef} id="notebook-export-text" value={exportText} readOnly rows={6} spellCheck={false} className={`${inputClass} resize-y font-mono text-sm`} /><p className="text-sm leading-relaxed text-zinc-400">If your device’s share options or download are unavailable, copy this text instead.</p></div>}

          {notebook.pairs.length > 0 && <div className="relative"><label htmlFor="notebook-search" className="sr-only">Search saved prompts and responses</label><Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-zinc-400" aria-hidden="true" /><input id="notebook-search" type="search" className={`${inputClass} min-h-11 pl-12`} placeholder="Find a prompt or response…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>}

          {notebook.pairs.length === 0 && !storageError ? <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center"><NotebookPen className="mx-auto h-8 w-8 text-orange-300/80" aria-hidden="true" /><p className="mt-3 text-base font-semibold">Start with one good example.</p><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">Write something above or choose Try example. Your saved collection will appear here.</p></div> : filteredPairs.length === 0 && !storageError ? <p role="status" className="rounded-xl border border-white/10 p-5 text-sm text-zinc-300">No examples match “{query}”. Try a different word.</p> : <div className="space-y-3">{filteredPairs.map((pair, index) => <article key={pair.id} className={`rounded-2xl border p-4 ${editingId === pair.id ? "border-orange-300/50 bg-orange-300/5" : "border-white/10 bg-black/10"}`}><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium text-orange-200">{query.trim() ? "Saved example" : `Example ${index + 1}`}</span>{editingId === pair.id && <span className="text-sm text-orange-200">Editing above</span>}</div><p className="whitespace-pre-wrap break-words text-base font-medium leading-relaxed">{pair.prompt}</p><details className="mt-3 text-sm text-zinc-300"><summary className="min-h-11 cursor-pointer content-center font-medium">Read ideal response</summary><p className="mt-2 whitespace-pre-wrap break-words leading-relaxed">{pair.response}</p></details>{deleteId === pair.id ? <div className="mt-4 space-y-3 rounded-xl border border-rose-300/20 bg-rose-300/5 p-3"><p className="text-sm text-rose-100">Delete this saved example from this device?</p><div className="flex flex-wrap gap-2"><button type="button" className={`${secondaryButton} border-rose-300/40 text-rose-100`} onClick={() => removeExample(pair)}>Delete example</button><button type="button" className={secondaryButton} onClick={() => setDeleteId(null)}>Keep it</button></div></div> : <div className="mt-3 flex flex-wrap gap-2"><button type="button" className={secondaryButton} onClick={() => openExample(pair)} aria-label={`Edit example ${index + 1}`}><Pencil className="h-4 w-4" aria-hidden="true" />Edit</button><button type="button" className={`${secondaryButton} text-zinc-400`} onClick={() => setDeleteId(pair.id)} aria-label={`Delete example ${index + 1}`}><Trash2 className="h-4 w-4" aria-hidden="true" />Delete</button></div>}</article>)}</div>}
        </div>
      </div>
    </section>
  );
}

export default LocalTrainingNotebook;
