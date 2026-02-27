import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Prefetches common admin dashboard queries during idle time
 * to warm the cache and improve perceived performance.
 */
export function useAdminCacheWarmer() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Use requestIdleCallback to avoid blocking main thread
    const warmCache = () => {
      const queriesToWarm = [
        "admin-kpi-trends",
        "admin-automation-status",
        "admin-company-dashboard",
        "admin-audit-trail",
      ];

      queriesToWarm.forEach((key) => {
        // Only prefetch if not already cached
        const existing = queryClient.getQueryData([key]);
        if (!existing) {
          queryClient.prefetchQuery({
            queryKey: [key],
            staleTime: 1000 * 60 * 3,
          });
        }
      });
    };

    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(warmCache, { timeout: 5000 });
      return () => cancelIdleCallback(id);
    } else {
      const timeout = setTimeout(warmCache, 2000);
      return () => clearTimeout(timeout);
    }
  }, [queryClient]);
}
