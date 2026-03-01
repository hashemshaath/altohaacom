import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toEnglishDigits } from "@/lib/formatNumber";
import {
  BarChart3, Users, MessageCircle, Heart, TrendingUp,
  Flag, Shield, Eye, Repeat2, AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function CommunityAnalytics() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: stats } = useQuery({
    queryKey: ["community-analytics"],
    queryFn: async () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
      const prevWeekStart = new Date(now.getTime() - 14 * 86400000).toISOString();

      const [
        totalPostsRes, weekPostsRes, prevWeekPostsRes,
        totalLikesRes, weekLikesRes,
        totalCommentsRes, totalRepostsRes,
        pendingRes, rejectedRes, reportsRes, activeUsersRes,
      ] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("posts").select("id", { count: "exact", head: true }).gte("created_at", prevWeekStart).lt("created_at", weekAgo),
        supabase.from("post_likes").select("id", { count: "exact", head: true }),
        supabase.from("post_likes").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("post_comments").select("id", { count: "exact", head: true }),
        supabase.from("post_reposts").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("moderation_status", "pending"),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("moderation_status", "rejected"),
        supabase.from("post_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("posts").select("author_id").gte("created_at", monthAgo),
      ]);

      const uniqueAuthors = new Set((activeUsersRes.data || []).map((p) => p.author_id));
      const thisWeek = weekPostsRes.count || 0;
      const lastWeek = prevWeekPostsRes.count || 0;
      const growthPct = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;

      return {
        totalPosts: totalPostsRes.count || 0,
        weekPosts: thisWeek,
        growthPct,
        totalLikes: totalLikesRes.count || 0,
        weekLikes: weekLikesRes.count || 0,
        totalComments: totalCommentsRes.count || 0,
        totalReposts: totalRepostsRes.count || 0,
        pendingPosts: pendingRes.count || 0,
        rejectedPosts: rejectedRes.count || 0,
        pendingReports: reportsRes.count || 0,
        activeUsers: uniqueAuthors.size,
      };
    },
    staleTime: 2 * 60 * 1000,
  });

  if (!stats) return null;

  const cards = [
    { icon: MessageCircle, label: isAr ? "إجمالي المنشورات" : "Total Posts", value: stats.totalPosts, sub: `+${stats.weekPosts} ${isAr ? "هذا الأسبوع" : "this week"}`, color: "text-primary" },
    { icon: Heart, label: isAr ? "الإعجابات" : "Likes", value: stats.totalLikes, sub: `+${stats.weekLikes} ${isAr ? "هذا الأسبوع" : "this week"}`, color: "text-destructive" },
    { icon: Users, label: isAr ? "مستخدمون نشطون" : "Active Users", value: stats.activeUsers, sub: isAr ? "آخر 30 يوم" : "Last 30 days", color: "text-chart-3" },
    { icon: MessageCircle, label: isAr ? "التعليقات" : "Comments", value: stats.totalComments, color: "text-chart-4" },
    { icon: Repeat2, label: isAr ? "إعادة النشر" : "Reposts", value: stats.totalReposts, color: "text-chart-2" },
    { icon: TrendingUp, label: isAr ? "نمو أسبوعي" : "Weekly Growth", value: `${stats.growthPct > 0 ? "+" : ""}${stats.growthPct}%`, color: stats.growthPct >= 0 ? "text-chart-3" : "text-destructive", isGrowth: true },
  ];

  const moderationCards = [
    { icon: Shield, label: isAr ? "بانتظار المراجعة" : "Pending Review", value: stats.pendingPosts, color: "text-chart-4", urgent: stats.pendingPosts > 0, statusIcon: AlertTriangle },
    { icon: Flag, label: isAr ? "بلاغات معلقة" : "Pending Reports", value: stats.pendingReports, color: "text-destructive", urgent: stats.pendingReports > 0, statusIcon: Flag },
    { icon: Eye, label: isAr ? "مرفوض" : "Rejected", value: stats.rejectedPosts, color: "text-muted-foreground", statusIcon: XCircle },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c, i) => (
          <Card key={i} className="transition-all hover:scale-[1.02]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <c.icon className={cn("h-4 w-4", c.color)} />
                <span className="text-xs text-muted-foreground truncate">{c.label}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{typeof c.value === "number" ? toEnglishDigits(`${c.value}`) : c.value}</p>
              {c.sub && <p className="text-[10px] text-muted-foreground mt-1">{c.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Moderation Quick Actions */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            {isAr ? "مركز الإشراف" : "Moderation Center"}
          </h3>
          <Link to="/admin/moderation">
            <Button variant="outline" size="sm" className="h-7 text-xs">
              {isAr ? "عرض الكل" : "View All"}
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {moderationCards.map((c, i) => (
            <div key={i} className={cn(
              "rounded-xl border p-3 transition-all duration-300 hover:-translate-y-0.5 group",
              c.urgent ? "border-destructive/40 bg-destructive/5" : "border-border"
            )}>
              <div className="flex items-center gap-1.5 mb-1">
                <c.statusIcon className={cn("h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110", c.color)} />
                <span className="text-[10px] text-muted-foreground font-medium">{c.label}</span>
              </div>
              <p className={cn("text-xl font-bold tabular-nums", c.urgent && "text-destructive")}>
                {toEnglishDigits(`${c.value}`)}
              </p>
              {c.urgent && (
                <Badge variant="destructive" className="mt-1 text-[9px] h-4">
                  {isAr ? "يحتاج مراجعة" : "Needs review"}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
