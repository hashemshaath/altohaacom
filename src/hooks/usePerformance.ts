import { useEffect, useRef, useState, useCallback, useMemo } from "react";

/**
 * Hook to detect if the user prefers reduced motion.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

/**
 * Hook to detect when an element enters the viewport (IntersectionObserver).
 * Automatically disconnects after first trigger unless `once` is false.
 */
export function useInView(options?: IntersectionObserverInit & { once?: boolean }) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  const once = options?.once !== false;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px", ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return { ref, inView };
}

/**
 * Performance observer for tracking Core Web Vitals.
 * Reports LCP, FID, and CLS to a callback (e.g., analytics).
 */
export function useWebVitals(onReport?: (metric: { name: string; value: number }) => void) {
  useEffect(() => {
    if (!onReport || typeof PerformanceObserver === "undefined") return;

    // LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) onReport({ name: "LCP", value: lastEntry.startTime });
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {}

    // CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) clsValue += entry.value;
        }
        onReport({ name: "CLS", value: clsValue });
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch {}
  }, [onReport]);
}

/**
 * Debounced callback hook for performance-sensitive inputs.
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback(
    ((...args: any[]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    }) as T,
    [callback, delay]
  );
}

/**
 * Debounced value hook - returns value after delay of inactivity.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * Throttled callback - executes at most once per interval.
 */
export function useThrottledCallback<T extends (...args: any[]) => void>(
  callback: T,
  interval: number
): T {
  const lastRun = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback(
    ((...args: any[]) => {
      const now = Date.now();
      const elapsed = now - lastRun.current;

      if (elapsed >= interval) {
        lastRun.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          lastRun.current = Date.now();
          callback(...args);
        }, interval - elapsed);
      }
    }) as T,
    [callback, interval]
  );
}

/**
 * Track and report FID (First Input Delay).
 */
export function useFID(onReport?: (value: number) => void) {
  useEffect(() => {
    if (!onReport || typeof PerformanceObserver === "undefined") return;
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        for (const entry of entries) {
          onReport(entry.processingStart - entry.startTime);
        }
      });
      observer.observe({ type: "first-input", buffered: true });
      return () => observer.disconnect();
    } catch {}
  }, [onReport]);
}

/**
 * Measure time-to-interactive for a component.
 */
export function useComponentLoadTime(componentName: string) {
  const mountTime = useRef(performance.now());

  useEffect(() => {
    const loadTime = performance.now() - mountTime.current;
    if (loadTime > 500) {
      console.warn(`[Perf] ${componentName} took ${loadTime.toFixed(0)}ms to mount`);
    }
  }, [componentName]);
}
