import { useCallback, useRef, memo, ReactNode } from "react";
import { Link, LinkProps, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * PrefetchLink - Preloads route chunks on hover/focus for instant navigation.
 * Maps routes to their lazy-loaded chunk imports.
 */

const routeModuleMap: Record<string, () => Promise<any>> = {
  "/": () => import("@/pages/Index"),
  "/dashboard": () => import("@/pages/Dashboard"),
  "/competitions": () => import("@/pages/Competitions"),
  "/community": () => import("@/pages/Community"),
  "/rankings": () => import("@/pages/Rankings"),
  "/news": () => import("@/pages/News"),
  "/exhibitions": () => import("@/pages/Exhibitions"),
  "/entities": () => import("@/pages/Entities"),
  "/recipes": () => import("@/pages/Recipes"),
  "/shop": () => import("@/pages/Shop"),
  "/masterclasses": () => import("@/pages/Masterclasses"),
  "/mentorship": () => import("@/pages/Mentorship"),
  "/profile": () => import("@/pages/Profile"),
  "/notifications": () => import("@/pages/Notifications"),
  "/messages": () => import("@/pages/Messages"),
  "/search": () => import("@/pages/Search"),
  "/help": () => import("@/pages/HelpCenter"),
  "/pro-suppliers": () => import("@/pages/ProSuppliers"),
  "/establishments": () => import("@/pages/Establishments"),
  "/chefs-table": () => import("@/pages/ChefsTable"),
};

const prefetchedRoutes = new Set<string>();

function prefetchRoute(to: string) {
  const basePath = to.split("?")[0].split("#")[0];
  // Try exact match first, then base path segments
  const match = routeModuleMap[basePath];
  if (match && !prefetchedRoutes.has(basePath)) {
    prefetchedRoutes.add(basePath);
    match().catch(() => {
      // Silently fail - it will load normally on navigation
      prefetchedRoutes.delete(basePath);
    });
  }
}

interface PrefetchLinkProps extends LinkProps {
  children: ReactNode;
  prefetchOnHover?: boolean;
}

export function PrefetchLink({
  children,
  to,
  prefetchOnHover = true,
  className,
  ...props
}: PrefetchLinkProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handlePointerEnter = useCallback(() => {
    if (!prefetchOnHover) return;
    // Small delay to avoid prefetching on accidental hovers
    timerRef.current = setTimeout(() => {
      prefetchRoute(typeof to === "string" ? to : to.pathname || "");
    }, 75);
  }, [to, prefetchOnHover]);

  const handlePointerLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleFocus = useCallback(() => {
    prefetchRoute(typeof to === "string" ? to : to.pathname || "");
  }, [to]);

  return (
    <Link
      to={to}
      className={className}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      {...props}
    >
      {children}
    </Link>
  );
}

/**
 * Hook to programmatically prefetch a route.
 */
export function usePrefetch() {
  return useCallback((path: string) => prefetchRoute(path), []);
}
