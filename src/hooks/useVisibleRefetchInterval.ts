/**
 * Returns a refetchInterval that pauses when the tab is hidden.
 * Use this in useQuery options to save bandwidth when user isn't looking.
 *
 * Usage:
 *   const refetchInterval = useVisibleRefetchInterval(REFETCH_INTERVAL_DEFAULT);
 *   useQuery({ ..., refetchInterval });
 */
import { useState, useEffect } from "react";
import { REFETCH_INTERVAL_DEFAULT } from "@/lib/constants";

function usePageVisibility(): boolean {
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return visible;
}

export function useVisibleRefetchInterval(intervalMs: number): number | false {
  const isVisible = usePageVisibility();
  return isVisible ? intervalMs : false;
}
