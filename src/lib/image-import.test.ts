import { afterEach, describe, expect, it, vi } from "vitest";
import { fitImageSize, prepareImage, prepareImageBatch, validateImageBatch } from "./image-import";

const photo = (size = 10, type = "image/jpeg") => new File([new Uint8Array(size)], "photo.jpg", { type });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("safe photo imports", () => {
  it("rejects empty, unsupported, excessive-count and excessive-total imports before decoding", () => {
    expect(() => validateImageBatch([photo(0)])).toThrow("empty");
    expect(() => validateImageBatch([photo(2, "image/svg+xml")])).toThrow("Convert");
    expect(() => validateImageBatch(Array(31).fill(photo()))).toThrow("30");
    expect(() => validateImageBatch(Array(6).fill(photo(8 * 1024 * 1024)))).toThrow("40 MB");
    expect(() => validateImageBatch([photo(9 * 1024 * 1024)])).toThrow("8 MB");
  });
  it("preserves portrait and landscape proportions without upscaling", () => {
    expect(fitImageSize(4000, 3000)).toEqual({ width: 2048, height: 1536 });
    expect(fitImageSize(3000, 4000)).toEqual({ width: 1536, height: 2048 });
    expect(fitImageSize(320, 200)).toEqual({ width: 320, height: 200 });
    expect(() => fitImageSize(10000, 10000)).toThrow("40 megapixels");
    expect(() => fitImageSize(0, 100)).toThrow();
  });
  it("releases temporary URLs after a corrupt image and permits a later retry", async () => {
    const revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:photo"), revokeObjectURL: revoke });
    vi.stubGlobal("Image", class { onerror: (() => void) | null = null; set src(value: string) { if (value) queueMicrotask(() => this.onerror?.()); } });
    await expect(prepareImage(photo())).rejects.toThrow("could not be opened");
    await expect(prepareImage(photo())).rejects.toThrow("could not be opened");
    expect(revoke).toHaveBeenCalledTimes(2);
  });
  it("times out a stalled decoder and releases its URL", async () => {
    vi.useFakeTimers();
    const revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: () => "blob:stalled", revokeObjectURL: revoke });
    vi.stubGlobal("Image", class { src = ""; });
    const result = expect(prepareImage(photo())).rejects.toThrow("too long");
    await vi.advanceTimersByTimeAsync(15_000);
    await result;
    expect(revoke).toHaveBeenCalledWith("blob:stalled");
  });
  it("decodes a batch sequentially and produces bounded image output", async () => {
    let active = 0, peak = 0;
    const draw = vi.fn();
    const revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: () => "blob:photo", revokeObjectURL: revoke });
    vi.stubGlobal("Image", class {
      naturalWidth = 4000; naturalHeight = 3000; onload: (() => void) | null = null;
      set src(value: string) { if (value) { peak = Math.max(peak, ++active); queueMicrotask(() => { active--; this.onload?.(); }); } }
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ fillRect: vi.fn(), drawImage: draw } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/jpeg;base64,prepared");
    const progress = vi.fn();
    expect(await prepareImageBatch([photo(), photo(), photo()], progress)).toHaveLength(3);
    expect(peak).toBe(1);
    expect(draw.mock.calls.every(call => call[3] === 2048 && call[4] === 1536)).toBe(true);
    expect(progress.mock.calls).toEqual([[1], [2], [3]]);
    expect(revoke).toHaveBeenCalledTimes(3);
  });
});
