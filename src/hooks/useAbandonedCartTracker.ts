import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { CartItem } from "./useCart";

const SAVE_DEBOUNCE_MS = 5000;

/**
 * Persists cart state to abandoned_carts table.
 * Fires on cart changes (debounced) and on page unload.
 * Marks cart as recovered when checkout completes.
 */
export function useAbandonedCartTracker(
  items: CartItem[],
  totalAmount: number,
  isCheckoutComplete: boolean
) {
  const { user } = useAuth();
  const savedCartRef = useRef<string>("");
  const abandonedCartIdRef = useRef<string | null>(
    sessionStorage.getItem("abandoned_cart_id")
  );
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const sessionId = sessionStorage.getItem("ad_session_id") || null;

  // Upsert cart to DB
  const saveCart = async (cartItems: CartItem[], total: number) => {
    if (cartItems.length === 0) {
      // Cart emptied — delete abandoned record
      if (abandonedCartIdRef.current) {
        await supabase
          .from("abandoned_carts")
          .delete()
          .eq("id", abandonedCartIdRef.current);
        sessionStorage.removeItem("abandoned_cart_id");
        abandonedCartIdRef.current = null;
      }
      savedCartRef.current = "[]";
      return;
    }

    const serialized = JSON.stringify(cartItems);
    if (serialized === savedCartRef.current) return;
    savedCartRef.current = serialized;

    const payload = {
      user_id: user?.id || null,
      session_id: sessionId,
      items: cartItems.map((i) => ({
        product_id: i.product_id,
        title: i.title,
        title_ar: i.title_ar,
        price: i.price,
        quantity: i.quantity,
        image_url: i.image_url,
      })) as unknown as import("@/integrations/supabase/types").Json,
      total_amount: total,
      currency: cartItems[0]?.currency || "SAR",
      cart_source: "web",
      recovery_status: "active",
    };

    if (abandonedCartIdRef.current) {
      await supabase
        .from("abandoned_carts")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", abandonedCartIdRef.current);
    } else {
      const { data } = await supabase
        .from("abandoned_carts")
        .insert(payload)
        .select("id")
        .single();
      if (data?.id) {
        abandonedCartIdRef.current = data.id;
        try { sessionStorage.setItem("abandoned_cart_id", data.id); } catch {}
      }
    }
  };

  // Debounced save on cart changes
  useEffect(() => {
    if (isCheckoutComplete) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveCart(items, totalAmount), SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, totalAmount, user?.id, isCheckoutComplete]);

  // Save on page unload (beacon fallback)
  useEffect(() => {
    const handleUnload = () => {
      if (items.length === 0 || isCheckoutComplete) return;
      const serialized = JSON.stringify(items);
      if (serialized === savedCartRef.current) return;
      // Use sendBeacon for reliability
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/abandoned_carts`;
      const body = JSON.stringify({
        user_id: user?.id || null,
        session_id: sessionId,
        items: items.map((i) => ({
          product_id: i.product_id,
          title: i.title,
          price: i.price,
          quantity: i.quantity,
        })),
        total_amount: totalAmount,
        currency: items[0]?.currency || "SAR",
        cart_source: "web",
        recovery_status: "active",
      });
      // sendBeacon doesn't support custom headers — the RLS policy
      // should allow anonymous inserts for abandoned_carts
      try {
        navigator.sendBeacon(
          url,
          new Blob([body], { type: "application/json" })
        );
      } catch {
        // silent
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") handleUnload();
    };
    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, totalAmount, user?.id, isCheckoutComplete]);

  // Mark as recovered on checkout
  useEffect(() => {
    if (isCheckoutComplete && abandonedCartIdRef.current) {
      supabase
        .from("abandoned_carts")
        .update({
          recovery_status: "recovered",
          recovered_at: new Date().toISOString(),
        })
        .eq("id", abandonedCartIdRef.current)
        .then(() => {
          sessionStorage.removeItem("abandoned_cart_id");
          abandonedCartIdRef.current = null;
        });
    }
  }, [isCheckoutComplete]);
}
