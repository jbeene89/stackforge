/** SoupyLab Smart Switch: decides where a reply runs. Pure logic, no I/O. */

export type EngineKind = "ollama" | "webgpu" | "file" | "cloud";

/** Preferred order: home computer, device GPU, device processor (own file), cloud. */
export const ENGINE_ORDER: EngineKind[] = ["ollama", "webgpu", "file", "cloud"];

export const ENGINE_LABELS: Record<EngineKind, string> = {
  ollama: "Home computer",
  webgpu: "This device (graphics chip)",
  file: "My model file",
  cloud: "Cloud",
};

/** Credits charged per cloud reply (matches the lite model price in ai-generate). */
export const CLOUD_MODEL = "google/gemini-3.1-flash-lite-preview";
export const CLOUD_COST = 1;

/** Browsers cannot hold a single file over 2 GB in memory. */
export const BROWSER_FILE_LIMIT_BYTES = 2 * 1024 ** 3;

export function canRunFileInBrowser(totalBytes: number, largestPartBytes = totalBytes): boolean {
  return totalBytes > 0 && largestPartBytes <= BROWSER_FILE_LIMIT_BYTES && totalBytes <= 4 * BROWSER_FILE_LIMIT_BYTES;
}

export interface RouteInput {
  ready: Partial<Record<EngineKind, boolean>>;
  offlineOnly: boolean;
  signedIn: boolean;
  /** When the user's own model file is loaded, run it before any stock model. */
  preferOwnModel?: boolean;
  /** Engines that already failed in this session. */
  failed?: EngineKind[];
}

export function planRoute({ ready, offlineOnly, signedIn, preferOwnModel, failed = [] }: RouteInput): EngineKind[] {
  const order = preferOwnModel && ready.file
    ? (["file", ...ENGINE_ORDER.filter(e => e !== "file")] as EngineKind[])
    : ENGINE_ORDER;
  return order.filter(engine => {
    if (failed.includes(engine)) return false;
    if (engine === "cloud") return !offlineOnly && signedIn;
    return Boolean(ready[engine]);
  });
}
