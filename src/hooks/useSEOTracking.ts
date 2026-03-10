import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "altoha_seo_session";

function getSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

/**
 * Tracks page views for SEO analytics.
 * Inserts into seo_page_views on each route change.
 * Updates duration when navigating away.
 */
export function useSEOTracking() {
  const location = useLocation();
  const startTime = useRef(Date.now());
  const lastPath = useRef<string | null>(null);
  const lastViewId = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;

    // Skip admin, auth, and API paths
    if (path.startsWith("/admin") || path.startsWith("/auth") || path.startsWith("/api")) {
      return;
    }

    // Update duration of previous page view
    if (lastViewId.current && lastPath.current !== path) {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      const isBounce = duration < 10;
      supabase
        .from("seo_page_views")
        .update({ duration_seconds: duration, is_bounce: isBounce })
        .eq("id", lastViewId.current)
        .then(() => {});
    }

    // Record new page view
    startTime.current = Date.now();
    lastPath.current = path;

    const record = {
      path,
      title: document.title,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      device_type: getDeviceType(),
      session_id: getSessionId(),
    };

    supabase
      .from("seo_page_views")
      .insert(record)
      .select("id")
      .single()
      .then(({ data }) => {
        if (data?.id) lastViewId.current = data.id;
      });

    // Update duration on page unload
    const handleUnload = () => {
      if (lastViewId.current) {
        const duration = Math.round((Date.now() - startTime.current) / 1000);
        // Use sendBeacon for reliability during unload
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/seo_page_views?id=eq.${lastViewId.current}`;
        navigator.sendBeacon?.(url); // best-effort
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [location.pathname]);
}
