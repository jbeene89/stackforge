/**
 * Attempts a programmatic download. Returns the blob URL if the browser
 * likely blocked it (e.g. sandboxed iframe) so callers can show a fallback.
 */
export function triggerDownload(blob: Blob, filename: string): string | null {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);

  try {
    a.click();
  } catch {
    // blocked
  }

  document.body.removeChild(a);

  // Keep the URL alive for fallback — caller is responsible for revoking
  return url;
}
