import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { pushToDataLayer, sendGoogleConversion } from "./useGoogleTracking";
import { getDeviceType } from "@/lib/deviceType";
import { getSessionId, getBrowser } from "@/lib/analyticsUtils";
import type { Json } from "@/integrations/supabase/types";


interface TrackItemPayload {
  product_id: string;
  title: string;
  price: number;
  currency?: string;
  quantity?: number;
  category?: string;
}

/**
 * Comprehensive e-commerce event tracking.
 * Logs to ad_user_behaviors + pushes to GTM dataLayer + Google conversions.
 */
export function useEcommerceTracking() {
  const { user } = useAuth();

  const logEvent = useCallback(
    (
      eventType: string,
      entityType: string,
      entityId?: string,
      metadata?: Record<string, unknown>
    ) => {
      supabase
        .from("ad_user_behaviors")
        .insert({
          user_id: user?.id || null,
          session_id: getSessionId(),
          event_type: eventType,
          entity_type: entityType,
          entity_id: entityId || null,
          page_url: window.location.pathname,
          page_category: "shop",
          device_type: getDeviceType(),
          browser: getBrowser(),
          metadata: (metadata || {}) as Json,
        })
        .then(null, () => {});
    },
    [user?.id]
  );

  // ── Cart Events ──────────────────────────────────────────────
  const trackAddToCart = useCallback(
    (item: TrackItemPayload) => {
      logEvent("add_to_cart", "product", item.product_id, {
        title: item.title,
        price: item.price,
        currency: item.currency || "SAR",
        quantity: item.quantity || 1,
      });
      pushToDataLayer("add_to_cart", {
        currency: item.currency || "SAR",
        value: item.price * (item.quantity || 1),
        items: [{ item_id: item.product_id, item_name: item.title, price: item.price, quantity: item.quantity || 1 }],
      });
      sendGoogleConversion("add_to_cart", { value: item.price, currency: item.currency || "SAR" });
    },
    [logEvent]
  );

  const trackRemoveFromCart = useCallback(
    (item: TrackItemPayload) => {
      logEvent("remove_from_cart", "product", item.product_id, {
        title: item.title,
        price: item.price,
        quantity: item.quantity || 1,
      });
      pushToDataLayer("remove_from_cart", {
        items: [{ item_id: item.product_id, item_name: item.title, price: item.price }],
      });
    },
    [logEvent]
  );

  // ── Checkout Flow Events ─────────────────────────────────────
  const trackCheckoutStep = useCallback(
    (step: string, stepIndex: number, cartTotal?: number, itemCount?: number) => {
      logEvent("checkout_step", "checkout", undefined, {
        step,
        step_index: stepIndex,
        cart_total: cartTotal,
        items_count: itemCount,
      });
      pushToDataLayer("checkout_progress", {
        checkout_step: step,
        checkout_step_index: stepIndex,
        value: cartTotal,
      });
    },
    [logEvent]
  );

  const trackCheckoutBegin = useCallback(
    (cartTotal: number, itemCount: number, currency = "SAR") => {
      logEvent("begin_checkout", "checkout", undefined, {
        value: cartTotal,
        items_count: itemCount,
        currency,
      });
      pushToDataLayer("begin_checkout", { currency, value: cartTotal, items_count: itemCount });
      sendGoogleConversion("begin_checkout", { value: cartTotal, currency });
    },
    [logEvent]
  );

  const trackPurchase = useCallback(
    (orderId: string, orderNumber: string, total: number, itemCount: number, currency = "SAR", paymentMethod?: string) => {
      logEvent("purchase", "order", orderId, {
        order_number: orderNumber,
        value: total,
        items_count: itemCount,
        currency,
        payment_method: paymentMethod,
      });
      pushToDataLayer("purchase", {
        transaction_id: orderNumber,
        value: total,
        currency,
        items_count: itemCount,
      });
      sendGoogleConversion("purchase", {
        transaction_id: orderNumber,
        value: total,
        currency,
      });
    },
    [logEvent]
  );

  // ── Product Events ───────────────────────────────────────────
  const trackProductView = useCallback(
    (item: TrackItemPayload) => {
      logEvent("view_item", "product", item.product_id, {
        title: item.title,
        price: item.price,
        category: item.category,
      });
      pushToDataLayer("view_item", {
        items: [{ item_id: item.product_id, item_name: item.title, price: item.price, item_category: item.category }],
      });
    },
    [logEvent]
  );

  const trackProductListView = useCallback(
    (listName: string, products: TrackItemPayload[]) => {
      logEvent("view_item_list", "product_list", undefined, {
        list_name: listName,
        items_count: products.length,
      });
      pushToDataLayer("view_item_list", {
        item_list_name: listName,
        items: products.slice(0, 10).map((p) => ({
          item_id: p.product_id,
          item_name: p.title,
          price: p.price,
        })),
      });
    },
    [logEvent]
  );

  // ── Booking / Registration / Membership ──────────────────────
  const trackBooking = useCallback(
    (bookingId: string, bookingType: string, metadata?: Record<string, unknown>) => {
      logEvent("booking_created", "booking", bookingId, { booking_type: bookingType, ...metadata });
      pushToDataLayer("booking", { booking_id: bookingId, booking_type: bookingType });
    },
    [logEvent]
  );

  const trackCompetitionRegistration = useCallback(
    (competitionId: string, competitionTitle: string, metadata?: Record<string, unknown>) => {
      logEvent("competition_registration", "competition", competitionId, {
        title: competitionTitle,
        ...metadata,
      });
      pushToDataLayer("competition_registration", {
        competition_id: competitionId,
        competition_title: competitionTitle,
      });
      sendGoogleConversion("sign_up", { method: "competition", value: 0 });
    },
    [logEvent]
  );

  const trackMembershipAction = useCallback(
    (action: "subscribe" | "upgrade" | "downgrade" | "renew" | "cancel", tier: string, value?: number) => {
      logEvent(`membership_${action}`, "membership", undefined, {
        tier,
        value,
        currency: "SAR",
      });
      pushToDataLayer(`membership_${action}`, { tier, value });
      if (action === "subscribe" || action === "upgrade") {
        sendGoogleConversion("purchase", { value: value || 0, currency: "SAR", transaction_id: `membership_${Date.now()}` });
      }
    },
    [logEvent]
  );

  // ── Wishlist / Share ─────────────────────────────────────────
  const trackWishlistAdd = useCallback(
    (item: TrackItemPayload) => {
      logEvent("add_to_wishlist", "product", item.product_id, { title: item.title, price: item.price });
      pushToDataLayer("add_to_wishlist", {
        items: [{ item_id: item.product_id, item_name: item.title, price: item.price }],
      });
    },
    [logEvent]
  );

  const trackShare = useCallback(
    (contentType: string, contentId: string, method: string) => {
      logEvent("share", contentType, contentId, { method });
      pushToDataLayer("share", { content_type: contentType, item_id: contentId, method });
    },
    [logEvent]
  );

  return {
    trackAddToCart,
    trackRemoveFromCart,
    trackCheckoutStep,
    trackCheckoutBegin,
    trackPurchase,
    trackProductView,
    trackProductListView,
    trackBooking,
    trackCompetitionRegistration,
    trackMembershipAction,
    trackWishlistAdd,
    trackShare,
  };
}
