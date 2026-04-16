import { useMemo, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isSameMonth, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { getDaysInMonth } from "@/hooks/useChefSchedule";
import type { GlobalEvent } from "@/hooks/useGlobalEventsCalendar";
import { GLOBAL_EVENT_COLORS } from "@/hooks/useGlobalEventsCalendar";
import { EventChip } from "./EventChip";
import { getEventsForDay } from "@/lib/eventsCalendarUtils";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

export const MonthView = memo(function MonthView({ events, currentDate, selectedDay, onSelectDay, isAr }: {
  events: GlobalEvent[]; currentDate: Date;
  selectedDay: Date | null; onSelectDay: (d: Date) => void; isAr: boolean;
}) {
  const days = useMemo(() => getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()), [currentDate]);
  const dayNames = isAr
    ? ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Pre-compute events for all days once
  const dayEventsMap = useMemo(() => {
    const map = new Map<string, GlobalEvent[]>();
    days.forEach(day => {
      map.set(day.toISOString(), getEventsForDay(events, day));
    });
    return map;
  }, [days, events]);

  return (
    <Card className="overflow-hidden border-border/30 shadow-sm rounded-2xl">
      <CardContent className="p-0">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-muted/20">
          {dayNames.map(d => (
            <div key={d} className="py-3 text-center text-[0.6875rem] font-bold text-muted-foreground/70 uppercase tracking-widest border-b border-border/20">{d}</div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayEvents = dayEventsMap.get(day.toISOString()) || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const hasEvents = dayEvents.length > 0;
            // Event density color intensity
            const density = Math.min(dayEvents.length, 5);
            return (
              <div
                key={i}
                onClick={() => onSelectDay(day)}
                className={cn(
                  "min-h-[90px] md:min-h-[110px] p-1.5 border-b border-e border-border/10 transition-all duration-200 cursor-pointer relative group",
                  !isCurrentMonth && "opacity-20",
                  isSelected && "bg-primary/8 ring-2 ring-inset ring-primary/25 shadow-inner",
                  !isSelected && hasEvents && isCurrentMonth && "hover:bg-primary/4",
                  !isSelected && !hasEvents && isCurrentMonth && "hover:bg-muted/15",
                )}
              >
                {/* Density indicator bar */}
                {hasEvents && isCurrentMonth && density > 1 && (
                  <div
                    className="absolute top-0 inset-x-0 h-0.5 rounded-b-full transition-all"
                    style={{ opacity: density * 0.2, background: `hsl(var(--primary))` }}
                  />
                )}
                <div className="flex items-start justify-between mb-1">
                  <span className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-lg text-xs tabular-nums transition-all duration-200",
                    isToday && "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/25 scale-105",
                    !isToday && isCurrentMonth && hasEvents && "font-bold text-primary",
                    !isToday && isCurrentMonth && !hasEvents && "font-medium text-foreground/70",
                    "group-hover:scale-105"
                  )}>
                    {day.getDate()}
                  </span>
                  {hasEvents && isCurrentMonth && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {dayEvents.length > 2 && (
                        <Badge variant="secondary" className="h-4 text-[0.625rem] px-1.5 tabular-nums rounded-md">{dayEvents.length}</Badge>
                      )}
                      {dayEvents.length <= 2 && dayEvents.map(ev => {
                        const c = GLOBAL_EVENT_COLORS[ev.type];
                        return <div key={ev.id} className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />;
                      })}
                    </div>
                  )}
                </div>
                {hasEvents && isCurrentMonth && (
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <EventChip key={`${ev.id}-${day.toISOString()}`} event={ev} isAr={isAr} compact />
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[0.625rem] text-center text-primary font-bold mt-0.5 opacity-70">
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
});
