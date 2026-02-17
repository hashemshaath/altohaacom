import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toEnglishDigits } from "@/lib/formatNumber";
import {
  BarChart3, Users, MessageCircle, Heart, TrendingUp,
  Flag, Shield, Eye, Repeat2,
} from "lucide-react";

export function CommunityAnalytics() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: stats } = useQuery({
    queryKey: ["community-analytics"],
    queryFn: async () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

      const [
        totalPostsRes,
        weekPostsRes,
        totalLikesRes,
        weekLikesRes,
        totalCommentsRes,
        totalRepostsRes,
        pendingRes,
        rejectedRes,
        reportsRes,
        activeUsersRes,
      ] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
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

      return {
        totalPosts: totalPostsRes.count || 0,
        weekPosts: weekPostsRes.count || 0,
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
    { icon: Shield, label: isAr ? "بانتظار المراجعة" : "Pending Review", value: stats.pendingPosts, color: "text-chart-4", urgent: stats.pendingPosts > 0 },
    { icon: Flag, label: isAr ? "بلاغات معلقة" : "Pending Reports", value: stats.pendingReports, color: "text-destructive", urgent: stats.pendingReports > 0 },
    { icon: Eye, label: isAr ? "مرفوض" : "Rejected", value: stats.rejectedPosts, color: "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c, i) => (
        <Card key={i} className={`transition-all hover:scale-[1.02] ${c.urgent ? "border-destructive/30 animate-pulse" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`h-4 w-4 ${c.color}`} />
              <span className="text-xs text-muted-foreground truncate">{c.label}</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{toEnglishDigits(`${c.value}`)}</p>
            {c.sub && <p className="text-[10px] text-muted-foreground mt-1">{c.sub}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
