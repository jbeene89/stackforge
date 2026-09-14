/* Instrumentation fixture. Place ONLY in src/debug/assets/public/. */
const fixtureRun = (new URL(self.location.href).searchParams.get("run") || "test").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);
const fixtureKey = "soupylab:sw-upgrade-test:old-shell-seen";
const oldShell = "<!doctype html><html><head><meta charset='utf-8'><title>Old app fixture</title></head>" +
  "<body><h1 id='old-app-fixture'>OLD APP — MIGRATION TEST</h1><script>" +
  "localStorage.setItem(" + JSON.stringify(fixtureKey) + "," + JSON.stringify("seen:" + fixtureRun) + ");" +
  "</script></body></html>";

self.addEventListener("install", event => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.mode === "navigate" && url.origin === self.location.origin) {
    event.respondWith(Promise.resolve(new Response(oldShell, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    })));
  }
});
