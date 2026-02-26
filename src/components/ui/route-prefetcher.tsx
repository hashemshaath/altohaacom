import { useEffect } from "react";

/**
 * Prefetches critical route chunks after initial paint.
 * Drop into App to warm the cache for common navigation targets.
 */
const routeLoaders = [
  () => import("@/pages/Competitions"),
  () => import("@/pages/Exhibitions"),
  () => import("@/pages/Community"),
  () => import("@/pages/Messages"),
];

export function RoutePrefetcher() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const id = requestIdleCallback
      ? requestIdleCallback(() => {
          routeLoaders.forEach((loader) => loader().catch(() => {}));
        })
      : window.setTimeout(() => {
          routeLoaders.forEach((loader) => loader().catch(() => {}));
        }, 3000);

    return () => {
      if (typeof cancelIdleCallback !== "undefined") cancelIdleCallback(id as number);
      else clearTimeout(id as number);
    };
  }, []);

  return null;
}
