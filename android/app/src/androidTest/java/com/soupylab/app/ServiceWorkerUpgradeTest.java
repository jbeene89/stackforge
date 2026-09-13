package com.soupylab.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.os.SystemClock;
import android.util.Log;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Run only on the dedicated emulator preview app, never a user's installation. */
@RunWith(AndroidJUnit4.class)
public class ServiceWorkerUpgradeTest {
    private static final String NOTEBOOK_KEY = "soupylab:training-notebook:v1";
    private static final String MARKER_KEY = "soupylab:sw-upgrade-test:old-shell-seen";
    private static final String TEST_DB = "soupylab-sw-upgrade-test";
    private static final String TEST_STATE = "__soupyNativeUpgradeTest";

    @Test
    public void staleWorkerIsRemovedWithoutLosingSavedNotebookOrIndexedDb() throws Exception {
        String runId = "sw_upgrade_" + UUID.randomUUID().toString().replace("-", "");
        String notebook = new JSONObject().put("version", 1).put("pairs", new JSONArray().put(
            new JSONObject()
                .put("id", runId)
                .put("prompt", "Keep this saved example through the native upgrade.")
                .put("response", "The notebook and IndexedDB record must survive service worker cleanup.")
                .put("createdAt", "2026-09-13T12:00:00.000Z")
                .put("updatedAt", "2026-09-13T12:00:00.000Z")
        )).toString();

        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            waitFor(scenario,
                "window.__soupylabNativeWorkerMigration10002?.status === 'complete'",
                "Initial native guard did not settle.");
            assertEquals("\"https://localhost\"", evaluate(scenario, "window.location.origin"));
            evaluate(scenario, "window.location.hash='/launchpad';true;");
            waitFor(scenario, "!!document.getElementById('launchpad-title')", "Initial launchpad did not settle.");
            JSONObject original = evaluateObject(scenario,
                "({ notebook: localStorage.getItem(" + q(NOTEBOOK_KEY) + "), marker: localStorage.getItem(" + q(MARKER_KEY) + ") })");

            try {
                evaluate(scenario,
                    "localStorage.setItem(" + q(NOTEBOOK_KEY) + "," + q(notebook) + ");" +
                    "localStorage.setItem(" + q(MARKER_KEY) + "," + q("pending:" + runId) + ");true;");

                // The live document intentionally prevents new registrations.
                // Remove only that document's override for this test setup.
                evaluate(scenario,
                    "window." + TEST_STATE + " = { stage: 'seeding' };" +
                    "(async () => {" + openDbFunction() +
                    "const db = await openTestDb();" +
                    "try { await new Promise((resolve,reject) => {" +
                    " const tx=db.transaction('markers','readwrite');" +
                    " tx.objectStore('markers').put({id:" + q(runId) + ",value:'retained'});" +
                    " tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);" +
                    "}); } finally { db.close(); }" +
                    "delete navigator.serviceWorker.register;" +
                    "await ServiceWorkerContainer.prototype.register.call(navigator.serviceWorker," +
                    q("/sw-upgrade-fixture.js?run=" + runId) + ",{scope:'/',updateViaCache:'none'});" +
                    "await navigator.serviceWorker.ready;" +
                    "await new Promise((resolve,reject) => {" +
                    " const controlled=()=>{if(navigator.serviceWorker.controller?.scriptURL.includes('sw-upgrade-fixture.js')){" +
                    "  clearTimeout(timer);navigator.serviceWorker.removeEventListener('controllerchange',controlled);resolve();}};" +
                    " const timer=setTimeout(()=>{navigator.serviceWorker.removeEventListener('controllerchange',controlled);reject(new Error('Fixture worker did not take control'));},15000);" +
                    " navigator.serviceWorker.addEventListener('controllerchange',controlled);controlled();" +
                    "});" +
                    "window." + TEST_STATE + "={stage:'controlled'};" +
                    "})().catch(error=>{window." + TEST_STATE + "={stage:'error',message:String(error)};});");
                waitForState(scenario, "controlled", "Fixture registration did not finish.");
                assertTrue(evaluate(scenario,
                    "navigator.serviceWorker.controller.scriptURL.includes('sw-upgrade-fixture.js')").equals("true"));

                // Recreate directly: pre-navigating would let the first Activity
                // remove the fixture before the new Activity's upgrade path runs.
                scenario.recreate();
                waitFor(scenario,
                    "!!document.getElementById('launchpad-title') && " +
                    "localStorage.getItem(" + q(MARKER_KEY) + ") === " + q("seen:" + runId) +
                    " && window.__soupylabNativeWorkerMigration10002?.status === 'complete' && !navigator.serviceWorker.controller",
                    "Native guard did not recover the real app after the stale worker's page.");

                evaluate(scenario,
                    "window." + TEST_STATE + "={stage:'checking'};" +
                    "(async()=>{" + openDbFunction() +
                    "const registrations=await navigator.serviceWorker.getRegistrations();" +
                    "const db=await openTestDb();let record;" +
                    "try{record=await new Promise((resolve,reject)=>{const request=db.transaction('markers','readonly').objectStore('markers').get(" + q(runId) + ");request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}finally{db.close();}" +
                    "window." + TEST_STATE + "={stage:'verified',registrationCount:registrations.length,controlled:!!navigator.serviceWorker.controller," +
                    " notebook:localStorage.getItem(" + q(NOTEBOOK_KEY) + "),marker:localStorage.getItem(" + q(MARKER_KEY) + "),record:record??null};" +
                    "})().catch(error=>{window." + TEST_STATE + "={stage:'error',message:String(error)};});");
                waitForState(scenario, "verified", "Preservation checks did not finish.");
                JSONObject result = evaluateObject(scenario, "window." + TEST_STATE);
                assertEquals(0, result.getInt("registrationCount"));
                assertFalse(result.getBoolean("controlled"));
                assertEquals(notebook, result.getString("notebook"));
                assertEquals("seen:" + runId, result.getString("marker"));
                assertEquals("retained", result.getJSONObject("record").getString("value"));

                // Hash navigation does not replace the document or bypass the guard.
                evaluate(scenario, "window.location.hash='/offline-workbench';true;");
                waitFor(scenario,
                    "document.body.innerText.includes('Keep this saved example through the native upgrade.')",
                    "The preserved notebook did not appear in the real notebook screen.");
            } finally {
                // Restore only this test's temporary writes. Never clear an
                // origin, database, object store, or cache to make the test pass.
                try {
                    String restoreNotebook = original.isNull("notebook")
                        ? "localStorage.removeItem(" + q(NOTEBOOK_KEY) + ");"
                        : "localStorage.setItem(" + q(NOTEBOOK_KEY) + "," + q(original.getString("notebook")) + ");";
                    String restoreMarker = original.isNull("marker")
                        ? "localStorage.removeItem(" + q(MARKER_KEY) + ");"
                        : "localStorage.setItem(" + q(MARKER_KEY) + "," + q(original.getString("marker")) + ");";
                    evaluate(scenario,
                        "window." + TEST_STATE + "={stage:'cleaning'};" +
                        "(async()=>{" +
                        "if(localStorage.getItem(" + q(NOTEBOOK_KEY) + ")===" + q(notebook) + "){" + restoreNotebook + "}" +
                        "if([" + q("pending:" + runId) + "," + q("seen:" + runId) + "].includes(localStorage.getItem(" + q(MARKER_KEY) + "))){" + restoreMarker + "}" +
                        openDbFunction() +
                        "const db=await openTestDb();try{await new Promise((resolve,reject)=>{const tx=db.transaction('markers','readwrite');tx.objectStore('markers').delete(" + q(runId) + ");tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}" +
                        "const registrations=await navigator.serviceWorker.getRegistrations();await Promise.all(registrations.filter(r=>r.active?.scriptURL.includes('sw-upgrade-fixture.js')||r.installing?.scriptURL.includes('sw-upgrade-fixture.js')||r.waiting?.scriptURL.includes('sw-upgrade-fixture.js')).map(r=>r.unregister()));" +
                        "window." + TEST_STATE + "={stage:'cleaned'};" +
                        "})().catch(error=>{window." + TEST_STATE + "={stage:'error',message:String(error)};});");
                    waitForState(scenario, "cleaned", "Test-only cleanup did not finish.");
                } catch (Exception | AssertionError cleanupError) {
                    Log.w("SoupyLabUpgradeTest", "Test-only cleanup could not finish.", cleanupError);
                }
            }
        }
    }

    private static String openDbFunction() {
        return "function openTestDb(){return new Promise((resolve,reject)=>{" +
            "const request=indexedDB.open(" + q(TEST_DB) + ",1);" +
            "request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('markers'))request.result.createObjectStore('markers',{keyPath:'id'});};" +
            "request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);" +
            "});}";
    }

    private static String q(String value) {
        return JSONObject.quote(value);
    }

    private static String evaluate(ActivityScenario<MainActivity> scenario, String script) throws Exception {
        CountDownLatch complete = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        scenario.onActivity(activity -> {
            assertNotNull("Native bridge is unavailable", activity.getBridge());
            WebView webView = activity.getBridge().getWebView();
            webView.evaluateJavascript(script, value -> {
                result.set(value);
                complete.countDown();
            });
        });
        assertTrue("JavaScript evaluation callback timed out", complete.await(10, TimeUnit.SECONDS));
        return result.get();
    }

    private static JSONObject evaluateObject(ActivityScenario<MainActivity> scenario, String expression) throws Exception {
        String raw = evaluate(scenario, "JSON.stringify(" + expression + ")");
        Object decoded = new JSONTokener(raw).nextValue();
        assertTrue("Expected a JSON string from WebView", decoded instanceof String);
        return new JSONObject((String) decoded);
    }

    private static void waitForState(ActivityScenario<MainActivity> scenario, String expected, String failure) throws Exception {
        long deadline = SystemClock.elapsedRealtime() + 30_000;
        while (SystemClock.elapsedRealtime() < deadline) {
            JSONObject state = evaluateObject(scenario, "window." + TEST_STATE + " || {} ");
            if (expected.equals(state.optString("stage"))) return;
            if ("error".equals(state.optString("stage"))) {
                throw new AssertionError(failure + " " + state.optString("message"));
            }
            SystemClock.sleep(100);
        }
        throw new AssertionError(failure);
    }

    private static void waitFor(ActivityScenario<MainActivity> scenario, String expression, String failure) throws Exception {
        long deadline = SystemClock.elapsedRealtime() + 30_000;
        while (SystemClock.elapsedRealtime() < deadline) {
            if ("true".equals(evaluate(scenario, "Boolean(" + expression + ")"))) return;
            SystemClock.sleep(100);
        }
        throw new AssertionError(failure);
    }
}
