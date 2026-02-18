import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isSameMonth, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { getDaysInMonth } from "@/hooks/useChefSchedule";
import type { GlobalEvent } from "@/hooks/useGlobalEventsCalendar";
import { EventChip } from "./EventChip";
import { getEventsForDay } from "./utils";
export function MonthView({ events, currentDate, selectedDay, onSelectDay, isAr }: {
  events: GlobalEvent[]; currentDate: Date;
  selectedDay: Date | null; onSelectDay: (d: Date) => void; isAr: boolean;
}) {
  const days = useMemo(() => getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()), [currentDate]);
  const dayNames = isAr
    ? ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDayEvents = (day: Date) => getEventsForDay(events, day);

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm">
      <CardContent className="p-0">
        <div className="grid grid-cols-7 bg-muted/30">
          {dayNames.map(d => (
            <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayEvents = getDayEvents(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const hasEvents = dayEvents.length > 0;
            return (
              <div
                key={i}
                onClick={() => onSelectDay(day)}
                className={cn(
                  "min-h-[90px] md:min-h-[115px] p-1.5 border-b border-e border-border/15 transition-all cursor-pointer relative",
                  !isCurrentMonth && "opacity-25 bg-muted/10",
                  isSelected && "bg-primary/8 ring-1 ring-inset ring-primary/20",
                  !isSelected && hasEvents && isCurrentMonth && "hover:bg-primary/5",
                  !isSelected && !hasEvents && isCurrentMonth && "hover:bg-muted/20"
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className={cn(
                    "flex items-center justify-center h-6 w-6 rounded-full text-xs tabular-nums transition-colors",
                    isToday && "bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/20",
                    !isToday && isCurrentMonth && "font-medium text-foreground",
                    !isToday && hasEvents && isCurrentMonth && "text-primary font-semibold",
                  )}>
                    {day.getDate()}
                  </span>
                  {hasEvents && isCurrentMonth && dayEvents.length > 2 && (
                    <Badge variant="secondary" className="h-4 text-[8px] px-1 tabular-nums">{dayEvents.length}</Badge>
                  )}
                </div>
                {hasEvents && isCurrentMonth && (
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <EventChip key={`${ev.id}-${day.toISOString()}`} event={ev} isAr={isAr} compact />
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[8px] text-center text-primary font-semibold mt-0.5">
                        +{dayEvents.length - 3} {isAr ? "المزيد" : "more"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
