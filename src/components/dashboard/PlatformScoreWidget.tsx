import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, TrendingDown, Minus } from "lucide-react";

function getScoreLevel(score: number, isAr: boolean): { label: string; color: string; emoji: string } {
  if (score >= 80) return { label: isAr ? "متميّز" : "Outstanding", color: "text-chart-2", emoji: "🏆" };
  if (score >= 60) return { label: isAr ? "نشط جداً" : "Very Active", color: "text-primary", emoji: "🔥" };
  if (score >= 40) return { label: isAr ? "نشط" : "Active", color: "text-chart-3", emoji: "⚡" };
  if (score >= 20) return { label: isAr ? "مبتدئ" : "Getting Started", color: "text-chart-4", emoji: "🌱" };
  return { label: isAr ? "جديد" : "Newcomer", color: "text-muted-foreground", emoji: "👋" };
}

export const PlatformScoreWidget = memo(function PlatformScoreWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["platform-score", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const prevThirtyDays = new Date(Date.now() - 60 * 86400000).toISOString();

      const [posts, reactions, follows, regs, views, prevPosts, prevReactions] = await Promise.allSettled([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", user.id).gte("created_at", thirtyDaysAgo),
        supabase.from("post_reactions").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", thirtyDaysAgo),
        supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("following_id", user.id).gte("created_at", thirtyDaysAgo),
        supabase.from("competition_registrations").select("id", { count: "exact", head: true }).eq("participant_id", user.id).gte("registered_at", thirtyDaysAgo),
        supabase.from("profile_views").select("id", { count: "exact", head: true }).eq("profile_user_id", user.id).gte("viewed_at", thirtyDaysAgo),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", user.id).gte("created_at", prevThirtyDays).lt("created_at", thirtyDaysAgo),
        supabase.from("post_reactions").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", prevThirtyDays).lt("created_at", thirtyDaysAgo),
      ]);

      const getCount = (r: PromiseSettledResult<any>) => r.status === "fulfilled" ? (r.value.count || 0) : 0;

      const postCount = getCount(posts);
      const reactionCount = getCount(reactions);
      const followCount = getCount(follows);
      const regCount = getCount(regs);
      const viewCount = getCount(views);
      const prevPostCount = getCount(prevPosts);
      const prevReactionCount = getCount(prevReactions);

      // Score calculation (max 100)
      const postScore = Math.min(postCount * 5, 25);
      const reactionScore = Math.min(reactionCount * 2, 20);
      const followScore = Math.min(followCount * 3, 20);
      const regScore = Math.min(regCount * 10, 20);
      const viewScore = Math.min(viewCount, 15);
      const score = Math.min(postScore + reactionScore + followScore + regScore + viewScore, 100);

      const prevScore = Math.min(
        Math.min(prevPostCount * 5, 25) + Math.min(prevReactionCount * 2, 20),
        100
      );

      return {
        score,
        prevScore,
        breakdown: [
          { label: isAr ? "منشورات" : "Posts", value: postCount, max: 5 },
          { label: isAr ? "تفاعلات" : "Reactions", value: reactionCount, max: 10 },
          { label: isAr ? "متابعون جدد" : "New Followers", value: followCount, max: 7 },
          { label: isAr ? "مسابقات" : "Competitions", value: regCount, max: 2 },
          { label: isAr ? "مشاهدات" : "Views", value: viewCount, max: 15 },
        ],
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });

  if (!data) return null;

  const { label, color, emoji } = getScoreLevel(data.score, isAr);
  const delta = data.score - data.prevScore;
  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta > 0 ? "text-chart-2" : delta < 0 ? "text-destructive" : "text-muted-foreground";

  // SVG radial gauge
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (data.score / 100) * circumference;

  return (
    <Card className="relative overflow-hidden border-border/40 transition-shadow hover:shadow-lg">
      <div className="pointer-events-none absolute -end-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-[50px]" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? "نقاط النشاط" : "Engagement Score"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Radial Gauge */}
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" opacity="0.3" />
              <circle
                cx="60" cy="60" r={radius}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 60 60)"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black tabular-nums">{data.score}</span>
              <span className="text-[9px] text-muted-foreground">/100</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{emoji}</span>
              <span className={`text-sm font-bold ${color}`}>{label}</span>
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
              <TrendIcon className="h-3.5 w-3.5" />
              {delta > 0 ? `+${delta}` : delta} {isAr ? "عن الشهر الماضي" : "vs last month"}
            </div>
            <Badge variant="outline" className="text-[10px] rounded-xl">
              {isAr ? "آخر 30 يوم" : "Last 30 days"}
            </Badge>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="space-y-2 border-t border-border/30 pt-3">
          {data.breakdown.map((item) => {
            const pct = Math.min((item.value / item.max) * 100, 100);
            return (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-20 truncate">{item.label}</span>
                <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold tabular-nums w-6 text-end">{item.value}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
