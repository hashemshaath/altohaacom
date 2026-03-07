import { useCallback, useRef } from "react";

/**
 * Prefetches route modules on hover/focus to speed up navigation.
 * Uses requestIdleCallback to avoid blocking main thread.
 */
const prefetched = new Set<string>();

const routeModules: Record<string, () => Promise<any>> = {
  "/competitions": () => import("@/pages/Competitions"),
  "/shop": () => import("@/pages/Shop"),
  "/community": () => import("@/pages/Community"),
  "/recipes": () => import("@/pages/Recipes"),
  "/messages": () => import("@/pages/Messages"),
  "/profile": () => import("@/pages/Profile"),
  "/masterclasses": () => import("@/pages/Masterclasses"),
  "/exhibitions": () => import("@/pages/Exhibitions"),
  "/dashboard": () => import("@/pages/Dashboard"),
  "/news": () => import("@/pages/News"),
  "/organizers": () => import("@/pages/Organizers"),
  "/rankings": () => import("@/pages/Rankings"),
  "/events-calendar": () => import("@/pages/EventsCalendar"),
};

export function usePrefetchRoute() {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const prefetch = useCallback((path: string) => {
    if (prefetched.has(path)) return;

    // Find matching route module
    const matchKey = Object.keys(routeModules).find(key => path.startsWith(key));
    if (!matchKey) return;

    // Delay slightly to avoid prefetching on fast scroll-overs
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (prefetched.has(path)) return;
      prefetched.add(path);

      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => {
          routeModules[matchKey]().catch(() => {
            prefetched.delete(path);
          });
        });
      } else {
        routeModules[matchKey]().catch(() => {
          prefetched.delete(path);
        });
      }
    }, 150);
  }, []);

  const prefetchProps = useCallback((path: string) => ({
    onMouseEnter: () => prefetch(path),
    onFocus: () => prefetch(path),
  }), [prefetch]);

  return { prefetch, prefetchProps };
}
