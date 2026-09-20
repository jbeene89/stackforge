import { afterEach, expect, it, vi } from "vitest";
import { shareOrSaveImage } from "./share-image";
const mocks = vi.hoisted(() => ({ write: vi.fn(), share: vi.fn() }));
vi.mock("./native-navigation", () => ({ isNativeApp: () => true }));
vi.mock("@capacitor/filesystem", () => ({ Filesystem: { writeFile: mocks.write }, Directory: { Cache: "CACHE" } }));
vi.mock("@capacitor/share", () => ({ Share: { share: mocks.share } }));
afterEach(() => { vi.unstubAllGlobals(); vi.resetAllMocks(); });
it("shares a cache file with its actual image extension", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, blob: async () => new Blob(["jpeg"], { type: "image/jpeg" }) })));
  mocks.write.mockResolvedValue({ uri: "content://soupylab/cache/image.jpg" });
  mocks.share.mockResolvedValue({});
  await shareOrSaveImage("data:image/jpeg;base64,anBlZw==");
  expect(mocks.write.mock.calls[0][0]).toMatchObject({ directory: "CACHE", data: "anBlZw==" });
  expect(mocks.write.mock.calls[0][0].path).toMatch(/\.jpg$/);
  expect(mocks.share).toHaveBeenCalledWith({ title: "SoupyLab image", files: ["content://soupylab/cache/image.jpg"], dialogTitle: "Share or save image" });
});
it("does not send an error response or non-image to the share sheet", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, blob: async () => new Blob(["error"], { type: "text/html" }) })));
  await expect(shareOrSaveImage("https://example.invalid/photo")).rejects.toThrow("cannot be shared");
  expect(mocks.write).not.toHaveBeenCalled();
  expect(mocks.share).not.toHaveBeenCalled();
});
