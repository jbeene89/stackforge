/** Decode locally before accepting a photo; bound memory and cloud payload size. */
export function validateImageBatch(files: readonly File[], maxBytes = 8 * 1024 * 1024) {
  if (!files.length || files.length > 30) throw new Error("Choose between 1 and 30 images.");
  if (files.reduce((sum, file) => sum + file.size, 0) > 40 * 1024 * 1024) {
    throw new Error("Choose a smaller batch: the total limit is 40 MB.");
  }
  for (const file of files) {
    if (!file.size) throw new Error(`“${file.name}” is empty.`);
    if (file.size > maxBytes) throw new Error(`“${file.name}” exceeds ${maxBytes / 1024 / 1024} MB.`);
    if (!/^image\/(jpeg|png|webp|gif|bmp|avif)$/i.test(file.type)) {
      throw new Error("Choose a JPEG, PNG, WebP, GIF, BMP or AVIF image. Convert HEIC and SVG files first.");
    }
  }
}

export function fitImageSize(width: number, height: number, limit = 2048) {
  if (!Number.isFinite(width * height) || width <= 0 || height <= 0 || width * height > 40_000_000) {
    throw new Error("This photo is too large to open. Choose an image under 40 megapixels.");
  }
  const scale = Math.min(1, limit / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export function prepareImage(file: File, maxBytes = 8 * 1024 * 1024): Promise<string> {
  validateImageBatch([file], maxBytes);
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    const finish = (error?: Error, data?: string) => {
      clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      URL.revokeObjectURL(url);
      image.src = "";
      if (error) reject(error); else resolve(data!);
    };
    const timeout = window.setTimeout(() => finish(new Error("Opening the image took too long. Please try a smaller photo.")), 15_000);
    image.onerror = () => finish(new Error("This image could not be opened. Try exporting it as JPEG or PNG."));
    image.onload = () => {
      try {
        const size = fitImageSize(image.naturalWidth, image.naturalHeight);
        const canvas = document.createElement("canvas");
        canvas.width = size.width;
        canvas.height = size.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Image processing is unavailable on this device.");
        context.fillStyle = "white";
        context.fillRect(0, 0, size.width, size.height);
        context.drawImage(image, 0, 0, size.width, size.height);
        const data = canvas.toDataURL("image/jpeg", 0.9);
        canvas.width = canvas.height = 0;
        if (!data.startsWith("data:image/")) throw new Error("This image could not be prepared.");
        finish(undefined, data);
      } catch (error) { finish(error instanceof Error ? error : new Error("Could not open this image.")); }
    };
    image.src = url;
  });
}

export async function prepareImageBatch(files: readonly File[], onProgress?: (completed: number) => void) {
  validateImageBatch(files);
  const images: string[] = [];
  // Decode one image at a time so selecting many camera photos cannot start 30 decoders at once.
  for (const file of files) {
    images.push(await prepareImage(file));
    onProgress?.(images.length);
  }
  return images;
}
