import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getDeviceType } from "@/lib/deviceType";
import { getSessionId, getBrowser } from "@/lib/analyticsUtils";


function getPageCategory(url: string) {
  if (url.includes("/competitions")) return "competitions";
  if (url.includes("/exhibitions")) return "exhibitions";
  if (url.includes("/community")) return "community";
  if (url.includes("/news") || url.includes("/articles")) return "articles";
  if (url.includes("/shop")) return "shop";
  if (url.includes("/recipes")) return "recipes";
  if (url.includes("/masterclass")) return "masterclasses";
  if (url.includes("/knowledge")) return "knowledge";
  if (url.includes("/mentorship")) return "mentorship";
  if (url.includes("/chefs-table")) return "chefs-table";
  if (url === "/" || url === "") return "home";
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

  // Log page view on mount
  useEffect(() => {
    if (pageViewLogged.current) return;
    pageViewLogged.current = true;
    startTime.current = Date.now();

    const url = window.location.pathname;
    const sid = getSessionId();
    const deviceType = getDeviceType();
    const browser = getBrowser();
    const category = getPageCategory(url);

    supabase.from("ad_user_behaviors").insert({
      user_id: user?.id || null,
      session_id: sid,
      event_type: "page_view",
      page_url: url,
      page_category: category,
      device_type: deviceType,
      browser,
      metadata: {},
    }).then(null, () => { /* fire-and-forget */ });

    // Track duration on unmount
    return () => {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      if (duration > 2) {
        supabase.from("ad_user_behaviors").insert({
          user_id: user?.id || null,
          session_id: sid,
          event_type: "engagement",
          page_url: url,
          page_category: category,
          duration_seconds: duration,
          device_type: deviceType,
          browser,
        }).then(null, () => { /* fire-and-forget */ });
      }
    };
  }, [user?.id]);

  // Custom event tracking
  const trackEvent = useCallback(
    (eventType: string, entityType?: string, entityId?: string, metadata?: Record<string, string>) => {
      supabase.from("ad_user_behaviors").insert({
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
      }).then(null, () => { /* fire-and-forget */ });
    },
    [user?.id]
  );

  // Update user interest profile
  const updateInterest = useCallback(
    async (category: string) => {
      if (!user?.id) return;
      try {
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
      } catch {
        // Non-critical — silently fail
      }
    },
    [user?.id]
  );

  return { trackEvent, updateInterest, sessionId: getSessionId() };
}
