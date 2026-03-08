import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";
import { differenceInDays, format, isWithinInterval, isPast, isFuture } from "date-fns";

interface Props {
  startDate: string;
  endDate: string;
  isAr: boolean;
}

export const ExhibitionDayIndicator = memo(function ExhibitionDayIndicator({ startDate, endDate, isAr }: Props) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = differenceInDays(end, start) + 1;
  const isHappening = isWithinInterval(now, { start, end });
  const hasEnded = isPast(end);
  const isUpcoming = isFuture(start);

  const currentDay = isHappening ? differenceInDays(now, start) + 1 : 0;

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Calendar className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? "جدول الأيام" : "Event Timeline"}
        </h3>
      </div>
      <CardContent className="p-4 space-y-3">
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <Badge
            className={
              isHappening
                ? "bg-chart-3/15 text-chart-3 border-chart-3/20"
                : hasEnded
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/15 text-primary border-primary/20"
            }
          >
            {isHappening
              ? isAr ? `🔴 اليوم ${currentDay} من ${totalDays}` : `🔴 Day ${currentDay} of ${totalDays}`
              : hasEnded
                ? isAr ? "انتهى" : "Completed"
                : isAr ? "لم يبدأ بعد" : "Not started yet"
            }
          </Badge>
          <span className="text-xs text-muted-foreground font-medium">
            {totalDays} {isAr ? "أيام" : "days"}
          </span>
        </div>

        {/* Day progress dots */}
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: Math.min(totalDays, 14) }, (_, i) => {
            const dayNum = i + 1;
            const isCurrent = isHappening && dayNum === currentDay;
            const isPassed = isHappening ? dayNum < currentDay : hasEnded;
            return (
              <div
                key={i}
                className={`relative flex h-8 w-8 items-center justify-center rounded-xl text-[10px] font-bold transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-primary/30 scale-110"
                    : isPassed
                      ? "bg-chart-3/15 text-chart-3"
                      : "bg-muted/50 text-muted-foreground"
                }`}
                title={`${isAr ? "اليوم" : "Day"} ${dayNum}`}
              >
                {isPassed && !isCurrent ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  dayNum
                )}
                {isCurrent && (
                  <span className="absolute -top-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-chart-3 animate-pulse ring-2 ring-background" />
                )}
              </div>
            );
          })}
          {totalDays > 14 && (
            <div className="flex h-8 items-center px-1 text-[10px] text-muted-foreground">
              +{totalDays - 14}
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            <span>{format(start, "MMM d, yyyy")}</span>
          </div>
          <span className="text-muted-foreground/40">→</span>
          <span>{format(end, "MMM d, yyyy")}</span>
        </div>
      </CardContent>
    </Card>
  );
});
