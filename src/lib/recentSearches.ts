const STORAGE_KEY = "altoha_recent_searches";
const SAVED_KEY = "altoha_saved_searches";
const MAX_RECENT = 8;
const MAX_SAVED = 10;

export function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/** Custom event fired whenever the recent-searches list changes — lets open SearchBars stay in sync. */
const CHANGE_EVENT = "altoha:recent-searches-changed";

function notifyChange() {
  try {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // SSR / no window
  }
}

/** Subscribe to recent-searches changes (in this tab and other tabs). Returns unsubscribe. */
export function subscribeRecentSearches(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, handler);
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) handler();
  };
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", storageHandler);
  };
}

export function addRecentSearch(query: string): void {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return;
  try {
    const recent = getRecentSearches().filter((q) => q !== trimmed);
    recent.unshift(trimmed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
    notifyChange();
  } catch {
    // localStorage not available
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    notifyChange();
  } catch {
    // noop
  }
}

export function removeRecentSearch(query: string): void {
  try {
    const recent = getRecentSearches().filter((q) => q !== query);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    notifyChange();
  } catch {
    // noop
  }
}

/** Saved/pinned searches that persist across sessions */
export function getSavedSearches(): string[] {
  try {
    const stored = localStorage.getItem(SAVED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addSavedSearch(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  try {
    const saved = getSavedSearches().filter((q) => q !== trimmed);
    saved.unshift(trimmed);
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved.slice(0, MAX_SAVED)));
  } catch {}
}

export function removeSavedSearch(query: string): void {
  try {
    const saved = getSavedSearches().filter((q) => q !== query);
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  } catch {}
}
