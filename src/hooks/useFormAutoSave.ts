import { useCallback, useEffect, useRef, useState } from "react";
import { MS_PER_DAY } from "@/lib/constants";

interface UseFormAutoSaveOptions<T> {
  /** Storage key for draft */
  key: string;
  /** Current form values */
  values: T;
  /** Debounce delay in ms (default 1000) */
  delay?: number;
  /** Whether auto-save is enabled */
  enabled?: boolean;
}

/**
 * Auto-saves form drafts to localStorage with debounce.
 * Returns saved draft and clear function.
 */
export function useFormAutoSave<T>({
  key,
  values,
  delay = 1000,
  enabled = true,
}: UseFormAutoSaveOptions<T>) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageKey = `draft_${key}`;

  // Load draft on mount
  const loadDraft = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;
      const { data, timestamp } = JSON.parse(saved);
      // Expire drafts older than 24h
      if (Date.now() - timestamp > MS_PER_DAY) {
        localStorage.removeItem(storageKey);
        return null;
      }
      return data as T;
    } catch {
      return null;
    }
  }, [storageKey]);

  // Auto-save with debounce
  useEffect(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          data: values,
          timestamp: Date.now(),
        }));
        setLastSaved(new Date());
      } catch { /* quota exceeded */ }
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [values, delay, enabled, storageKey]);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch { /* restricted */ }
    setLastSaved(null);
  }, [storageKey]);

  const hasDraft = useCallback(() => {
    try { return !!localStorage.getItem(storageKey); } catch { return false; }
  }, [storageKey]);

  return { loadDraft, clearDraft, hasDraft, lastSaved };
}
