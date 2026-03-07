/**
 * Performance monitoring utilities.
 * Tracks Core Web Vitals and reports slow interactions.
 */
import { useEffect, useRef, useCallback } from "react";

interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
  fcp: number | null;
}

const metrics: PerformanceMetrics = {
  lcp: null,
  fid: null,
  cls: null,
  ttfb: null,
  fcp: null,
};

let initialized = false;

function initWebVitals() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  // LCP
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const last = entries[entries.length - 1] as any;
    metrics.lcp = last?.startTime || null;
  });
  try { lcpObserver.observe({ type: "largest-contentful-paint", buffered: true }); } catch {}

  // FID
  const fidObserver = new PerformanceObserver((list) => {
    const entry = list.getEntries()[0] as any;
    metrics.fid = entry?.processingStart - entry?.startTime || null;
  });
  try { fidObserver.observe({ type: "first-input", buffered: true }); } catch {}

  // CLS
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as any[]) {
      if (!entry.hadRecentInput) clsValue += entry.value;
    }
    metrics.cls = clsValue;
  });
  try { clsObserver.observe({ type: "layout-shift", buffered: true }); } catch {}

  // TTFB & FCP from navigation and paint timing
  const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (navEntry) metrics.ttfb = navEntry.responseStart - navEntry.requestStart;

  const paintEntries = performance.getEntriesByType("paint");
  const fcp = paintEntries.find(e => e.name === "first-contentful-paint");
  if (fcp) metrics.fcp = fcp.startTime;
}

/** Hook to monitor and log performance metrics */
export function usePerformanceMonitor(debug = false) {
  useEffect(() => {
    initWebVitals();

    if (debug) {
      const timer = setTimeout(() => {
        console.group("🔍 Performance Metrics");
        console.log("LCP:", metrics.lcp ? `${Math.round(metrics.lcp)}ms` : "pending");
        console.log("FID:", metrics.fid ? `${Math.round(metrics.fid)}ms` : "pending");
        console.log("CLS:", metrics.cls?.toFixed(4) || "pending");
        console.log("TTFB:", metrics.ttfb ? `${Math.round(metrics.ttfb)}ms` : "pending");
        console.log("FCP:", metrics.fcp ? `${Math.round(metrics.fcp)}ms` : "pending");
        console.groupEnd();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [debug]);

  return metrics;
}

/** Hook to track component render time */
export function useRenderTimer(componentName: string, enabled = false) {
  const startRef = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;
    const duration = performance.now() - startRef.current;
    if (duration > 100) {
      console.warn(`⚠️ Slow render: ${componentName} took ${Math.round(duration)}ms`);
    }
  }, [componentName, enabled]);
}

/** Intersection observer hook for viewport-based lazy loading */
export function useInViewport(rootMargin = "200px") {
  const ref = useRef<HTMLDivElement>(null);
  const inViewRef = useRef(false);
  const callbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !inViewRef.current) {
          inViewRef.current = true;
          callbackRef.current?.();
          observer.unobserve(el);
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  const onInView = useCallback((cb: () => void) => {
    callbackRef.current = cb;
    if (inViewRef.current) cb();
  }, []);

  return { ref, onInView, inView: inViewRef.current };
}
