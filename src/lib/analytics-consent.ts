export const COOKIE_CONSENT_KEY = "cookie-consent";
export const ANALYTICS_SCRIPT_ID = "soupylab-consented-analytics";
export type CookieConsent = "accepted" | "declined";

export function readCookieConsent(): CookieConsent | null {
  try {
    const stored = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    return stored === "accepted" || stored === "declined" ? stored : null;
  } catch {
    return null;
  }
}

export function saveCookieConsent(consent: CookieConsent): boolean {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, consent);
    return true;
  } catch {
    return false;
  }
}

/** No script, queue, or tracking requests are created without stored consent. */
export function initializeConsentedAnalytics(): boolean {
  if (readCookieConsent() !== "accepted") return false;
  if (document.getElementById(ANALYTICS_SCRIPT_ID)) return true;

  const analyticsWindow = window as Window & { dataLayer?: unknown[] };
  const dataLayer = analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
  // Google's tag queue consumes the arguments object for each command.
  window.gtag = function () {
    if (readCookieConsent() === "accepted") dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", "AW-17413895911");
  window.gtag("config", "G-GDRJZ9C7KH");

  const script = document.createElement("script");
  script.id = ANALYTICS_SCRIPT_ID;
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=AW-17413895911";
  document.head.appendChild(script);
  return true;
}
