import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ANALYTICS_SCRIPT_ID, COOKIE_CONSENT_KEY, initializeConsentedAnalytics,
  readCookieConsent, saveCookieConsent,
} from "./analytics-consent";

beforeEach(() => {
  localStorage.clear();
  Reflect.deleteProperty(window, "gtag");
  Reflect.deleteProperty(window, "dataLayer");
  // Never attach the remote script: these tests inspect requested DOM changes only.
  vi.spyOn(document.head, "appendChild").mockImplementation(<T extends Node>(node: T): T => node);
});

afterEach(() => {
  document.getElementById(ANALYTICS_SCRIPT_ID)?.remove();
  vi.restoreAllMocks();
  localStorage.clear();
  Reflect.deleteProperty(window, "gtag");
  Reflect.deleteProperty(window, "dataLayer");
});

describe("optional analytics consent", () => {
  it.each([null, "declined", "true", "corrupt"])("creates no analytics script or queue for %s consent", consent => {
    if (consent !== null) localStorage.setItem(COOKIE_CONSENT_KEY, consent);
    expect(initializeConsentedAnalytics()).toBe(false);
    expect(document.head.appendChild).not.toHaveBeenCalled();
    expect(window.gtag).toBeUndefined();
    expect("dataLayer" in window).toBe(false);
  });

  it("loads only the existing tracking IDs after stored acceptance", () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    expect(initializeConsentedAnalytics()).toBe(true);
    const script = vi.mocked(document.head.appendChild).mock.calls[0][0] as HTMLScriptElement;
    expect(script.id).toBe(ANALYTICS_SCRIPT_ID);
    expect(script.src).toBe("https://www.googletagmanager.com/gtag/js?id=AW-17413895911");
    expect(script.async).toBe(true);
    const queue = (window as unknown as Window & { dataLayer: IArguments[] }).dataLayer.map(command => Array.from(command));
    expect(queue).toEqual([["js", expect.any(Date)], ["config", "AW-17413895911"], ["config", "G-GDRJZ9C7KH"]]);
  });

  it("supports an explicit acceptance and a saved decline", () => {
    expect(saveCookieConsent("declined")).toBe(true);
    expect(readCookieConsent()).toBe("declined");
    expect(initializeConsentedAnalytics()).toBe(false);
    expect(saveCookieConsent("accepted")).toBe(true);
    expect(initializeConsentedAnalytics()).toBe(true);
    expect(document.head.appendChild).toHaveBeenCalledTimes(1);
  });

  it("does not duplicate an already initialized tag", () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    const marker = document.createElement("meta");
    marker.id = ANALYTICS_SCRIPT_ID;
    document.body.appendChild(marker);
    expect(initializeConsentedAnalytics()).toBe(true);
    expect(initializeConsentedAnalytics()).toBe(true);
    expect(document.head.appendChild).not.toHaveBeenCalled();
  });

  it("fails closed when storage cannot be read", () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Storage blocked"); });
    expect(readCookieConsent()).toBeNull();
    expect(initializeConsentedAnalytics()).toBe(false);
    expect(document.head.appendChild).not.toHaveBeenCalled();
  });

  it("does not throw or activate analytics when acceptance cannot be saved", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota exceeded"); });
    expect(saveCookieConsent("accepted")).toBe(false);
    expect(saveCookieConsent("declined")).toBe(false);
    expect(initializeConsentedAnalytics()).toBe(false);
    expect(document.head.appendChild).not.toHaveBeenCalled();
  });

  it("does not queue further app events after consent is declined", () => {
    saveCookieConsent("accepted");
    initializeConsentedAnalytics();
    const queue = (window as unknown as Window & { dataLayer: unknown[] }).dataLayer;
    const priorLength = queue.length;
    saveCookieConsent("declined");
    window.gtag("event", "conversion");
    expect(queue).toHaveLength(priorLength);
    expect(initializeConsentedAnalytics()).toBe(false);
  });
});
