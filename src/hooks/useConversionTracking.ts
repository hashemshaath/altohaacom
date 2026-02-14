import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sendGoogleConversion, pushToDataLayer } from "./useGoogleTracking";

/**
 * Unified conversion tracking hook.
 * Logs events to both the internal conversion_events table
 * AND forwards to Google Analytics/GTM.
 */
export function useConversionTracking() {
  const { user } = useAuth();

  const trackConversion = useCallback(
    async (
      eventName: string,
      options?: {
        category?: string;
        value?: number;
        currency?: string;
        source?: string;
        medium?: string;
        campaign?: string;
        metadata?: Record<string, unknown>;
      }
    ) => {
      const sessionId = sessionStorage.getItem("ad_session_id") || undefined;

      // 1. Log to internal DB
      await supabase.from("conversion_events").insert([{
        user_id: user?.id || null,
        session_id: sessionId,
        event_name: eventName,
        event_category: options?.category,
        event_value: options?.value,
        currency: options?.currency || "SAR",
        source: options?.source,
        medium: options?.medium,
        campaign: options?.campaign,
        metadata: (options?.metadata || {}) as any,
      }]);

      // 2. Forward to Google Analytics
      sendGoogleConversion(eventName, {
        value: options?.value,
        currency: options?.currency || "SAR",
        event_category: options?.category,
        ...options?.metadata,
      });

      // 3. Push to GTM dataLayer
      pushToDataLayer(eventName, {
        value: options?.value,
        currency: options?.currency || "SAR",
        category: options?.category,
        userId: user?.id,
      });
    },
    [user?.id]
  );

  // Pre-built conversion helpers
  const trackSignup = useCallback(
    () => trackConversion("sign_up", { category: "engagement" }),
    [trackConversion]
  );

  const trackPurchase = useCallback(
    (value: number, orderId?: string) =>
      trackConversion("purchase", { category: "ecommerce", value, metadata: { order_id: orderId } }),
    [trackConversion]
  );

  const trackAddToCart = useCallback(
    (productId: string, value?: number) =>
      trackConversion("add_to_cart", { category: "ecommerce", value, metadata: { product_id: productId } }),
    [trackConversion]
  );

  const trackRegistration = useCallback(
    (competitionId: string) =>
      trackConversion("competition_registration", { category: "engagement", metadata: { competition_id: competitionId } }),
    [trackConversion]
  );

  const trackPageView = useCallback(
    (pageName: string) =>
      trackConversion("page_view", { category: "navigation", metadata: { page: pageName } }),
    [trackConversion]
  );

  return {
    trackConversion,
    trackSignup,
    trackPurchase,
    trackAddToCart,
    trackRegistration,
    trackPageView,
  };
}
