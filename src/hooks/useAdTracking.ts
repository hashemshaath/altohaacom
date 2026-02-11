import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

let sessionId: string | null = null;

function getSessionId() {
  if (!sessionId) {
    sessionId = sessionStorage.getItem("ad_session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("ad_session_id", sessionId);
    }
  }
  return sessionId;
}

function getDeviceType() {
  const w = window.innerWidth;
  return w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
}

function getBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "chrome";
  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "safari";
  if (ua.includes("Edg")) return "edge";
  return "other";
}

/**
 * Hook to track user behavior for ad targeting & retargeting.
 * Automatically logs page views. Call trackEvent for custom events.
 */
export function useAdTracking() {
  const { user } = useAuth();
  const pageViewLogged = useRef(false);
  const startTime = useRef(Date.now());

  // Categorize page from URL
  const getPageCategory = useCallback((url: string) => {
    if (url.includes("/competitions")) return "competitions";
    if (url.includes("/exhibitions")) return "exhibitions";
    if (url.includes("/community")) return "community";
    if (url.includes("/news") || url.includes("/articles")) return "articles";
    if (url.includes("/shop")) return "shop";
    if (url.includes("/recipes")) return "recipes";
    if (url.includes("/masterclass")) return "masterclasses";
    if (url.includes("/knowledge")) return "knowledge";
    if (url.includes("/mentorship")) return "mentorship";
    if (url.includes("/tastings")) return "tastings";
    if (url === "/" || url === "") return "home";
    return "other";
  }, []);

  // Log page view on mount
  useEffect(() => {
    if (pageViewLogged.current) return;
    pageViewLogged.current = true;
    startTime.current = Date.now();

    const url = window.location.pathname;
    supabase.from("ad_user_behaviors").insert([{
      user_id: user?.id || null,
      session_id: getSessionId(),
      event_type: "page_view",
      page_url: url,
      page_category: getPageCategory(url),
      device_type: getDeviceType(),
      browser: getBrowser(),
      metadata: {},
    }]);

    // Track duration on unmount
    return () => {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      if (duration > 2) {
        supabase.from("ad_user_behaviors").insert([{
          user_id: user?.id || null,
          session_id: getSessionId(),
          event_type: "engagement",
          page_url: url,
          page_category: getPageCategory(url),
          duration_seconds: duration,
          device_type: getDeviceType(),
          browser: getBrowser(),
        }]);
      }
    };
  }, [user?.id, getPageCategory]);

  // Custom event tracking
  const trackEvent = useCallback(
    (eventType: string, entityType?: string, entityId?: string, metadata?: Record<string, string>) => {
      supabase.from("ad_user_behaviors").insert([{
        user_id: user?.id || null,
        session_id: getSessionId(),
        event_type: eventType,
        page_url: window.location.pathname,
        page_category: getPageCategory(window.location.pathname),
        entity_type: entityType || null,
        entity_id: entityId || null,
        device_type: getDeviceType(),
        browser: getBrowser(),
        metadata: metadata || {},
      }]);
    },
    [user?.id, getPageCategory]
  );

  // Update user interest profile
  const updateInterest = useCallback(
    async (category: string) => {
      if (!user?.id) return;
      const { data: existing } = await supabase
        .from("ad_user_interests")
        .select("id, score, interaction_count")
        .eq("user_id", user.id)
        .eq("interest_category", category)
        .maybeSingle();

      if (existing) {
        await supabase.from("ad_user_interests").update({
          score: (existing.score as number) + 1,
          interaction_count: (existing.interaction_count || 0) + 1,
          last_interaction_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await supabase.from("ad_user_interests").insert({
          user_id: user.id,
          interest_category: category,
          score: 1,
          interaction_count: 1,
          last_interaction_at: new Date().toISOString(),
        });
      }
    },
    [user?.id]
  );

  return { trackEvent, updateInterest, sessionId: getSessionId() };
}
