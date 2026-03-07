/**
 * Pause expensive operations when the tab is hidden.
 * Useful for stopping timers, animations, and polling.
 */
import { useState, useEffect, useCallback } from "react";

export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handler = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return isVisible;
}

/**
 * Only runs a callback when the page is visible.
 * Returns a wrapped function that no-ops when tab is hidden.
 */
export function useVisibleCallback<T extends (...args: any[]) => any>(fn: T): T {
  const isVisible = usePageVisibility();
  return useCallback(
    ((...args: any[]) => {
      if (isVisible) return fn(...args);
    }) as T,
    [fn, isVisible]
  );
}
