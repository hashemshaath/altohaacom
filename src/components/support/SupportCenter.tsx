import { useState, useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle, Plus, MessageSquare, Clock, CheckCircle, AlertCircle, Search, BookOpen, ChevronRight, Send, LifeBuoy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string; labelAr: string }> = {
  open: { color: "bg-blue-100 text-blue-700", icon: AlertCircle, label: "Open", labelAr: "مفتوح" },
  in_progress: { color: "bg-amber-100 text-amber-700", icon: Clock, label: "In Progress", labelAr: "قيد المعالجة" },
  resolved: { color: "bg-green-100 text-green-700", icon: CheckCircle, label: "Resolved", labelAr: "تم الحل" },
  closed: { color: "bg-slate-100 text-slate-700", icon: CheckCircle, label: "Closed", labelAr: "مغلق" },
};

const FAQ_ITEMS = [
  { q: "How do I reset my password?", qAr: "كيف أعيد تعيين كلمة المرور؟", a: "Go to Settings → Security → Change Password", aAr: "اذهب إلى الإعدادات → الأمان → تغيير كلمة المرور" },
  { q: "How do I join a competition?", qAr: "كيف أشارك في مسابقة؟", a: "Browse Competitions → Select → Register. You'll receive a confirmation.", aAr: "تصفح المسابقات → اختر → سجّل. ستتلقى تأكيداً." },
  { q: "How do I update my profile?", qAr: "كيف أحدّث ملفي الشخصي؟", a: "Go to Profile → Edit Profile to update your information.", aAr: "اذهب إلى الملف الشخصي → تعديل الملف لتحديث معلوماتك." },
  { q: "How do I contact support?", qAr: "كيف أتواصل مع الدعم؟", a: "Use this support center to create a ticket, or email us.", aAr: "استخدم مركز الدعم هذا لإنشاء تذكرة، أو راسلنا عبر البريد." },
  { q: "How do I cancel an order?", qAr: "كيف ألغي طلباً؟", a: "Go to Orders → Select the order → Cancel. Note: some orders cannot be cancelled once shipped.", aAr: "اذهب إلى الطلبات → اختر الطلب → إلغاء. ملاحظة: بعض الطلبات لا يمكن إلغاؤها بعد الشحن." },
];

