import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Eye, Heart, Trophy, BookOpen } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface StatItem {
  labelEn: string;
  labelAr: string;
  value: number;
  prevValue: number;
  icon: React.ElementType;
}

export function WeeklyOverviewWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: stats } = useQuery({
    queryKey: ["weekly-overview", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
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
    staleTime: 5 * 60 * 1000,
  });

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
              <span className="text-[10px] text-muted-foreground">{isAr ? s.labelAr : s.labelEn}</span>
              <div className={`flex items-center gap-0.5 text-[9px] font-bold ${trendColor}`}>
                <TrendIcon className="h-2.5 w-2.5" />
                {delta > 0 ? `+${delta}` : delta}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
