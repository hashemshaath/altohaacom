import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

// VAPID public key - generated for this project
const VAPID_PUBLIC_KEY = "BNpKhfYGzVfr_FEBXxGefORo8gJNGMZdaQ0FGKC0SJYE-YyT_mu1HGqWAXvWrFPOdGWGKGEP9fVnJpMGx_GQWM";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await (reg as any).pushManager.getSubscription();
      setIsSubscribed(!!sub);
      return !!sub;
    } catch {
      return false;
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!user) return false;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast({ title: "Push notifications not supported", variant: "destructive" });
      return false;
    }

    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast({ title: "Notification permission denied", variant: "destructive" });
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await (reg as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJSON = sub.toJSON();

      await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: subJSON.endpoint!,
        p256dh: subJSON.keys!.p256dh,
        auth: subJSON.keys!.auth,
        user_agent: navigator.userAgent,
      }, { onConflict: "endpoint" });

      setIsSubscribed(true);
      toast({ title: "Push notifications enabled! 🔔" });
      return true;
    } catch (err: any) {
      toast({ title: "Failed to subscribe", description: err.message, variant: "destructive" });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await (reg as any).pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
      setIsSubscribed(false);
      toast({ title: "Push notifications disabled" });
    } catch {
      toast({ title: "Failed to unsubscribe", variant: "destructive" });
    }
  }, []);

  const isSupported = "serviceWorker" in navigator && "PushManager" in window;

  return { isSubscribed, isSupported, isLoading, subscribe, unsubscribe, checkSubscription };
}
