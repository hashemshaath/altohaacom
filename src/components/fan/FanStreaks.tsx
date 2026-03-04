import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, CalendarDays, Trophy, Zap } from "lucide-react";
import { useEffect } from "react";

export function FanStreaks() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: streak } = useQuery({
    queryKey: ["fan-streak", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("fan_streaks")
        .select("id, user_id, current_streak, longest_streak, total_active_days, last_activity_date, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Update streak on visit
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];

    const updateStreak = async () => {
      const { data: existing } = await supabase
        .from("fan_streaks")
        .select("id, current_streak, longest_streak, total_active_days, last_activity_date")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("fan_streaks").insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
          total_active_days: 1,
        });
      } else if (existing.last_activity_date !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        const isConsecutive = existing.last_activity_date === yesterdayStr;
        const newStreak = isConsecutive ? existing.current_streak + 1 : 1;
        const longestStreak = Math.max(newStreak, existing.longest_streak);

        await supabase
          .from("fan_streaks")
          .update({
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_activity_date: today,
            total_active_days: existing.total_active_days + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        return; // Already updated today
      }
      queryClient.invalidateQueries({ queryKey: ["fan-streak"] });
    };

    updateStreak();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = streak?.current_streak || 0;
  const longest = streak?.longest_streak || 0;
  const totalDays = streak?.total_active_days || 0;

  const streakEmoji = current >= 30 ? "🔥" : current >= 7 ? "⚡" : current >= 3 ? "✨" : "💫";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-1/10">
            <Flame className="h-3.5 w-3.5 text-chart-1" />
          </div>
          {isAr ? "سلسلة النشاط" : "Activity Streak"}
          {current > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 gap-0.5">
              {streakEmoji} {current}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <Flame className="h-4 w-4 mx-auto text-chart-1 mb-1" />
            <p className="text-lg font-bold">{current}</p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "الحالية" : "Current"}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <Trophy className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{longest}</p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "الأطول" : "Best"}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <CalendarDays className="h-4 w-4 mx-auto text-chart-3 mb-1" />
            <p className="text-lg font-bold">{totalDays}</p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "الأيام" : "Days"}</p>
          </div>
        </div>
        {current >= 3 && (
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            {isAr
              ? `${streakEmoji} استمر! أنت في سلسلة ${current} أيام متتالية`
              : `${streakEmoji} Keep going! You're on a ${current}-day streak`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
