import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  syncPendingMutations,
  getPendingMutations,
  getUnresolvedConflicts,
  type SyncConflict,
} from "@/lib/offlineCache";
import { toast } from "sonner";

export type ConnectionStatus = "online" | "offline" | "syncing";

export function useOfflineSync() {
  const [status, setStatus] = useState<ConnectionStatus>(
    navigator.onLine ? "online" : "offline"
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const syncingRef = useRef(false);

  const refreshState = useCallback(async () => {
    try {
      const pending = await getPendingMutations();
      setPendingCount(pending.length);
      const unresolved = await getUnresolvedConflicts();
      setConflicts(unresolved);
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
      // Sync complete — result.synced / result.failed / result.conflicts tracked silently

      if (result.conflicts > 0) {
        toast.warning(`${result.conflicts} conflict${result.conflicts > 1 ? "s" : ""} detected — review in sidebar`, {
          duration: 6000,
        });
      }
      if (result.synced > 0) {
        toast.success(`${result.synced} change${result.synced > 1 ? "s" : ""} synced`);
      }
      if (result.failed === 0) {
        setStatus("online");
      }
    } catch (e) {
      console.error("[OfflineSync] Sync error:", e);
    } finally {
      syncingRef.current = false;
      await refreshState();
      if (navigator.onLine) setStatus("online");
    }
  }, [refreshState]);

  useEffect(() => {
    const handleOnline = () => {
      setStatus("online");
      doSync();
    };
    const handleOffline = () => setStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    refreshState();
    if (navigator.onLine) doSync();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [doSync, refreshState]);

  useEffect(() => {
    const interval = setInterval(refreshState, 10000);
    return () => clearInterval(interval);
  }, [refreshState]);

  return { status, pendingCount, conflicts, triggerSync: doSync, refreshState };
}
