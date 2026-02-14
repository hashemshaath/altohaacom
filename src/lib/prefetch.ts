/**
 * Prefetch common route chunks on idle to improve navigation speed.
 * Uses requestIdleCallback to avoid impacting initial page load.
 */

const prefetchQueue: (() => Promise<any>)[] = [];
let isPrefetching = false;

function processQueue() {
  if (isPrefetching || prefetchQueue.length === 0) return;
  isPrefetching = true;
  
  const next = prefetchQueue.shift();
  if (next) {
    next()
      .catch(() => {}) // Silently fail - prefetch is best-effort
      .finally(() => {
        isPrefetching = false;
        if (prefetchQueue.length > 0) {
          // Small delay between prefetches to avoid overwhelming the network
          setTimeout(processQueue, 100);
        }
      });
  }
}

export function prefetchRoute(loader: () => Promise<any>) {
  prefetchQueue.push(loader);
  
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(processQueue, { timeout: 3000 });
  } else {
    setTimeout(processQueue, 2000);
  }
}

/**
 * Prefetch the most commonly navigated routes after the initial page loads.
 * Call this once from App or Index after first meaningful paint.
 */
export function prefetchCommonRoutes() {
  const commonRoutes = [
    () => import("@/pages/Competitions"),
    () => import("@/pages/News"),
    () => import("@/pages/Auth"),
    () => import("@/pages/Shop"),
  ];

  // Delay prefetching to prioritize initial render
  const startPrefetch = () => {
    commonRoutes.forEach(loader => prefetchRoute(loader));
  };

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(startPrefetch, { timeout: 5000 });
  } else {
    setTimeout(startPrefetch, 3000);
  }
}
