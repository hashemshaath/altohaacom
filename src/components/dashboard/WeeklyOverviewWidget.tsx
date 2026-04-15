import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Eye, Trophy, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CACHE } from "@/lib/queryConfig";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { MS_PER_DAY, MS_PER_WEEK } from "@/lib/constants";

interface StatItem {
  labelEn: string;
  labelAr: string;
  value: number;
  prevValue: number;
  icon: React.ElementType;
}

export const WeeklyOverviewWidget = memo(function WeeklyOverviewWidget() {
  const { user } = useAuth();
  const isAr = useIsAr();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["weekly-overview", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const now = new Date();
      const weekAgo = new Date(now.getTime() - MS_PER_WEEK);
      const twoWeeksAgo = new Date(now.getTime() - 14 * MS_PER_DAY);
      const weekStr = weekAgo.toISOString();
      const twoWeekStr = twoWeeksAgo.toISOString();

      const [views, prevViews, posts, prevPosts, regs, prevRegs] = await Promise.all([
        supabase.from("profile_views").select("id", { count: "exact", head: true }).eq("profile_user_id", user.id).gte("viewed_at", weekStr),
        supabase.from("profile_views").select("id", { count: "exact", head: true }).eq("profile_user_id", user.id).gte("viewed_at", twoWeekStr).lt("viewed_at", weekStr),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", user.id).gte("created_at", weekStr),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", user.id).gte("created_at", twoWeekStr).lt("created_at", weekStr),
        supabase.from("competition_registrations").select("id", { count: "exact", head: true }).eq("participant_id", user.id).gte("registered_at", weekStr),
        supabase.from("competition_registrations").select("id", { count: "exact", head: true }).eq("participant_id", user.id).gte("registered_at", twoWeekStr).lt("registered_at", weekStr),
      ]);

      return [
        { labelEn: "Profile Views", labelAr: "مشاهدات الملف", value: views.count || 0, prevValue: prevViews.count || 0, icon: Eye },
        { labelEn: "Posts", labelAr: "المنشورات", value: posts.count || 0, prevValue: prevPosts.count || 0, icon: BookOpen },
        { labelEn: "Registrations", labelAr: "التسجيلات", value: regs.count || 0, prevValue: prevRegs.count || 0, icon: Trophy },
      ] as StatItem[];
    },
    enabled: !!user,
    ...CACHE.medium,
  });

  if (isLoading) return (
    <Card className="border-border/40 animate-pulse">
      <CardHeader className="pb-2"><Skeleton className="h-4 w-32" /></CardHeader>
      <CardContent className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </CardContent>
    </Card>
  );

  if (!stats) return null;

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">
          {isAr ? "نظرة أسبوعية" : "Weekly Overview"}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          const delta = s.value - s.prevValue;
          const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
          const trendColor = delta > 0 ? "text-chart-2" : delta < 0 ? "text-destructive" : "text-muted-foreground";

          return (
            <div key={s.labelEn} className="flex flex-col items-center gap-1 rounded-xl bg-muted/40 p-3 text-center">
              <Icon className="h-4 w-4 text-primary" />
              <AnimatedCounter value={s.value} className="text-lg font-bold" />
              <span className="text-xs text-muted-foreground">{isAr ? s.labelAr : s.labelEn}</span>
              <div className={`flex items-center gap-0.5 text-xs font-bold ${trendColor}`}>
                <TrendIcon className="h-2.5 w-2.5" />
                {delta > 0 ? `+${delta}` : delta}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
});
