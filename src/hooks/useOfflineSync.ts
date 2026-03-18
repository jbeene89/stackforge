import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  syncPendingMutations,
  getPendingMutations,
} from "@/lib/offlineCache";

export type ConnectionStatus = "online" | "offline" | "syncing";

export function useOfflineSync() {
  const [status, setStatus] = useState<ConnectionStatus>(
    navigator.onLine ? "online" : "offline"
  );
  const [pendingCount, setPendingCount] = useState(0);
  const syncingRef = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      const pending = await getPendingMutations();
      setPendingCount(pending.length);
    } catch {
      // IndexedDB not available
    }
  }, []);

  const doSync = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    const pending = await getPendingMutations();
    if (pending.length === 0) return;

    syncingRef.current = true;
    setStatus("syncing");

    try {
      const result = await syncPendingMutations(supabase);
      console.log(`[OfflineSync] Synced ${result.synced}, failed ${result.failed}`);
      if (result.failed === 0) {
        setStatus("online");
      }
    } catch (e) {
      console.error("[OfflineSync] Sync error:", e);
    } finally {
      syncingRef.current = false;
      await refreshPendingCount();
      if (navigator.onLine && status !== "syncing") setStatus("online");
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setStatus("online");
      doSync();
    };
    const handleOffline = () => setStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial sync attempt + pending count
    refreshPendingCount();
    if (navigator.onLine) doSync();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [doSync, refreshPendingCount]);

  // Poll pending count periodically
  useEffect(() => {
    const interval = setInterval(refreshPendingCount, 10000);
    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  return { status, pendingCount, triggerSync: doSync };
}
