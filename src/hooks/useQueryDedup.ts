/**
 * Query deduplication and smart prefetching utilities.
 * Prevents duplicate in-flight requests and prefetches data on hover.
 */
import { useCallback } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Prefetch Supabase data on hover/focus to eliminate perceived latency.
 * Uses React Query's prefetchQuery to leverage cache.
 */
export function useSmartPrefetch() {
  const queryClient = useQueryClient();

  const prefetchQuery = useCallback(
    (key: QueryKey, fetcher: () => Promise<any>, staleTime = 1000 * 60 * 3) => {
      // Only prefetch if data isn't already fresh
      const existing = queryClient.getQueryData(key);
      if (existing) return;

      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => {
          queryClient.prefetchQuery({ queryKey: key, queryFn: fetcher, staleTime });
        });
      } else {
        queryClient.prefetchQuery({ queryKey: key, queryFn: fetcher, staleTime });
      }
    },
    [queryClient]
  );

  /** Prefetch a Supabase table query */
  const prefetchTable = useCallback(
    (table: string, filters?: Record<string, any>, select = "*", limit = 20) => {
      const key = ["prefetch", table, filters];
      prefetchQuery(key, async () => {
        let q = supabase.from(table as any).select(select).limit(limit);
        if (filters) {
          Object.entries(filters).forEach(([col, val]) => {
            q = q.eq(col, val);
          });
        }
        const { data } = await q;
        return data;
      });
    },
    [prefetchQuery]
  );

  /** Returns hover/focus props that trigger prefetch */
  const prefetchProps = useCallback(
    (key: QueryKey, fetcher: () => Promise<any>) => ({
      onMouseEnter: () => prefetchQuery(key, fetcher),
      onFocus: () => prefetchQuery(key, fetcher),
    }),
    [prefetchQuery]
  );

  return { prefetchQuery, prefetchTable, prefetchProps };
}
