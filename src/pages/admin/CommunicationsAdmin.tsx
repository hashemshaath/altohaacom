import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { CommunicationsLiveWidget } from "@/components/admin/CommunicationsLiveWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import {
  MessageSquare, Send, Inbox, ArrowUpRight, ArrowDownLeft, Clock, CheckCheck,
  Reply, AlertCircle, Search, Building2, Plus, Star, StarOff, Archive,
  Tag, StickyNote, BarChart3, Trash2, Eye, EyeOff, Filter, Download,
} from "lucide-react";
import { format, differenceInMinutes, differenceInHours } from "date-fns";

// ─── Types ───────────────────────────────────────────────────
interface Communication {
  id: string;
  company_id: string;
  sender_id: string;
  subject: string;
  message: string;
  direction: string;
  status: string;
  parent_id: string | null;
  is_internal_note: boolean | null;
  is_archived: boolean | null;
  is_starred: boolean | null;
  tags: string[] | null;
  response_time_minutes: number | null;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface CompanyInfo {
  id: string;
  name: string;
  name_ar: string | null;
}

const TAG_OPTIONS = [
  { value: "follow-up", label: "Follow Up", labelAr: "متابعة", color: "bg-chart-4/15 text-chart-4" },
  { value: "resolved", label: "Resolved", labelAr: "محلول", color: "bg-chart-2/15 text-chart-2" },
  { value: "escalated", label: "Escalated", labelAr: "مُصعّد", color: "bg-destructive/15 text-destructive" },
  { value: "pending", label: "Pending", labelAr: "قيد الانتظار", color: "bg-chart-3/15 text-chart-3" },
  { value: "important", label: "Important", labelAr: "مهم", color: "bg-primary/15 text-primary" },
];

// ─── Main Component ──────────────────────────────────────────
export default function CommunicationsAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [filter, setFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Communication | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [composeOpen, setComposeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("inbox");
  const [showArchived, setShowArchived] = useState(false);

  // Compose form
  const [composeForm, setComposeForm] = useState({
    company_id: "", subject: "", message: "", priority: "normal",
  });

  // ─── Queries ─────────────────────────────────────────────
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["adminCommunications", filter, priorityFilter, tagFilter, showArchived],
    queryFn: async () => {
      let query = supabase
        .from("company_communications")
        .select("*")
        .is("parent_id", null)
        .eq("is_internal_note", false)
        .order("created_at", { ascending: false });

      if (!showArchived) query = query.or("is_archived.is.null,is_archived.eq.false");
      else query = query.eq("is_archived", true);

      if (filter === "unread") query = query.eq("status", "unread").eq("direction", "outgoing");
      else if (filter === "outgoing") query = query.eq("direction", "outgoing");
      else if (filter === "incoming") query = query.eq("direction", "incoming");
      else if (filter === "starred") query = query.eq("is_starred", true);

      if (priorityFilter !== "all") query = query.eq("priority", priorityFilter);
      if (tagFilter !== "all") query = query.contains("tags", [tagFilter]);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Communication[];
    },
  });

  const companyIds = [...new Set(messages.map((m) => m.company_id))];
  const { data: companies = [] } = useQuery({
    queryKey: ["adminCommCompanies", companyIds.join(",")],
    queryFn: async () => {
      if (companyIds.length === 0) return [];
      const { data, error } = await supabase.from("companies").select("id, name, name_ar").in("id", companyIds);
      if (error) throw error;
      return (data || []) as CompanyInfo[];
    },
    enabled: companyIds.length > 0,
  });
  const companyMap = new Map(companies.map((c) => [c.id, c]));

  // All companies for compose
  const { data: allCompanies = [] } = useQuery({
    queryKey: ["allCompaniesForCompose"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, name, name_ar").order("name").limit(200);
      if (error) throw error;
      return (data || []) as CompanyInfo[];
    },
  });

