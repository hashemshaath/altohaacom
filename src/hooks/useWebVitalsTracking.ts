import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Tracks Core Web Vitals (LCP, INP, CLS, FCP, TTFB) per route
 * using native PerformanceObserver API. Sends data via beacon on page hide.
 */

interface VitalsData {
  lcp: number | null;
  inp: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
}

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getConnectionType(): string | null {
  const nav = navigator as any;
  return nav?.connection?.effectiveType || null;
}

function getSessionId(): string {
  let id = sessionStorage.getItem("altoha_vitals_session");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("altoha_vitals_session", id);
  }
  return id;
}

export function useWebVitalsTracking() {
  const location = useLocation();
  const vitalsRef = useRef<VitalsData>({ lcp: null, inp: null, cls: null, fcp: null, ttfb: null });
  const sentRef = useRef(false);
  const observersRef = useRef<PerformanceObserver[]>([]);

  useEffect(() => {
    // Reset for new route
    vitalsRef.current = { lcp: null, inp: null, cls: null, fcp: null, ttfb: null };
    sentRef.current = false;

    // Clean up previous observers
    observersRef.current.forEach(o => { try { o.disconnect(); } catch {} });
    observersRef.current = [];

    const path = location.pathname;

    // Track only public routes for SEO analytics
    if (path.startsWith("/admin") || path.startsWith("/auth") || path.startsWith("/api")) {
      return;
    }

    try {
      // LCP
      const lcpObs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1] as any;
        if (last) vitalsRef.current.lcp = Math.round(last.startTime);
      });
      lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
      observersRef.current.push(lcpObs);
    } catch {}

    try {
      // CLS
      let clsValue = 0;
      const clsObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        vitalsRef.current.cls = Math.round(clsValue * 1000) / 1000;
      });
      clsObs.observe({ type: "layout-shift", buffered: true });
      observersRef.current.push(clsObs);
    } catch {}

    try {
      // FCP
      const fcpObs = new PerformanceObserver((list) => {
        const entry = list.getEntries().find(e => e.name === "first-contentful-paint");
        if (entry) vitalsRef.current.fcp = Math.round(entry.startTime);
      });
      fcpObs.observe({ type: "paint", buffered: true });
      observersRef.current.push(fcpObs);
    } catch {}

    try {
      // INP (Interaction to Next Paint)
      let maxINP = 0;
      const inpObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          const duration = entry.duration || 0;
          if (duration > maxINP) {
            maxINP = duration;
            vitalsRef.current.inp = Math.round(duration);
          }
        }
      });
      inpObs.observe({ type: "event", buffered: true });
      observersRef.current.push(inpObs);
    } catch {}

    // TTFB from navigation timing
    try {
      const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      if (navEntries[0]) {
        vitalsRef.current.ttfb = Math.round(navEntries[0].responseStart - navEntries[0].requestStart);
      }
    } catch {}

    // Send on page hide (covers tab close, navigation, minimize)
    const sendVitals = () => {
      if (sentRef.current) return;
      const v = vitalsRef.current;
      // Only send if we have at least one metric
      if (v.lcp == null && v.cls == null && v.fcp == null && v.ttfb == null) return;
      sentRef.current = true;

      const payload = {
        path,
        lcp: v.lcp,
        inp: v.inp,
        cls: v.cls,
        fcp: v.fcp,
        ttfb: v.ttfb,
        device_type: getDeviceType(),
        connection_type: getConnectionType(),
        session_id: getSessionId(),
        user_agent: navigator.userAgent.slice(0, 200),
      };

      // Use sendBeacon for reliability on page unload
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/seo_web_vitals`;
      const headers = {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        Prefer: "return=minimal",
      };

      try {
        // Use fetch with keepalive for reliable delivery with auth headers
        fetch(url, { method: "POST", headers, body: JSON.stringify(payload), keepalive: true }).catch(() => {});
      } catch {
        // Silent fail — vitals are non-critical
      }
    };

    const onVisChange = () => {
      if (document.visibilityState === "hidden") sendVitals();
    };
    document.addEventListener("visibilitychange", onVisChange);

    // Also send after 30s as a safety net (user stays on page)
    const safetyTimer = setTimeout(sendVitals, 30000);

    return () => {
      clearTimeout(safetyTimer);
      document.removeEventListener("visibilitychange", onVisChange);
      observersRef.current.forEach(o => { try { o.disconnect(); } catch {} });
      observersRef.current = [];
    };
  }, [location.pathname]);
}
