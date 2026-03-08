import { useEffect, memo } from "react";

/**
 * Prefetches critical route chunks after initial paint.
 * Drop into App to warm the cache for common navigation targets.
 */
const routeLoaders = [
  () => import("@/pages/Competitions"),
  () => import("@/pages/Exhibitions"),
  () => import("@/pages/Community"),
  () => import("@/pages/Recipes"),
  () => import("@/pages/News"),
];

export const RoutePrefetcher = memo(function RoutePrefetcher() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasIdleCallback = "requestIdleCallback" in window;
    const id = hasIdleCallback
      ? window.requestIdleCallback(() => {
          routeLoaders.forEach((loader) => loader().catch(() => {}));
        })
      : window.setTimeout(() => {
          routeLoaders.forEach((loader) => loader().catch(() => {}));
        }, 3000);

    return () => {
      if (hasIdleCallback) window.cancelIdleCallback(id as number);
      else clearTimeout(id as number);
    };
  }, []);

  return null;
}
