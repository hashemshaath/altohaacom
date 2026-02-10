import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="overflow-hidden">
      <div className="border-b bg-gradient-to-r from-primary/5 via-transparent to-primary/5 px-4 py-3">
        <h3 className="flex items-center gap-2 font-semibold text-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Timer className="h-4 w-4 text-primary" />
          </div>
          {isAr ? labelAr : label}
        </h3>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-4 gap-3 text-center">
          <FlipUnit value={timeLeft.days} label={isAr ? "يوم" : "Days"} />
          <FlipUnit value={timeLeft.hours} label={isAr ? "ساعة" : "Hours"} />
          <FlipUnit value={timeLeft.minutes} label={isAr ? "دقيقة" : "Min"} />
          <FlipUnit value={timeLeft.seconds} label={isAr ? "ثانية" : "Sec"} />
        </div>
      </CardContent>
    </Card>
  );
}

function FlipUnit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");
  return (
    <div className="space-y-1">
      <div className="relative rounded-xl border bg-gradient-to-b from-card to-muted/50 shadow-sm overflow-hidden">
        {/* Divider line */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-border/50 z-10" />
        <p className="text-2xl font-bold tabular-nums py-3 relative z-0 tracking-wider">
          {display}
        </p>
      </div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
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
