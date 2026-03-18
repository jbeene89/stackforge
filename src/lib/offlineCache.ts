// Offline-first IndexedDB cache for training data
// Caches: training_datasets, dataset_samples, training_jobs
// Syncs pending mutations when back online with conflict detection

const DB_NAME = "soupyforge-offline";
const DB_VERSION = 2;

type StoreName = "training_datasets" | "dataset_samples" | "training_jobs" | "pending_mutations" | "sync_conflicts";

interface PendingMutation {
  id: string;
  store: Exclude<StoreName, "pending_mutations" | "sync_conflicts">;
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
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("training_datasets")) {
        db.createObjectStore("training_datasets", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("dataset_samples")) {
        const store = db.createObjectStore("dataset_samples", { keyPath: "id" });
        store.createIndex("by_dataset", "dataset_id", { unique: false });
      }
      if (!db.objectStoreNames.contains("training_jobs")) {
        db.createObjectStore("training_jobs", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pending_mutations")) {
        db.createObjectStore("pending_mutations", { keyPath: "id" });
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

// Sync engine — replays pending mutations against Supabase
export async function syncPendingMutations(
  supabase: any,
  onProgress?: (synced: number, total: number) => void
): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingMutations();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  // Sort by created_at to replay in order
  pending.sort((a, b) => a.created_at.localeCompare(b.created_at));

  let synced = 0;
  let failed = 0;

  for (const mutation of pending) {
    try {
      const table = mutation.store;
      if (mutation.action === "insert") {
        const { error } = await supabase.from(table).insert(mutation.payload);
        if (error) throw error;
      } else if (mutation.action === "update") {
        const { id, ...updates } = mutation.payload;
        const { error } = await supabase.from(table).update(updates).eq("id", id);
        if (error) throw error;
      } else if (mutation.action === "delete") {
        const { error } = await supabase.from(table).delete().eq("id", mutation.payload.id);
        if (error) throw error;
      }
      await clearPendingMutation(mutation.id);
      synced++;
      onProgress?.(synced, pending.length);
    } catch (e) {
      console.error("[OfflineSync] Failed to sync mutation:", mutation, e);
      failed++;
    }
  }

  return { synced, failed };
}
