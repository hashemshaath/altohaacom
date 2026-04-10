import { useEffect, useRef } from "react";
import { canPrefetch } from "./useConnectionAwarePrefetch";

/**
 * Prefetches top route chunks during browser idle time.
 * This warms the module cache so navigation feels instant.
 */
const PREFETCH_ROUTES = [
  () => import("@/pages/Competitions"),
  () => import("@/pages/Exhibitions"),
  () => import("@/pages/Community"),
];

export function useRoutePrefetch() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    if (!canPrefetch()) return;

    const prefetch = () => {
      // Stagger prefetches to avoid contention
      PREFETCH_ROUTES.forEach((loader, i) => {
        setTimeout(() => {
          loader().then(null, () => {});
        }, 1000 + i * 500);
      });
    };

    if ("requestIdleCallback" in window) {
      const id = (window as any).requestIdleCallback(prefetch, { timeout: 5000 });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const timer = setTimeout(prefetch, 3000);
      return () => clearTimeout(timer);
    }
  }, []);
}
