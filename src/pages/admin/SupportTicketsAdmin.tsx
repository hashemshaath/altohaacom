import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { useCSVExport } from "@/hooks/useCSVExport";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { TicketPerformanceWidget } from "@/components/admin/TicketPerformanceWidget";
import { TicketEscalationWidget } from "@/components/admin/TicketEscalationWidget";
import { SupportSatisfactionWidget } from "@/components/admin/SupportSatisfactionWidget";
import { MessagingAdminOverview } from "@/components/admin/MessagingAdminOverview";
import { SupportOverviewWidget } from "@/components/admin/SupportOverviewWidget";
import {
  Ticket,
  Search,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  MessageSquare,
  ArrowLeft,
  UserCheck,
  XCircle,
  Timer,
  Zap,
  MessageCircle,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInHours, differenceInMinutes } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ─── SLA Thresholds (hours) ─────────────────────────────────
const SLA_THRESHOLDS: Record<string, { warning: number; breach: number }> = {
  urgent: { warning: 1, breach: 4 },
  high: { warning: 4, breach: 8 },
  normal: { warning: 8, breach: 24 },
  low: { warning: 24, breach: 72 },
};

// ─── Canned Responses ───────────────────────────────────────
const CANNED_RESPONSES = [
  { key: "ack", en: "Thank you for reaching out. We've received your request and are looking into it. We'll get back to you shortly.", ar: "شكرًا للتواصل معنا. لقد تلقينا طلبك وسنرد عليك قريبًا." },
  { key: "info", en: "Could you please provide more details about the issue you're experiencing? Screenshots or error messages would be helpful.", ar: "هل يمكنك تقديم مزيد من التفاصيل حول المشكلة؟ لقطات الشاشة أو رسائل الخطأ ستكون مفيدة." },
  { key: "resolved", en: "The issue has been resolved. Please let us know if you need any further assistance.", ar: "تم حل المشكلة. يرجى إعلامنا إذا كنت بحاجة إلى مزيد من المساعدة." },
  { key: "escalated", en: "Your ticket has been escalated to our senior team for further investigation. We'll update you as soon as possible.", ar: "تم تصعيد تذكرتك إلى الفريق المتخصص لمزيد من التحقيق. سنحدثك في أقرب وقت." },
  { key: "followup", en: "We're following up on your ticket. Is the issue still persisting, or has it been resolved?", ar: "نتابع تذكرتك. هل المشكلة لا تزال قائمة أم تم حلها؟" },
];

function getSlaIndicator(priority: string, createdAt: string, status: string, isAr: boolean) {
  if (status === "resolved" || status === "closed") return null;
  const thresholds = SLA_THRESHOLDS[priority] || SLA_THRESHOLDS.normal;
  const hours = differenceInHours(new Date(), new Date(createdAt));
  const mins = differenceInMinutes(new Date(), new Date(createdAt));

  if (hours >= thresholds.breach) {
    return (
      <Badge variant="destructive" className="gap-1 text-[9px] animate-pulse">
        <Timer className="h-3 w-3" />
        {isAr ? "تجاوز SLA" : "SLA Breached"}
      </Badge>
    );
  }
  if (hours >= thresholds.warning) {
    return (
      <Badge className="gap-1 text-[9px] bg-chart-4/10 text-chart-4 border-chart-4/30" variant="outline">
        <Timer className="h-3 w-3" />
        {isAr ? "تحذير SLA" : "SLA Warning"}
      </Badge>
    );
  }
  const remaining = thresholds.breach * 60 - mins;
  const remHours = Math.floor(remaining / 60);
  const remMins = remaining % 60;
  return (
    <span className="text-[9px] text-muted-foreground flex items-center gap-1">
      <Clock className="h-3 w-3" />
      {remHours}h {remMins}m
    </span>
  );
}

