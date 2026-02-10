import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Send,
  Inbox,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCheck,
  Reply,
  AlertCircle,
  Search,
  Building2,
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

interface CompanyInfo {
  id: string;
  name: string;
  name_ar: string | null;
}

export default function CommunicationsAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Communication | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  // Fetch all communications (root messages only)
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["adminCommunications", filter, priorityFilter],
    queryFn: async () => {
      let query = supabase
        .from("company_communications")
        .select("*")
        .is("parent_id", null)
        .order("created_at", { ascending: false });

      if (filter === "unread") {
        query = query.eq("status", "unread").eq("direction", "outgoing");
      } else if (filter === "outgoing") {
        query = query.eq("direction", "outgoing");
      } else if (filter === "incoming") {
        query = query.eq("direction", "incoming");
      }

      if (priorityFilter !== "all") {
        query = query.eq("priority", priorityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Communication[];
    },
  });

  // Fetch company names for display
  const companyIds = [...new Set(messages.map((m) => m.company_id))];
  const { data: companies = [] } = useQuery({
    queryKey: ["adminCommCompanies", companyIds.join(",")],
    queryFn: async () => {
      if (companyIds.length === 0) return [];
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, name_ar")
        .in("id", companyIds);
      if (error) throw error;
      return (data || []) as CompanyInfo[];
    },
    enabled: companyIds.length > 0,
  });

  const companyMap = new Map(companies.map((c) => [c.id, c]));

  // Fetch replies for selected message
  const { data: replies = [] } = useQuery({
    queryKey: ["adminCommReplies", selectedMessage?.id],
    queryFn: async () => {
      if (!selectedMessage) return [];
      const { data, error } = await supabase
        .from("company_communications")
        .select("*")
        .eq("parent_id", selectedMessage.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Communication[];
    },
    enabled: !!selectedMessage,
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("company_communications")
        .update({ status: "read" })
        .eq("id", id)
        .eq("status", "unread")
        .eq("direction", "outgoing");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCommunications"] });
    },
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ parentId, companyId }: { parentId: string; companyId: string }) => {
      if (!user) throw new Error("Not authenticated");
      const parent = messages.find((m) => m.id === parentId);
      const { error } = await supabase.from("company_communications").insert({
        company_id: companyId,
        sender_id: user.id,
        subject: `Re: ${parent?.subject || ""}`,
        message: replyMessage,
        direction: "incoming",
        priority: parent?.priority || "normal",
        parent_id: parentId,
        status: "unread",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCommunications"] });
      queryClient.invalidateQueries({ queryKey: ["adminCommReplies"] });
      setReplyMessage("");
      toast({ title: language === "ar" ? "تم إرسال الرد" : "Reply sent" });
    },
    onError: () => {
      toast({ title: language === "ar" ? "فشل الإرسال" : "Failed to send", variant: "destructive" });
    },
  });

  const openMessage = (msg: Communication) => {
    setSelectedMessage(msg);
    setReplyMessage("");
    if (msg.direction === "outgoing" && msg.status === "unread") {
      markReadMutation.mutate(msg.id);
    }
  };

  // Filter by search
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">{language === "ar" ? "عاجل" : "Urgent"}</Badge>;
      case "high":
        return <Badge className="bg-orange-500">{language === "ar" ? "مرتفع" : "High"}</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          {language === "ar" ? "صندوق التواصل" : "Communications Inbox"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {language === "ar"
            ? "عرض والرد على جميع رسائل الشركات"
            : "View and respond to all company messages"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Inbox className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{language === "ar" ? "الإجمالي" : "Total"}</p>
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
                <p className="text-sm text-muted-foreground">{language === "ar" ? "غير مقروءة" : "Unread"}</p>
                <p className="text-xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">{language === "ar" ? "عاجلة" : "Urgent"}</p>
                <p className="text-xl font-bold">{urgentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{language === "ar" ? "شركات" : "Companies"}</p>
                <p className="text-xl font-bold">{companyIds.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === "ar" ? "بحث في الرسائل..." : "Search messages..."}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
            <SelectItem value="unread">{language === "ar" ? "غير مقروءة" : "Unread"}</SelectItem>
            <SelectItem value="outgoing">{language === "ar" ? "من الشركات" : "From Companies"}</SelectItem>
            <SelectItem value="incoming">{language === "ar" ? "من الإدارة" : "From Admin"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "ar" ? "كل الأولويات" : "All Priorities"}</SelectItem>
            <SelectItem value="urgent">{language === "ar" ? "عاجل" : "Urgent"}</SelectItem>
            <SelectItem value="high">{language === "ar" ? "مرتفع" : "High"}</SelectItem>
            <SelectItem value="normal">{language === "ar" ? "عادي" : "Normal"}</SelectItem>
            <SelectItem value="low">{language === "ar" ? "منخفض" : "Low"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages List & Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* List */}
        <div className="lg:col-span-2">
          <ScrollArea className="h-[600px]">
            <div className="space-y-2 pr-2">
              {filteredMessages.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-lg font-medium">
                      {language === "ar" ? "لا توجد رسائل" : "No messages"}
                    </p>
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
                      onClick={() => openMessage(msg)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {msg.direction === "outgoing" ? (
                                <ArrowDownLeft className="h-3.5 w-3.5 shrink-0 text-primary" />
                              ) : (
                                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              )}
                              <span className="text-xs text-muted-foreground truncate">
                                {company ? (language === "ar" && company.name_ar ? company.name_ar : company.name) : "Unknown"}
                              </span>
                            </div>
                            <p className={`truncate font-medium text-sm ${msg.direction === "outgoing" && msg.status === "unread" ? "font-bold" : ""}`}>
                              {msg.subject}
                            </p>
                            <p className="truncate text-xs text-muted-foreground mt-0.5">{msg.message}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {msg.direction === "outgoing" && msg.status === "unread" && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                            {msg.direction === "incoming" && msg.status === "read" && (
                              <CheckCheck className="h-3.5 w-3.5 text-primary" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.created_at), "MM/dd HH:mm")}
                            </span>
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

        {/* Detail */}
        <div className="lg:col-span-3">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedMessage.subject}</CardTitle>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">
                        <Building2 className="mr-1 h-3 w-3" />
                        {(() => {
                          const c = companyMap.get(selectedMessage.company_id);
                          return c ? (language === "ar" && c.name_ar ? c.name_ar : c.name) : "Unknown";
                        })()}
                      </Badge>
                      {selectedMessage.direction === "outgoing" ? (
                        <Badge variant="outline">
                          <ArrowDownLeft className="mr-1 h-3 w-3" />
                          {language === "ar" ? "من الشركة" : "From Company"}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <ArrowUpRight className="mr-1 h-3 w-3" />
                          {language === "ar" ? "من الإدارة" : "From Admin"}
                        </Badge>
                      )}
                      {getPriorityBadge(selectedMessage.priority)}
                      <span>{format(new Date(selectedMessage.created_at), "yyyy-MM-dd HH:mm")}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="whitespace-pre-wrap rounded-lg bg-muted/50 p-4">
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
                        className={`rounded-lg border p-4 ${
                          reply.direction === "incoming" ? "ml-4 border-s-[3px] border-s-primary" : "mr-4"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                          <Badge variant="outline">
                            {reply.direction === "incoming"
                              ? language === "ar" ? "الإدارة" : "Admin"
                              : language === "ar" ? "الشركة" : "Company"}
                          </Badge>
                          <span>{format(new Date(reply.created_at), "yyyy-MM-dd HH:mm")}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{reply.message}</p>
                      </div>
                    ))}
                  </>
                )}

                {/* Reply Form */}
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Reply className="h-4 w-4" />
                    {language === "ar" ? "رد سريع" : "Quick Reply"}
                  </p>
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={4}
                    placeholder={language === "ar" ? "اكتب ردك هنا..." : "Type your reply here..."}
                  />
                  <div className="flex justify-end">
                    <Button
                      disabled={!replyMessage || replyMutation.isPending}
                      onClick={() =>
                        replyMutation.mutate({
                          parentId: selectedMessage.id,
                          companyId: selectedMessage.company_id,
                        })
                      }
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {replyMutation.isPending
                        ? language === "ar" ? "جارٍ الإرسال..." : "Sending..."
                        : language === "ar" ? "إرسال الرد" : "Send Reply"}
                    </Button>
                  </div>
                </div>
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
    </div>
  );
}
