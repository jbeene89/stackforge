// Keeps the user's model files on this device (browser private storage) so they load without re-picking.
import { parseModelLabel, sortModelParts, type SoupyModelLabel } from "./label";

export interface SavedModel { id: string; name: string; bytes: number; parts: string[]; label?: SoupyModelLabel }

const ROOT = "soupylab-models";

export function isModelStoreAvailable(): boolean {
  return typeof navigator !== "undefined" && !!navigator.storage?.getDirectory;
}

async function root() {
  const base = await navigator.storage.getDirectory();
  return base.getDirectoryHandle(ROOT, { create: true });
}

export async function listSavedModels(): Promise<SavedModel[]> {
  if (!isModelStoreAvailable()) return [];
  const dir = await root();
  const out: SavedModel[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for await (const [id, handle] of (dir as any).entries() as AsyncIterable<[string, FileSystemHandle]>) {
    if (handle.kind !== "directory") continue;
    const sub = handle as FileSystemDirectoryHandle;
    const parts: string[] = []; let bytes = 0; let label: SoupyModelLabel | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const [name, fh] of (sub as any).entries() as AsyncIterable<[string, FileSystemFileHandle]>) {
      const file = await fh.getFile();
      if (name.endsWith(".gguf")) { parts.push(name); bytes += file.size; }
      else if (name === "label.json") label = parseModelLabel(await file.text()) ?? undefined;
    }
    if (parts.length) out.push({ id, name: label?.name || id, bytes, parts: sortModelParts(parts.map(n => ({ name: n }))).map(p => p.name), label });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveModel(id: string, files: File[], label?: SoupyModelLabel): Promise<void> {
  const dir = await (await root()).getDirectoryHandle(id, { create: true });
  for (const f of files) {
    const fh = await dir.getFileHandle(f.name, { create: true });
    const w = await fh.createWritable();
    await f.stream().pipeTo(w);
  }
  if (label) {
    const fh = await dir.getFileHandle("label.json", { create: true });
    const w = await fh.createWritable();
    await w.write(JSON.stringify(label));
    await w.close();
  }
}

export async function readSavedModel(model: SavedModel): Promise<File[]> {
  const dir = await (await root()).getDirectoryHandle(model.id);
  return Promise.all(model.parts.map(async p => (await dir.getFileHandle(p)).getFile()));
}

export async function deleteSavedModel(id: string): Promise<void> {
  await (await root()).removeEntry(id, { recursive: true });
}
