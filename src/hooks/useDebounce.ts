import { useState, useEffect } from "react";

/**
 * Debounce a value by a given delay (ms).
 * Useful for search inputs to reduce API calls.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
