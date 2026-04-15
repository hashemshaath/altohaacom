import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

const SOUND_KEY = "altoha_notification_sound";
const DND_KEY = "altoha_dnd_mode";

export function useNotificationPrefs() {
  const [soundEnabled, setSoundEnabledState] = useState(() => {
    try { return localStorage.getItem(SOUND_KEY) !== "false"; } catch { return true; }
  });
  const [dndMode, setDndModeState] = useState(() => {
    try { return localStorage.getItem(DND_KEY) === "true"; } catch { return false; }
  });

  const setSoundEnabled = (v: boolean) => {
    try { localStorage.setItem(SOUND_KEY, String(v)); } catch { /* restricted */ }
    setSoundEnabledState(v);
  };

  const setDndMode = (v: boolean) => {
    try { localStorage.setItem(DND_KEY, String(v)); } catch { /* restricted */ }
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
        .select("id, user_id, title, title_ar, body, body_ar, type, link, is_read, metadata, channel, read_at, status, priority, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw handleSupabaseError(error);

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error: unknown) {
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

      if (error) throw handleSupabaseError(error);

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: unknown) {
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

      if (error) throw handleSupabaseError(error);

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error: unknown) {
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
      if (error) throw handleSupabaseError(error);
      setNotifications(prev => {
        const deleted = prev.find(n => n.id === notificationId);
        const next = prev.filter(n => n.id !== notificationId);
        if (deleted && !deleted.is_read) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return next;
      });
    } catch (error: unknown) {
      console.error("Error deleting notification:", error);
    }
  }, [user?.id]);

  const clearAllRead = useCallback(async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .eq("is_read", true);
      if (error) throw handleSupabaseError(error);
      setNotifications(prev => prev.filter(n => !n.is_read));
    } catch (error: unknown) {
      console.error("Error clearing read notifications:", error);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription — only handles data sync (toast/sound is in useRealtimeNotifications)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notif-data-sync")
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
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications(prev => {
            const next = prev.map(n => (n.id === updated.id ? updated : n));
            setUnreadCount(next.filter(n => !n.is_read).length);
            return next;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deletedId = (payload.old as Record<string, unknown>)?.id as string | undefined;
          if (!deletedId) return;
          setNotifications(prev => {
            const next = prev.filter(n => n.id !== deletedId);
            setUnreadCount(next.filter(n => !n.is_read).length);
            return next;
          });
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
