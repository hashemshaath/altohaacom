import { QueryClient } from "@tanstack/react-query";

/**
 * Centralized React Query defaults.
 * All queries inherit these unless overridden.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time: 2 minutes
        staleTime: 1000 * 60 * 2,
        // Keep unused data in cache for 30 minutes
        gcTime: 1000 * 60 * 30,
        // Don't refetch on window focus by default — saves bandwidth
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect — staleTime handles freshness
        refetchOnReconnect: "always",
        // Retry once on failure
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
