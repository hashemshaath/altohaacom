import { useState, useEffect } from "react";
import { Timer } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface CompetitionCountdownProps {
  targetDate: string;
  label: string;
  labelAr: string;
}

export function CompetitionCountdown({ targetDate, label, labelAr }: CompetitionCountdownProps) {
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
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-card">
      <div className="border-b border-border/30 bg-gradient-to-r from-primary/[0.04] to-transparent px-5 py-3.5">
        <h3 className="flex items-center gap-2.5 font-bold text-sm">
          <Timer className="h-4 w-4 text-primary" />
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
}

function FlipUnit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");
  return (
    <div className="space-y-1.5 text-center">
      <div className="relative rounded-xl bg-muted/40 border border-border/30 overflow-hidden">
        <div className="absolute inset-x-0 top-1/2 h-px bg-border/20 z-10" />
        <p className="text-2xl font-bold tabular-nums py-3.5 relative z-0 tracking-wider text-foreground">
          {display}
        </p>
      </div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
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
