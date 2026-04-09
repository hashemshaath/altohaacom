/**
 * Safe localStorage wrappers that prevent crashes in restricted environments
 * (incognito mode, blocked cookies, storage quota exceeded, etc.)
 */

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage full or restricted — silently fail
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Restricted environment — silently fail
  }
}
