import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Eye, Flag,
  MessageSquare, Trash2, Ban, Clock, BarChart3,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toEnglishDigits, formatLocalizedDate } from "@/lib/formatNumber";

interface Report {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  reason_detail: string | null;
  status: string;
  created_at: string;
  reporter_name?: string;
  post_content?: string;
  post_author_name?: string;
  post_author_avatar?: string;
  post_image_url?: string | null;
}

export default function ModerationCenter() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [activeStatus, setActiveStatus] = useState("pending");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["moderation-reports", activeStatus],
    queryFn: async () => {
      const { data: reportsData, error } = await supabase
        .from("post_reports")
        .select("*")
        .eq("status", activeStatus)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      if (!reportsData?.length) return [];

      const postIds = [...new Set(reportsData.map((r) => r.post_id))];
      const reporterIds = [...new Set(reportsData.map((r) => r.reporter_id))];

      const [postsRes, reporterProfilesRes] = await Promise.all([
        supabase.from("posts").select("id, content, author_id, image_url").in("id", postIds),
        supabase.from("profiles").select("user_id, full_name").in("user_id", reporterIds),
      ]);

      const authorIds = [...new Set(postsRes.data?.map((p) => p.author_id) || [])];
      const { data: authorProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", authorIds);

      const postsMap = new Map(postsRes.data?.map((p) => [p.id, p]) || []);
      const reporterMap = new Map(reporterProfilesRes.data?.map((p) => [p.user_id, p.full_name]) || []);
      const authorMap = new Map(authorProfiles?.map((p) => [p.user_id, p]) || []);

      return reportsData.map((r) => {
        const post = postsMap.get(r.post_id);
        const author = post ? authorMap.get(post.author_id) : null;
        return {
          ...r,
          reporter_name: reporterMap.get(r.reporter_id) || "Unknown",
          post_content: post?.content || "[Deleted]",
          post_author_name: author?.full_name || "Unknown",
          post_author_avatar: author?.avatar_url || null,
          post_image_url: post?.image_url || null,
        };
      }) as Report[];
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ reportId, postId, action }: { reportId: string; postId: string; action: "approve" | "remove" | "warn" }) => {
      // Update report status
      await supabase.from("post_reports").update({
        status: action === "approve" ? "dismissed" : "actioned",
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
        review_notes: actionNote || null,
      }).eq("id", reportId);

      if (action === "remove") {
        // Set post moderation status
        await supabase.from("posts").update({
          moderation_status: "removed",
          moderation_reason: actionNote || "Removed by moderator",
          moderated_by: user!.id,
          moderated_at: new Date().toISOString(),
        }).eq("id", postId);
      }

      // Log the action
      await supabase.from("moderation_actions").insert({
        entity_type: "post",
        entity_id: postId,
        action,
        reason: actionNote || null,
        performed_by: user!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-reports"] });
      setSelectedReport(null);
      setActionNote("");
      toast({ title: isAr ? "تم اتخاذ الإجراء" : "Action taken" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const { data: statsData } = useQuery({
    queryKey: ["moderation-stats"],
    queryFn: async () => {
      const [pending, actioned, dismissed] = await Promise.all([
        supabase.from("post_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("post_reports").select("*", { count: "exact", head: true }).eq("status", "actioned"),
        supabase.from("post_reports").select("*", { count: "exact", head: true }).eq("status", "dismissed"),
      ]);
      return {
        pending: pending.count || 0,
        actioned: actioned.count || 0,
        dismissed: dismissed.count || 0,
        total: (pending.count || 0) + (actioned.count || 0) + (dismissed.count || 0),
      };
    },
  });

  const reasonLabels: Record<string, { en: string; ar: string }> = {
    spam: { en: "Spam", ar: "محتوى مزعج" },
    harassment: { en: "Harassment", ar: "تحرش" },
    hate_speech: { en: "Hate Speech", ar: "خطاب كراهية" },
    violence: { en: "Violence", ar: "عنف" },
    political: { en: "Political", ar: "سياسي" },
    inappropriate: { en: "Inappropriate", ar: "غير لائق" },
    copyright: { en: "Copyright", ar: "حقوق ملكية" },
    other: { en: "Other", ar: "أخرى" },
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="container py-6 space-y-6">
        <AdminPageHeader
          icon={Shield}
          title={isAr ? "مركز الإشراف" : "Moderation Center"}
          description={isAr ? "مراجعة البلاغات وإدارة المحتوى" : "Review reports and manage content"}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: isAr ? "بانتظار المراجعة" : "Pending", value: statsData?.pending || 0, icon: Clock, color: "text-chart-4" },
            { label: isAr ? "تم اتخاذ إجراء" : "Actioned", value: statsData?.actioned || 0, icon: CheckCircle, color: "text-chart-3" },
            { label: isAr ? "تم الرفض" : "Dismissed", value: statsData?.dismissed || 0, icon: XCircle, color: "text-muted-foreground" },
            { label: isAr ? "الإجمالي" : "Total", value: statsData?.total || 0, icon: BarChart3, color: "text-primary" },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`rounded-xl bg-muted p-2 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{toEnglishDigits(stat.value.toString())}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reports tabs */}
        <Tabs value={activeStatus} onValueChange={setActiveStatus}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {isAr ? "بانتظار" : "Pending"}
              {(statsData?.pending || 0) > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{statsData?.pending}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="actioned" className="gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              {isAr ? "تم الإجراء" : "Actioned"}
            </TabsTrigger>
            <TabsTrigger value="dismissed" className="gap-1.5">
              <XCircle className="h-3.5 w-3.5" />
              {isAr ? "مرفوض" : "Dismissed"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeStatus} className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : reports.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Shield className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">{isAr ? "لا توجد بلاغات" : "No reports"}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={report.post_author_avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {(report.post_author_name || "?")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold">{report.post_author_name}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {reasonLabels[report.reason] ? (isAr ? reasonLabels[report.reason].ar : reasonLabels[report.reason].en) : report.reason}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground ms-auto">
                              {toEnglishDigits(formatLocalizedDate(report.created_at, isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }))}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{report.post_content}</p>
                          {report.post_image_url && (
                            <img src={report.post_image_url} alt="" className="mt-2 h-20 w-20 rounded-lg object-cover" />
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <Flag className="h-3 w-3 text-destructive" />
                            <span className="text-xs text-muted-foreground">
                              {isAr ? "أبلغ بواسطة:" : "Reported by:"} {report.reporter_name}
                            </span>
                          </div>
                          {report.reason_detail && (
                            <p className="mt-1 text-xs text-muted-foreground italic">"{report.reason_detail}"</p>
                          )}

                          {activeStatus === "pending" && (
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="gap-1"
                                onClick={() => setSelectedReport(report)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {isAr ? "حذف المنشور" : "Remove Post"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => moderateMutation.mutate({ reportId: report.id, postId: report.post_id, action: "approve" })}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                {isAr ? "رفض البلاغ" : "Dismiss"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Remove post dialog */}
      {selectedReport && (
        <Dialog open onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                {isAr ? "حذف المنشور" : "Remove Post"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {isAr ? "سيتم إخفاء هذا المنشور من الجميع." : "This post will be hidden from everyone."}
              </p>
              <div className="rounded-lg bg-muted p-3 text-sm">{selectedReport.post_content}</div>
              <Textarea
                placeholder={isAr ? "سبب الحذف (اختياري)..." : "Reason for removal (optional)..."}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedReport(null)}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => moderateMutation.mutate({ reportId: selectedReport.id, postId: selectedReport.post_id, action: "remove" })}
                disabled={moderateMutation.isPending}
              >
                {isAr ? "حذف" : "Remove"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
