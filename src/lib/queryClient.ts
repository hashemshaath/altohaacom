import { QueryClient, MutationCache } from "@tanstack/react-query";

/**
 * Centralized React Query factory with production-grade defaults.
 * Used in App.tsx and available for test environments.
 *
 * Defaults:
 * - staleTime: 3 min (avoids redundant refetches)
 * - gcTime: 30 min (keeps inactive data warm)
 * - refetchOnWindowFocus: false (saves bandwidth)
 * - Smart retry: skips 4xx errors, retries once for others
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error) => {
        console.error("[Mutation Error]", error instanceof Error ? error.message : error);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 3,
        gcTime: 1000 * 60 * 30,
        retry: (failureCount, error) => {
          const status = (error as { status?: number })?.status;
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: "always",
      },
      mutations: { retry: 0 },
    },
  });
}
