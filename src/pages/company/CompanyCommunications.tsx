import { useState, useMemo } from "react";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Plus,
  Send,
  Inbox,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCheck,
  Reply,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

interface Communication {
  id: string;
  company_id: string;
  sender_id: string;
  subject: string;
  message: string;
  direction: string;
  status: string;
  parent_id: string | null;
  is_internal_note: boolean;
  priority: string;
  created_at: string;
  updated_at: string;
}

export default function CompanyCommunications() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { companyId } = useCompanyAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Communication | null>(null);
  const [replyMode, setReplyMode] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    subject: "",
    message: "",
    priority: "normal",
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["companyCommunications", companyId, filter],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from("company_communications")
        .select("id, company_id, sender_id, subject, message, direction, status, priority, is_starred, is_archived, is_internal_note, tags, parent_id, response_time_minutes, created_at, updated_at")
        .eq("company_id", companyId)
        .is("parent_id", null)
        .order("created_at", { ascending: false });

      if (filter === "unread") {
        query = query.eq("status", "unread");
      } else if (filter === "incoming") {
        query = query.eq("direction", "incoming");
      } else if (filter === "outgoing") {
        query = query.eq("direction", "outgoing");
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Communication[];
    },
    enabled: !!companyId,
  });

  const { data: replies = [] } = useQuery({
    queryKey: ["communicationReplies", selectedMessage?.id],
    queryFn: async () => {
      if (!selectedMessage) return [];
      const { data, error } = await supabase
        .from("company_communications")
        .select("id, company_id, sender_id, subject, message, direction, status, priority, is_starred, is_archived, is_internal_note, tags, parent_id, response_time_minutes, created_at, updated_at")
        .eq("parent_id", selectedMessage.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Communication[];
    },
    enabled: !!selectedMessage,
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { subject: string; message: string; priority: string; parentId?: string }) => {
      if (!companyId || !user) throw new Error("No company or user");
      const { error } = await supabase.from("company_communications").insert({
        company_id: companyId,
        sender_id: user.id,
        subject: data.subject,
        message: data.message,
        direction: "outgoing",
        priority: data.priority,
        parent_id: data.parentId || null,
        status: "unread",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyCommunications"] });
      queryClient.invalidateQueries({ queryKey: ["communicationReplies"] });
      setDialogOpen(false);
      setReplyMode(false);
      setForm({ subject: "", message: "", priority: "normal" });
      toast({ title: language === "ar" ? "تم إرسال الرسالة" : "Message sent" });
    },
    onError: () => {
      toast({ title: language === "ar" ? "فشل الإرسال" : "Failed to send", variant: "destructive" });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("company_communications")
        .update({ status: "read" })
        .eq("id", id)
        .eq("status", "unread")
        .eq("direction", "incoming");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyCommunications"] });
    },
  });

  const openMessage = (msg: Communication) => {
    setSelectedMessage(msg);
    if (msg.direction === "incoming" && msg.status === "unread") {
      markReadMutation.mutate(msg.id);
    }
  };

  const openNewMessage = () => {
    setSelectedMessage(null);
    setReplyMode(false);
    setForm({ subject: "", message: "", priority: "normal" });
    setDialogOpen(true);
  };

  const openReply = () => {
    if (!selectedMessage) return;
    setForm({
      subject: `Re: ${selectedMessage.subject}`,
      message: "",
      priority: selectedMessage.priority,
    });
    setReplyMode(true);
    setDialogOpen(true);
  };

  const handleSend = () => {
    sendMutation.mutate({
      ...form,
      parentId: replyMode && selectedMessage ? selectedMessage.id : undefined,
    });
  };

  const { unreadCount, sentCount } = useMemo(() => ({
    unreadCount: messages.filter((m) => m.direction === "incoming" && m.status === "unread").length,
    sentCount: messages.filter((m) => m.direction === "outgoing").length,
  }), [messages]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">{language === "ar" ? "عاجل" : "Urgent"}</Badge>;
      case "high":
        return <Badge className="bg-chart-4">{language === "ar" ? "مرتفع" : "High"}</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (msg: Communication) => {
    if (msg.direction === "outgoing") {
      return msg.status === "read" ? (
        <CheckCheck className="h-4 w-4 text-primary" />
      ) : (
        <Clock className="h-4 w-4 text-muted-foreground" />
      );
    }
    return msg.status === "unread" ? (
      <div className="h-2 w-2 rounded-full bg-primary" />
    ) : null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {language === "ar" ? "التواصل" : "Communications"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {language === "ar" ? "التواصل مع إدارة المنصة" : "Communicate with platform administration"}
          </p>
        </div>
        <Button onClick={openNewMessage}>
          <Plus className="me-2 h-4 w-4" />
          {language === "ar" ? "رسالة جديدة" : "New Message"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Inbox className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "الإجمالي" : "Total"}
                </p>
                <p className="text-xl font-bold">{messages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "غير مقروءة" : "Unread"}
                </p>
                <p className="text-xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Send className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "مُرسلة" : "Sent"}
                </p>
                <p className="text-xl font-bold">
                  {messages.filter((m) => m.direction === "outgoing").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
            <SelectItem value="unread">{language === "ar" ? "غير مقروءة" : "Unread"}</SelectItem>
            <SelectItem value="incoming">{language === "ar" ? "واردة" : "Incoming"}</SelectItem>
            <SelectItem value="outgoing">{language === "ar" ? "صادرة" : "Outgoing"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages List & Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* List */}
        <div className="lg:col-span-2 space-y-2">
          {messages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">
                  {language === "ar" ? "لا توجد رسائل" : "No messages yet"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {language === "ar" ? "ابدأ محادثة مع الإدارة" : "Start a conversation with the administration"}
                </p>
              </CardContent>
            </Card>
          ) : (
            messages.map((msg) => (
              <Card
                key={msg.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedMessage?.id === msg.id ? "border-primary" : ""
                } ${msg.direction === "incoming" && msg.status === "unread" ? "border-s-[3px] border-s-primary" : ""}`}
                onClick={() => openMessage(msg)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {msg.direction === "incoming" ? (
                        <ArrowDownLeft className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0">
                        <p className={`truncate font-medium ${msg.direction === "incoming" && msg.status === "unread" ? "font-bold" : ""}`}>
                          {msg.subject}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">{msg.message}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {getStatusIcon(msg)}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(msg.created_at), "MM/dd")}
                      </span>
                      {getPriorityBadge(msg.priority)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedMessage.subject}</CardTitle>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      {selectedMessage.direction === "incoming" ? (
                        <Badge variant="outline">
                          <ArrowDownLeft className="me-1 h-3 w-3" />
                          {language === "ar" ? "واردة" : "Incoming"}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <ArrowUpRight className="me-1 h-3 w-3" />
                          {language === "ar" ? "صادرة" : "Outgoing"}
                        </Badge>
                      )}
                      {getPriorityBadge(selectedMessage.priority)}
                      <span>{format(new Date(selectedMessage.created_at), "yyyy-MM-dd HH:mm")}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={openReply}>
                    <Reply className="me-2 h-4 w-4" />
                    {language === "ar" ? "رد" : "Reply"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="whitespace-pre-wrap rounded-xl bg-muted/50 p-4">
                  {selectedMessage.message}
                </div>

                {/* Replies */}
                {replies.length > 0 && (
                  <>
                    <Separator />
                    <p className="text-sm font-medium text-muted-foreground">
                      {language === "ar" ? `${replies.length} ردود` : `${replies.length} Replies`}
                    </p>
                    {replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`rounded-xl border p-4 ${
                          reply.direction === "outgoing" ? "ms-4 border-s-[3px] border-s-primary" : "me-4"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                          <Badge variant="outline">
                            {reply.direction === "outgoing"
                              ? language === "ar" ? "أنت" : "You"
                              : language === "ar" ? "الإدارة" : "Admin"}
                          </Badge>
                          <span>{format(new Date(reply.created_at), "yyyy-MM-dd HH:mm")}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{reply.message}</p>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-24">
                <MessageSquare className="mb-4 h-16 w-16 text-muted-foreground/30" />
                <p className="text-muted-foreground">
                  {language === "ar" ? "اختر رسالة لعرضها" : "Select a message to view"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {replyMode
                ? language === "ar" ? "رد على الرسالة" : "Reply to Message"
                : language === "ar" ? "رسالة جديدة" : "New Message"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{language === "ar" ? "الموضوع" : "Subject"}</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                disabled={replyMode}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "الأولوية" : "Priority"}</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{language === "ar" ? "منخفض" : "Low"}</SelectItem>
                  <SelectItem value="normal">{language === "ar" ? "عادي" : "Normal"}</SelectItem>
                  <SelectItem value="high">{language === "ar" ? "مرتفع" : "High"}</SelectItem>
                  <SelectItem value="urgent">{language === "ar" ? "عاجل" : "Urgent"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "الرسالة" : "Message"}</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={6}
                placeholder={language === "ar" ? "اكتب رسالتك هنا..." : "Type your message here..."}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleSend}
                disabled={!form.subject || !form.message || sendMutation.isPending}
              >
                <Send className="me-2 h-4 w-4" />
                {sendMutation.isPending
                  ? language === "ar" ? "جارٍ الإرسال..." : "Sending..."
                  : language === "ar" ? "إرسال" : "Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
