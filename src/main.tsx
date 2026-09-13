import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { isNativeApp } from "./lib/native-navigation";
import { registerSW } from "virtual:pwa-register";
import { initializeConsentedAnalytics } from "./lib/analytics-consent";

initializeConsentedAnalytics();

if (isNativeApp()) document.documentElement.dataset.nativeApp = "true";

// Guard: unregister service workers in iframe/preview contexts
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe || isNativeApp()) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  }).catch(() => { /* The bundled native app does not need a service worker. */ });
} else {
  registerSW({ immediate: true });
}

createRoot(document.getElementById("root")!).render(<App />);
