import { useState, useRef, useEffect } from "react";
import { TicketSatisfactionRating } from "@/components/support/TicketSatisfactionRating";
import { ScrollToTopFAB } from "@/components/mobile/ScrollToTopFAB";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Ticket,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ArrowLeft,
  Search,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toEnglishDigits } from "@/lib/formatNumber";

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  subject_ar: string | null;
  description: string;
  description_ar: string | null;
  category: string;
  priority: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  message_ar: string | null;
  is_internal_note: boolean;
  created_at: string;
}

const CATEGORIES = [
  { value: "general", en: "General", ar: "عام" },
  { value: "account", en: "Account", ar: "الحساب" },
  { value: "competition", en: "Competition", ar: "المسابقة" },
  { value: "payment", en: "Payment", ar: "الدفع" },
  { value: "technical", en: "Technical", ar: "تقني" },
  { value: "suggestion", en: "Suggestion", ar: "اقتراح" },
];

const PRIORITIES = [
  { value: "low", en: "Low", ar: "منخفض" },
  { value: "normal", en: "Normal", ar: "عادي" },
  { value: "high", en: "High", ar: "مرتفع" },
  { value: "urgent", en: "Urgent", ar: "عاجل" },
];

export default function SupportTickets() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newReply, setNewReply] = useState("");

  // Create form
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newPriority, setNewPriority] = useState("normal");

  // Fetch tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["supportTickets", user?.id, statusFilter],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: !!user,
  });

  // Fetch messages for selected ticket
  const { data: ticketMessages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["ticketMessages", selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket) return [];
      const { data, error } = await supabase
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", selectedTicket.id)
        .eq("is_internal_note", false)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as TicketMessage[];
    },
    enabled: !!selectedTicket,
  });

  // Create ticket
  const createTicket = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        subject: newSubject,
        description: newDescription,
        category: newCategory,
        priority: newPriority,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
      setIsCreateOpen(false);
      // Notify admins about new support ticket
      import("@/lib/notificationTriggers").then(({ notifyAdminSupportTicket }) => {
        notifyAdminSupportTicket({
          ticketNumber: "",
          subject: newSubject,
          priority: newPriority,
          userName: user?.email || "User",
        });
      });
      setNewSubject("");
      setNewDescription("");
      setNewCategory("general");
      setNewPriority("normal");
      toast({ title: isAr ? "تم إنشاء التذكرة بنجاح" : "Ticket created successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  // Send reply
  const sendReply = useMutation({
    mutationFn: async () => {
      if (!user || !selectedTicket) throw new Error("Not ready");
      const { error } = await supabase.from("support_ticket_messages").insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        message: newReply,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticketMessages"] });
      setNewReply("");
      toast({ title: isAr ? "تم إرسال الرد" : "Reply sent" });
    },
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; en: string; ar: string }> = {
      open: { class: "bg-chart-4/10 text-chart-4", en: "Open", ar: "مفتوحة" },
      in_progress: { class: "bg-primary/10 text-primary", en: "In Progress", ar: "قيد المعالجة" },
      waiting: { class: "bg-chart-3/10 text-chart-3", en: "Waiting", ar: "في الانتظار" },
      resolved: { class: "bg-chart-5/10 text-chart-5", en: "Resolved", ar: "محلولة" },
      closed: { class: "bg-muted text-muted-foreground", en: "Closed", ar: "مغلقة" },
    };
    const s = map[status] || map.open;
    return <Badge className={s.class} variant="outline">{isAr ? s.ar : s.en}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, { class: string; en: string; ar: string }> = {
      low: { class: "bg-muted text-muted-foreground", en: "Low", ar: "منخفض" },
      normal: { class: "bg-chart-1/10 text-chart-1", en: "Normal", ar: "عادي" },
      high: { class: "bg-chart-4/10 text-chart-4", en: "High", ar: "مرتفع" },
      urgent: { class: "bg-destructive/10 text-destructive", en: "Urgent", ar: "عاجل" },
    };
    const p = map[priority] || map.normal;
    return <Badge className={p.class} variant="outline">{isAr ? p.ar : p.en}</Badge>;
  };

  const filteredTickets = tickets.filter(t =>
    !searchQuery || t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || t.ticket_number.includes(searchQuery)
  );

  const openCount = tickets.filter(t => t.status === "open" || t.status === "in_progress").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background py-12">
          <div className="absolute -top-32 start-1/4 h-64 w-64 rounded-full bg-primary/8 blur-[100px] animate-pulse pointer-events-none" />
          <div className="absolute -top-20 end-1/3 h-48 w-48 rounded-full bg-accent/10 blur-[80px] animate-pulse [animation-delay:1s] pointer-events-none" />
          <div className="container relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/15">
                  <Ticket className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-bold md:text-3xl">
                    {isAr ? "تذاكر الدعم" : "Support Tickets"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {isAr ? "أرسل تذكرة دعم وتابع حالتها" : "Submit and track your support requests"}
                  </p>
                </div>
              </div>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    {isAr ? "تذكرة جديدة" : "New Ticket"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{isAr ? "إنشاء تذكرة دعم" : "Create Support Ticket"}</DialogTitle>
                    <DialogDescription>
                      {isAr ? "صف مشكلتك وسيتم الرد عليك في أقرب وقت" : "Describe your issue and we'll respond as soon as possible"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder={isAr ? "الموضوع" : "Subject"}
                      value={newSubject}
                      onChange={e => setNewSubject(e.target.value)}
                    />
                    <Textarea
                      placeholder={isAr ? "وصف المشكلة..." : "Describe your issue..."}
                      rows={4}
                      value={newDescription}
                      onChange={e => setNewDescription(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Select value={newCategory} onValueChange={setNewCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => (
                            <SelectItem key={c.value} value={c.value}>
                              {isAr ? c.ar : c.en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={newPriority} onValueChange={setNewPriority}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map(p => (
                            <SelectItem key={p.value} value={p.value}>
                              {isAr ? p.ar : p.en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => createTicket.mutate()}
                      disabled={!newSubject.trim() || !newDescription.trim() || createTicket.isPending}
                    >
                      {createTicket.isPending
                        ? isAr ? "جاري الإنشاء..." : "Creating..."
                        : isAr ? "إرسال التذكرة" : "Submit Ticket"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <Card>
                <CardContent className="flex items-center gap-3 py-4">
                  <Ticket className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{isAr ? "الإجمالي" : "Total"}</p>
                    <p className="text-xl font-bold">{toEnglishDigits(tickets.length)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 py-4">
                  <Clock className="h-8 w-8 text-chart-4" />
                  <div>
                    <p className="text-xs text-muted-foreground">{isAr ? "مفتوحة" : "Open"}</p>
                    <p className="text-xl font-bold">{toEnglishDigits(openCount)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 py-4">
                  <CheckCircle2 className="h-8 w-8 text-chart-5" />
                  <div>
                    <p className="text-xs text-muted-foreground">{isAr ? "محلولة" : "Resolved"}</p>
                    <p className="text-xl font-bold">{toEnglishDigits(resolvedCount)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <div className="container py-6">
          {selectedTicket ? (
            /* Ticket Detail View */
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {isAr ? "العودة" : "Back to Tickets"}
              </Button>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{selectedTicket.ticket_number}</Badge>
                        {getStatusBadge(selectedTicket.status)}
                        {getPriorityBadge(selectedTicket.priority)}
                        <span className="text-xs text-muted-foreground">
                          {toEnglishDigits(format(new Date(selectedTicket.created_at), "yyyy-MM-dd HH:mm"))}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl bg-muted/50 p-4 mb-4">
                    <p className="whitespace-pre-wrap text-sm">{selectedTicket.description}</p>
                  </div>

                  <Separator className="my-4" />

                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    {isAr ? "الردود" : "Replies"} ({toEnglishDigits(ticketMessages.length)})
                  </h4>

                  {loadingMessages ? (
                    <div className="space-y-2">
                      {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[400px]">
                      <div className="space-y-3">
                        {ticketMessages.map(msg => {
                          const isMine = msg.sender_id === user?.id;
                          return (
                            <div
                              key={msg.id}
                              className={`rounded-xl border p-3 ${isMine ? "" : "border-s-[3px] border-s-primary bg-primary/5"}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {isMine ? (isAr ? "أنت" : "You") : (isAr ? "الدعم" : "Support")}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {toEnglishDigits(formatDistanceToNow(new Date(msg.created_at), {
                                    addSuffix: true,
                                    locale: isAr ? ar : enUS,
                                  }))}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}

                  {selectedTicket.status !== "closed" && (
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        if (newReply.trim()) sendReply.mutate();
                      }}
                      className="mt-4 flex gap-2"
                    >
                      <Input
                        value={newReply}
                        onChange={e => setNewReply(e.target.value)}
                        placeholder={isAr ? "اكتب ردك..." : "Type your reply..."}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={!newReply.trim() || sendReply.isPending} size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  )}

                  {/* Satisfaction Rating */}
                  <div className="mt-4">
                    <TicketSatisfactionRating
                      ticketId={selectedTicket.id}
                      ticketStatus={selectedTicket.status}
                      existingRating={(selectedTicket as any).satisfaction_rating}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Tickets List View */
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={isAr ? "بحث في التذاكر..." : "Search tickets..."}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="ps-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "جميع الحالات" : "All Status"}</SelectItem>
                    <SelectItem value="open">{isAr ? "مفتوحة" : "Open"}</SelectItem>
                    <SelectItem value="in_progress">{isAr ? "قيد المعالجة" : "In Progress"}</SelectItem>
                    <SelectItem value="resolved">{isAr ? "محلولة" : "Resolved"}</SelectItem>
                    <SelectItem value="closed">{isAr ? "مغلقة" : "Closed"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : filteredTickets.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Ticket className="mb-4 h-12 w-12 text-muted-foreground/30" />
                    <p className="text-lg font-medium">{isAr ? "لا توجد تذاكر" : "No tickets found"}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isAr ? "أنشئ تذكرة جديدة للحصول على المساعدة" : "Create a new ticket to get help"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {filteredTickets.map(ticket => (
                    <Card
                      key={ticket.id}
                      className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm hover:-translate-y-0.5"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <CardContent className="flex items-center gap-4 py-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground font-mono">{ticket.ticket_number}</span>
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                          </div>
                          <p className="font-medium truncate">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{ticket.description}</p>
                        </div>
                        <div className="text-end shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {toEnglishDigits(formatDistanceToNow(new Date(ticket.created_at), {
                              addSuffix: true,
                              locale: isAr ? ar : enUS,
                            }))}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <ScrollToTopFAB />
      <Footer />
    </div>
  );
}
