import { useState, useEffect } from "react";
import { isPast } from "date-fns";

interface CountdownTimerProps {
  targetDate: Date;
  isAr: boolean;
  compact?: boolean;
}

export function CountdownTimer({ targetDate, isAr, compact = false }: CountdownTimerProps) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (isPast(targetDate)) return null;

  const totalSeconds = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const units = [
    { value: days, label: isAr ? "يوم" : "Days" },
    { value: hours, label: isAr ? "ساعة" : "Hours" },
    { value: minutes, label: isAr ? "دقيقة" : "Min" },
    { value: seconds, label: isAr ? "ثانية" : "Sec" },
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {units.map((u, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="flex h-12 w-full items-center justify-center rounded-xl border border-primary/20 bg-gradient-to-b from-primary/10 to-primary/5 shadow-sm">
              <span className="font-mono text-lg font-bold tabular-nums text-primary">
                {String(u.value).padStart(2, "0")}
              </span>
            </div>
            <span className="mt-1.5 text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80">
              {u.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 py-2 sm:gap-6">
      {units.map((u, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="group relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-gradient-to-b from-background to-primary/5 shadow-inner transition-all hover:scale-105 hover:border-primary/40 sm:h-20 sm:w-20">
            <span className="font-mono text-2xl font-bold tracking-tighter text-primary drop-shadow-sm sm:text-3xl">
              {String(u.value).padStart(2, "0")}
            </span>
            <div className="absolute inset-x-0 top-1/2 h-px bg-primary/10" />
          </div>
          <span className="mt-2 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80 sm:mt-3 sm:text-[10px] sm:tracking-[0.2em]">
            {u.label}
          </span>
        </div>
      ))}
    </div>
  );
}
