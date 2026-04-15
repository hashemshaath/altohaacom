import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { canPrefetch } from "./useConnectionAwarePrefetch";

/**
 * Prefetches route modules AND data on hover/focus to speed up navigation.
 * Uses requestIdleCallback to avoid blocking main thread.
 */
const prefetched = new Set<string>();

const routeModules: Record<string, () => Promise<unknown>> = {
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

/** Warm the Supabase query cache alongside module prefetch */
const dataPrefetchers: Record<string, () => Promise<unknown>> = {
  "/competitions": async () => {
    await supabase.from("competitions").select("id,title,slug,status,start_date,featured_image_url").in("status", ["registration_open", "upcoming"]).order("start_date", { ascending: false }).limit(12);
  },
  "/news": async () => {
    await supabase.from("articles").select("id,title,slug,excerpt,featured_image_url,published_at,type").eq("status", "published").order("published_at", { ascending: false }).limit(10);
  },
  "/exhibitions": async () => {
    await supabase.from("exhibitions").select("id,title,slug,start_date,end_date,venue,city,featured_image_url,status").in("status", ["active", "upcoming"]).order("start_date", { ascending: false }).limit(10);
  },
  "/recipes": async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- recipes may not be in generated types
    await (supabase.from("recipes") as never).select("id,title,slug,featured_image_url").eq("status", "published").order("created_at", { ascending: false }).limit(12);
  },
  "/shop": async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- shop_products may not be in generated types
    await (supabase.from("shop_products") as never).select("id,name,slug,price,currency,images,status").eq("status", "active").order("created_at", { ascending: false }).limit(12);
  },
};

export function usePrefetchRoute() {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const prefetch = useCallback((path: string) => {
    if (prefetched.has(path) || !canPrefetch()) return;

    // Find matching route module
    const matchKey = Object.keys(routeModules).find(key => path.startsWith(key));
    if (!matchKey) return;

    // Delay slightly to avoid prefetching on fast scroll-overs
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (prefetched.has(path)) return;
      prefetched.add(path);

      const schedule = "requestIdleCallback" in window
        ? (fn: () => void) => (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(fn)
        : (fn: () => void) => fn();

      schedule(() => {
        // Prefetch module
        routeModules[matchKey]().catch(() => prefetched.delete(path));
        // Prefetch data (fire-and-forget)
        dataPrefetchers[matchKey]?.().then(null, () => {});
      });
    }, 150);
  }, []);

  const prefetchProps = useCallback((path: string) => ({
    onMouseEnter: () => prefetch(path),
    onFocus: () => prefetch(path),
  }), [prefetch]);

  return { prefetch, prefetchProps };
}
