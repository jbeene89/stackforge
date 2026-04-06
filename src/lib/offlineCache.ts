// Offline-first IndexedDB cache for all user data
// Caches all user-owned tables and syncs pending mutations when back online

const DB_NAME = "soupy-offline";
const DB_VERSION = 3;

const ALL_STORES = [
  "training_datasets",
  "dataset_samples",
  "training_jobs",
  "modules",
  "projects",
  "stacks",
  "runs",
  "custom_models",
  "profiles",
  "user_credits",
  "credit_transactions",
  "cognitive_fingerprints",
  "deploy_pipeline_status",
  "founder_interviews",
  "mobile_captures",
  "perspective_jobs",
  "project_messages",
  "pending_mutations",
  "sync_conflicts",
] as const;

export type StoreName = (typeof ALL_STORES)[number];

// Tables that support mutation queueing (user-owned, CRUD-capable)
export type MutableStore = Exclude<StoreName, "pending_mutations" | "sync_conflicts" | "credit_transactions" | "user_credits">;

interface PendingMutation {
  id: string;
  store: MutableStore;
  action: "insert" | "update" | "delete";
  payload: Record<string, any>;
  created_at: string;
}

export interface SyncConflict {
  id: string;
  store: string;
  record_id: string;
  local_version: Record<string, any>;
  server_version: Record<string, any>;
  mutation_action: string;
  resolved: boolean;
  resolution?: "local" | "server" | "merged";
  created_at: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      const oldVersion = (event as IDBVersionChangeEvent).oldVersion;

