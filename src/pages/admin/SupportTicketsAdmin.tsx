import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
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
import { useToast } from "@/hooks/use-toast";
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
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Ticket className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold sm:text-2xl">
            {isAr ? "إدارة تذاكر الدعم" : "Support Tickets"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isAr ? "إدارة ومعالجة جميع طلبات الدعم" : "Manage and respond to all support requests"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: Ticket, label: isAr ? "الإجمالي" : "Total", value: stats.total, color: "text-primary", bg: "bg-primary/10" },
          { icon: AlertCircle, label: isAr ? "مفتوحة" : "Open", value: stats.open, color: "text-chart-4", bg: "bg-chart-4/10" },
          { icon: Clock, label: isAr ? "قيد المعالجة" : "In Progress", value: stats.inProgress, color: "text-chart-3", bg: "bg-chart-3/10" },
          { icon: CheckCircle2, label: isAr ? "محلولة" : "Resolved", value: stats.resolved, color: "text-chart-5", bg: "bg-chart-5/10" },
          { icon: XCircle, label: isAr ? "عاجلة" : "Urgent", value: stats.urgent, color: "text-destructive", bg: "bg-destructive/10" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 py-4">
              <div className={`rounded-full p-2 ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTicket ? (
        /* Detail View */
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedTicketId(null)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {isAr ? "العودة" : "Back"}
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedTicket.subject}</CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{selectedTicket.ticket_number}</Badge>
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                    <Badge variant="outline">
                      <Users className="me-1 h-3 w-3" />
                      {profileMap.get(selectedTicket.user_id)?.full_name || "Unknown"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedTicket.status !== "resolved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus.mutate({ id: selectedTicket.id, status: "resolved" })}
                    >
                      <CheckCircle2 className="me-1 h-3 w-3" />
                      {isAr ? "تم الحل" : "Resolve"}
                    </Button>
                  )}
                  {selectedTicket.status !== "closed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateStatus.mutate({ id: selectedTicket.id, status: "closed" })}
                    >
                      <XCircle className="me-1 h-3 w-3" />
                      {isAr ? "إغلاق" : "Close"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/50 p-4 mb-4">
                <p className="whitespace-pre-wrap text-sm">{selectedTicket.description}</p>
                <span className="text-[10px] text-muted-foreground block mt-2">
                  {format(new Date(selectedTicket.created_at), "yyyy-MM-dd HH:mm")}
                </span>
              </div>

              <Separator className="my-4" />

              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                {isAr ? "الردود والملاحظات" : "Replies & Notes"} ({ticketMessages.length})
              </h4>

              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3">
                  {ticketMessages.map(msg => {
                    const isSelf = msg.sender_id === user?.id;
                    const isUser = msg.sender_id === selectedTicket.user_id;
                    const profile = profileMap.get(msg.sender_id);

                    return (
                      <div
                        key={msg.id}
                        className={`rounded-lg border p-3 ${
                          msg.is_internal_note
                            ? "bg-chart-4/5 border-chart-4/30 border-dashed"
                            : isUser
                            ? ""
                            : "border-s-[3px] border-s-primary bg-primary/5"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {isUser ? (isAr ? "المستخدم" : "User") : (isAr ? "الدعم" : "Support")}
                            </Badge>
                            {msg.is_internal_note && (
                              <Badge variant="secondary" className="text-[10px]">
                                {isAr ? "ملاحظة داخلية" : "Internal Note"}
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
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {selectedTicket.status !== "closed" && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={e => setIsInternalNote(e.target.checked)}
                        className="rounded"
                      />
                      {isAr ? "ملاحظة داخلية (لن يراها المستخدم)" : "Internal note (hidden from user)"}
                    </label>
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
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!newReply.trim() || sendReply.isPending} className="self-end">
                      <Send className="h-4 w-4" />
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
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث..." : "Search..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="open">{isAr ? "مفتوحة" : "Open"}</SelectItem>
                <SelectItem value="in_progress">{isAr ? "قيد المعالجة" : "In Progress"}</SelectItem>
                <SelectItem value="resolved">{isAr ? "محلولة" : "Resolved"}</SelectItem>
                <SelectItem value="closed">{isAr ? "مغلقة" : "Closed"}</SelectItem>
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
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Ticket className="mb-4 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">{isAr ? "لا توجد تذاكر" : "No tickets found"}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? "الرقم" : "Ticket #"}</TableHead>
                      <TableHead>{isAr ? "الموضوع" : "Subject"}</TableHead>
                      <TableHead>{isAr ? "المستخدم" : "User"}</TableHead>
                      <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{isAr ? "الأولوية" : "Priority"}</TableHead>
                      <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                    </TableRow>
                  </TableHeader>
                   <TableBody>
                    {filteredTickets.map(ticket => {
                      const profile = profileMap.get(ticket.user_id);
                      return (
                        <TableRow
                          key={ticket.id}
                          className="cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => setSelectedTicketId(ticket.id)}
                        >
                          <TableCell className="font-mono text-xs">{ticket.ticket_number}</TableCell>
                          <TableCell>
                            <p className="font-medium max-w-[240px] truncate">{ticket.subject}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                                {(profile?.full_name || "U")[0].toUpperCase()}
                              </div>
                              <span className="text-sm truncate">{profile?.full_name || "Unknown"}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
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
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
