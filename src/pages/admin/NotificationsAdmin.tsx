import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCSVExport } from "@/hooks/useCSVExport";
import { format } from "date-fns";
import {
  Bell, Send, Plus, Mail, MessageSquare, Smartphone, Clock, Check, X,
  AlertCircle, BarChart3, RefreshCw, Megaphone, Search, Filter, ChevronDown,
  ChevronUp, Trash2, RotateCcw, Eye, Users, Zap, Target, TrendingUp,
  CheckSquare, XSquare, Download, Sparkles,
} from "lucide-react";
import { SmartNotificationRules } from "@/components/admin/SmartNotificationRules";
import { NotificationAnalyticsWidget } from "@/components/admin/NotificationAnalyticsWidget";
import { NotificationDeliveryWidget } from "@/components/admin/NotificationDeliveryWidget";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { BulkActionBar } from "@/components/admin/BulkActionBar";

// ─── Types ─────────────────────────────────────────────────
interface Segment {
  id: string;
  name: string;
  name_ar: string | null;
  estimated_reach: number | null;
  is_active: boolean | null;
}

// ─── Main Component ────────────────────────────────────────
export default function NotificationsAdmin() {
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
  const [newNotification, setNewNotification] = useState({
    title: "", title_ar: "", body: "", body_ar: "",
    type: "info", channels: ["in_app"] as string[],
    targetMode: "all" as "all" | "segment" | "role" | "manual",
    targetSegmentId: "", targetRole: "", targetUsers: "",
    link: "",
    sendMode: "now" as "now" | "scheduled",
    scheduledAt: "",
  });

  const [channelSettings, setChannelSettings] = useState({
    in_app: true, email: true, sms: false, whatsapp: false, push: false,
  });

  // ─── Queries ─────────────────────────────────────────────
  const { data: recentNotifications = [], isLoading: loadingRecent } = useQuery({
    queryKey: ["recent-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications").select("*")
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: queueStats } = useQuery({
    queryKey: ["notification-queue-stats"],
    queryFn: async () => {
      const [pending, sent, failed] = await Promise.all([
        supabase.from("notification_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("notification_queue").select("*", { count: "exact", head: true }).eq("status", "sent"),
        supabase.from("notification_queue").select("*", { count: "exact", head: true }).eq("status", "failed"),
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
        .from("notification_queue").select("*")
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_templates").select("*")
        .order("created_at", { ascending: false });
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
      setNewNotification({ title: "", title_ar: "", body: "", body_ar: "", type: "info", channels: ["in_app"], targetMode: "all", targetSegmentId: "", targetRole: "", targetUsers: "", link: "", sendMode: "now", scheduledAt: "" });
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
      items = items.filter((n: any) =>
        (n.title || "").toLowerCase().includes(q) || (n.body || "").toLowerCase().includes(q) ||
        (n.title_ar || "").toLowerCase().includes(q)
      );
    }
    if (recentTypeFilter !== "all") items = items.filter((n: any) => n.type === recentTypeFilter);
    if (recentChannelFilter !== "all") items = items.filter((n: any) => (n.channel || "in_app") === recentChannelFilter);
    if (recentStatusFilter !== "all") items = items.filter((n: any) => (n.status || "pending") === recentStatusFilter);
    return items;
  }, [recentNotifications, recentSearch, recentTypeFilter, recentChannelFilter, recentStatusFilter]);

  const bulkRecent = useAdminBulkActions(filteredRecent);

  const filteredQueue = useMemo(() => {
    let items = queueItems;
    if (queueStatusFilter !== "all") items = items.filter((i: any) => i.status === queueStatusFilter);
    if (queueChannelFilter !== "all") items = items.filter((i: any) => i.channel === queueChannelFilter);
    return items;
  }, [queueItems, queueStatusFilter, queueChannelFilter]);

  // Analytics
  const analytics = useMemo(() => {
    if (recentNotifications.length === 0 && queueItems.length === 0) return null;

    const allItems = [...recentNotifications, ...queueItems];
    const totalSent = recentNotifications.filter((n: any) => n.status === "sent").length;
    const totalRead = recentNotifications.filter((n: any) => n.status === "read").length;
    const readRate = totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0;

    // Channel distribution
    const byChannel: Record<string, number> = {};
    recentNotifications.forEach((n: any) => {
      const ch = n.channel || "in_app";
      byChannel[ch] = (byChannel[ch] || 0) + 1;
    });

    // Type distribution
    const byType: Record<string, number> = {};
    recentNotifications.forEach((n: any) => {
      const t = n.type || "info";
      byType[t] = (byType[t] || 0) + 1;
    });

    // Hourly volume
    const byHour: Record<number, number> = {};
    recentNotifications.forEach((n: any) => {
      const h = new Date(n.created_at).getHours();
      byHour[h] = (byHour[h] || 0) + 1;
    });
    const peakHour = Object.entries(byHour).sort(([, a], [, b]) => (b as number) - (a as number))[0];

    // Queue failure reasons
    const failedItems = queueItems.filter((i: any) => i.status === "failed");
    const failureReasons: Record<string, number> = {};
    failedItems.forEach((i: any) => {
      const reason = (i as any).error_message || "Unknown";
      const shortReason = reason.length > 40 ? reason.substring(0, 40) + "..." : reason;
      failureReasons[shortReason] = (failureReasons[shortReason] || 0) + 1;
    });

    // Daily volume (last 7 days)
    const dayNames = isAr
      ? ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const byDay: Record<number, number> = {};
    recentNotifications.forEach((n: any) => {
      const d = new Date(n.created_at).getDay();
      byDay[d] = (byDay[d] || 0) + 1;
    });

    // Delivery success rate
    const queueTotal = queueItems.length;
    const queueSuccess = queueItems.filter((i: any) => i.status === "sent").length;
    const deliveryRate = queueTotal > 0 ? Math.round((queueSuccess / queueTotal) * 100) : 100;

    return {
      totalNotifications: recentNotifications.length,
      totalSent, totalRead, readRate, byChannel, byType, byHour, peakHour,
      failureReasons, dayNames, byDay, deliveryRate, queueTotal, queueSuccess,
      failedCount: failedItems.length,
    };
  }, [recentNotifications, queueItems, isAr]);

  // ─── Helpers ─────────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent": case "delivered":
        return <Badge className="bg-chart-2/15 text-chart-2 border-chart-2/30 gap-1"><Check className="h-3 w-3" />{status}</Badge>;
      case "read":
        return <Badge className="bg-primary/15 text-primary border-primary/30 gap-1"><Eye className="h-3 w-3" />read</Badge>;
      case "failed":
        return <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" />{status}</Badge>;
      case "cancelled":
        return <Badge variant="secondary" className="gap-1"><X className="h-3 w-3" />{status}</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{status}</Badge>;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email": return <Mail className="h-3.5 w-3.5" />;
      case "sms": return <Smartphone className="h-3.5 w-3.5" />;
      case "whatsapp": return <MessageSquare className="h-3.5 w-3.5" />;
      case "push": return <Megaphone className="h-3.5 w-3.5" />;
      default: return <Bell className="h-3.5 w-3.5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      info: "bg-primary/15 text-primary", success: "bg-chart-2/15 text-chart-2",
      warning: "bg-chart-4/15 text-chart-4", error: "bg-destructive/15 text-destructive",
    };
    return <Badge className={`${colors[type] || colors.info} border-0 capitalize`}>{type}</Badge>;
  };

  const toggleChannel = (ch: string) => {
    setNewNotification((prev) => ({
      ...prev,
      channels: prev.channels.includes(ch)
        ? prev.channels.filter((c) => c !== ch)
        : [...prev.channels, ch],
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Bell}
        title={isAr ? "إدارة الإشعارات" : "Notification Management"}
        description={isAr ? "إرسال وتتبع وتحليل إشعارات المستخدمين" : "Send, track, and analyze user notifications"}
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Send className="me-2 h-4 w-4" />
            {isAr ? "بث إشعار" : "Broadcast"}
          </Button>
        }
      />

      {/* Notification Delivery Analytics */}
      <NotificationDeliveryWidget />

      {/* Notification Insights Widget */}
      <NotificationAnalyticsWidget />

      {/* Queue Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {[
          { label: isAr ? "الإجمالي" : "Total Queued", value: queueStats?.total || 0, icon: BarChart3, border: "border-s-primary", bg: "bg-primary/10", iconColor: "text-primary" },
          { label: isAr ? "في الانتظار" : "Pending", value: queueStats?.pending || 0, icon: Clock, border: "border-s-chart-4", bg: "bg-chart-4/10", iconColor: "text-chart-4" },
          { label: isAr ? "تم الإرسال" : "Sent", value: queueStats?.sent || 0, icon: Check, border: "border-s-chart-2", bg: "bg-chart-2/10", iconColor: "text-chart-2" },
          { label: isAr ? "فشل" : "Failed", value: queueStats?.failed || 0, icon: AlertCircle, border: "border-s-destructive", bg: "bg-destructive/10", iconColor: "text-destructive" },
        ].map((s) => (
          <Card key={s.label} className={`border-s-[3px] ${s.border}`}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-xl p-2.5 ${s.bg}`}><s.icon className={`h-5 w-5 ${s.iconColor}`} /></div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent" className="gap-1.5"><Bell className="h-3.5 w-3.5" />{isAr ? "الأخيرة" : "Recent"}</TabsTrigger>
          <TabsTrigger value="smart-rules" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />{isAr ? "القواعد الذكية" : "Smart Rules"}</TabsTrigger>
          <TabsTrigger value="queue" className="gap-1.5"><Send className="h-3.5 w-3.5" />{isAr ? "التوصيل" : "Queue"}</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />{isAr ? "التحليلات" : "Analytics"}</TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5"><Zap className="h-3.5 w-3.5" />{isAr ? "القوالب" : "Templates"}</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Filter className="h-3.5 w-3.5" />{isAr ? "الإعدادات" : "Settings"}</TabsTrigger>
        </TabsList>

        {/* ═══ RECENT TAB ═══ */}
        <TabsContent value="recent" className="mt-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={recentSearch} onChange={(e) => setRecentSearch(e.target.value)}
                placeholder={isAr ? "بحث..." : "Search..."} className="ps-10" />
            </div>
            <Select value={recentTypeFilter} onValueChange={setRecentTypeFilter}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل الأنواع" : "All Types"}</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Alert</SelectItem>
              </SelectContent>
            </Select>
            <Select value={recentChannelFilter} onValueChange={setRecentChannelFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل القنوات" : "All Channels"}</SelectItem>
                <SelectItem value="in_app">In-App</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="push">Push</SelectItem>
              </SelectContent>
            </Select>
            <Select value={recentStatusFilter} onValueChange={setRecentStatusFilter}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل الحالات" : "All Status"}</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-10" onClick={() => exportNotifications(filteredRecent)}>
              <Download className="me-1 h-3.5 w-3.5" />{isAr ? "تصدير" : "Export"}
            </Button>
          </div>

          <BulkActionBar
            count={bulkRecent.count}
            onClear={bulkRecent.clearSelection}
            onExport={() => exportNotifications(bulkRecent.selectedItems)}
          />

          <Card>
            <CardContent className="p-0">
              {loadingRecent ? (
                <div className="p-6"><Skeleton className="h-64" /></div>
              ) : filteredRecent.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">
                          <Checkbox checked={bulkRecent.isAllSelected} onCheckedChange={bulkRecent.toggleAll} />
                        </TableHead>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                        <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                        <TableHead>{isAr ? "القناة" : "Channel"}</TableHead>
                        <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                        <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecent.map((notif: any) => (
                        <>
                          <TableRow key={notif.id} className={`cursor-pointer ${bulkRecent.isSelected(notif.id) ? "bg-primary/5" : ""}`} onClick={() => setExpandedNotifId(expandedNotifId === notif.id ? null : notif.id)}>
                            <TableCell onClick={e => e.stopPropagation()}>
                              <Checkbox checked={bulkRecent.isSelected(notif.id)} onCheckedChange={() => bulkRecent.toggleOne(notif.id)} />
                            </TableCell>
                            <TableCell>
                              {expandedNotifId === notif.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-sm truncate max-w-[250px]">
                                {isAr && notif.title_ar ? notif.title_ar : notif.title}
                              </p>
                            </TableCell>
                            <TableCell>{getTypeBadge(notif.type || "info")}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                {getChannelIcon(notif.channel || "in_app")}
                                <span className="text-xs capitalize">{notif.channel || "in_app"}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(notif.status || "pending")}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{format(new Date(notif.created_at), "MMM d, HH:mm")}</TableCell>
                          </TableRow>
                          {expandedNotifId === notif.id && (
                            <TableRow key={`${notif.id}-detail`}>
                              <TableCell colSpan={6}>
                                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? "العنوان (EN)" : "Title (EN)"}</p>
                                      <p className="text-sm">{notif.title || "—"}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? "العنوان (AR)" : "Title (AR)"}</p>
                                      <p className="text-sm" dir="rtl">{notif.title_ar || "—"}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? "المحتوى (EN)" : "Body (EN)"}</p>
                                      <p className="text-sm whitespace-pre-wrap">{notif.body || "—"}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? "المحتوى (AR)" : "Body (AR)"}</p>
                                      <p className="text-sm whitespace-pre-wrap" dir="rtl">{notif.body_ar || "—"}</p>
                                    </div>
                                  </div>
                                  <Separator />
                                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                    <span><strong>ID:</strong> {notif.id.substring(0, 12)}...</span>
                                    <span><strong>User:</strong> {notif.user_id?.substring(0, 12) || "—"}...</span>
                                    {notif.link && <span><strong>Link:</strong> {notif.link}</span>}
                                    <span><strong>Created:</strong> {format(new Date(notif.created_at), "yyyy-MM-dd HH:mm:ss")}</span>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">{isAr ? "لا توجد إشعارات" : "No notifications found"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ SMART RULES TAB ═══ */}
        <TabsContent value="smart-rules" className="mt-6">
          <SmartNotificationRules />
        </TabsContent>

        {/* ═══ QUEUE TAB ═══ */}
        <TabsContent value="queue" className="mt-6 space-y-4">
          {/* Bulk Actions */}
          {selectedQueueIds.size > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex items-center justify-between p-3">
                <span className="text-sm font-medium">{selectedQueueIds.size} {isAr ? "محدد" : "selected"}</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => retryQueueMutation.mutate(Array.from(selectedQueueIds))}>
                    <RotateCcw className="me-1 h-3.5 w-3.5" />{isAr ? "إعادة" : "Retry"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => cancelQueueMutation.mutate(Array.from(selectedQueueIds))}>
                    <XSquare className="me-1 h-3.5 w-3.5" />{isAr ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button variant="destructive" size="sm"
                    onClick={() => setConfirmBulkAction({ action: "delete", ids: Array.from(selectedQueueIds) })}>
                    <Trash2 className="me-1 h-3.5 w-3.5" />{isAr ? "حذف" : "Delete"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedQueueIds(new Set())}>{isAr ? "إلغاء" : "Clear"}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Queue Filters */}
          <div className="flex flex-wrap gap-2">
            <Select value={queueStatusFilter} onValueChange={setQueueStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل الحالات" : "All Status"}</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={queueChannelFilter} onValueChange={setQueueChannelFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل القنوات" : "All Channels"}</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="push">Push</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-10"
              onClick={() => { queryClient.invalidateQueries({ queryKey: ["notification-queue-items"] }); queryClient.invalidateQueries({ queryKey: ["notification-queue-stats"] }); }}>
              <RefreshCw className="me-2 h-3.5 w-3.5" />{isAr ? "تحديث" : "Refresh"}
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {loadingQueue ? (
                <div className="p-6"><Skeleton className="h-64" /></div>
              ) : filteredQueue.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">
                          <Checkbox
                            checked={selectedQueueIds.size === filteredQueue.length && filteredQueue.length > 0}
                            onCheckedChange={() => {
                              if (selectedQueueIds.size === filteredQueue.length) setSelectedQueueIds(new Set());
                              else setSelectedQueueIds(new Set(filteredQueue.map((i: any) => i.id)));
                            }}
                          />
                        </TableHead>
                        <TableHead>{isAr ? "القناة" : "Channel"}</TableHead>
                        <TableHead>{isAr ? "المستخدم" : "User"}</TableHead>
                        <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                        <TableHead>{isAr ? "المحاولات" : "Attempts"}</TableHead>
                        <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                        <TableHead>{isAr ? "الإجراءات" : "Actions"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQueue.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Checkbox checked={selectedQueueIds.has(item.id)} onCheckedChange={() => toggleQueueSelect(item.id)} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {getChannelIcon(item.channel)}
                              <span className="text-sm capitalize">{item.channel}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{item.user_id?.substring(0, 12)}...</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell className="text-sm">{item.attempts || 0}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(item.created_at), "MMM d, HH:mm")}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {item.status === "failed" && (
                                <Button variant="ghost" size="icon" className="h-7 w-7"
                                  onClick={() => retryQueueMutation.mutate([item.id])}>
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {item.status === "pending" && (
                                <Button variant="ghost" size="icon" className="h-7 w-7"
                                  onClick={() => cancelQueueMutation.mutate([item.id])}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <Send className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">{isAr ? "لا توجد عناصر" : "No queue items"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ ANALYTICS TAB ═══ */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          {analytics ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: isAr ? "إجمالي الإشعارات" : "Total Notifications", value: analytics.totalNotifications, icon: Bell, color: "text-primary" },
                  { label: isAr ? "معدل القراءة" : "Read Rate", value: `${analytics.readRate}%`, icon: Eye, color: analytics.readRate >= 50 ? "text-chart-2" : "text-chart-4" },
                  { label: isAr ? "معدل التوصيل" : "Delivery Rate", value: `${analytics.deliveryRate}%`, icon: TrendingUp, color: analytics.deliveryRate >= 80 ? "text-chart-2" : "text-destructive" },
                  { label: isAr ? "الفاشلة" : "Failed", value: analytics.failedCount, icon: AlertCircle, color: "text-destructive" },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardContent className="p-4 text-center">
                      <s.icon className={`h-6 w-6 mx-auto mb-2 ${s.color}`} />
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Channel Distribution */}
                <Card>
                  <CardHeader><CardTitle className="text-base">{isAr ? "توزيع القنوات" : "Channel Distribution"}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(analytics.byChannel).sort(([, a], [, b]) => (b as number) - (a as number)).map(([ch, count]) => {
                      const pct = analytics.totalNotifications > 0 ? Math.round(((count as number) / analytics.totalNotifications) * 100) : 0;
                      return (
                        <div key={ch}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <div className="flex items-center gap-2">{getChannelIcon(ch)}<span className="capitalize">{ch.replace("_", " ")}</span></div>
                            <span className="text-muted-foreground">{count as number} ({pct}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Type Distribution */}
                <Card>
                  <CardHeader><CardTitle className="text-base">{isAr ? "توزيع الأنواع" : "Type Distribution"}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(analytics.byType).sort(([, a], [, b]) => (b as number) - (a as number)).map(([type, count]) => {
                      const pct = analytics.totalNotifications > 0 ? Math.round(((count as number) / analytics.totalNotifications) * 100) : 0;
                      const colors: Record<string, string> = { info: "bg-primary", success: "bg-chart-2", warning: "bg-chart-4", error: "bg-destructive" };
                      return (
                        <div key={type}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="capitalize">{type}</span>
                            <span className="text-muted-foreground">{count as number} ({pct}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${colors[type] || colors.info}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Peak Hours */}
                <Card>
                  <CardHeader><CardTitle className="text-base">{isAr ? "ساعة الذروة" : "Peak Hour"}</CardTitle></CardHeader>
                  <CardContent className="text-center">
                    {analytics.peakHour ? (
                      <>
                        <p className="text-4xl font-bold text-primary">{analytics.peakHour[0]}:00</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {analytics.peakHour[1]} {isAr ? "إشعار" : "notifications"}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">{isAr ? "لا توجد بيانات" : "No data"}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Failure Reasons */}
                <Card>
                  <CardHeader><CardTitle className="text-base">{isAr ? "أسباب الفشل" : "Failure Reasons"}</CardTitle></CardHeader>
                  <CardContent>
                    {Object.keys(analytics.failureReasons).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(analytics.failureReasons).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 5).map(([reason, count]) => (
                          <div key={reason} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground truncate max-w-[200px]">{reason}</span>
                            <Badge variant="destructive" className="shrink-0">{count as number}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground py-4">{isAr ? "لا توجد أخطاء 🎉" : "No failures 🎉"}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Volume by Day */}
                <Card className="md:col-span-2">
                  <CardHeader><CardTitle className="text-base">{isAr ? "الحجم حسب اليوم" : "Volume by Day"}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between gap-2 h-32">
                      {analytics.dayNames.map((day: string, i: number) => {
                        const count = analytics.byDay[i] || 0;
                        const maxCount = Math.max(...Object.values(analytics.byDay), 1);
                        const height = Math.max((count / maxCount) * 100, 4);
                        return (
                          <div key={i} className="flex flex-col items-center gap-1 flex-1">
                            <span className="text-xs font-medium">{count}</span>
                            <div className="w-full rounded-t-md bg-primary/80 transition-all" style={{ height: `${height}%` }} />
                            <span className="text-[10px] text-muted-foreground">{day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">{isAr ? "لا توجد بيانات كافية" : "Not enough data yet"}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ TEMPLATES TAB (Quick-Send) ═══ */}
        <TabsContent value="templates" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{isAr ? "القوالب والإرسال السريع" : "Templates & Quick Send"}</CardTitle>
              <CardDescription>{isAr ? "أرسل إشعارات سريعة باستخدام القوالب المعدّة" : "Send quick notifications using pre-configured templates"}</CardDescription>
            </CardHeader>
            <CardContent>
              {commTemplates.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {commTemplates.map((t: any) => (
                    <Card key={t.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{isAr && t.name_ar ? t.name_ar : t.name}</p>
                          <div className="flex items-center gap-1">{getChannelIcon(t.channel)}<span className="text-[10px] capitalize text-muted-foreground">{t.channel}</span></div>
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground">{t.slug}</p>
                        {t.variables && t.variables.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {t.variables.map((v: string) => <Badge key={v} variant="outline" className="text-[10px]">{`{{${v}}}`}</Badge>)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Zap className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">{isAr ? "لا توجد قوالب" : "No templates available"}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legacy templates */}
          {templates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{isAr ? "قوالب الإشعارات القديمة" : "Legacy Notification Templates"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {templates.map((template: any) => (
                    <Card key={template.id}>
                      <CardContent className="p-4">
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{template.title}</p>
                        <div className="flex gap-1 mt-2">
                          {template.channels?.map((channel: string) => (
                            <Badge key={channel} variant="outline" className="text-xs gap-1">{getChannelIcon(channel)}{channel}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ SETTINGS TAB ═══ */}
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{isAr ? "قنوات الإشعارات" : "Notification Channels"}</CardTitle>
              <CardDescription>{isAr ? "تفعيل وتعطيل قنوات الإشعارات على مستوى المنصة" : "Enable or disable notification channels platform-wide"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "in_app", icon: Bell, label: isAr ? "داخل التطبيق" : "In-App", desc: isAr ? "إشعارات فورية داخل المنصة" : "Real-time in-platform alerts" },
                { key: "email", icon: Mail, label: isAr ? "البريد الإلكتروني" : "Email", desc: isAr ? "إرسال عبر البريد الإلكتروني" : "Delivery via email" },
                { key: "sms", icon: Smartphone, label: "SMS", desc: isAr ? "رسائل نصية قصيرة" : "Short message service" },
                { key: "whatsapp", icon: MessageSquare, label: "WhatsApp", desc: isAr ? "إرسال عبر واتساب" : "WhatsApp messaging" },
                { key: "push", icon: Megaphone, label: isAr ? "إشعارات الدفع" : "Push", desc: isAr ? "إشعارات الدفع للأجهزة" : "Browser & device push notifications" },
              ].map(({ key, icon: Icon, label, desc }) => (
                <div key={key} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${channelSettings[key as keyof typeof channelSettings] ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon className={`h-4 w-4 ${channelSettings[key as keyof typeof channelSettings] ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <Switch checked={channelSettings[key as keyof typeof channelSettings]}
                    onCheckedChange={(checked) => setChannelSettings({ ...channelSettings, [key]: checked })} />
                </div>
              ))}
              <Button className="w-full mt-4"
                onClick={() => toast({ title: isAr ? "تم الحفظ" : "Saved", description: isAr ? "تم حفظ إعدادات الإشعارات" : "Notification settings saved" })}>
                {isAr ? "حفظ الإعدادات" : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ BROADCAST DIALOG ═══ */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              {isAr ? "بث إشعار جديد" : "Broadcast Notification"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Content tabs */}
            <Tabs defaultValue="en">
              <TabsList><TabsTrigger value="en">English</TabsTrigger><TabsTrigger value="ar">العربية</TabsTrigger></TabsList>
              <TabsContent value="en" className="space-y-3 mt-3">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={newNotification.title} onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })} placeholder="Notification title..." />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea rows={3} value={newNotification.body} onChange={(e) => setNewNotification({ ...newNotification, body: e.target.value })} placeholder="Notification body..." />
                </div>
              </TabsContent>
              <TabsContent value="ar" className="space-y-3 mt-3">
                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <Input dir="rtl" value={newNotification.title_ar} onChange={(e) => setNewNotification({ ...newNotification, title_ar: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>الرسالة</Label>
                  <Textarea dir="rtl" rows={3} value={newNotification.body_ar} onChange={(e) => setNewNotification({ ...newNotification, body_ar: e.target.value })} />
                </div>
              </TabsContent>
            </Tabs>

            {/* Type & Link */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{isAr ? "النوع" : "Type"}</Label>
                <Select value={newNotification.type} onValueChange={(v) => setNewNotification({ ...newNotification, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "الرابط (اختياري)" : "Link (optional)"}</Label>
                <Input value={newNotification.link} onChange={(e) => setNewNotification({ ...newNotification, link: e.target.value })}
                  placeholder="/dashboard" />
              </div>
            </div>

            {/* Channels */}
            <div className="space-y-2">
              <Label>{isAr ? "القنوات" : "Channels"}</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "in_app", label: "In-App", icon: Bell },
                  { value: "email", label: "Email", icon: Mail },
                  { value: "sms", label: "SMS", icon: Smartphone },
                  { value: "push", label: "Push", icon: Megaphone },
                ].map((ch) => (
                  <Badge key={ch.value}
                    className={`cursor-pointer gap-1.5 px-3 py-1.5 transition-all ${
                      newNotification.channels.includes(ch.value)
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                    onClick={() => toggleChannel(ch.value)}>
                    <ch.icon className="h-3.5 w-3.5" />
                    {ch.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Targeting */}
            <div className="rounded-lg border p-4 space-y-4">
              <Label className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" />{isAr ? "الاستهداف" : "Targeting"}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: "all", label: isAr ? "الجميع" : "All Users", icon: Users },
                  { value: "segment", label: isAr ? "شريحة" : "Segment", icon: Target },
                  { value: "role", label: isAr ? "الدور" : "By Role", icon: Zap },
                  { value: "manual", label: isAr ? "يدوي" : "Manual IDs", icon: Filter },
                ].map((t) => (
                  <Button key={t.value} variant={newNotification.targetMode === t.value ? "default" : "outline"} size="sm"
                    className="gap-1.5" onClick={() => setNewNotification({ ...newNotification, targetMode: t.value as any })}>
                    <t.icon className="h-3.5 w-3.5" />{t.label}
                  </Button>
                ))}
              </div>

              {newNotification.targetMode === "segment" && (
                <Select value={newNotification.targetSegmentId} onValueChange={(v) => setNewNotification({ ...newNotification, targetSegmentId: v })}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر شريحة..." : "Select segment..."} /></SelectTrigger>
                  <SelectContent>
                    {segments.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {isAr && s.name_ar ? s.name_ar : s.name} ({s.estimated_reach || 0} {isAr ? "مستخدم" : "users"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {newNotification.targetMode === "role" && (
                <Select value={newNotification.targetRole} onValueChange={(v) => setNewNotification({ ...newNotification, targetRole: v })}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر الدور..." : "Select role..."} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chef">{isAr ? "شيف" : "Chef"}</SelectItem>
                    <SelectItem value="supervisor">{isAr ? "مشرف" : "Supervisor"}</SelectItem>
                    <SelectItem value="organizer">{isAr ? "منظم" : "Organizer"}</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {newNotification.targetMode === "manual" && (
                <Textarea value={newNotification.targetUsers}
                  onChange={(e) => setNewNotification({ ...newNotification, targetUsers: e.target.value })}
                  placeholder={isAr ? "أدخل معرفات المستخدمين مفصولة بفواصل" : "Enter user IDs, separated by commas"}
                  rows={2} />
              )}
            </div>
          </div>
          {/* Schedule Option */}
          <div className="rounded-lg border p-4 space-y-3">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {isAr ? "توقيت الإرسال" : "Send Timing"}
            </Label>
            <div className="flex gap-2">
              <Button
                variant={newNotification.sendMode === "now" ? "default" : "outline"}
                size="sm"
                onClick={() => setNewNotification({ ...newNotification, sendMode: "now" })}
              >
                <Zap className="me-1 h-3.5 w-3.5" />
                {isAr ? "الآن" : "Send Now"}
              </Button>
              <Button
                variant={newNotification.sendMode === "scheduled" ? "default" : "outline"}
                size="sm"
                onClick={() => setNewNotification({ ...newNotification, sendMode: "scheduled" })}
              >
                <Clock className="me-1 h-3.5 w-3.5" />
                {isAr ? "مجدول" : "Schedule"}
              </Button>
            </div>
            {newNotification.sendMode === "scheduled" && (
              <Input
                type="datetime-local"
                value={newNotification.scheduledAt}
                onChange={(e) => setNewNotification({ ...newNotification, scheduledAt: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
              />
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => sendMutation.mutate()} disabled={
              sendMutation.isPending || !newNotification.title || !newNotification.body || newNotification.channels.length === 0 ||
              (newNotification.sendMode === "scheduled" && !newNotification.scheduledAt)
            }>
              <Send className="me-2 h-4 w-4" />
              {sendMutation.isPending
                ? (isAr ? "جارٍ..." : "Sending...")
                : newNotification.sendMode === "scheduled"
                  ? (isAr ? "جدولة البث" : "Schedule Broadcast")
                  : (isAr ? "بث الآن" : "Broadcast Now")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CONFIRM BULK DELETE ═══ */}
      <AlertDialog open={!!confirmBulkAction} onOpenChange={() => setConfirmBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "تأكيد الحذف" : "Confirm Delete"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `هل أنت متأكد من حذف ${confirmBulkAction?.ids.length || 0} عنصر؟`
                : `Are you sure you want to delete ${confirmBulkAction?.ids.length || 0} queue items?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmBulkAction && deleteQueueMutation.mutate(confirmBulkAction.ids)}>
              {isAr ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
