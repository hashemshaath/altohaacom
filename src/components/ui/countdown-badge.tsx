import { useState, useEffect, memo } from "react";
import { isPast, differenceInDays, differenceInHours } from "date-fns";
import { Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  targetDate: Date;
  isAr: boolean;
  className?: string;
}

export const CountdownBadge = memo(function CountdownBadge({ targetDate, isAr, className }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000); // update every minute
    return () => clearInterval(id);
  }, []);

  if (isPast(targetDate)) return null;

  const days = differenceInDays(targetDate, now);
  const hours = differenceInHours(targetDate, now) % 24;
  const urgent = days < 3;

  const text = days > 0
    ? `${days}${isAr ? "ي" : "d"} ${hours}${isAr ? "س" : "h"}`
    : `${hours}${isAr ? " ساعة" : "h left"}`;

  return (
    <Badge
      variant={urgent ? "destructive" : "secondary"}
      className={cn("text-[9px] px-1.5 py-0 gap-0.5 font-mono tabular-nums", className)}
    >
      <Timer className="h-2.5 w-2.5" />
      {text}
    </Badge>
  );
});
