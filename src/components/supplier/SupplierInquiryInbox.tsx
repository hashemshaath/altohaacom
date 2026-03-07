import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Mail, Reply, CheckCircle, Clock, Eye } from "lucide-react";
import { format } from "date-fns";

export function SupplierInquiryInbox() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { companyId } = useCompanyAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["supplierInquiries", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("company_communications")
        .select("id, company_id, sender_id, subject, message, direction, status, priority, is_starred, is_archived, is_internal_note, tags, parent_id, response_time_minutes, created_at, updated_at")
        .eq("company_id", companyId)
        .eq("direction", "inbound")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!companyId,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("company_communications")
        .update({ status: "read" } as any)
        .eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["supplierInquiries", companyId] }),
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!companyId || !selectedId || !replyText.trim()) throw new Error("Invalid");
      const original = inquiries.find((i: any) => i.id === selectedId) as any;
      await supabase.from("company_communications").insert({
        company_id: companyId,
        subject: `Re: ${original?.subject || "Inquiry"}`,
        message: replyText.trim(),
        direction: "outbound",
        status: "sent",
        parent_id: selectedId,
      } as any);
      // Mark original as replied
      await supabase
        .from("company_communications")
        .update({ status: "replied" } as any)
        .eq("id", selectedId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplierInquiries", companyId] });
      toast({ title: isAr ? "تم إرسال الرد" : "Reply sent" });
      setReplyText("");
    },
    onError: () => toast({ title: isAr ? "فشل الإرسال" : "Failed to send", variant: "destructive" }),
  });

  const selected = inquiries.find((i: any) => i.id === selectedId) as any;
  const unreadCount = inquiries.filter((i: any) => i.status === "unread").length;

  const handleSelect = (inquiry: any) => {
    setSelectedId(inquiry.id);
    setReplyText("");
    if (inquiry.status === "unread") {
      markReadMutation.mutate(inquiry.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "unread":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[9px]">{isAr ? "جديد" : "New"}</Badge>;
      case "read":
        return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20 text-[9px]">{isAr ? "مقروء" : "Read"}</Badge>;
      case "replied":
        return <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20 text-[9px]">{isAr ? "تم الرد" : "Replied"}</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {isAr ? "صندوق الاستفسارات" : "Inquiry Inbox"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr
              ? `${inquiries.length} استفسار${unreadCount > 0 ? ` · ${unreadCount} جديد` : ""}`
              : `${inquiries.length} inquiries${unreadCount > 0 ? ` · ${unreadCount} new` : ""}`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Inquiry List */}
        <div className="lg:col-span-2 space-y-2 max-h-[600px] overflow-y-auto">
          {inquiries.length === 0 && !isLoading && (
            <div className="py-12 text-center">
              <Mail className="mx-auto mb-3 h-10 w-10 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">{isAr ? "لا توجد استفسارات" : "No inquiries yet"}</p>
            </div>
          )}
          {inquiries.map((inq: any) => (
            <Card
              key={inq.id}
              className={`cursor-pointer rounded-xl transition-colors ${
                selectedId === inq.id ? "border-primary/40 bg-primary/5" : "hover:bg-muted/50"
              } ${inq.status === "unread" ? "border-s-4 border-s-primary" : ""}`}
              onClick={() => handleSelect(inq)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{inq.subject || (isAr ? "بدون عنوان" : "No subject")}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{inq.message}</p>
                  </div>
                  {getStatusBadge(inq.status)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {format(new Date(inq.created_at), "MMM d, yyyy HH:mm")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-3">
          {selected ? (
            <Card className="rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{selected.subject || (isAr ? "بدون عنوان" : "No subject")}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(selected.created_at), "EEEE, MMM d, yyyy 'at' HH:mm")}
                    </p>
                  </div>
                  {getStatusBadge(selected.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-muted/50 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                  {selected.message}
                </div>

                {/* Reply */}
                {selected.status !== "replied" && (
                  <div className="space-y-3 pt-2 border-t">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Reply className="h-4 w-4 text-primary" />
                      {isAr ? "الرد" : "Reply"}
                    </p>
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={4}
                      placeholder={isAr ? "اكتب ردك..." : "Write your reply..."}
                    />
                    <Button
                      size="sm"
                      onClick={() => replyMutation.mutate()}
                      disabled={replyMutation.isPending || !replyText.trim()}
                    >
                      <Reply className="me-1.5 h-3.5 w-3.5" />
                      {replyMutation.isPending ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال الرد" : "Send Reply")}
                    </Button>
                  </div>
                )}

                {selected.status === "replied" && (
                  <div className="flex items-center gap-2 text-sm text-chart-5">
                    <CheckCircle className="h-4 w-4" />
                    {isAr ? "تم الرد على هذا الاستفسار" : "This inquiry has been replied to"}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex h-full items-center justify-center py-20">
              <div className="text-center">
                <Eye className="mx-auto mb-3 h-10 w-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">{isAr ? "اختر استفساراً لعرضه" : "Select an inquiry to view"}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
