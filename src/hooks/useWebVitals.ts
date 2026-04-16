import { useEffect, useRef } from "react";

/**
 * Lightweight Web Vitals reporter using PerformanceObserver.
 * Logs CLS, LCP, FID/INP to console in dev and can be extended
 * to send to an analytics endpoint.
 */

interface VitalsReport {
  lcp?: number;
  cls?: number;
  fid?: number;
  inp?: number;
  fcp?: number;
  ttfb?: number;
}

const reported = { current: false };

function observeMetric(type: string, cb: (value: number) => void): PerformanceObserver | null {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (!last) return;

      if (type === "largest-contentful-paint") {
        cb((last as any).startTime);
      } else if (type === "layout-shift") {
        // Accumulate CLS
        let cls = 0;
        for (const entry of entries) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
          }
        }
        cb(cls);
      } else if (type === "first-input") {
        cb((last as any).processingStart - (last as any).startTime);
      } else if (type === "event") {
        // INP approximation
        let maxDuration = 0;
        for (const entry of entries) {
          if ((entry as any).duration > maxDuration) {
            maxDuration = (entry as any).duration;
          }
        }
        cb(maxDuration);
      }
    });
    observer.observe({ type, buffered: true } as any);
    return observer;
  } catch {
    return null;
  }
}

export function useWebVitals() {
  const vitals = useRef<VitalsReport>({});

  useEffect(() => {
    if (reported.current) return;
    reported.current = true;

    const observers: (PerformanceObserver | null)[] = [];

    // TTFB & FCP from navigation/paint timing
    try {
      const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (navEntry) {
        vitals.current.ttfb = navEntry.responseStart - navEntry.requestStart;
      }
      const paintEntries = performance.getEntriesByType("paint");
      const fcpEntry = paintEntries.find((e) => e.name === "first-contentful-paint");
      if (fcpEntry) {
        vitals.current.fcp = fcpEntry.startTime;
      }
    } catch { /* ignore */ }

    observers.push(
      observeMetric("largest-contentful-paint", (v) => { vitals.current.lcp = v; }),
      observeMetric("layout-shift", (v) => { vitals.current.cls = v; }),
      observeMetric("first-input", (v) => { vitals.current.fid = v; }),
      observeMetric("event", (v) => { vitals.current.inp = v; })
    );

    // Log summary after page settles
    const timer = setTimeout(() => {
      const v = vitals.current;
      if (import.meta.env.DEV) {
        console.log(
          "%c⚡ Web Vitals",
          "color: #10b981; font-weight: bold",
          `TTFB: ${v.ttfb?.toFixed(0) ?? "?"}ms`,
          `FCP: ${v.fcp?.toFixed(0) ?? "?"}ms`,
          `LCP: ${v.lcp?.toFixed(0) ?? "?"}ms`,
          `CLS: ${v.cls?.toFixed(3) ?? "?"}`,
          `FID: ${v.fid?.toFixed(0) ?? "?"}ms`,
          `INP: ${v.inp?.toFixed(0) ?? "?"}ms`
        );
      }
    }, 10_000);

    return () => {
      clearTimeout(timer);
      observers.forEach((o) => o?.disconnect());
    };
  }, []);
}
