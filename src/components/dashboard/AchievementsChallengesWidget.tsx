import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Flame, Star, ChevronRight, Sparkles, Check } from "lucide-react";
import { Link } from "react-router-dom";

export function AchievementsChallengesWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["dashboard-challenges-widget", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const [challengesRes, progressRes, badgesRes, streakRes] = await Promise.all([
        supabase
          .from("challenges")
          .select("id, title, title_ar, target_count, reward_points, icon_emoji, difficulty, challenge_type")
          .eq("is_active", true)
          .eq("is_hidden", false)
          .order("sort_order")
          .limit(6),
        supabase
          .from("user_challenges")
          .select("challenge_id, progress, completed_at")
          .eq("user_id", user.id),
        supabase
          .from("user_badges")
          .select("id, badge_name, badge_name_ar, badge_icon, earned_at")
          .eq("user_id", user.id)
          .order("earned_at", { ascending: false })
          .limit(5),
        supabase
          .from("user_streaks")
          .select("streak_type, current_streak, longest_streak")
          .eq("user_id", user.id)
          .eq("streak_type", "daily_login")
          .maybeSingle(),
      ]);

      const challenges = challengesRes.data || [];
      const progress = progressRes.data || [];
      const badges = badgesRes.data || [];
      const streak = streakRes.data;

      const activeChallenges = challenges.map((c: any) => {
        const p = progress.find((up: any) => up.challenge_id === c.id);
        return {
          ...c,
          current: p?.progress || 0,
          completed: !!p?.completed_at,
        };
      });

      const completedCount = progress.filter((p: any) => p.completed_at).length;

      return { activeChallenges, badges, streak, completedCount, totalChallenges: challenges.length };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 3,
  });

  if (!data) return null;

  const { activeChallenges, badges, streak, completedCount } = data;
  const incompleteChallenges = activeChallenges.filter((c: any) => !c.completed).slice(0, 3);

  return (
    <Card className="border-border/40 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
              <Trophy className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "الإنجازات والتحديات" : "Achievements & Challenges"}
          </CardTitle>
          <Link to="/loyalty">
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
              {isAr ? "عرض الكل" : "View All"}
              <ChevronRight className="h-3 w-3 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-xl bg-muted/50">
            <Flame className="h-3.5 w-3.5 text-chart-1 mx-auto mb-0.5" />
            <p className="text-lg font-bold">{streak?.current_streak || 0}</p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "يوم متتالي" : "Day Streak"}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-muted/50">
            <Trophy className="h-3.5 w-3.5 text-primary mx-auto mb-0.5" />
            <p className="text-lg font-bold">{completedCount}</p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "مكتمل" : "Completed"}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-muted/50">
            <Star className="h-3.5 w-3.5 text-chart-4 mx-auto mb-0.5" />
            <p className="text-lg font-bold">{badges.length}</p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "شارات" : "Badges"}</p>
          </div>
        </div>

        {/* Active Challenges */}
        {incompleteChallenges.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-chart-1" />
              {isAr ? "تحديات نشطة" : "Active Challenges"}
            </p>
            {incompleteChallenges.map((c: any) => {
              const pct = Math.min(100, Math.round((c.current / (c.target_count || 1)) * 100));
              return (
                <div key={c.id} className="rounded-xl border border-border/30 p-2.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.icon_emoji || "🏆"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{isAr ? c.title_ar || c.title : c.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Progress value={pct} className="h-1 flex-1" />
                        <span className="text-[9px] text-muted-foreground tabular-nums">{c.current}/{c.target_count}</span>
                      </div>
                    </div>
                    {c.reward_points && (
                      <Badge variant="secondary" className="text-[9px] gap-0.5 shrink-0">
                        <Star className="h-2.5 w-2.5" />
                        {c.reward_points}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent Badges */}
        {badges.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {isAr ? "آخر الشارات" : "Recent Badges"}
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {badges.map((b: any) => (
                <div key={b.id} className="flex flex-col items-center gap-1 shrink-0 p-2 rounded-xl bg-muted/30 min-w-[56px]">
                  <span className="text-xl">{b.badge_icon || "⭐"}</span>
                  <p className="text-[8px] text-muted-foreground text-center line-clamp-1 max-w-[52px]">
                    {isAr ? b.badge_name_ar || b.badge_name : b.badge_name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {incompleteChallenges.length === 0 && badges.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">{isAr ? "ابدأ بإكمال التحديات لكسب الشارات!" : "Start completing challenges to earn badges!"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
