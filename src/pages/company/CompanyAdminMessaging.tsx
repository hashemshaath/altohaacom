import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CompanyPageGuard } from "@/components/company/CompanyPageGuard";
import {
  MessageSquare, Send, Headphones, Clock, User, ShieldCheck, Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toEnglishDigits } from "@/lib/formatNumber";

interface SupportMessage {
  id: string;
  company_id: string;
  sender_id: string;
  sender_type: string;
  subject: string | null;
  message: string;
  is_read: boolean | null;
  created_at: string;
}

export default function CompanyAdminMessaging() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const scrollRef = useRef<HTMLDivElement>(null);

  const [newMessage, setNewMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [composing, setComposing] = useState(false);
  const [sending, setSending] = useState(false);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["company-support-messages", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_support_messages")
        .select("id, company_id, sender_id, sender_type, subject, message, is_read, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as SupportMessage[];
    },
    enabled: !!companyId,
    staleTime: 1000 * 30,
  });

  // Realtime
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel("company-support-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "company_support_messages", filter: `company_id=eq.${companyId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["company-support-messages", companyId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId, queryClient]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark admin messages as read
  useEffect(() => {
    if (!companyId || !user?.id || messages.length === 0) return;
    const unread = messages.filter(m => m.sender_type === "admin" && !m.is_read);
    if (unread.length > 0) {
      supabase
        .from("company_support_messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", unread.map(m => m.id))
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["company-support-messages", companyId] });
        });
    }
  }, [messages, companyId, user?.id, queryClient]);

  const handleSend = async () => {
    if (!newMessage.trim() || !companyId || !user?.id) return;
    setSending(true);
    try {
      const { error } = await supabase.from("company_support_messages").insert({
        company_id: companyId,
        sender_id: user.id,
        sender_type: "company",
        subject: subject.trim() || null,
        message: newMessage.trim(),
      });
      if (error) throw error;
      setNewMessage("");
      setSubject("");
      setComposing(false);
      queryClient.invalidateQueries({ queryKey: ["company-support-messages", companyId] });
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const unreadFromAdmin = messages.filter(m => m.sender_type === "admin" && !m.is_read).length;

  return (
    <CompanyPageGuard page="communications">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Headphones className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{isAr ? "التواصل مع الإدارة" : "Admin Support"}</h1>
              <p className="text-sm text-muted-foreground">
                {isAr ? "تواصل مباشر مع فريق إدارة المنصة" : "Direct communication with platform admins"}
              </p>
            </div>
          </div>
          {!composing && (
            <Button size="sm" onClick={() => setComposing(true)}>
              <Plus className="me-1.5 h-4 w-4" />
              {isAr ? "رسالة جديدة" : "New Message"}
            </Button>
          )}
        </div>

        {/* Compose */}
        {composing && (
          <Card className="animate-fade-in border-primary/20">
            <CardContent className="space-y-3 pt-5">
              <Input
                placeholder={isAr ? "الموضوع (اختياري)" : "Subject (optional)"}
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
              <Textarea
                placeholder={isAr ? "اكتب رسالتك..." : "Type your message..."}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setComposing(false); setNewMessage(""); setSubject(""); }}>
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button size="sm" onClick={handleSend} disabled={!newMessage.trim() || sending}>
                  <Send className="me-1.5 h-4 w-4" />
                  {sending ? (isAr ? "جارٍ الإرسال..." : "Sending...") : (isAr ? "إرسال" : "Send")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages Thread */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : messages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/50 mb-3">
                <MessageSquare className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium">{isAr ? "لا توجد رسائل بعد" : "No messages yet"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isAr ? "ابدأ محادثة مع فريق الإدارة" : "Start a conversation with the admin team"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ScrollArea className="h-[calc(100vh-340px)] min-h-[300px]" ref={scrollRef}>
              <div className="space-y-1 p-4">
                {messages.map((msg, idx) => {
                  const isCompany = msg.sender_type === "company";
                  const isMine = msg.sender_id === user?.id;
                  const showDate = idx === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[idx - 1].created_at).toDateString();

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex items-center justify-center py-3">
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {toEnglishDigits(new Date(msg.created_at).toLocaleDateString(isAr ? "ar" : "en", { month: "short", day: "numeric", year: "numeric" }))}
                          </Badge>
                        </div>
                      )}
                      <div className={`flex ${isCompany ? "justify-end" : "justify-start"} mb-2`}>
                        <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                          isCompany
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                        }`}>
                          {msg.subject && (
                            <p className={`text-xs font-semibold mb-1 ${isCompany ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                              {msg.subject}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <div className={`flex items-center gap-1.5 mt-1.5 ${isCompany ? "justify-end" : "justify-start"}`}>
                            <span className={`text-[10px] ${isCompany ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                              {toEnglishDigits(formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: isAr ? ar : enUS }))}
                            </span>
                            {isCompany ? (
                              <User className="h-3 w-3 opacity-50" />
                            ) : (
                              <ShieldCheck className="h-3 w-3 opacity-50" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Quick Reply */}
            <Separator />
            <div className="flex items-center gap-2 p-3">
              <Textarea
                placeholder={isAr ? "رد سريع..." : "Quick reply..."}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                rows={1}
                className="min-h-[40px] resize-none"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <Button size="icon" onClick={handleSend} disabled={!newMessage.trim() || sending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </CompanyPageGuard>
  );
}
