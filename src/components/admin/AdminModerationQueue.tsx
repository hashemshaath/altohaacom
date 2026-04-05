import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Flag, MessageSquare, Eye } from "lucide-react";
import { format } from "date-fns";

export const AdminModerationQueue = memo(function AdminModerationQueue() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["admin-moderation-queue"],
    queryFn: async () => {
      const [reports, pendingPosts] = await Promise.all([
        supabase.from("content_reports").select("id, reason, created_at, status").eq("status", "pending").order("created_at", { ascending: false }).limit(5),
        supabase.from("posts").select("id, content, created_at, moderation_status").eq("moderation_status", "pending").order("created_at", { ascending: false }).limit(5),
      ]);
      return {
        reports: reports.data || [],
        pendingPosts: pendingPosts.data || [],
        totalReports: reports.data?.length || 0,
        totalPending: pendingPosts.data?.length || 0,
      };
    },
    staleTime: 1000 * 30,
  });

  const totalItems = (data?.totalReports || 0) + (data?.totalPending || 0);

  return (
    <Card className={`border-border/50 ${totalItems > 0 ? "border-destructive/20" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className={`flex h-7 w-7 items-center justify-center rounded-xl ${totalItems > 0 ? "bg-destructive/10 animate-pulse" : "bg-chart-2/10"}`}>
            <AlertTriangle className={`h-3.5 w-3.5 ${totalItems > 0 ? "text-destructive" : "text-chart-2"}`} />
          </div>
          {isAr ? "طابور المراجعة" : "Moderation Queue"}
          {totalItems > 0 && (
            <Badge variant="destructive" className="text-[10px] h-5 px-1.5">{totalItems}</Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/moderation">
            {isAr ? "المركز" : "Center"} <ArrowRight className="ms-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {/* Summary badges */}
        {totalItems > 0 && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {(data?.totalReports || 0) > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                <Flag className="me-1 h-3 w-3" />
                {data.totalReports} {isAr ? "بلاغات" : "reports"}
              </Badge>
            )}
            {(data?.totalPending || 0) > 0 && (
              <Badge className="text-[10px] bg-chart-4/10 text-chart-4 hover:bg-chart-4/20 border-0">
                <MessageSquare className="me-1 h-3 w-3" />
                {data.totalPending} {isAr ? "منشورات معلقة" : "pending posts"}
              </Badge>
            )}
          </div>
        )}
        {totalItems === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-chart-2/10">
              <Eye className="h-5 w-5 text-chart-2" />
            </div>
            <p className="text-sm font-bold text-chart-2">{isAr ? "كل شيء نظيف! ✨" : "All clear! ✨"}</p>
            <p className="text-xs text-muted-foreground mt-1">{isAr ? "لا توجد عناصر معلقة للمراجعة" : "No pending items to review"}</p>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">{isAr ? "آخر فحص: الآن" : "Last checked: just now"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data?.reports.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-2.5 transition-all duration-200 hover:bg-destructive/10 hover:shadow-sm group/report">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-destructive/10 transition-transform group-hover/report:scale-110">
                  <Flag className="h-3.5 w-3.5 text-destructive" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{r.reason || (isAr ? "بلاغ محتوى" : "Content report")}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(r.created_at), "MMM d, HH:mm")}</p>
                </div>
                <Badge variant="outline" className="text-[9px] border-destructive/30 text-destructive">
                  {isAr ? "بلاغ" : "report"}
                </Badge>
              </div>
            ))}
            {data?.pendingPosts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-chart-4/20 bg-chart-4/5 p-2.5 transition-all duration-200 hover:bg-chart-4/10 hover:shadow-sm group/post">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-chart-4/10 transition-transform group-hover/post:scale-110">
                  <MessageSquare className="h-3.5 w-3.5 text-chart-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{(p.content || "").slice(0, 60)}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(p.created_at), "MMM d, HH:mm")}</p>
                </div>
                <Badge variant="outline" className="text-[9px] border-chart-4/30 text-chart-4">
                  {isAr ? "معلق" : "pending"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
