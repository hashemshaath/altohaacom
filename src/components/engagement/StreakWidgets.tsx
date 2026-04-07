import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useLoginStreak } from "@/hooks/useLoginStreak";
import { Flame, Zap, Trophy } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";

/**
 * Compact streak badge shown in dashboard/profile areas.
 */
export const StreakBadge = memo(function StreakBadge({ className }: { className?: string }) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { currentStreak, multiplier, isLoading } = useLoginStreak();

  if (isLoading || currentStreak === 0) return null;

  const isHot = currentStreak >= 7;
  const isOnFire = currentStreak >= 30;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all",
        isOnFire
          ? "bg-gradient-to-r from-chart-4/20 to-destructive/20 text-destructive border border-destructive/30"
          : isHot
            ? "bg-chart-4/15 text-chart-4 border border-chart-4/30"
            : "bg-primary/10 text-primary border border-primary/20",
        className
      )}
      title={isAr ? `${currentStreak} يوم متتالي` : `${currentStreak} day streak`}
    >
      <Flame className={cn("h-3.5 w-3.5", isOnFire && "animate-pulse")} />
      <AnimatedCounter value={currentStreak} className="inline" />
      {multiplier > 1 && (
        <span className="flex items-center gap-0.5 text-[12px] opacity-80">
          <Zap className="h-2.5 w-2.5" />
          {multiplier}x
        </span>
      )}
    </div>
  );
});

/**
 * Detailed streak widget for dashboard.
 */
export const StreakWidget = memo(function StreakWidget({ className }: { className?: string }) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { currentStreak, longestStreak, totalLogins, multiplier, isLoading } = useLoginStreak();

  if (isLoading) return null;

  return (
    <div className={cn("rounded-2xl border border-border/50 p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Flame className="h-4 w-4 text-chart-4" />
          {isAr ? "سلسلة تسجيل الدخول" : "Login Streak"}
        </h3>
        {multiplier > 1 && (
          <span className="flex items-center gap-1 text-xs font-bold text-chart-4 bg-chart-4/10 px-2 py-0.5 rounded-full">
            <Zap className="h-3 w-3" />
            {multiplier}x {isAr ? "مضاعف" : "multiplier"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center rounded-xl bg-muted/50 p-2.5">
          <Flame className="h-4 w-4 mx-auto text-chart-4 mb-1" />
          <AnimatedCounter value={currentStreak} className="text-lg font-bold block" />
          <p className="text-[12px] text-muted-foreground">{isAr ? "الحالي" : "Current"}</p>
        </div>
        <div className="text-center rounded-xl bg-muted/50 p-2.5">
          <Trophy className="h-4 w-4 mx-auto text-primary mb-1" />
          <AnimatedCounter value={longestStreak} className="text-lg font-bold block" />
          <p className="text-[12px] text-muted-foreground">{isAr ? "الأطول" : "Best"}</p>
        </div>
        <div className="text-center rounded-xl bg-muted/50 p-2.5">
          <Zap className="h-4 w-4 mx-auto text-chart-2 mb-1" />
          <AnimatedCounter value={totalLogins} className="text-lg font-bold block" />
          <p className="text-[12px] text-muted-foreground">{isAr ? "إجمالي" : "Total"}</p>
        </div>
      </div>

      {/* Streak progress bar (7-day goal) */}
      <div className="space-y-1">
        <div className="flex justify-between text-[12px] text-muted-foreground">
          <span>{isAr ? "هدف 7 أيام" : "7-day goal"}</span>
          <span>{Math.min(currentStreak, 7)}/7</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-chart-4 to-destructive transition-all duration-500"
            style={{ width: `${Math.min(100, (currentStreak / 7) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
});
