import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

const SOUND_KEY = "altoha_notification_sound";
const DND_KEY = "altoha_dnd_mode";

export function useNotificationPrefs() {
  const [soundEnabled, setSoundEnabledState] = useState(() => {
    return localStorage.getItem(SOUND_KEY) !== "false";
  });
  const [dndMode, setDndModeState] = useState(() => {
    return localStorage.getItem(DND_KEY) === "true";
  });

  const setSoundEnabled = (v: boolean) => {
    localStorage.setItem(SOUND_KEY, String(v));
    setSoundEnabledState(v);
  };

  const setDndMode = (v: boolean) => {
    localStorage.setItem(DND_KEY, String(v));
    setDndModeState(v);
  };

  return { soundEnabled, setSoundEnabled, dndMode, setDndMode };
}

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("user_id", user.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, [user?.id]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [user?.id]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", user.id);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const wasUnread = notifications.find(n => n.id === notificationId && !n.is_read);
        return wasUnread ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, [user?.id, notifications]);

  const clearAllRead = useCallback(async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .eq("is_read", true);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => !n.is_read));
    } catch (error) {
      console.error("Error clearing read notifications:", error);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Play notification sound if enabled
          const soundOn = localStorage.getItem(SOUND_KEY) !== "false";
          const dnd = localStorage.getItem(DND_KEY) === "true";
          
          if (soundOn && !dnd) {
            try {
              const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczGiCGr9H/cj0YKXOS0O2IVzMjVo6+5qVoTCtZhLjf0mpJLFeNwuenn11FIVaLvd/fczYbREhKZqG6yLFiQjJakrjU3qxlTjhJXI++1cJ4UjRAQE2GsNHhm2RAJ0CDqbzd4qtjSTpaj77JwnhQK0BCSoCqzuOhdEYzW5K84eKzb007VZC+1cF2TipCRUyAqM7nimVBOF6UvNjdt2xLO1eSwdjDd08xR0JIf6TJ4YhgPTdjl7vR26llOEhprsHKt2ZKL0RFRnieyN6FXUA7a5u6zNSgXjJNdbW9wq5gRCpESUB2m8Xdg1pBO3Kfu8fKl1YrRXy5t7ioV0AiQU0+dJjC2oFXQz58o7vCxI1NK0OBuLGtnlM6H0FQQXKWP9Z/VEQ+gae7vsC9hUcmQYi2rKiUTTQaQlNAdZc/1X1TRj+Ep7q6urdFxUZCoLWopI5ENhZDV0F4mUDTfFVHQoiovLO2s0M/P0GotKejikE0EURbQ3uaQdF7V0lFjqu8r7KvP0s4PK20paCHPzETR19Ff5xC0HxZSkeMrb2rr6k7UTQ5sLSkn4U+MBRIZ0eBnUTPfFtMSo+vvaiqpDlVMTm0taOfhD0vFUlsSISeRc99XU5Mka+9pKehN1kxOba2oZ2CPi4YS3FJhqBH0H5fUE2UsL2iqJw1XjE7uLahn4E+LhpNc0uIoknQf2FSUJW0vaOqmTNiMj26t6GcgD8uHE91TIqlStF+Y1RSlra8oauXMmYzP7y4oZt/QS8eTndOi6dL0YBkVlOYt7yhq5UxajNA");
              audio.volume = 0.3;
              audio.play().catch(() => {});
            } catch (_) {}
          }
          
          // Show toast alert if not DND
          if (!dnd && toastRef.current) {
            toastRef.current({
              title: newNotification.title,
              description: newNotification.body,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRead,
    refetch: fetchNotifications,
  };
}
