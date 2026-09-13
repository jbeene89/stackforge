package com.soupylab.app;

import android.net.Uri;
import android.util.Log;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "SoupyLabUpgrade";

    // At most one migration-triggered reload per Activity, even if a controller
    // fails to disappear. Every document still gets worker cleanup and blocking.
    private boolean migrationReloadAvailable = true;

    private static final String WORKER_MIGRATION =
        "(() => {\n" +
        "  if (window.location.origin !== 'https://localhost') return;\n" +
        "  const key = '__soupylabNativeWorkerMigration10002';\n" +
        "  if (window[key]) return;\n" +
        "  const state = window[key] = { status: 'running', reloadIssued: false };\n" +
        "  const sw = navigator.serviceWorker;\n" +
        "  if (!sw) { state.status = 'complete'; return; }\n" +
        "  const mayReload = __ALLOW_RELOAD__;\n" +
        "  const blockedRegister = () => Promise.reject(new Error('Service workers are disabled in the bundled SoupyLab app.'));\n" +
        "  try {\n" +
        "    Object.defineProperty(sw, 'register', { configurable: true, writable: false, value: blockedRegister });\n" +
        "  } catch (error) {\n" +
        "    state.status = 'failed';\n" +
        "    console.warn('[SoupyLab] Could not protect worker registration for this page.');\n" +
        "    return;\n" +
        "  }\n" +
        "  (async () => {\n" +
        "    const registrations = await sw.getRegistrations();\n" +
        "    const localRegistrations = registrations.filter(registration => {\n" +
        "      try { return new URL(registration.scope).origin === 'https://localhost'; }\n" +
        "      catch (error) { return false; }\n" +
        "    });\n" +
        "    const hadWorker = Boolean(sw.controller) || localRegistrations.length > 0;\n" +
        "    await Promise.all(localRegistrations.map(registration => registration.unregister()));\n" +
        "    state.status = 'complete';\n" +
        "    if (hadWorker && mayReload && !state.reloadIssued) {\n" +
        "      state.reloadIssued = true;\n" +
        "      window.location.replace(window.location.href);\n" +
        "    }\n" +
        "  })().catch(() => {\n" +
        "    state.status = 'failed';\n" +
        "    console.warn('[SoupyLab] Worker migration did not complete; it will retry on the next page load.');\n" +
        "  });\n" +
        "})();";

    @Override
    protected void load() {
        // BridgeActivity calls load() after its WebView exists. Adding this
        // listener before super.load() installs it before the first navigation.
        bridgeBuilder.addWebViewListener(new WebViewListener() {
            @Override
            public void onPageLoaded(WebView webView) {
                String currentUrl = webView.getUrl();
                if (currentUrl == null) return;
                Uri uri = Uri.parse(currentUrl);
                if (!"https".equals(uri.getScheme()) || !"localhost".equals(uri.getHost()) ||
                    (uri.getPort() != -1 && uri.getPort() != 443)) return;

                boolean allowReload = migrationReloadAvailable;
                migrationReloadAvailable = false;
                try {
                    webView.evaluateJavascript(
                        WORKER_MIGRATION.replace("__ALLOW_RELOAD__", allowReload ? "true" : "false"),
                        null
                    );
                } catch (RuntimeException error) {
                    Log.w(TAG, "Worker migration could not run for this page.", error);
                }
            }
        });
        super.load();
    }
}
