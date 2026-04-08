import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, MessageCircle, Award } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";

interface CommunityInsightsProps {
  className?: string;
}

export const CommunityInsights = memo(function CommunityInsights({ className }: CommunityInsightsProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: insights } = useQuery({
    queryKey: ["community-weekly-insights"],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      
      const [postsRes, usersRes, repliesRes] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true })
          .gte("created_at", weekAgo).is("reply_to_post_id", null),
        supabase.from("profiles").select("id", { count: "exact", head: true })
          .gte("updated_at", weekAgo),
        supabase.from("posts").select("id", { count: "exact", head: true })
          .gte("created_at", weekAgo).not("reply_to_post_id", "is", null),
      ]);

      return {
        newPosts: postsRes.count || 0,
        activeUsers: usersRes.count || 0,
        replies: repliesRes.count || 0,
        engagementRate: postsRes.count && usersRes.count
          ? Math.round(((repliesRes.count || 0) / (postsRes.count || 1)) * 100)
          : 0,
      };
    },
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 20,
  });

  if (!insights || (insights.newPosts === 0 && insights.activeUsers === 0)) return null;

  const stats = [
    { icon: TrendingUp, label: isAr ? "منشور جديد" : "New Posts", value: insights.newPosts, color: "text-primary" },
    { icon: Users, label: isAr ? "عضو نشط" : "Active", value: insights.activeUsers, color: "text-chart-2" },
    { icon: MessageCircle, label: isAr ? "رد" : "Replies", value: insights.replies, color: "text-chart-3" },
    { icon: Award, label: isAr ? "تفاعل %" : "Engage %", value: insights.engagementRate, color: "text-chart-4" },
  ];

  return (
    <div className={cn("px-4 py-3 border-b border-border/30", className)}>
      <h4 className="text-[12px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
        <TrendingUp className="h-3 w-3" />
        {isAr ? "إحصائيات الأسبوع" : "This Week's Activity"}
      </h4>
      <div className="grid grid-cols-4 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center rounded-xl bg-muted/20 py-1.5 px-1">
            <stat.icon className={cn("h-3.5 w-3.5 mx-auto mb-0.5", stat.color)} />
            <AnimatedCounter value={stat.value} className={cn("text-sm font-bold tabular-nums", stat.color)} />
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
});
