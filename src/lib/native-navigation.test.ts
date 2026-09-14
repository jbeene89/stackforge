import { describe, expect, it, vi } from "vitest";
import { appHref, getSignInDestination } from "./native-navigation";
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => true } }));

describe("native navigation", () => {
  it("keeps sign-up and home links inside the native router", () => {
    expect(appHref("/signup")).toBe("/#/signup");
    expect(appHref("/")).toBe("/#/");
    expect(appHref("/demo/module-builder?preset=scope-summarizer")).toBe("/#/demo/module-builder?preset=scope-summarizer");
  });
  it("rejects external redirects and authentication loops", () => {
    for (const value of ["https://example.com", "//example.com", "/%2fexample.com", "/login", "/signup", "\\example.com", null, {}]) {
      expect(getSignInDestination(value)).toBe("/dashboard");
    }
    expect(getSignInDestination("/image-forge")).toBe("/image-forge");
  });
});
