import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GLOBAL_EVENT_COLORS, GLOBAL_EVENT_LABELS, type GlobalEvent } from "@/hooks/useGlobalEventsCalendar";
import { format, startOfMonth, endOfMonth, isSameMonth, isSameDay, isBefore, eachDayOfInterval, getDay } from "date-fns";
import { cn } from "@/lib/utils";

export function YearView({ events, currentDate, onNavigate, isAr }: {
  events: GlobalEvent[]; currentDate: Date; onNavigate: (d: Date) => void; isAr: boolean;
}) {
  const year = currentDate.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {months.map((monthDate, mi) => {
        const ms = startOfMonth(monthDate);
        const me = endOfMonth(monthDate);
        const monthEvents = events.filter(e => {
          const d = new Date(e.start_date);
          return d >= ms && d <= me;
        });
        const isCurrentMonth = isSameMonth(monthDate, new Date());
        const isPast = isBefore(me, new Date()) && !isCurrentMonth;
        return (
          <Card
            key={mi}
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 border-border/40",
              isCurrentMonth && "ring-2 ring-primary/25 border-primary/20 shadow-md shadow-primary/5",
              isPast && "opacity-60"
            )}
            onClick={() => onNavigate(monthDate)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className={cn("text-xs font-bold", isCurrentMonth && "text-primary")}>{format(monthDate, "MMMM")}</h4>
                {monthEvents.length > 0 && (
                  <Badge variant={isCurrentMonth ? "default" : "outline"} className="text-[9px] h-4 px-1.5 tabular-nums">{monthEvents.length}</Badge>
                )}
              </div>
              <MiniMonthGrid monthDate={monthDate} events={monthEvents} />
              {monthEvents.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.from(new Set(monthEvents.map(e => e.type))).slice(0, 6).map(type => {
                    const colors = GLOBAL_EVENT_COLORS[type];
                    const label = GLOBAL_EVENT_LABELS[type];
                    return (
                      <Tooltip key={type}>
                        <TooltipTrigger asChild>
                          <div className={cn("h-2 w-2 rounded-full cursor-default", colors.dot)} />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
                          {isAr ? label.ar : label.en}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function MiniMonthGrid({ monthDate, events }: { monthDate: Date; events: GlobalEvent[] }) {
  const days = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
  const firstDayOffset = getDay(startOfMonth(monthDate));

  return (
    <div className="grid grid-cols-7 gap-px">
      {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`e-${i}`} className="h-4" />)}
      {days.map((day, i) => {
        const dayEventCount = events.filter(e => isSameDay(new Date(e.start_date), day)).length;
        const isToday = isSameDay(day, new Date());
        return (
          <div key={i} className={cn(
            "h-4 flex items-center justify-center text-[8px] rounded-sm transition-colors",
            isToday && "bg-primary text-primary-foreground font-bold ring-1 ring-primary/30",
            dayEventCount > 0 && !isToday && "bg-primary/15 text-primary font-semibold",
            dayEventCount > 2 && !isToday && "bg-primary/25",
          )}>
            {day.getDate()}
          </div>
        );
      })}
    </div>
  );
}
