/**
 * Performance utilities: debounce, throttle, and memoization helpers.
 */

/**
 * Debounce a function call by `delay` ms.
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay = 300): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
  };
  return debounced as T & { cancel: () => void };
}

/**
 * Throttle a function call to at most once per `limit` ms.
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, limit = 200): T {
  let inThrottle = false;
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

/**
 * Simple memoize for single-argument pure functions.
 */
export function memoize<T extends (arg: any) => any>(fn: T, maxSize = 100): T {
  const cache = new Map<any, ReturnType<T>>();
  return ((arg: any) => {
    if (cache.has(arg)) return cache.get(arg);
    const result = fn(arg);
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(arg, result);
    return result;
  }) as T;
}
