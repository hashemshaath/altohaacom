import { useCallback, useRef } from "react";
import { shouldPrefetch } from "@/lib/networkQuality";

/**
 * Returns props to spread on `<Link>` or `<a>` for hover/focus prefetching.
 *
 * On hover (after 100ms debounce), triggers the route chunk prefetch
 * so navigation feels instant.
 *
 * ```tsx
 * const linkProps = useLinkPrefetch("/chefs");
 * <Link to="/chefs" {...linkProps}>Chefs</Link>
 * ```
 */
export function useLinkPrefetch(path: string) {
  const prefetched = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const doPrefetch = useCallback(() => {
    if (prefetched.current.has(path) || !shouldPrefetch()) return;
    prefetched.current.add(path);

    // Dynamically discover and prefetch the route chunk
    const routeModules = import.meta.glob("/src/pages/**/*.tsx");
    const normalizedPath = path === "/" ? "/Index" : path;

    for (const [modulePath, loader] of Object.entries(routeModules)) {
      const routeName = modulePath.replace("/src/pages/", "").replace(".tsx", "");
      if (`/${routeName}` === normalizedPath || routeName === normalizedPath.slice(1)) {
        (loader as () => Promise<unknown>)().then(null, () => {});
        break;
      }
    }
  }, [path]);

  const onMouseEnter = useCallback(() => {
    timer.current = setTimeout(doPrefetch, 100);
  }, [doPrefetch]);

  const onMouseLeave = useCallback(() => {
    clearTimeout(timer.current);
  }, []);

  const onFocus = useCallback(() => {
    doPrefetch();
  }, [doPrefetch]);

  return { onMouseEnter, onMouseLeave, onFocus };
}
