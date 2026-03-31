// IndexedDB gallery for Image Forge — auto-saves every generated image
const DB_NAME = "soupy-forge-gallery";
const DB_VERSION = 1;
const STORE = "images";

export interface ForgeGalleryItem {
  id: string;
  image: string; // base64 data URL
  prompt: string;
  mode: "council" | "free" | "chatroom";
  characterId?: string;
  characterName?: string;
  perspectives?: string[];
  created_at: string;
}

function openGalleryDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("by_date", "created_at", { unique: false });
        store.createIndex("by_mode", "mode", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveToGallery(item: Omit<ForgeGalleryItem, "id" | "created_at">): Promise<string> {
  const db = await openGalleryDB();
  const entry: ForgeGalleryItem = {
    ...item,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve(entry.id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getGalleryItems(limit = 100): Promise<ForgeGalleryItem[]> {
  const db = await openGalleryDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const index = store.index("by_date");
    const items: ForgeGalleryItem[] = [];
    const req = index.openCursor(null, "prev"); // newest first
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor && items.length < limit) {
        items.push(cursor.value);
        cursor.continue();
      } else {
        resolve(items);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const db = await openGalleryDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearGallery(): Promise<void> {
  const db = await openGalleryDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
