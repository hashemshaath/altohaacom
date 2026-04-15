import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, MessageCircle, Zap } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";
import { MS_PER_DAY, MS_PER_WEEK } from "@/lib/constants";
import { CACHE } from "@/lib/queryConfig";

export const CommunityInsights = memo(function CommunityInsights() {
  const isAr = useIsAr();

  const { data: insights } = useQuery({
    queryKey: ["community-insights-unified"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      const weekAgo = new Date(Date.now() - MS_PER_WEEK).toISOString();

      const [todayPostsRes, weekPostsRes, weekRepliesRes, todayAuthorsRes] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true })
          .gte("created_at", todayISO).eq("moderation_status", "approved").is("reply_to_post_id", null),
        supabase.from("posts").select("id", { count: "exact", head: true })
          .gte("created_at", weekAgo).is("reply_to_post_id", null),
        supabase.from("posts").select("id", { count: "exact", head: true })
          .gte("created_at", weekAgo).not("reply_to_post_id", "is", null),
        supabase.from("posts").select("author_id")
          .gte("created_at", todayISO).eq("moderation_status", "approved"),
      ]);

      const activeToday = new Set(todayAuthorsRes.data?.map(p => p.author_id) || []).size;

      return {
        postsToday: todayPostsRes.count || 0,
        postsWeek: weekPostsRes.count || 0,
        repliesWeek: weekRepliesRes.count || 0,
        activeToday,
      };
    },
    staleTime: CACHE.medium.staleTime,
    gcTime: 1000 * 60 * 10,
  });

  if (!insights || (insights.postsToday === 0 && insights.postsWeek === 0)) return null;

  return (
    <div className="px-4 py-3 flex items-center gap-2.5 flex-wrap text-[12px]">
      <Zap className="h-3.5 w-3.5 text-chart-4 shrink-0" />
      {insights.postsToday > 0 && (
        <div className="flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1.5">
          <TrendingUp className="h-3 w-3 text-primary" />
          <AnimatedCounter value={insights.postsToday} className="font-bold tabular-nums text-primary" />
          <span className="text-muted-foreground">{isAr ? "اليوم" : "today"}</span>
        </div>
      )}
      {insights.activeToday > 0 && (
        <div className="flex items-center gap-1.5 rounded-full bg-chart-3/8 px-3 py-1.5">
          <Users className="h-3 w-3 text-chart-3" />
          <AnimatedCounter value={insights.activeToday} className="font-bold tabular-nums text-chart-3" />
          <span className="text-muted-foreground">{isAr ? "نشط" : "active"}</span>
        </div>
      )}
      {insights.repliesWeek > 0 && (
        <div className="flex items-center gap-1.5 rounded-full bg-chart-2/8 px-3 py-1.5">
          <MessageCircle className="h-3 w-3 text-chart-2" />
          <AnimatedCounter value={insights.repliesWeek} className="font-bold tabular-nums text-chart-2" />
          <span className="text-muted-foreground">{isAr ? "رد/أسبوع" : "replies/wk"}</span>
        </div>
      )}
    </div>
  );
});
