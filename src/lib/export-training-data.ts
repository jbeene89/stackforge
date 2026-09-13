import { isNativeApp } from "./native-navigation";

/** Called only after the user chooses Export. No network or automatic sharing. */
export async function exportTrainingData(jsonl: string): Promise<"shared" | "download-started"> {
  const filename = `soupylab-training-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`;
  if (isNativeApp()) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
      import("@capacitor/filesystem"), import("@capacitor/share"),
    ]);
    const result = await Filesystem.writeFile({ path: filename, data: jsonl, directory: Directory.Cache, encoding: Encoding.UTF8 });
    // Android's chooser grants access to this one cache file after the user selects a destination.
    // Leave it in cache until Android can finish the recipient's read; the OS may reclaim it later.
    await Share.share({ title: "SoupyLab training examples", files: [result.uri], dialogTitle: "Export training examples" });
    return "shared";
  }
  const url = URL.createObjectURL(new Blob([jsonl], { type: "application/x-ndjson;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return "download-started";
}
