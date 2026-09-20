import { isNativeApp } from "./native-navigation";

/** Open the device chooser only after an explicit share/save action. */
export async function shareOrSaveImage(source: string): Promise<void> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30_000);
  let blob: Blob;
  try {
    const response = await fetch(source, { signal: controller.signal });
    if (!response.ok) throw new Error("The image could not be downloaded. Please try again.");
    blob = await response.blob();
  } finally { clearTimeout(timeout); }
  if (!/^image\/(png|jpeg|webp|gif)$/.test(blob.type) || !blob.size || blob.size > 20 * 1024 * 1024) {
    throw new Error("This image cannot be shared. Try a PNG, JPEG, WebP or GIF under 20 MB.");
  }
  const extension = blob.type === "image/jpeg" ? "jpg" : blob.type.split("/")[1];
  const filename = `soupylab-${Date.now()}.${extension}`;
  if (isNativeApp()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([import("@capacitor/filesystem"), import("@capacitor/share")]);
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = () => reject(new Error("The image could not be prepared for sharing."));
      reader.onabort = () => reject(new Error("Image sharing was canceled."));
      reader.readAsDataURL(blob);
    });
    const result = await Filesystem.writeFile({ path: filename, data, directory: Directory.Cache });
    await Share.share({ title: "SoupyLab image", files: [result.uri], dialogTitle: "Share or save image" });
    return;
  }
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "SoupyLab image" });
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
