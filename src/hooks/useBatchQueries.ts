/**
 * Query batching utility for reducing Supabase round-trips.
 * Groups multiple table queries into a single parallel execution.
 */
import { useQueries } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BatchQuery {
  key: string;
  table: string;
  select?: string;
  filter?: Record<string, any>;
  eq?: [string, any][];
  limit?: number;
  order?: { column: string; ascending?: boolean };
  single?: boolean;
  count?: "exact" | "planned" | "estimated";
}

/**
 * Execute multiple Supabase queries in parallel with shared caching.
 * Reduces waterfall requests on pages that need data from multiple tables.
 *
 * @example
 * const results = useBatchQueries([
 *   { key: "profile", table: "profiles", eq: [["user_id", userId]], single: true },
 *   { key: "posts", table: "posts", eq: [["author_id", userId]], limit: 10 },
 *   { key: "followers", table: "user_follows", eq: [["following_id", userId]], count: "exact" },
 * ], { enabled: !!userId, staleTime: 60000 });
 */
export function useBatchQueries(
  queries: BatchQuery[],
  options?: { enabled?: boolean; staleTime?: number }
) {
  const results = useQueries({
    queries: queries.map((q) => ({
      queryKey: ["batch", q.key, q.filter, q.eq],
      queryFn: async () => {
        let query = supabase.from(q.table as any).select(q.select || "*", q.count ? { count: q.count, head: !q.select } : undefined);

        if (q.eq) {
          for (const [col, val] of q.eq) {
            query = query.eq(col, val);
          }
        }

        if (q.order) {
          query = query.order(q.order.column, { ascending: q.order.ascending ?? false });
        }

        if (q.limit) {
          query = query.limit(q.limit);
        }

        if (q.single) {
          const { data, error, count } = await (query as any).single();
          if (error && error.code !== "PGRST116") throw error;
          return { data, count };
        }

        const { data, error, count } = await query;
        if (error) throw error;
        return { data, count };
      },
      enabled: options?.enabled !== false,
      staleTime: options?.staleTime ?? 1000 * 60 * 3,
    })),
  });

  const map = new Map<string, { data: any; count?: number | null; isLoading: boolean; error: any }>();
  queries.forEach((q, i) => {
    const r = results[i];
    map.set(q.key, {
      data: r.data?.data ?? null,
      count: r.data?.count ?? null,
      isLoading: r.isLoading,
      error: r.error,
    });
  });

  return {
    results: map,
    get: (key: string) => map.get(key),
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
  };
}
