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
      <div className="border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 font-semibold text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-4/10">
            <Timer className="h-3.5 w-3.5 text-chart-4" />
          </div>
          {isAr ? labelAr : label}
        </h3>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          <TimeUnit value={timeLeft.days} label={isAr ? "يوم" : "Days"} />
          <TimeUnit value={timeLeft.hours} label={isAr ? "ساعة" : "Hours"} />
          <TimeUnit value={timeLeft.minutes} label={isAr ? "دقيقة" : "Min"} />
          <TimeUnit value={timeLeft.seconds} label={isAr ? "ثانية" : "Sec"} />
        </div>
      </CardContent>
    </Card>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg bg-muted/50 py-2">
      <p className="text-lg font-bold tabular-nums">{String(value).padStart(2, "0")}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
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
