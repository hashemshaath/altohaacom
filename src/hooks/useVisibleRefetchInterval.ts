/**
 * Returns a refetchInterval that pauses when the tab is hidden.
 * Use this in useQuery options to save bandwidth when user isn't looking.
 *
 * Usage:
 *   const refetchInterval = useVisibleRefetchInterval(60000);
 *   useQuery({ ..., refetchInterval });
 */
import { usePageVisibility } from "./usePageVisibility";

export function useVisibleRefetchInterval(intervalMs: number): number | false {
  const isVisible = usePageVisibility();
  return isVisible ? intervalMs : false;
}