  // Replies
  const { data: replies = [] } = useQuery({
    queryKey: ["adminCommReplies", selectedMessage?.id],
    queryFn: async () => {
      if (!selectedMessage) return [];
      const { data, error } = await supabase
        .from("company_communications").select("*")
        .eq("parent_id", selectedMessage.id).order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Communication[];
    },
    enabled: !!selectedMessage,
  });

  // Internal notes for selected thread
  const { data: internalNotes = [] } = useQuery({
    queryKey: ["adminCommNotes", selectedMessage?.id],
    queryFn: async () => {
      if (!selectedMessage) return [];
      const { data, error } = await supabase
        .from("company_communications").select("*")
        .eq("parent_id", selectedMessage.id).eq("is_internal_note", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Communication[];
    },
    enabled: !!selectedMessage,
  });

  // Analytics data
  const { data: allMessagesForAnalytics = [] } = useQuery({
    queryKey: ["adminCommAnalytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_communications").select("created_at, direction, status, priority, response_time_minutes, is_internal_note")
        .is("parent_id", null).eq("is_internal_note", false)
        .order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: activeTab === "analytics",
  });

  // ─── Mutations ───────────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("company_communications").update({ status: "read" }).eq("id", id).eq("status", "unread").eq("direction", "outgoing");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminCommunications"] }),
  });

  const replyMutation = useMutation({
    mutationFn: async ({ parentId, companyId }: { parentId: string; companyId: string }) => {
      if (!user) throw new Error("Not authenticated");
      const parent = messages.find((m) => m.id === parentId);
      // Calculate response time
      let responseTime: number | undefined;
      if (parent && parent.direction === "outgoing") {
        responseTime = differenceInMinutes(new Date(), new Date(parent.created_at));
      }
      const { error } = await supabase.from("company_communications").insert({
        company_id: companyId, sender_id: user.id,
        subject: `Re: ${parent?.subject || ""}`, message: replyMessage,
        direction: "incoming", priority: parent?.priority || "normal",
        parent_id: parentId, status: "unread",
        response_time_minutes: responseTime,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCommunications"] });
      queryClient.invalidateQueries({ queryKey: ["adminCommReplies"] });
      setReplyMessage("");
      toast({ title: isAr ? "تم إرسال الرد" : "Reply sent" });
    },
    onError: () => toast({ title: isAr ? "فشل الإرسال" : "Failed to send", variant: "destructive" }),
  });

  const composeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("company_communications").insert({
        company_id: composeForm.company_id, sender_id: user.id,
        subject: composeForm.subject, message: composeForm.message,
        direction: "incoming", priority: composeForm.priority, status: "unread",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCommunications"] });
      setComposeOpen(false);
      setComposeForm({ company_id: "", subject: "", message: "", priority: "normal" });
      toast({ title: isAr ? "تم إرسال الرسالة" : "Message sent" });
    },
    onError: (e: any) => toast({ title: isAr ? "فشل الإرسال" : "Send failed", description: e.message, variant: "destructive" }),
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ parentId, companyId, note }: { parentId: string; companyId: string; note: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("company_communications").insert({
        company_id: companyId, sender_id: user.id,
        subject: "Internal Note", message: note,
        direction: "incoming", priority: "normal",
        parent_id: parentId, status: "read", is_internal_note: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCommNotes"] });
      setNoteText("");
      toast({ title: isAr ? "تمت إضافة الملاحظة" : "Note added" });
    },
  });

  const toggleStarMutation = useMutation({
    mutationFn: async ({ id, starred }: { id: string; starred: boolean }) => {
      const { error } = await supabase.from("company_communications").update({ is_starred: starred }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminCommunications"] }),
  });

  const updateTagsMutation = useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const { error } = await supabase.from("company_communications").update({ tags }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCommunications"] });
      toast({ title: isAr ? "تم تحديث العلامات" : "Tags updated" });
    },
  });

  // Bulk mutations
  const bulkMarkReadMutation = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selectedIds);
      const { error } = await supabase.from("company_communications").update({ status: "read" }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCommunications"] });
      setSelectedIds(new Set());
      toast({ title: isAr ? "تم التحديث" : "Marked as read" });
    },
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selectedIds);
      const { error } = await supabase.from("company_communications").update({ is_archived: true }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCommunications"] });
      setSelectedIds(new Set());
      toast({ title: isAr ? "تم الأرشفة" : "Messages archived" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selectedIds);
      const { error } = await supabase.from("company_communications").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCommunications"] });
      setSelectedIds(new Set());
      toast({ title: isAr ? "تم الحذف" : "Messages deleted" });
    },
  });

  const { exportCSV: exportMessages } = useCSVExport({
    columns: [
      { header: isAr ? "الموضوع" : "Subject", accessor: (r: Communication) => r.subject },
      { header: isAr ? "الاتجاه" : "Direction", accessor: (r: Communication) => r.direction },
      { header: isAr ? "الأولوية" : "Priority", accessor: (r: Communication) => r.priority },
      { header: isAr ? "الحالة" : "Status", accessor: (r: Communication) => r.status },
      { header: isAr ? "التاريخ" : "Date", accessor: (r: Communication) => r.created_at?.slice(0, 10) || "" },
      { header: isAr ? "العلامات" : "Tags", accessor: (r: Communication) => r.tags?.join(", ") || "" },
    ],
    filename: "communications",
  });

  // ─── Local State ─────────────────────────────────────────
  const [noteText, setNoteText] = useState("");

  // ─── Derived Data ────────────────────────────────────────
  const filteredMessages = searchQuery
    ? messages.filter((m) => {
        const company = companyMap.get(m.company_id);
        const companyName = (company?.name || "").toLowerCase();
        const q = searchQuery.toLowerCase();
        return m.subject.toLowerCase().includes(q) || m.message.toLowerCase().includes(q) || companyName.includes(q);
      })
    : messages;

  const unreadCount = messages.filter((m) => m.direction === "outgoing" && m.status === "unread").length;
  const urgentCount = messages.filter((m) => m.priority === "urgent" && m.status === "unread").length;
  const starredCount = messages.filter((m) => m.is_starred).length;

  // Analytics computations
  const analytics = useMemo(() => {
    if (allMessagesForAnalytics.length === 0) return null;
    const total = allMessagesForAnalytics.length;
    const incoming = allMessagesForAnalytics.filter((m: any) => m.direction === "outgoing").length;
    const outgoing = allMessagesForAnalytics.filter((m: any) => m.direction === "incoming").length;
    const urgent = allMessagesForAnalytics.filter((m: any) => m.priority === "urgent").length;

    // Response times
    const responseTimes = allMessagesForAnalytics
      .filter((m: any) => m.response_time_minutes != null)
      .map((m: any) => m.response_time_minutes as number);
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length)
      : 0;
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

    // Messages by hour
    const byHour: Record<number, number> = {};
    allMessagesForAnalytics.forEach((m: any) => {
      const hour = new Date(m.created_at).getHours();
      byHour[hour] = (byHour[hour] || 0) + 1;
    });
    const busiestHour = Object.entries(byHour).sort(([, a], [, b]) => (b as number) - (a as number))[0];

    // Messages by day of week
    const byDay: Record<number, number> = {};
    const dayNames = isAr
      ? ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    allMessagesForAnalytics.forEach((m: any) => {
      const day = new Date(m.created_at).getDay();
      byDay[day] = (byDay[day] || 0) + 1;
    });

    // SLA: % responded within 60 minutes
    const slaTarget = 60; // minutes
    const withinSLA = responseTimes.filter((t) => t <= slaTarget).length;
    const slaPercent = responseTimes.length > 0 ? Math.round((withinSLA / responseTimes.length) * 100) : 100;

    // Priority breakdown
    const byPriority = {
      urgent: allMessagesForAnalytics.filter((m: any) => m.priority === "urgent").length,
      high: allMessagesForAnalytics.filter((m: any) => m.priority === "high").length,
      normal: allMessagesForAnalytics.filter((m: any) => m.priority === "normal" || !m.priority).length,
      low: allMessagesForAnalytics.filter((m: any) => m.priority === "low").length,
    };

    return { total, incoming, outgoing, urgent, avgResponseTime, maxResponseTime, busiestHour, byDay, dayNames, slaPercent, slaTarget, byPriority, responseTimes };
  }, [allMessagesForAnalytics, isAr]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredMessages.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredMessages.map((m) => m.id)));
  };

  const openMessage = (msg: Communication) => {
    setSelectedMessage(msg);
    setReplyMessage("");
    setNoteText("");
    if (msg.direction === "outgoing" && msg.status === "unread") markReadMutation.mutate(msg.id);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent": return <Badge variant="destructive">{isAr ? "عاجل" : "Urgent"}</Badge>;
      case "high": return <Badge className="bg-chart-4/15 text-chart-4 border-chart-4/30">{isAr ? "مرتفع" : "High"}</Badge>;
      default: return null;
    }
  };

  const getTagBadge = (tag: string) => {
    const t = TAG_OPTIONS.find((o) => o.value === tag);
    if (!t) return <Badge variant="outline" key={tag}>{tag}</Badge>;
    return <Badge key={tag} className={`${t.color} border-0`}>{isAr ? t.labelAr : t.label}</Badge>;
  };

  const toggleTag = (msgId: string, tag: string, currentTags: string[]) => {
    const newTags = currentTags.includes(tag) ? currentTags.filter((t) => t !== tag) : [...currentTags, tag];
    updateTagsMutation.mutate({ id: msgId, tags: newTags });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={MessageSquare}
        title={isAr ? "صندوق التواصل" : "Communications Inbox"}
        description={isAr ? "عرض والرد على جميع رسائل الشركات مع التحليلات والعلامات" : "View and respond to company messages with analytics, tags & notes"}
        actions={
          <Button onClick={() => setComposeOpen(true)}>
            <Plus className="me-2 h-4 w-4" />
            {isAr ? "رسالة جديدة" : "New Message"}
          </Button>
        }
      />

      {/* Communications Live Stats */}
      <CommunicationsLiveWidget />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: isAr ? "الإجمالي" : "Total", value: messages.length, icon: Inbox, color: "text-primary" },
          { label: isAr ? "غير مقروءة" : "Unread", value: unreadCount, icon: AlertCircle, color: "text-destructive" },
          { label: isAr ? "عاجلة" : "Urgent", value: urgentCount, icon: Clock, color: "text-chart-4" },
          { label: isAr ? "مميّزة" : "Starred", value: starredCount, icon: Star, color: "text-chart-3" },
          { label: isAr ? "شركات" : "Companies", value: companyIds.length, icon: Building2, color: "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className={`h-7 w-7 ${s.color}`} />
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs: Inbox / Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            {isAr ? "صندوق الوارد" : "Inbox"}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            {isAr ? "التحليلات" : "Analytics"}
          </TabsTrigger>
        </TabsList>

        {/* ═══ INBOX TAB ═══ */}
        <TabsContent value="inbox" className="space-y-4">
          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex items-center justify-between p-3">
                <span className="text-sm font-medium">
                  {selectedIds.size} {isAr ? "محدد" : "selected"}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportMessages(filteredMessages.filter(m => selectedIds.has(m.id)))}>
                    <Download className="me-1 h-3.5 w-3.5" />
                    {isAr ? "تصدير" : "Export"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => bulkMarkReadMutation.mutate()}>
                    <Eye className="me-1 h-3.5 w-3.5" />
                    {isAr ? "قراءة" : "Mark Read"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => bulkArchiveMutation.mutate()}>
                    <Archive className="me-1 h-3.5 w-3.5" />
                    {isAr ? "أرشفة" : "Archive"}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => bulkDeleteMutation.mutate()}>
                    <Trash2 className="me-1 h-3.5 w-3.5" />
                    {isAr ? "حذف" : "Delete"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                    {isAr ? "إلغاء" : "Cancel"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? "بحث في الرسائل..." : "Search messages..."} className="ps-10" />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="unread">{isAr ? "غير مقروءة" : "Unread"}</SelectItem>
                <SelectItem value="outgoing">{isAr ? "من الشركات" : "From Companies"}</SelectItem>
                <SelectItem value="incoming">{isAr ? "من الإدارة" : "From Admin"}</SelectItem>
                <SelectItem value="starred">{isAr ? "مميّزة" : "Starred"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل الأولويات" : "All Priorities"}</SelectItem>
                <SelectItem value="urgent">{isAr ? "عاجل" : "Urgent"}</SelectItem>
                <SelectItem value="high">{isAr ? "مرتفع" : "High"}</SelectItem>
                <SelectItem value="normal">{isAr ? "عادي" : "Normal"}</SelectItem>
                <SelectItem value="low">{isAr ? "منخفض" : "Low"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-[140px]"><Tag className="me-1 h-3.5 w-3.5" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل العلامات" : "All Tags"}</SelectItem>
                {TAG_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{isAr ? t.labelAr : t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant={showArchived ? "secondary" : "outline"} size="sm" className="h-10" onClick={() => setShowArchived(!showArchived)}>
              <Archive className="me-1 h-3.5 w-3.5" />
              {isAr ? "الأرشيف" : "Archive"}
            </Button>
          </div>

          {/* Messages List & Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* ── List ── */}
            <div className="lg:col-span-2">
              <div className="mb-2 flex items-center gap-2">
                <Checkbox checked={selectedIds.size === filteredMessages.length && filteredMessages.length > 0}
                  onCheckedChange={toggleSelectAll} />
                <span className="text-xs text-muted-foreground">{isAr ? "تحديد الكل" : "Select All"}</span>
              </div>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2 pe-2">
                  {filteredMessages.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-16">
                        <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="text-lg font-medium">{isAr ? "لا توجد رسائل" : "No messages"}</p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredMessages.map((msg) => {
                      const company = companyMap.get(msg.company_id);
                      return (
                        <Card
                          key={msg.id}
                          className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                            selectedMessage?.id === msg.id ? "border-primary" : ""
                          } ${msg.direction === "outgoing" && msg.status === "unread" ? "border-s-[3px] border-s-primary" : ""}`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-2">
                              <Checkbox checked={selectedIds.has(msg.id)} onCheckedChange={() => toggleSelect(msg.id)}
                                className="mt-1" onClick={(e) => e.stopPropagation()} />
                              <div className="min-w-0 flex-1" onClick={() => openMessage(msg)}>
                                <div className="flex items-center gap-2 mb-1">
                                  {msg.direction === "outgoing" ? (
                                    <ArrowDownLeft className="h-3.5 w-3.5 shrink-0 text-primary" />
                                  ) : (
                                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                  )}
                                  <span className="text-xs text-muted-foreground truncate">
                                    {company ? (isAr && company.name_ar ? company.name_ar : company.name) : "Unknown"}
                                  </span>
                                  {msg.is_starred && <Star className="h-3 w-3 text-chart-3 fill-chart-3" />}
                                </div>
                                <p className={`truncate font-medium text-sm ${msg.direction === "outgoing" && msg.status === "unread" ? "font-bold" : ""}`}>
                                  {msg.subject}
                                </p>
                                <p className="truncate text-xs text-muted-foreground mt-0.5">{msg.message}</p>
                                {/* Tags */}
                                {msg.tags && msg.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {msg.tags.map((tag) => getTagBadge(tag))}
                                  </div>
                                )}
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1">
                                {msg.direction === "outgoing" && msg.status === "unread" && <div className="h-2 w-2 rounded-full bg-primary" />}
                                {msg.direction === "incoming" && msg.status === "read" && <CheckCheck className="h-3.5 w-3.5 text-primary" />}
                                <span className="text-[10px] text-muted-foreground">{format(new Date(msg.created_at), "MM/dd HH:mm")}</span>
                                {getPriorityBadge(msg.priority)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* ── Detail Panel ── */}
            <div className="lg:col-span-3">
              {selectedMessage ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{selectedMessage.subject}</CardTitle>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">
                          <Building2 className="me-1 h-3 w-3" />
                            {(() => { const c = companyMap.get(selectedMessage.company_id); return c ? (isAr && c.name_ar ? c.name_ar : c.name) : "Unknown"; })()}
                          </Badge>
                          {selectedMessage.direction === "outgoing" ? (
                            <Badge variant="outline"><ArrowDownLeft className="me-1 h-3 w-3" />{isAr ? "من الشركة" : "From Company"}</Badge>
                          ) : (
                            <Badge variant="outline"><ArrowUpRight className="me-1 h-3 w-3" />{isAr ? "من الإدارة" : "From Admin"}</Badge>
                          )}
                          {getPriorityBadge(selectedMessage.priority)}
                          <span>{format(new Date(selectedMessage.created_at), "yyyy-MM-dd HH:mm")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => toggleStarMutation.mutate({ id: selectedMessage.id, starred: !selectedMessage.is_starred })}>
                          {selectedMessage.is_starred
                            ? <Star className="h-4 w-4 text-chart-3 fill-chart-3" />
                            : <StarOff className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => { bulkArchiveMutation.mutate(); setSelectedIds(new Set([selectedMessage.id])); }}>
                          <Archive className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      {TAG_OPTIONS.map((tag) => (
                        <Badge key={tag.value}
                          className={`cursor-pointer transition-all ${(selectedMessage.tags || []).includes(tag.value) ? tag.color + " border-0" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                          onClick={() => toggleTag(selectedMessage.id, tag.value, selectedMessage.tags || [])}>
                          {isAr ? tag.labelAr : tag.label}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="whitespace-pre-wrap rounded-lg bg-muted/50 p-4">{selectedMessage.message}</div>

                    {/* Replies */}
                    {replies.filter((r) => !r.is_internal_note).length > 0 && (
                      <>
                        <Separator />
                        <p className="text-sm font-medium text-muted-foreground">
                          {replies.filter((r) => !r.is_internal_note).length} {isAr ? "ردود" : "Replies"}
                        </p>
                        {replies.filter((r) => !r.is_internal_note).map((reply) => (
                          <div key={reply.id}
                            className={`rounded-lg border p-4 ${reply.direction === "incoming" ? "ms-4 border-s-[3px] border-s-primary" : "me-4"}`}>
                            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                              <Badge variant="outline">
                                {reply.direction === "incoming" ? (isAr ? "الإدارة" : "Admin") : (isAr ? "الشركة" : "Company")}
                              </Badge>
                              <span>{format(new Date(reply.created_at), "yyyy-MM-dd HH:mm")}</span>
                            </div>
                            <p className="whitespace-pre-wrap">{reply.message}</p>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Internal Notes */}
                    {internalNotes.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-sm font-medium flex items-center gap-2 text-chart-3">
                            <StickyNote className="h-4 w-4" />
                            {isAr ? "ملاحظات داخلية" : "Internal Notes"} ({internalNotes.length})
                          </p>
                          {internalNotes.map((note) => (
                            <div key={note.id} className="rounded-lg border border-chart-3/30 bg-chart-3/5 p-3">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <Badge variant="outline" className="text-chart-3 border-chart-3/30">
                                  <StickyNote className="me-1 h-3 w-3" />
                                  {isAr ? "ملاحظة" : "Note"}
                                </Badge>
                                <span>{format(new Date(note.created_at), "yyyy-MM-dd HH:mm")}</span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{note.message}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Add Note Form */}
                    <Separator />
                    <div className="space-y-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <StickyNote className="h-4 w-4 text-chart-3" />
                        {isAr ? "إضافة ملاحظة داخلية" : "Add Internal Note"}
                      </p>
                      <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2}
                        placeholder={isAr ? "ملاحظة مرئية للإدارة فقط..." : "Note visible to admins only..."} />
                      <Button variant="outline" size="sm" disabled={!noteText || addNoteMutation.isPending}
                        onClick={() => addNoteMutation.mutate({ parentId: selectedMessage.id, companyId: selectedMessage.company_id, note: noteText })}>
                        <StickyNote className="me-2 h-3.5 w-3.5" />
                        {addNoteMutation.isPending ? (isAr ? "جارٍ..." : "Adding...") : (isAr ? "إضافة" : "Add Note")}
                      </Button>
                    </div>

                    {/* Reply Form */}
                    <Separator />
                    <div className="space-y-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Reply className="h-4 w-4" />
                        {isAr ? "رد سريع" : "Quick Reply"}
                      </p>
                      <Textarea value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} rows={4}
                        placeholder={isAr ? "اكتب ردك هنا..." : "Type your reply here..."} />
                      <div className="flex justify-end">
                        <Button disabled={!replyMessage || replyMutation.isPending}
                          onClick={() => replyMutation.mutate({ parentId: selectedMessage.id, companyId: selectedMessage.company_id })}>
                          <Send className="me-2 h-4 w-4" />
                          {replyMutation.isPending ? (isAr ? "جارٍ الإرسال..." : "Sending...") : (isAr ? "إرسال الرد" : "Send Reply")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-24">
                    <MessageSquare className="mb-4 h-16 w-16 text-muted-foreground/30" />
                    <p className="text-muted-foreground">{isAr ? "اختر رسالة لعرضها" : "Select a message to view"}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ═══ ANALYTICS TAB ═══ */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">{analytics.avgResponseTime}</p>
                    <p className="text-xs text-muted-foreground mt-1">{isAr ? "متوسط وقت الرد (دقيقة)" : "Avg Response Time (min)"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className={`text-3xl font-bold ${analytics.slaPercent >= 80 ? "text-chart-2" : analytics.slaPercent >= 50 ? "text-chart-4" : "text-destructive"}`}>
                      {analytics.slaPercent}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{isAr ? `ضمن SLA (${analytics.slaTarget} دقيقة)` : `Within SLA (${analytics.slaTarget}min)`}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold">{analytics.incoming}</p>
                    <p className="text-xs text-muted-foreground mt-1">{isAr ? "رسائل من الشركات" : "From Companies"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold">{analytics.outgoing}</p>
                    <p className="text-xs text-muted-foreground mt-1">{isAr ? "ردود الإدارة" : "Admin Replies"}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Busiest Hour */}
                <Card>
                  <CardHeader><CardTitle className="text-base">{isAr ? "أوقات الذروة" : "Peak Hours"}</CardTitle></CardHeader>
                  <CardContent>
                    {analytics.busiestHour && (
                      <div className="text-center mb-4">
                        <p className="text-4xl font-bold text-primary">{analytics.busiestHour[0]}:00</p>
                        <p className="text-sm text-muted-foreground">{isAr ? "أكثر ساعة نشاطاً" : "Busiest Hour"} ({analytics.busiestHour[1]} {isAr ? "رسالة" : "msgs"})</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Priority Breakdown */}
                <Card>
                  <CardHeader><CardTitle className="text-base">{isAr ? "توزيع الأولويات" : "Priority Breakdown"}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(analytics.byPriority).map(([key, val]) => {
                      const pct = analytics.total > 0 ? Math.round((val / analytics.total) * 100) : 0;
                      const colors: Record<string, string> = { urgent: "bg-destructive", high: "bg-chart-4", normal: "bg-primary", low: "bg-muted-foreground" };
                      const labels: Record<string, string> = isAr
                        ? { urgent: "عاجل", high: "مرتفع", normal: "عادي", low: "منخفض" }
                        : { urgent: "Urgent", high: "High", normal: "Normal", low: "Low" };
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>{labels[key]}</span>
                            <span className="text-muted-foreground">{val} ({pct}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${colors[key]}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Messages by Day */}
                <Card className="md:col-span-2">
                  <CardHeader><CardTitle className="text-base">{isAr ? "الرسائل حسب اليوم" : "Messages by Day"}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between gap-2 h-32">
                      {analytics.dayNames.map((day, i) => {
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

                {/* Response Time Distribution */}
                <Card className="md:col-span-2">
                  <CardHeader><CardTitle className="text-base">{isAr ? "توزيع أوقات الرد" : "Response Time Distribution"}</CardTitle></CardHeader>
                  <CardContent>
                    {analytics.responseTimes.length > 0 ? (
                      <div className="grid grid-cols-4 gap-4 text-center">
                        {[
                          { label: isAr ? "< 15 دقيقة" : "< 15 min", filter: (t: number) => t < 15 },
                          { label: isAr ? "15-60 دقيقة" : "15-60 min", filter: (t: number) => t >= 15 && t < 60 },
                          { label: isAr ? "1-4 ساعات" : "1-4 hours", filter: (t: number) => t >= 60 && t < 240 },
                          { label: isAr ? "> 4 ساعات" : "> 4 hours", filter: (t: number) => t >= 240 },
                        ].map((bucket) => {
                          const count = analytics.responseTimes.filter(bucket.filter).length;
                          const pct = Math.round((count / analytics.responseTimes.length) * 100);
                          return (
                            <div key={bucket.label} className="space-y-1">
                              <p className="text-2xl font-bold">{pct}%</p>
                              <p className="text-xs text-muted-foreground">{bucket.label}</p>
                              <p className="text-[10px] text-muted-foreground">({count})</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground py-8">
                        {isAr ? "لا توجد بيانات أوقات الرد بعد" : "No response time data yet"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">{isAr ? "جارٍ تحميل التحليلات..." : "Loading analytics..."}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ COMPOSE DIALOG ═══ */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? "رسالة جديدة" : "New Message"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isAr ? "الشركة" : "Company"}</Label>
              <Select value={composeForm.company_id} onValueChange={(v) => setComposeForm((p) => ({ ...p, company_id: v }))}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر شركة..." : "Select company..."} /></SelectTrigger>
                <SelectContent>
                  {allCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{isAr && c.name_ar ? c.name_ar : c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "الأولوية" : "Priority"}</Label>
              <Select value={composeForm.priority} onValueChange={(v) => setComposeForm((p) => ({ ...p, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{isAr ? "منخفض" : "Low"}</SelectItem>
                  <SelectItem value="normal">{isAr ? "عادي" : "Normal"}</SelectItem>
                  <SelectItem value="high">{isAr ? "مرتفع" : "High"}</SelectItem>
                  <SelectItem value="urgent">{isAr ? "عاجل" : "Urgent"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "الموضوع" : "Subject"}</Label>
              <Input value={composeForm.subject} onChange={(e) => setComposeForm((p) => ({ ...p, subject: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "الرسالة" : "Message"}</Label>
              <Textarea rows={5} value={composeForm.message} onChange={(e) => setComposeForm((p) => ({ ...p, message: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button disabled={!composeForm.company_id || !composeForm.subject || !composeForm.message || composeMutation.isPending}
              onClick={() => composeMutation.mutate()}>
              <Send className="me-2 h-4 w-4" />
              {composeMutation.isPending ? (isAr ? "جارٍ..." : "Sending...") : (isAr ? "إرسال" : "Send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
