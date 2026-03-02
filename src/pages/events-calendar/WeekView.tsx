import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GLOBAL_EVENT_COLORS } from "@/hooks/useGlobalEventsCalendar";
import type { GlobalEvent } from "@/hooks/useGlobalEventsCalendar";
import { isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { EventChip } from "./EventChip";
import { getEventsForDay } from "./utils";

export function WeekView({ events, currentDate, isAr }: { events: GlobalEvent[]; currentDate: Date; isAr: boolean }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate, { weekStartsOn: 0 }) });

  const getDayEvents = (day: Date) => getEventsForDay(events, day);

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm">
      <CardContent className="p-0">
        <div className="grid grid-cols-7 divide-x divide-border/20">
          {weekDays.map((day, i) => {
            const dayEvents = getDayEvents(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div key={i} className={cn("min-h-[380px]", isToday && "bg-primary/3")}>
                <div className={cn(
                  "text-center py-3 border-b border-border/20 transition-colors",
                  isToday ? "bg-primary/8" : "bg-muted/20"
                )}>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{format(day, "EEE", isAr ? { locale: arLocale } : undefined)}</p>
                  <p className={cn(
                    "text-xl font-bold tabular-nums mt-0.5",
                    isToday ? "text-primary" : "text-foreground"
                  )}>{day.getDate()}</p>
                  {dayEvents.length > 0 && (
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      {dayEvents.slice(0, 5).map(ev => {
                        const colors = GLOBAL_EVENT_COLORS[ev.type];
                        return <div key={ev.id} className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />;
                      })}
                    </div>
                  )}
                </div>
                <ScrollArea className="h-[320px]">
                  <div className="p-1.5 space-y-1">
                    {dayEvents.length === 0 && (
                      <p className="text-[10px] text-muted-foreground/15 text-center pt-10">—</p>
                    )}
                    {dayEvents.map(ev => (
                      <EventChip key={ev.id} event={ev} isAr={isAr} />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
