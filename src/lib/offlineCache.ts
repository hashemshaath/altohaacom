/**
 * IndexedDB-based offline cache for key platform content.
 * Stores competitions, articles, recipes, and user profile data
 * for browsing when offline.
 */

const DB_NAME = "altoha_offline";
const DB_VERSION = 1;
const STORES = ["competitions", "articles", "recipes", "profiles", "offline_queue"] as const;
type StoreName = (typeof STORES)[number];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: "id" });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheItems<T extends { id: string }>(
  store: StoreName,
  items: T[]
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(store, "readwrite");
    const os = tx.objectStore(store);
    for (const item of items) {
      os.put({ ...item, _cachedAt: Date.now() });
    }
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  } catch {
    // IndexedDB not available
  }
}

export async function getCachedItems<T>(store: StoreName): Promise<T[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(store, "readonly");
    const os = tx.objectStore(store);
    const req = os.getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        db.close();
        resolve(req.result as T[]);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return [];
  }
}

export async function getCachedItem<T>(store: StoreName, id: string): Promise<T | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(store, "readonly");
    const os = tx.objectStore(store);
    const req = os.get(id);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        db.close();
        resolve(req.result as T | null);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return null;
  }
}

export async function clearStore(store: StoreName): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).clear();
    await new Promise<void>((res) => { tx.oncomplete = () => res(); });
    db.close();
  } catch {
    // Silently fail
  }
}

/** Queue an action to retry when back online */
export async function queueOfflineAction(action: {
  type: string;
  table: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction("offline_queue", "readwrite");
    tx.objectStore("offline_queue").put({
      id: crypto.randomUUID(),
      ...action,
      createdAt: Date.now(),
    });
    await new Promise<void>((res) => { tx.oncomplete = () => res(); });
    db.close();
  } catch {
    // Silently fail
  }
}

/** Get and clear all queued offline actions */
export async function flushOfflineQueue(): Promise<Array<{
  id: string;
  type: string;
  table: string;
  payload: Record<string, unknown>;
}>> {
  try {
    const items = await getCachedItems<{
      id: string;
      type: string;
      table: string;
      payload: Record<string, unknown>;
    }>("offline_queue");
    if (items.length > 0) {
      await clearStore("offline_queue");
    }
    return items;
  } catch {
    return [];
  }
}

/** Get cache stats for UI display */
export async function getCacheStats(): Promise<{
  competitions: number;
  articles: number;
  recipes: number;
  lastSync: number | null;
}> {
  const [competitions, articles, recipes] = await Promise.all([
    getCachedItems("competitions"),
    getCachedItems("articles"),
    getCachedItems("recipes"),
  ]);

  const allItems = [...competitions, ...articles, ...recipes] as Array<{ _cachedAt?: number }>;
  const lastSync = allItems.reduce((max, item) => {
    const t = item._cachedAt || 0;
    return t > max ? t : max;
  }, 0);

  return {
    competitions: competitions.length,
    articles: articles.length,
    recipes: recipes.length,
    lastSync: lastSync || null,
  };
}
