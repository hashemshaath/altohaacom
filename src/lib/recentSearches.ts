const STORAGE_KEY = "altoha_recent_searches";
const MAX_RECENT = 8;

export function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): void {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return;
  try {
    const recent = getRecentSearches().filter((q) => q !== trimmed);
    recent.unshift(trimmed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // localStorage not available
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
