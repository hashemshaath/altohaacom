import { useState, useEffect, memo } from "react";
import { Timer } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface CompetitionCountdownProps {
  targetDate: string;
  label: string;
  labelAr: string;
}

export const CompetitionCountdown = memo(function CompetitionCountdown({ targetDate, label, labelAr }: CompetitionCountdownProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.total <= 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm">
      <div className="border-b border-border/30 bg-gradient-to-r from-primary/[0.06] via-primary/[0.02] to-transparent px-5 py-3.5">
        <h3 className="flex items-center gap-2.5 font-bold text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-primary/10">
            <Timer className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? labelAr : label}
        </h3>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-4 gap-2.5">
          <FlipUnit value={timeLeft.days} label={isAr ? "يوم" : "Days"} />
          <FlipUnit value={timeLeft.hours} label={isAr ? "ساعة" : "Hours"} />
          <FlipUnit value={timeLeft.minutes} label={isAr ? "دقيقة" : "Min"} />
          <FlipUnit value={timeLeft.seconds} label={isAr ? "ثانية" : "Sec"} />
        </div>
      </div>
    </div>
  );
});

function FlipUnit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");
  return (
    <div className="space-y-1.5 text-center">
      <div className="relative rounded-xl bg-gradient-to-b from-muted/50 to-muted/20 border border-border/30 overflow-hidden shadow-sm">
        <div className="absolute inset-x-0 top-1/2 h-px bg-border/20 z-10" />
        <p className="text-2xl sm:text-3xl font-black tabular-nums py-3 sm:py-3.5 relative z-0 tracking-wider text-foreground">
          {display}
        </p>
      </div>
      <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
    </div>
  );
}

function getTimeLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}
