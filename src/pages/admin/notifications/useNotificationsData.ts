import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCSVExport } from "@/hooks/useCSVExport";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { format } from "date-fns";
import { QUERY_LIMIT_LARGE } from "@/lib/constants";

interface Segment {
  id: string;
  name: string;
  name_ar: string | null;
  estimated_reach: number | null;
  is_active: boolean | null;
}

const EMPTY_FORM = {
  title: "", title_ar: "", body: "", body_ar: "",
  type: "info", channels: ["in_app"] as string[],
  targetMode: "all" as "all" | "segment" | "role" | "manual",
  targetSegmentId: "", targetRole: "", targetUsers: "",
  link: "",
  sendMode: "now" as "now" | "scheduled",
  scheduledAt: "",
};

export function useNotificationsData() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [confirmBulkAction, setConfirmBulkAction] = useState<{ action: string; ids: string[] } | null>(null);

  // Filter states
  const [recentSearch, setRecentSearch] = useState("");
  const [recentTypeFilter, setRecentTypeFilter] = useState("all");
  const [recentChannelFilter, setRecentChannelFilter] = useState("all");
  const [recentStatusFilter, setRecentStatusFilter] = useState("all");
  const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null);

  // Queue selection
  const [selectedQueueIds, setSelectedQueueIds] = useState<Set<string>>(new Set());
  const [queueStatusFilter, setQueueStatusFilter] = useState("all");
  const [queueChannelFilter, setQueueChannelFilter] = useState("all");

  // Broadcast form
  const [newNotification, setNewNotification] = useState(EMPTY_FORM);

  const [channelSettings, setChannelSettings] = useState({
    in_app: true, email: true, sms: false, whatsapp: false, push: false,
  });

  // ─── Queries ─────────────────────────────────────────────
  const { data: recentNotifications = [], isLoading: loadingRecent } = useQuery({
    queryKey: ["recent-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications").select("id, user_id, title, title_ar, body, body_ar, type, link, is_read, channel, status, created_at, metadata")
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: queueStats } = useQuery({
    queryKey: ["notification-queue-stats"],
    queryFn: async () => {
      const [pending, sent, failed] = await Promise.all([
        supabase.from("notification_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("notification_queue").select("id", { count: "exact", head: true }).eq("status", "sent"),
        supabase.from("notification_queue").select("id", { count: "exact", head: true }).eq("status", "failed"),
      ]);
      return {
        pending: pending.count || 0, sent: sent.count || 0, failed: failed.count || 0,
        total: (pending.count || 0) + (sent.count || 0) + (failed.count || 0),
      };
    },
  });

  const { data: queueItems = [], isLoading: loadingQueue } = useQuery({
    queryKey: ["notification-queue-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_queue").select("id, user_id, channel, status, attempts, scheduled_for, error_message, created_at")
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_templates").select("id, name, title, title_ar, body, body_ar, channels, variables, created_at")
        .order("created_at", { ascending: false }).limit(QUERY_LIMIT_LARGE);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: segments = [] } = useQuery({
    queryKey: ["audience-segments-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audience_segments").select("id, name, name_ar, estimated_reach, is_active")
        .eq("is_active", true).order("name");
      if (error) throw error;
      return (data || []) as Segment[];
    },
  });

  const { data: commTemplates = [] } = useQuery({
    queryKey: ["comm-templates-for-quicksend"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communication_templates").select("id, name, name_ar, slug, channel, variables")
        .eq("is_active", true).order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // ─── Mutations ───────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: async () => {
      const targetUserIds = newNotification.targetMode === "manual"
        ? newNotification.targetUsers.split(",").map((id) => id.trim()).filter(Boolean)
        : [];
      const { data, error } = await supabase.functions.invoke("broadcast-notification", {
        body: {
          title: newNotification.title, titleAr: newNotification.title_ar,
          body: newNotification.body, bodyAr: newNotification.body_ar,
          type: newNotification.type, channels: newNotification.channels,
          link: newNotification.link || undefined,
          targetAll: newNotification.targetMode === "all",
          targetUserIds,
          targetRole: newNotification.targetMode === "role" ? newNotification.targetRole : undefined,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recent-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-queue-stats"] });
      queryClient.invalidateQueries({ queryKey: ["notification-queue-items"] });
      toast({
        title: isAr ? "تم الإرسال" : "Sent",
        description: isAr
          ? `تم إرسال الإشعار إلى ${data?.totalUsers || 0} مستخدم`
          : `Notification sent to ${data?.totalUsers || 0} users`,
      });
      setIsCreateOpen(false);
      setNewNotification(EMPTY_FORM);
    },
    onError: (error) => toast({ variant: "destructive", title: isAr ? "فشل الإرسال" : "Send Failed", description: error.message }),
  });

  const retryQueueMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("notification_queue")
        .update({ status: "pending", attempts: 0, error_message: null })
        .in("id", ids).eq("status", "failed");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-queue-items"] });
      queryClient.invalidateQueries({ queryKey: ["notification-queue-stats"] });
      setSelectedQueueIds(new Set());
      toast({ title: isAr ? "تمت إعادة المحاولة" : "Retried successfully" });
    },
  });

  const cancelQueueMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("notification_queue")
        .update({ status: "failed" as const })
        .in("id", ids).eq("status", "pending");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-queue-items"] });
      queryClient.invalidateQueries({ queryKey: ["notification-queue-stats"] });
      setSelectedQueueIds(new Set());
      toast({ title: isAr ? "تم الإلغاء" : "Cancelled successfully" });
    },
  });

  const deleteQueueMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("notification_queue").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-queue-items"] });
      queryClient.invalidateQueries({ queryKey: ["notification-queue-stats"] });
      setSelectedQueueIds(new Set());
      setConfirmBulkAction(null);
      toast({ title: isAr ? "تم الحذف" : "Deleted successfully" });
    },
  });

  // ─── Derived / Filtered Data ─────────────────────────────
  const filteredRecent = useMemo(() => {
    let items = recentNotifications;
    if (recentSearch) {
      const q = recentSearch.toLowerCase();
      items = items.filter((n) =>
        (n.title || "").toLowerCase().includes(q) || (n.body || "").toLowerCase().includes(q) ||
        (n.title_ar || "").toLowerCase().includes(q)
      );
    }
    if (recentTypeFilter !== "all") items = items.filter((n) => n.type === recentTypeFilter);
    if (recentChannelFilter !== "all") items = items.filter((n) => (n.channel || "in_app") === recentChannelFilter);
    if (recentStatusFilter !== "all") items = items.filter((n) => (n.status || "pending") === recentStatusFilter);
    return items;
  }, [recentNotifications, recentSearch, recentTypeFilter, recentChannelFilter, recentStatusFilter]);

  const bulkRecent = useAdminBulkActions(filteredRecent);

  const filteredQueue = useMemo(() => {
    let items = queueItems;
    if (queueStatusFilter !== "all") items = items.filter((i) => i.status === queueStatusFilter);
    if (queueChannelFilter !== "all") items = items.filter((i) => i.channel === queueChannelFilter);
    return items;
  }, [queueItems, queueStatusFilter, queueChannelFilter]);

  const analytics = useMemo(() => {
    if (recentNotifications.length === 0 && queueItems.length === 0) return null;

    const totalSent = recentNotifications.filter((n) => n.status === "sent").length;
    const totalRead = recentNotifications.filter((n) => n.status === "read").length;
    const readRate = totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0;

    const byChannel: Record<string, number> = {};
    recentNotifications.forEach((n) => { const ch = n.channel || "in_app"; byChannel[ch] = (byChannel[ch] || 0) + 1; });

    const byType: Record<string, number> = {};
    recentNotifications.forEach((n) => { const t = n.type || "info"; byType[t] = (byType[t] || 0) + 1; });

    const byHour: Record<number, number> = {};
    recentNotifications.forEach((n) => { const h = new Date(n.created_at).getHours(); byHour[h] = (byHour[h] || 0) + 1; });
    const peakHour = Object.entries(byHour).sort(([, a], [, b]) => (b as number) - (a as number))[0];

    const failedItems = queueItems.filter((i) => i.status === "failed");
    const failureReasons: Record<string, number> = {};
    failedItems.forEach((i) => {
      const reason = (i as any).error_message || "Unknown";
      const shortReason = reason.length > 40 ? reason.substring(0, 40) + "..." : reason;
      failureReasons[shortReason] = (failureReasons[shortReason] || 0) + 1;
    });

    const dayNames = isAr
      ? ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const byDay: Record<number, number> = {};
    recentNotifications.forEach((n) => { const d = new Date(n.created_at).getDay(); byDay[d] = (byDay[d] || 0) + 1; });

    const queueTotal = queueItems.length;
    const queueSuccess = queueItems.filter((i) => i.status === "sent").length;
    const deliveryRate = queueTotal > 0 ? Math.round((queueSuccess / queueTotal) * 100) : 100;

    return {
      totalNotifications: recentNotifications.length,
      totalSent, totalRead, readRate, byChannel, byType, byHour, peakHour,
      failureReasons, dayNames, byDay, deliveryRate, queueTotal, queueSuccess,
      failedCount: failedItems.length,
    };
  }, [recentNotifications, queueItems, isAr]);

  // ─── Helpers ─────────────────────────────────────────────
  const toggleChannel = (ch: string) => {
    setNewNotification((prev) => ({
      ...prev,
      channels: prev.channels.includes(ch) ? prev.channels.filter((c) => c !== ch) : [...prev.channels, ch],
    }));
  };

  const toggleQueueSelect = (id: string) => {
    setSelectedQueueIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const { exportCSV: exportNotifications } = useCSVExport({
    columns: [
      { header: isAr ? "العنوان" : "Title", accessor: (n: any) => n.title || "" },
      { header: isAr ? "العنوان (عربي)" : "Title (AR)", accessor: (n: any) => n.title_ar || "" },
      { header: isAr ? "النوع" : "Type", accessor: (n: any) => n.type || "info" },
      { header: isAr ? "القناة" : "Channel", accessor: (n: any) => n.channel || "in_app" },
      { header: isAr ? "الحالة" : "Status", accessor: (n: any) => n.status || "pending" },
      { header: isAr ? "التاريخ" : "Date", accessor: (n: any) => format(new Date(n.created_at), "yyyy-MM-dd HH:mm") },
    ],
    filename: "notifications",
  });

  const refreshQueue = () => {
    queryClient.invalidateQueries({ queryKey: ["notification-queue-items"] });
    queryClient.invalidateQueries({ queryKey: ["notification-queue-stats"] });
  };

  return {
    isAr,
    // Dialog
    isCreateOpen, setIsCreateOpen,
    confirmBulkAction, setConfirmBulkAction,
    // Recent filters
    recentSearch, setRecentSearch,
    recentTypeFilter, setRecentTypeFilter,
    recentChannelFilter, setRecentChannelFilter,
    recentStatusFilter, setRecentStatusFilter,
    expandedNotifId, setExpandedNotifId,
    // Queue
    selectedQueueIds, setSelectedQueueIds,
    queueStatusFilter, setQueueStatusFilter,
    queueChannelFilter, setQueueChannelFilter,
    // Form
    newNotification, setNewNotification,
    channelSettings, setChannelSettings,
    // Data
    loadingRecent, loadingQueue,
    filteredRecent, filteredQueue,
    bulkRecent, analytics,
    queueStats, templates, segments, commTemplates,
    // Mutations
    sendMutation, retryQueueMutation, cancelQueueMutation, deleteQueueMutation,
    // Helpers
    toggleChannel, toggleQueueSelect,
    exportNotifications, refreshQueue,
    toast,
  };
}
