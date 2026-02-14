import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export function usePullToRefresh() {
  const queryClient = useQueryClient();

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries();
    // Small delay so the animation feels natural
    await new Promise((r) => setTimeout(r, 500));
  }, [queryClient]);

  return refresh;
}
