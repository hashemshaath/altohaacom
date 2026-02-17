import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Shield, CheckCircle, XCircle, Eye, Flag,
  Trash2, Clock, BarChart3, FileSearch, AlertTriangle,
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

interface PendingPost {
  id: string;
  content: string;
  image_url: string | null;
  image_urls: string[];
  created_at: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  moderation_reason: string | null;
  ai_decision?: string;
  ai_categories?: string[];
  ai_explanation?: string;
}

export default function ModerationCenter() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [activeTab, setActiveTab] = useState("queue");
  const [activeStatus, setActiveStatus] = useState("pending");

  // ─── Pending content queue ───
  const { data: pendingPosts = [], isLoading: loadingQueue } = useQuery({
    queryKey: ["moderation-queue"],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from("posts")
        .select("id, content, image_url, image_urls, created_at, author_id, moderation_reason")
        .in("moderation_status", ["pending", "rejected"])
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      if (!posts?.length) return [];

      const authorIds = [...new Set(posts.map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from("profiles").select("user_id, full_name, avatar_url").in("user_id", authorIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Get AI moderation logs
      const postIds = posts.map(p => p.id);
      const { data: logs } = await supabase
        .from("content_moderation_log")
        .select("entity_id, ai_decision, ai_categories, ai_explanation, ai_explanation_ar")
        .in("entity_id", postIds)
        .eq("entity_type", "post");
      const logMap = new Map(logs?.map(l => [l.entity_id, l]) || []);

      return posts.map(p => {
        const profile = profileMap.get(p.author_id);
        const log = logMap.get(p.id);
        return {
          ...p,
          author_name: profile?.full_name || "Unknown",
          author_avatar: profile?.avatar_url || null,
          ai_decision: log?.ai_decision,
          ai_categories: log?.ai_categories,
          ai_explanation: isAr ? log?.ai_explanation_ar : log?.ai_explanation,
        } as PendingPost;
      });
    },
  });

  const queueActionMutation = useMutation({
    mutationFn: async ({ postId, action }: { postId: string; action: "approved" | "rejected" }) => {
      await supabase.from("posts").update({
        moderation_status: action,
        moderation_reason: action === "rejected" ? (actionNote || "Rejected by moderator") : null,
        moderated_by: user!.id,
        moderated_at: new Date().toISOString(),
      }).eq("id", postId);

      await supabase.from("content_moderation_log").update({
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
        final_decision: action,
      }).eq("entity_id", postId).eq("entity_type", "post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-stats"] });
      setActionNote("");
      toast({ title: isAr ? "تم اتخاذ الإجراء" : "Action taken" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  // ─── Reports (existing) ───
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["moderation-reports", activeStatus],
    queryFn: async () => {
      const { data: reportsData, error } = await supabase
        .from("post_reports").select("*").eq("status", activeStatus)
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      if (!reportsData?.length) return [];

      const postIds = [...new Set(reportsData.map(r => r.post_id))];
      const reporterIds = [...new Set(reportsData.map(r => r.reporter_id))];
      const [postsRes, reporterProfilesRes] = await Promise.all([
        supabase.from("posts").select("id, content, author_id, image_url").in("id", postIds),
        supabase.from("profiles").select("user_id, full_name").in("user_id", reporterIds),
      ]);
      const authorIds = [...new Set(postsRes.data?.map(p => p.author_id) || [])];
      const { data: authorProfiles } = await supabase
        .from("profiles").select("user_id, full_name, avatar_url").in("user_id", authorIds);

      const postsMap = new Map(postsRes.data?.map(p => [p.id, p]) || []);
      const reporterMap = new Map(reporterProfilesRes.data?.map(p => [p.user_id, p.full_name]) || []);
      const authorMap = new Map(authorProfiles?.map(p => [p.user_id, p]) || []);

      return reportsData.map(r => {
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
      await supabase.from("post_reports").update({
        status: action === "approve" ? "dismissed" : "actioned",
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
        review_notes: actionNote || null,
      }).eq("id", reportId);

      if (action === "remove") {
        await supabase.from("posts").update({
          moderation_status: "removed",
          moderation_reason: actionNote || "Removed by moderator",
          moderated_by: user!.id,
          moderated_at: new Date().toISOString(),
        }).eq("id", postId);
      }

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
      const [pending, actioned, dismissed, queuePending] = await Promise.all([
        supabase.from("post_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("post_reports").select("*", { count: "exact", head: true }).eq("status", "actioned"),
        supabase.from("post_reports").select("*", { count: "exact", head: true }).eq("status", "dismissed"),
        supabase.from("posts").select("*", { count: "exact", head: true }).in("moderation_status", ["pending", "rejected"]),
      ]);
      return {
        pending: pending.count || 0,
        actioned: actioned.count || 0,
        dismissed: dismissed.count || 0,
        total: (pending.count || 0) + (actioned.count || 0) + (dismissed.count || 0),
        queuePending: queuePending.count || 0,
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

  const aiCategoryLabels: Record<string, { en: string; ar: string }> = {
    political: { en: "Political", ar: "سياسي" },
    indecent: { en: "Indecent", ar: "غير لائق" },
    off_topic: { en: "Off-topic", ar: "خارج الموضوع" },
    profanity: { en: "Profanity", ar: "ألفاظ بذيئة" },
    defamatory: { en: "Defamatory", ar: "تشهير" },
    hate_speech: { en: "Hate Speech", ar: "خطاب كراهية" },
    violence: { en: "Violence", ar: "عنف" },
    spam: { en: "Spam", ar: "محتوى مزعج" },
    sensitive: { en: "Sensitive", ar: "حساس" },
    ai_error: { en: "AI Error", ar: "خطأ ذكاء اصطناعي" },
    parse_error: { en: "Parse Error", ar: "خطأ تحليل" },
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="container py-6 space-y-6">
        <AdminPageHeader
          icon={Shield}
          title={isAr ? "مركز الإشراف والتحقق" : "Content Moderation Center"}
          description={isAr ? "مراجعة المحتوى قبل النشر وإدارة البلاغات" : "Review content before publication & manage reports"}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: isAr ? "قيد المراجعة" : "Content Queue", value: statsData?.queuePending || 0, icon: FileSearch, color: "text-chart-2" },
            { label: isAr ? "بلاغات معلقة" : "Reports Pending", value: statsData?.pending || 0, icon: Clock, color: "text-chart-4" },
            { label: isAr ? "تم اتخاذ إجراء" : "Actioned", value: statsData?.actioned || 0, icon: CheckCircle, color: "text-chart-3" },
            { label: isAr ? "تم الرفض" : "Dismissed", value: statsData?.dismissed || 0, icon: XCircle, color: "text-muted-foreground" },
            { label: isAr ? "إجمالي البلاغات" : "Total Reports", value: statsData?.total || 0, icon: BarChart3, color: "text-primary" },
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

        {/* Main tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="queue" className="gap-1.5">
              <FileSearch className="h-3.5 w-3.5" />
              {isAr ? "قائمة المراجعة" : "Content Queue"}
              {(statsData?.queuePending || 0) > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{statsData?.queuePending}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1.5">
              <Flag className="h-3.5 w-3.5" />
              {isAr ? "البلاغات" : "Reports"}
              {(statsData?.pending || 0) > 0 && (
                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">{statsData?.pending}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ─── Content Queue Tab ─── */}
          <TabsContent value="queue" className="mt-4">
            {loadingQueue ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : pendingPosts.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <CheckCircle className="mx-auto mb-3 h-12 w-12 text-primary/30" />
                  <p className="text-muted-foreground">{isAr ? "لا يوجد محتوى بانتظار المراجعة" : "No content awaiting review"}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingPosts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={post.author_avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {(post.author_name || "?")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold">{post.author_name}</span>
                            {post.ai_decision && (
                              <Badge
                                variant={post.ai_decision === "rejected" ? "destructive" : "outline"}
                                className="text-[10px] gap-1"
                              >
                                {post.ai_decision === "rejected" ? <XCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                {isAr ? (post.ai_decision === "rejected" ? "رفض تلقائي" : "مراجعة") : (post.ai_decision === "rejected" ? "Auto-rejected" : "Needs Review")}
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground ms-auto">
                              {toEnglishDigits(formatLocalizedDate(post.created_at, isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }))}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{post.content}</p>
                          {(post.image_url || post.image_urls?.length > 0) && (
                            <div className="mt-2 flex gap-2 flex-wrap">
                              {(post.image_urls?.length > 0 ? post.image_urls : [post.image_url]).filter(Boolean).map((url, i) => (
                                <img key={i} src={url!} alt="" className="h-20 w-20 rounded-lg object-cover border" />
                              ))}
                            </div>
                          )}

                          {/* AI Analysis */}
                          {post.ai_categories && post.ai_categories.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {post.ai_categories.map((cat, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px]">
                                  {aiCategoryLabels[cat] ? (isAr ? aiCategoryLabels[cat].ar : aiCategoryLabels[cat].en) : cat}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {post.ai_explanation && (
                            <p className="mt-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md p-2 italic">
                              {post.ai_explanation}
                            </p>
                          )}

                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              className="gap-1"
                              onClick={() => queueActionMutation.mutate({ postId: post.id, action: "approved" })}
                              disabled={queueActionMutation.isPending}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              {isAr ? "نشر" : "Approve & Publish"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              onClick={() => queueActionMutation.mutate({ postId: post.id, action: "rejected" })}
                              disabled={queueActionMutation.isPending}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              {isAr ? "رفض" : "Reject"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── Reports Tab ─── */}
          <TabsContent value="reports" className="mt-4 space-y-4">
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
                                  <Button size="sm" variant="destructive" className="gap-1" onClick={() => setSelectedReport(report)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {isAr ? "حذف المنشور" : "Remove Post"}
                                  </Button>
                                  <Button size="sm" variant="outline" className="gap-1"
                                    onClick={() => moderateMutation.mutate({ reportId: report.id, postId: report.post_id, action: "approve" })}>
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
