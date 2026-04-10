import { useRef, useCallback } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";

/**
 * Prevents duplicate Supabase queries by checking the React Query cache
 * before executing a fetch. Returns cached data if fresh enough.
 *
 * ```tsx
 * const dedup = useQueryDedup();
 *
 * const { data } = useQuery({
 *   queryKey: ["profiles", id],
 *   queryFn: () => dedup(["profiles", id], () => fetchProfile(id)),
 * });
 * ```
 */
export function useQueryDedup() {
  const qc = useQueryClient();
  const inflightRef = useRef(new Map<string, Promise<unknown>>());

  return useCallback(
    async <T>(key: QueryKey, fetcher: () => Promise<T>): Promise<T> => {
      const keyStr = JSON.stringify(key);

      // Check if data is already cached and fresh
      const cached = qc.getQueryData<T>(key);
      const state = qc.getQueryState(key);
      if (cached && state && !state.isInvalidated) {
        const age = Date.now() - state.dataUpdatedAt;
        // If less than 30 seconds old, return cached
        if (age < 30_000) return cached;
      }

      // Deduplicate in-flight requests
      const existing = inflightRef.current.get(keyStr);
      if (existing) return existing as Promise<T>;

      const promise = fetcher().finally(() => {
        inflightRef.current.delete(keyStr);
      });

      inflightRef.current.set(keyStr, promise);
      return promise;
    },
    [qc]
  );
}
