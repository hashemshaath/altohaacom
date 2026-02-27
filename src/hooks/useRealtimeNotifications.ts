import { useEffect } from "react";
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

/**
 * Subscribes to realtime notification inserts for the current user
 * and shows a sonner toast for each new notification.
 */
export function useRealtimeNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
