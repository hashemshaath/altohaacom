import type { QueryClient } from "@tanstack/react-query";

/**
 * Creates an optimistic update configuration for TanStack Query mutations.
 *
 * Usage with useMutation:
 * ```ts
 * const mutation = useMutation({
 *   mutationFn: updateProfile,
 *   ...optimisticUpdate(queryClient, ["my-profile", userId], (old, newData) => ({
 *     ...old,
 *     ...newData,
 *   })),
 * });
 * ```
 */
export function optimisticUpdate<TData, TVariables>(
  queryClient: QueryClient,
  queryKey: unknown[],
  updater: (oldData: TData, variables: TVariables) => TData,
) {
  return {
    onMutate: async (variables: TVariables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // Optimistically update
      if (previousData !== undefined) {
        queryClient.setQueryData<TData>(queryKey, (old) =>
          old !== undefined ? updater(old, variables) : old,
        );
      }

      return { previousData };
    },

    onError: (
      _error: unknown,
      _variables: TVariables,
      context: { previousData?: TData } | undefined,
    ) => {
      // Roll back on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },

    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey });
    },
  };
}

/**
 * Optimistic list operations — add, remove, update items in an array cache.
 */
export const listOptimistic = {
  add: <T extends { id: string }>(
    queryClient: QueryClient,
    queryKey: unknown[],
  ) =>
    optimisticUpdate<T[], T>(queryClient, queryKey, (old, newItem) => [
      newItem,
      ...old,
    ]),

  remove: <T extends { id: string }>(
    queryClient: QueryClient,
    queryKey: unknown[],
  ) =>
    optimisticUpdate<T[], string>(queryClient, queryKey, (old, id) =>
      old.filter((item) => item.id !== id),
    ),

  update: <T extends { id: string }>(
    queryClient: QueryClient,
    queryKey: unknown[],
  ) =>
    optimisticUpdate<T[], Partial<T> & { id: string }>(
      queryClient,
      queryKey,
      (old, updated) =>
        old.map((item) =>
          item.id === updated.id ? { ...item, ...updated } : item,
        ),
    ),
};