export default function SupportTicketsAdmin() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newReply, setNewReply] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Fetch all tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["adminTickets", statusFilter, priorityFilter],
    queryFn: async () => {
      let query = supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (priorityFilter !== "all") query = query.eq("priority", priorityFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch user profiles for tickets
  const userIds = [...new Set(tickets.map(t => t.user_id))];
  const { data: profiles = [] } = useQuery({
    queryKey: ["ticketProfiles", userIds.join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", userIds);
      return data || [];
    },
    enabled: userIds.length > 0,
  });

  const profileMap = new Map(profiles.map(p => [p.user_id, p]));
  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  // Fetch messages
  const { data: ticketMessages = [] } = useQuery({
    queryKey: ["adminTicketMessages", selectedTicketId],
    queryFn: async () => {
      if (!selectedTicketId) return [];
      const { data, error } = await supabase
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", selectedTicketId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTicketId,
  });

  // Update ticket status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "resolved") updates.resolved_at = new Date().toISOString();
      if (status === "closed") updates.closed_at = new Date().toISOString();
      if (status === "in_progress" && !tickets.find(t => t.id === id)?.assigned_to) {
        updates.assigned_to = user?.id;
      }

      const { error } = await supabase.from("support_tickets").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTickets"] });
      toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
    },
  });

  // Send reply
  const sendReply = useMutation({
    mutationFn: async () => {
      if (!user || !selectedTicketId) throw new Error("Not ready");
      const { error } = await supabase.from("support_ticket_messages").insert({
        ticket_id: selectedTicketId,
        sender_id: user.id,
        message: newReply,
        is_internal_note: isInternalNote,
      });
      if (error) throw error;

      // Auto-update status to in_progress if open
      if (selectedTicket?.status === "open") {
        await supabase
          .from("support_tickets")
          .update({ status: "in_progress", assigned_to: user.id })
          .eq("id", selectedTicketId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTicketMessages"] });
      queryClient.invalidateQueries({ queryKey: ["adminTickets"] });
      setNewReply("");
      setIsInternalNote(false);
      toast({ title: isAr ? "تم الإرسال" : "Sent" });
    },
  });

  const filteredTickets = tickets.filter(t =>
    !searchQuery ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.ticket_number.includes(searchQuery) ||
    profileMap.get(t.user_id)?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved" || t.status === "closed").length,
    urgent: tickets.filter(t => t.priority === "urgent" && t.status !== "closed").length,
    slaBreach: tickets.filter(t => {
      if (t.status === "resolved" || t.status === "closed") return false;
      const thresh = SLA_THRESHOLDS[t.priority] || SLA_THRESHOLDS.normal;
      return differenceInHours(new Date(), new Date(t.created_at)) >= thresh.breach;
    }).length,
  };

  const bulk = useAdminBulkActions(filteredTickets);

  const { exportCSV: exportTicketsCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الرقم" : "Ticket #", accessor: (t: any) => t.ticket_number },
      { header: isAr ? "الموضوع" : "Subject", accessor: (t: any) => t.subject },
      { header: isAr ? "المستخدم" : "User", accessor: (t: any) => profileMap.get(t.user_id)?.full_name || "Unknown" },
      { header: isAr ? "الحالة" : "Status", accessor: (t: any) => t.status },
      { header: isAr ? "الأولوية" : "Priority", accessor: (t: any) => t.priority },
      { header: isAr ? "التاريخ" : "Date", accessor: (t: any) => t.created_at?.split("T")[0] || "" },
    ],
    filename: "support-tickets",
  });

  const bulkStatusChange = async (status: string) => {
    const ids = [...bulk.selected];
    const updates: any = { status };
    if (status === "resolved") updates.resolved_at = new Date().toISOString();
    if (status === "closed") updates.closed_at = new Date().toISOString();
    const { error } = await supabase.from("support_tickets").update(updates).in("id", ids);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["adminTickets"] });
      bulk.clearSelection();
      toast({ title: isAr ? `تم تحديث ${ids.length} تذكرة` : `Updated ${ids.length} tickets` });
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; label: string }> = {
      open: { class: "bg-chart-4/10 text-chart-4", label: isAr ? "مفتوحة" : "Open" },
      in_progress: { class: "bg-primary/10 text-primary", label: isAr ? "قيد المعالجة" : "In Progress" },
      waiting: { class: "bg-chart-3/10 text-chart-3", label: isAr ? "في الانتظار" : "Waiting" },
      resolved: { class: "bg-chart-5/10 text-chart-5", label: isAr ? "محلولة" : "Resolved" },
      closed: { class: "bg-muted text-muted-foreground", label: isAr ? "مغلقة" : "Closed" },
    };
    const s = map[status] || map.open;
    return <Badge className={s.class} variant="outline">{s.label}</Badge>;
  };

  const getPriorityBadge = (p: string) => {
    if (p === "urgent") return <Badge variant="destructive">{isAr ? "عاجل" : "Urgent"}</Badge>;
    if (p === "high") return <Badge className="bg-chart-4/10 text-chart-4" variant="outline">{isAr ? "مرتفع" : "High"}</Badge>;
    return null;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <AdminPageHeader
        icon={Ticket}
        title={isAr ? "تذاكر الدعم" : "Support Tickets"}
        description={isAr ? "إدارة طلبات الدعم" : "Manage support requests"}
      />

      {/* Messaging Overview */}
      <MessagingAdminOverview />

      {/* Support Overview */}
      <SupportOverviewWidget />

      {/* Performance Widget */}
      <TicketPerformanceWidget />

      {/* Escalation & SLA Widget */}
      <TicketEscalationWidget />

      {/* Support Satisfaction & Performance */}
      <SupportSatisfactionWidget />

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {[
          { icon: Ticket, label: isAr ? "الكل" : "Total", value: stats.total, color: "primary" },
          { icon: AlertCircle, label: isAr ? "مفتوحة" : "Open", value: stats.open, color: "chart-4" },
          { icon: Clock, label: isAr ? "جارية" : "Active", value: stats.inProgress, color: "chart-3" },
          { icon: CheckCircle2, label: isAr ? "محلولة" : "Done", value: stats.resolved, color: "chart-5" },
          { icon: XCircle, label: isAr ? "عاجلة" : "Urgent", value: stats.urgent, color: "destructive" },
          { icon: Timer, label: "SLA", value: stats.slaBreach, color: "destructive" },
        ].map(s => (
          <Card key={s.label} className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <CardContent className="flex items-center gap-2 p-2.5 sm:py-4 sm:px-3">
              <div className={cn(
                "flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                `bg-${s.color}/10`
              )}>
                <s.icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", `text-${s.color}`)} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate font-medium">{s.label}</p>
                <p className="text-base sm:text-xl font-bold tabular-nums">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTicket ? (
        /* Detail View */
        <div className="space-y-3 sm:space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedTicketId(null)} className="gap-2 h-8 rounded-xl">
            <ArrowLeft className="h-3.5 w-3.5" />
            {isAr ? "العودة" : "Back"}
          </Button>

          <Card className="rounded-2xl border-border/50">
            <CardHeader className="p-3 sm:p-6 border-b border-border/30">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-sm sm:text-base">{selectedTicket.subject}</CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <Badge variant="outline" className="text-[10px]">{selectedTicket.ticket_number}</Badge>
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                    {getSlaIndicator(selectedTicket.priority, selectedTicket.created_at, selectedTicket.status, isAr)}
                    <Badge variant="outline" className="text-[10px]">
                      <Users className="me-1 h-3 w-3" />
                      {profileMap.get(selectedTicket.user_id)?.full_name || "Unknown"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1.5 sm:gap-2 shrink-0">
                  {selectedTicket.status !== "resolved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 sm:h-8 text-xs px-2 sm:px-3 rounded-xl"
                      onClick={() => updateStatus.mutate({ id: selectedTicket.id, status: "resolved" })}
                    >
                      <CheckCircle2 className="me-1 h-3 w-3" />
                      {isAr ? "حل" : "Resolve"}
                    </Button>
                  )}
                  {selectedTicket.status !== "closed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 sm:h-8 text-xs px-2 sm:px-3 rounded-xl"
                      onClick={() => updateStatus.mutate({ id: selectedTicket.id, status: "closed" })}
                    >
                      <XCircle className="me-1 h-3 w-3" />
                      {isAr ? "إغلاق" : "Close"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="rounded-xl bg-muted/40 border border-border/30 p-3 sm:p-4 mb-3 sm:mb-4">
                <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">{selectedTicket.description}</p>
                <span className="text-[10px] text-muted-foreground block mt-2">
                  {format(new Date(selectedTicket.created_at), "yyyy-MM-dd HH:mm")}
                </span>
              </div>

              <Separator className="my-3 sm:my-4" />

              <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                {isAr ? "الردود" : "Replies"} ({ticketMessages.length})
              </h4>

              <ScrollArea className="max-h-[300px] sm:max-h-[400px]">
                <div className="space-y-2 sm:space-y-3">
                  {ticketMessages.map(msg => {
                    const isUser = msg.sender_id === selectedTicket.user_id;

                    return (
                      <div
                        key={msg.id}
                         className={cn(
                          "rounded-xl border p-3",
                          msg.is_internal_note
                            ? "bg-chart-4/5 border-chart-4/30 border-dashed"
                            : isUser
                            ? "bg-muted/30 border-border/30"
                            : "border-s-[3px] border-s-primary bg-primary/[0.03]"
                        )}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">
                              {isUser ? (isAr ? "المستخدم" : "User") : (isAr ? "الدعم" : "Support")}
                            </Badge>
                            {msg.is_internal_note && (
                              <Badge variant="secondary" className="text-[9px]">
                                {isAr ? "داخلية" : "Internal"}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.created_at), {
                              addSuffix: true,
                              locale: isAr ? ar : enUS,
                            })}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {selectedTicket.status !== "closed" && (
                <div className="mt-3 sm:mt-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] sm:text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={e => setIsInternalNote(e.target.checked)}
                        className="rounded"
                      />
                      {isAr ? "ملاحظة داخلية" : "Internal note"}
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1 h-7 text-[11px] rounded-xl">
                          <Zap className="h-3 w-3" />
                          <span className="hidden sm:inline">{isAr ? "ردود سريعة" : "Quick Replies"}</span>
                          <span className="sm:hidden">{isAr ? "سريع" : "Quick"}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-72 sm:w-80 rounded-xl">
                        {CANNED_RESPONSES.map(r => (
                          <DropdownMenuItem
                            key={r.key}
                            onClick={() => setNewReply(isAr ? r.ar : r.en)}
                            className="flex-col items-start gap-1 py-2"
                          >
                            <span className="text-xs font-medium capitalize">{r.key}</span>
                            <span className="text-[11px] text-muted-foreground line-clamp-2">
                              {isAr ? r.ar : r.en}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      if (newReply.trim()) sendReply.mutate();
                    }}
                    className="flex gap-2"
                  >
                    <Textarea
                      value={newReply}
                      onChange={e => setNewReply(e.target.value)}
                      placeholder={isAr ? "اكتب الرد..." : "Type your reply..."}
                      rows={2}
                      className="flex-1 text-xs sm:text-sm rounded-xl"
                    />
                    <Button type="submit" size="sm" disabled={!newReply.trim() || sendReply.isPending} className="self-end h-9 w-9 p-0 rounded-xl">
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* List View */
        <>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-[140px] sm:min-w-[200px]">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث..." : "Search..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="ps-8 h-8 sm:h-9 text-xs sm:text-sm rounded-xl bg-muted/30 border-border/40"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[100px] sm:w-[140px] h-8 sm:h-9 text-xs sm:text-sm rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="open">{isAr ? "مفتوحة" : "Open"}</SelectItem>
                <SelectItem value="in_progress">{isAr ? "جارية" : "Active"}</SelectItem>
                <SelectItem value="resolved">{isAr ? "محلولة" : "Resolved"}</SelectItem>
                <SelectItem value="closed">{isAr ? "مغلقة" : "Closed"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[100px] sm:w-[140px] h-8 sm:h-9 text-xs sm:text-sm rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="urgent">{isAr ? "عاجل" : "Urgent"}</SelectItem>
                <SelectItem value="high">{isAr ? "مرتفع" : "High"}</SelectItem>
                <SelectItem value="normal">{isAr ? "عادي" : "Normal"}</SelectItem>
                <SelectItem value="low">{isAr ? "منخفض" : "Low"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <BulkActionBar
            count={bulk.count}
            onClear={bulk.clearSelection}
            onStatusChange={bulkStatusChange}
            onExport={() => exportTicketsCSV(bulk.count > 0 ? bulk.selectedItems : filteredTickets)}
          />

          <Card className="rounded-2xl border-border/50 overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 sm:p-6 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 mb-3">
                    <Ticket className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">{isAr ? "لا توجد تذاكر" : "No tickets found"}</p>
                </div>
              ) : (
                <>
                  {/* Mobile card list */}
                  <div className="sm:hidden divide-y divide-border">
                    {filteredTickets.map(ticket => {
                      const profile = profileMap.get(ticket.user_id);
                      return (
                         <div
                          key={ticket.id}
                          className="flex items-start gap-2.5 px-3 py-3 active:bg-accent/50 cursor-pointer transition-all duration-200 hover:bg-accent/30"
                          onClick={() => setSelectedTicketId(ticket.id)}
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted text-[10px] font-semibold mt-0.5">
                            {(profile?.full_name || "U")[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{ticket.subject}</p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-[10px] font-mono text-muted-foreground">{ticket.ticket_number}</span>
                              {getStatusBadge(ticket.status)}
                              {getPriorityBadge(ticket.priority)}
                              {getSlaIndicator(ticket.priority, ticket.created_at, ticket.status, isAr)}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {profile?.full_name || "Unknown"} · {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: isAr ? ar : enUS })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} />
                          </TableHead>
                          <TableHead>{isAr ? "الرقم" : "Ticket #"}</TableHead>
                          <TableHead>{isAr ? "الموضوع" : "Subject"}</TableHead>
                          <TableHead>{isAr ? "المستخدم" : "User"}</TableHead>
                          <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                          <TableHead>{isAr ? "الأولوية" : "Priority"}</TableHead>
                          <TableHead>SLA</TableHead>
                          <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTickets.map(ticket => {
                          const profile = profileMap.get(ticket.user_id);
                          return (
                            <TableRow
                              key={ticket.id}
                              className={cn(
                                "cursor-pointer hover:bg-accent/50 transition-all duration-200",
                                bulk.isSelected(ticket.id) && "bg-primary/5"
                              )}
                              onClick={() => setSelectedTicketId(ticket.id)}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox checked={bulk.isSelected(ticket.id)} onCheckedChange={() => bulk.toggleOne(ticket.id)} />
                              </TableCell>
                              <TableCell className="font-mono text-xs">{ticket.ticket_number}</TableCell>
                              <TableCell>
                                <p className="font-medium max-w-[240px] truncate">{ticket.subject}</p>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-muted text-[10px] font-semibold">
                                    {(profile?.full_name || "U")[0].toUpperCase()}
                                  </div>
                                  <span className="text-sm truncate">{profile?.full_name || "Unknown"}</span>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                              <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                              <TableCell>
                                {getSlaIndicator(ticket.priority, ticket.created_at, ticket.status, isAr)}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(ticket.created_at), {
                                  addSuffix: true,
                                  locale: isAr ? ar : enUS,
                                })}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
