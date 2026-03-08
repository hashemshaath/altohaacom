import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Displays the user's login streak (consecutive days with activity).
 * Calculates streak from points_ledger daily_login entries.
 */
export function StreakWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["login-streak", user?.id],
    queryFn: async () => {
      if (!user) return { streak: 0, weekDays: [] };

      // Get last 30 daily_login entries
      const { data: entries } = await supabase
        .from("points_ledger")
        .select("created_at")
        .eq("user_id", user.id)
        .eq("action_type", "daily_login")
        .order("created_at", { ascending: false })
        .limit(30);

      if (!entries || entries.length === 0) return { streak: 0, weekDays: getWeekDays() };

      // Calculate streak
      const dates = entries.map((e) => new Date(e.created_at).toDateString());
      const uniqueDates = [...new Set(dates)];
      let streak = 0;
      const today = new Date();

      for (let i = 0; i < 60; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        if (uniqueDates.includes(checkDate.toDateString())) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      return { streak, weekDays: getWeekDays(uniqueDates) };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });

  const streak = data?.streak || 0;
  const weekDays = data?.weekDays || getWeekDays();

  const dayLabels = isAr
    ? ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"]
    : ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <Card className="border-border/40 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
            streak >= 7 ? "bg-chart-4/15 text-chart-4" : streak >= 3 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {streak}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isAr ? "يوم متتالي" : "Day Streak"}
            </p>
          </div>
        </div>

        {/* Week visualization */}
        <div className="flex items-center justify-between gap-1">
          {weekDays.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-medium text-muted-foreground">
                {dayLabels[day.dayOfWeek]}
              </span>
              <div
                className={cn(
                  "h-6 w-6 rounded-xl flex items-center justify-center transition-all text-[10px] font-bold",
                  day.isToday && !day.active && "ring-1 ring-primary/30 bg-primary/5 text-primary",
                  day.active && "bg-primary text-primary-foreground shadow-sm",
                  !day.active && !day.isToday && "bg-muted/50 text-muted-foreground/40"
                )}
              >
                {day.active ? "✓" : day.date}
              </div>
            </div>
          ))}
        </div>

        {streak >= 7 && (
          <p className="mt-2 text-[10px] text-center font-semibold text-chart-4">
            🔥 {isAr ? "سلسلة رائعة! استمر!" : "Amazing streak! Keep going!"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function getWeekDays(activeDates: string[] = []) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return {
      dayOfWeek: i,
      date: d.getDate(),
      isToday: d.toDateString() === today.toDateString(),
      active: activeDates.includes(d.toDateString()),
    };
  });
}