export function SupportCenter() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("tickets");
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", priority: "normal", category: "general" });
  const [searchFaq, setSearchFaq] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["my-support-tickets", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("id, ticket_number, subject, subject_ar, description, category, priority, status, user_id, assigned_to, created_at, updated_at, resolved_at, closed_at, satisfaction_rating")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: replies = [] } = useQuery({
    queryKey: ["ticket-replies", selectedTicket?.id],
    queryFn: async () => {
      const { data } = await (supabase
        .from("support_ticket_replies" as any)
        .select("id, ticket_id, sender_id, message, message_ar, is_internal, created_at")
        .eq("ticket_id", selectedTicket!.id)
        .order("created_at", { ascending: true }) as any);
      return data || [];
    },
    enabled: !!selectedTicket?.id,
  });

  const createTicket = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user!.id,
        subject: form.subject,
        description: form.description,
        priority: form.priority,
        category: form.category,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-support-tickets"] });
      setNewTicketOpen(false);
      setForm({ subject: "", description: "", priority: "normal", category: "general" });
      toast({ title: isAr ? "تم إنشاء التذكرة بنجاح" : "Ticket created successfully" });
    },
    onError: () => toast({ title: isAr ? "حدث خطأ" : "Error creating ticket", variant: "destructive" }),
  });

  const sendReply = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from("support_ticket_replies" as any).insert({
        ticket_id: selectedTicket.id,
        user_id: user!.id,
        content: replyText,
        is_staff: false,
      } as any) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-replies"] });
      setReplyText("");
    },
  });

  const filteredFaq = useMemo(() => FAQ_ITEMS.filter(f => {
    if (!searchFaq) return true;
    const text = isAr ? `${f.qAr} ${f.aAr}` : `${f.q} ${f.a}`;
    return text.toLowerCase().includes(searchFaq.toLowerCase());
  }), [searchFaq, isAr]);

  const openCount = useMemo(() => tickets.filter(t => t.status === "open" || t.status === "in_progress").length, [tickets]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-primary" />
            {isAr ? "مركز الدعم" : "Support Center"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {openCount > 0 ? `${openCount} ${isAr ? "تذكرة مفتوحة" : "open tickets"}` : (isAr ? "لا توجد تذاكر مفتوحة" : "No open tickets")}
          </p>
        </div>
        <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              {isAr ? "تذكرة جديدة" : "New Ticket"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isAr ? "إنشاء تذكرة دعم" : "Create Support Ticket"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm">{isAr ? "الموضوع" : "Subject"}</Label>
                <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder={isAr ? "عنوان المشكلة" : "Brief title"} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{isAr ? "الوصف" : "Description"}</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={isAr ? "صف المشكلة بالتفصيل..." : "Describe your issue..."} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">{isAr ? "الأولوية" : "Priority"}</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{isAr ? "منخفضة" : "Low"}</SelectItem>
                      <SelectItem value="normal">{isAr ? "عادية" : "Normal"}</SelectItem>
                      <SelectItem value="high">{isAr ? "عالية" : "High"}</SelectItem>
                      <SelectItem value="urgent">{isAr ? "عاجلة" : "Urgent"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{isAr ? "الفئة" : "Category"}</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">{isAr ? "عام" : "General"}</SelectItem>
                      <SelectItem value="account">{isAr ? "الحساب" : "Account"}</SelectItem>
                      <SelectItem value="billing">{isAr ? "الفوترة" : "Billing"}</SelectItem>
                      <SelectItem value="competition">{isAr ? "المسابقات" : "Competitions"}</SelectItem>
                      <SelectItem value="technical">{isAr ? "تقني" : "Technical"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => createTicket.mutate()} disabled={!form.subject || !form.description} className="w-full">
                {isAr ? "إرسال التذكرة" : "Submit Ticket"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="tickets" className="gap-1"><MessageSquare className="h-3.5 w-3.5" />{isAr ? "تذاكري" : "My Tickets"}</TabsTrigger>
          <TabsTrigger value="faq" className="gap-1"><BookOpen className="h-3.5 w-3.5" />{isAr ? "أسئلة شائعة" : "FAQ"}</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-4 space-y-2">
          {selectedTicket ? (
            <div className="space-y-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
                ← {isAr ? "العودة" : "Back"}
              </Button>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{selectedTicket.subject}</CardTitle>
                    <Badge className={STATUS_CONFIG[selectedTicket.status]?.color || ""}>{isAr ? STATUS_CONFIG[selectedTicket.status]?.labelAr : STATUS_CONFIG[selectedTicket.status]?.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">#{selectedTicket.ticket_number}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{selectedTicket.description}</p>
                  <Separator className="my-3" />
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-3">
                      {replies.map((r: any) => (
                        <div key={r.id} className={cn("p-3 rounded-xl text-sm", r.is_staff ? "bg-primary/5 border-s-2 border-primary" : "bg-muted")}>
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-[10px]">{r.is_staff ? (isAr ? "فريق الدعم" : "Support Team") : (isAr ? "أنت" : "You")}</Badge>
                            <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: isAr ? ar : undefined })}</span>
                          </div>
                          <p>{r.content}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  {selectedTicket.status !== "closed" && (
                    <div className="flex gap-2 mt-3">
                      <Input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={isAr ? "اكتب رداً..." : "Write a reply..."} className="flex-1" />
                      <Button size="icon" onClick={() => sendReply.mutate()} disabled={!replyText.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : tickets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <HelpCircle className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">{isAr ? "لا توجد تذاكر دعم" : "No support tickets yet"}</p>
              </CardContent>
            </Card>
          ) : (
            tickets.map((t: any) => {
              const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.open;
              const Icon = sc.icon;
              return (
                <Card key={t.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setSelectedTicket(t)}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0", sc.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        #{t.ticket_number} · {formatDistanceToNow(new Date(t.created_at), { addSuffix: true, locale: isAr ? ar : undefined })}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="faq" className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? "ابحث في الأسئلة..." : "Search FAQ..."} value={searchFaq} onChange={e => setSearchFaq(e.target.value)} className="ps-9" />
          </div>
          {filteredFaq.map((f, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-1">{isAr ? f.qAr : f.q}</p>
                <p className="text-sm text-muted-foreground">{isAr ? f.aAr : f.a}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
