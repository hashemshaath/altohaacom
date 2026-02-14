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

/**
 * LRU Cache with configurable max size.
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear(): void { this.cache.clear(); }
}

/**
 * Batch multiple database count queries into a single parallel execution.
 */
export async function batchCountQueries(
  queries: Array<{ key: string; query: Promise<{ count: number | null }> }>
): Promise<Record<string, number>> {
  const results = await Promise.all(
    queries.map(async ({ key, query }) => {
      const { count } = await query;
      return [key, count ?? 0] as const;
    })
  );
  return Object.fromEntries(results);
}