      if (oldVersion < 1) {
        db.createObjectStore("training_datasets", { keyPath: "id" });
        const samplesStore = db.createObjectStore("dataset_samples", { keyPath: "id" });
        samplesStore.createIndex("by_dataset", "dataset_id", { unique: false });
        db.createObjectStore("training_jobs", { keyPath: "id" });
        db.createObjectStore("pending_mutations", { keyPath: "id" });
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains("sync_conflicts")) {
          const conflictStore = db.createObjectStore("sync_conflicts", { keyPath: "id" });
          conflictStore.createIndex("by_resolved", "resolved", { unique: false });
        }
      }
      if (oldVersion < 3) {
        // Add all new stores for full offline data support
        const newStores = [
          "modules",
          "projects",
          "stacks",
          "runs",
          "custom_models",
          "profiles",
          "user_credits",
          "credit_transactions",
          "cognitive_fingerprints",
          "deploy_pipeline_status",
          "founder_interviews",
          "mobile_captures",
          "perspective_jobs",
          "project_messages",
        ];
        for (const name of newStores) {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, { keyPath: "id" });
            // Add useful indexes
            if (name === "project_messages") {
              store.createIndex("by_project", "project_id", { unique: false });
            }
            if (name === "perspective_jobs") {
              store.createIndex("by_dataset", "dataset_id", { unique: false });
            }
            if (name === "cognitive_fingerprints") {
              store.createIndex("by_dataset", "dataset_id", { unique: false });
            }
            if (name === "deploy_pipeline_status") {
              store.createIndex("by_dataset", "dataset_id", { unique: false });
            }
            if (name === "founder_interviews") {
              store.createIndex("by_dataset", "dataset_id", { unique: false });
            }
            if (name === "mobile_captures") {
              store.createIndex("by_dataset", "dataset_id", { unique: false });
            }
          }
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Generic read/write helpers
export async function cacheGetAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheGetByIndex<T>(
  store: StoreName,
  indexName: string,
  key: string
): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const index = tx.objectStore(store).index(indexName);
    const req = index.getAll(key);
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheGet<T>(store: StoreName, id: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(id);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function cachePutAll<T extends { id: string }>(
  store: StoreName,
  items: T[]
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const os = tx.objectStore(store);
    items.forEach((item) => os.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function cachePut<T extends { id: string }>(
  store: StoreName,
  item: T
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function cacheDelete(store: StoreName, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function cacheClear(store: StoreName): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Pending mutations queue
export async function queueMutation(mutation: Omit<PendingMutation, "id" | "created_at">): Promise<void> {
  const entry: PendingMutation = {
    ...mutation,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  await cachePut("pending_mutations", entry as any);
}

export async function getPendingMutations(): Promise<PendingMutation[]> {
  return cacheGetAll<PendingMutation>("pending_mutations");
}

export async function clearPendingMutation(id: string): Promise<void> {
  await cacheDelete("pending_mutations", id);
}

export async function clearAllPendingMutations(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_mutations", "readwrite");
    tx.objectStore("pending_mutations").clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Conflict helpers
export async function addConflict(conflict: Omit<SyncConflict, "id" | "created_at" | "resolved">): Promise<void> {
  const entry: SyncConflict = {
    ...conflict,
    id: crypto.randomUUID(),
    resolved: false,
    created_at: new Date().toISOString(),
  };
  await cachePut("sync_conflicts" as StoreName, entry as any);
}

export async function getUnresolvedConflicts(): Promise<SyncConflict[]> {
  const all = await cacheGetAll<SyncConflict>("sync_conflicts" as StoreName);
  return all.filter(c => !c.resolved);
}

export async function getAllConflicts(): Promise<SyncConflict[]> {
  return cacheGetAll<SyncConflict>("sync_conflicts" as StoreName);
}

export async function resolveConflict(
  conflictId: string,
  resolution: "local" | "server",
  supabase: any
): Promise<void> {
  const all = await getAllConflicts();
  const conflict = all.find(c => c.id === conflictId);
  if (!conflict) return;

  if (resolution === "local") {
    const table = conflict.store;
    const { id: recordId, ...updates } = conflict.local_version;
    if (conflict.mutation_action === "update") {
      await supabase.from(table).update(updates).eq("id", recordId);
    } else if (conflict.mutation_action === "delete") {
      await supabase.from(table).delete().eq("id", recordId);
    }
    if (conflict.mutation_action === "delete") {
      await cacheDelete(table as StoreName, recordId);
    } else {
      await cachePut(table as StoreName, conflict.local_version as any);
    }
  } else {
    await cachePut(conflict.store as StoreName, conflict.server_version as any);
  }

  const updated: SyncConflict = { ...conflict, resolved: true, resolution };
  await cachePut("sync_conflicts" as StoreName, updated as any);
}

// Sync engine — replays pending mutations with conflict detection
export async function syncPendingMutations(
  supabase: any,
  onProgress?: (synced: number, total: number) => void
): Promise<{ synced: number; failed: number; conflicts: number }> {
  const pending = await getPendingMutations();
  if (pending.length === 0) return { synced: 0, failed: 0, conflicts: 0 };

  pending.sort((a, b) => a.created_at.localeCompare(b.created_at));

  let synced = 0;
  let failed = 0;
  let conflicts = 0;

  for (const mutation of pending) {
    try {
      const table = mutation.store;

      if (mutation.action === "insert") {
        const { error } = await supabase.from(table).insert(mutation.payload);
        if (error) {
          if (error.code === "23505") {
            await clearPendingMutation(mutation.id);
            synced++;
            continue;
          }
          throw error;
        }
      } else if (mutation.action === "update") {
        const { id, ...updates } = mutation.payload;

        const { data: serverRow } = await supabase.from(table).select("*").eq("id", id).single();

        if (serverRow && serverRow.updated_at && mutation.created_at < serverRow.updated_at) {
          await addConflict({
            store: table,
            record_id: id,
            local_version: mutation.payload,
            server_version: serverRow,
            mutation_action: "update",
          });
          await clearPendingMutation(mutation.id);
          conflicts++;
          onProgress?.(synced + conflicts, pending.length);
          continue;
        }

        const { error } = await supabase.from(table).update(updates).eq("id", id);
        if (error) throw error;
      } else if (mutation.action === "delete") {
        const { data: serverRow } = await supabase
          .from(table)
          .select("*")
          .eq("id", mutation.payload.id)
          .single();

        if (serverRow && serverRow.updated_at && mutation.created_at < serverRow.updated_at) {
          await addConflict({
            store: table,
            record_id: mutation.payload.id,
            local_version: mutation.payload,
            server_version: serverRow,
            mutation_action: "delete",
          });
          await clearPendingMutation(mutation.id);
          conflicts++;
          onProgress?.(synced + conflicts, pending.length);
          continue;
        }

        const { error } = await supabase.from(table).delete().eq("id", mutation.payload.id);
        if (error) {
          if (error.code === "PGRST116") {
            await clearPendingMutation(mutation.id);
            synced++;
            continue;
          }
          throw error;
        }
      }

      await clearPendingMutation(mutation.id);
      synced++;
      onProgress?.(synced + conflicts, pending.length);
    } catch (e) {
      console.error("[OfflineSync] Failed to sync mutation:", mutation, e);
      failed++;
    }
  }

  return { synced, failed, conflicts };
}
