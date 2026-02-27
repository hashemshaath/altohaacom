import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const NOTIFICATION_ICONS: Record<string, string> = {
  follow: "👤",
  follow_request: "🤝",
  reaction: "🔥",
  comment: "💬",
  mention: "📢",
  story_view: "👁️",
  live_session: "🎙️",
  success: "✅",
  warning: "⚠️",
  schedule: "📅",
  exhibition_update: "🏛️",
  exhibition_review: "⭐",
  exhibition_reminder: "⏰",
  booth_assignment: "📍",
  supplier_review: "⭐",
  supplier_inquiry: "📩",
  supplier_milestone: "🎉",
  bio_milestone: "🎉",
  bio_subscriber: "📬",
  link_milestone: "🔗",
};

/** Play a short notification sound using Web Audio API */
function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1174, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Silently fail — user hasn't interacted yet or AudioContext unavailable
  }
}

/** Trigger haptic feedback on supported devices */
function triggerHaptic() {
  try {
    if ("vibrate" in navigator) navigator.vibrate(50);
  } catch {
    // Not supported
  }
}

/**
 * Subscribes to realtime notification inserts for the current user
 * and shows a sonner toast with sound + haptic for each new notification.
 */
export function useRealtimeNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const lastNotifTime = useRef(0);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as any;
          const icon = NOTIFICATION_ICONS[notification.type] || "🔔";
          const title = notification.title || notification.title_ar || "New notification";

          // Debounce rapid-fire notifications (300ms)
          const now = Date.now();
          if (now - lastNotifTime.current > 300) {
            playNotificationSound();
            triggerHaptic();
            lastNotifTime.current = now;
          }

          toast(title, {
            description: notification.body || notification.body_ar,
            icon,
            action: notification.link
              ? {
                  label: "View",
                  onClick: () => {
                    window.location.href = notification.link;
                  },
                }
              : undefined,
            duration: 5000,
          });

          // Invalidate notification queries to update bell count
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["daily-digest"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
