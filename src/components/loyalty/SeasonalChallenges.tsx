import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Clock, Trophy, Flame, Star } from "lucide-react";
import { differenceInDays, differenceInHours } from "date-fns";

const SEASON_ICONS: Record<string, typeof Sparkles> = {
  daily: Clock,
  weekly: Star,
  seasonal: Sparkles,
  special: Trophy,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  medium: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  hard: "bg-destructive/10 text-destructive border-destructive/20",
};

export function SeasonalChallenges() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();

  const { data: challenges = [] } = useQuery({
    queryKey: ["active-challenges"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .eq("is_hidden", false)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("sort_order", { ascending: true })
        .limit(8);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: userProgress = [] } = useQuery({
    queryKey: ["user-challenge-progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("user_challenges")
        .select("*")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getProgress = (challengeId: string) => {
    const p = userProgress.find((up: any) => up.challenge_id === challengeId);
    return p ? { current: p.progress || 0, completed: p.completed_at != null } : { current: 0, completed: false };
  };

  const getTimeLeft = (endsAt: string | null) => {
    if (!endsAt) return isAr ? "دائم" : "Ongoing";
    const now = new Date();
    const end = new Date(endsAt);
    const days = differenceInDays(end, now);
    if (days > 1) return isAr ? `${days} يوم` : `${days}d left`;
    const hours = differenceInHours(end, now);
    if (hours > 0) return isAr ? `${hours} ساعة` : `${hours}h left`;
    return isAr ? "انتهى" : "Ended";
  };

  if (challenges.length === 0) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-1/10">
            <Flame className="h-3.5 w-3.5 text-chart-1" />
          </div>
          {isAr ? "التحديات النشطة" : "Active Challenges"}
          <Badge variant="secondary" className="text-[10px]">{challenges.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {challenges.map((c: any) => {
            const { current, completed } = getProgress(c.id);
            const target = c.target_count || 1;
            const pct = Math.min(100, Math.round((current / target) * 100));
            const Icon = SEASON_ICONS[c.challenge_type] || Sparkles;

            return (
              <div
                key={c.id}
                className={`rounded-xl border p-3 transition-all ${completed ? "border-chart-2/40 bg-chart-2/5" : "border-border/40 hover:border-border/60"}`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-lg">
                    {c.icon_emoji || <Icon className="h-4 w-4 text-chart-1" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold truncate">{isAr ? c.title_ar || c.title : c.title}</p>
                      {completed && <Trophy className="h-3 w-3 text-chart-2 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                      {isAr ? c.description_ar || c.description : c.description}
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <Progress value={pct} className="h-1.5 flex-1" />
                  <span className="text-[10px] font-medium text-muted-foreground tabular-nums whitespace-nowrap">
                    {current}/{target}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {c.difficulty && (
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 ${DIFFICULTY_COLORS[c.difficulty] || ""}`}>
                        {c.difficulty}
                      </Badge>
                    )}
                    {c.reward_points && (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 gap-0.5">
                        <Star className="h-2.5 w-2.5" />
                        {c.reward_points}
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{getTimeLeft(c.ends_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
