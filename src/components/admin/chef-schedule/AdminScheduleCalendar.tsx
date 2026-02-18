import { useMemo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { getDaysInMonth, EVENT_TYPE_CONFIG, type ChefScheduleEvent, type ScheduleEventType } from "@/hooks/useChefSchedule";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, isSameDay, isSameMonth, parseISO, isWithinInterval } from "date-fns";

interface Props {
  events: ChefScheduleEvent[];
  profileMap: Record<string, { full_name?: string; full_name_ar?: string | null }>;
  onEventClick: (event: ChefScheduleEvent) => void;
  onDateClick: (date: string) => void;
}

export default function AdminScheduleCalendar({ events, profileMap, onEventClick, onDateClick }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

  const dayNames = isAr
    ? ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getEventsForDay = (day: Date) =>
    events.filter(ev => {
      const start = parseISO(ev.start_date);
      const end = ev.end_date ? parseISO(ev.end_date) : start;
      return isSameDay(start, day) || isSameDay(end, day) || isWithinInterval(day, { start, end });
    });

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <Card className="border-border/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
        <h3 className="text-sm font-semibold">{format(currentDate, "MMMM yyyy")}</h3>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 border-b border-border/20">
        {dayNames.map(d => (
          <div key={d} className="text-[10px] font-semibold text-muted-foreground text-center py-1.5">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={i}
              className={cn(
                "min-h-[80px] border-b border-e border-border/15 p-1 cursor-pointer hover:bg-muted/30 transition-colors",
                !isCurrentMonth && "opacity-40 bg-muted/10",
              )}
              onClick={() => onDateClick(format(day, "yyyy-MM-dd"))}
            >
              <div className={cn(
                "text-[11px] font-medium mb-0.5 w-6 h-6 flex items-center justify-center rounded-full",
                isToday && "bg-primary text-primary-foreground",
              )}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(ev => {
                  const config = EVENT_TYPE_CONFIG[ev.event_type as ScheduleEventType] || EVENT_TYPE_CONFIG.other;
                  const chef = profileMap[ev.chef_id];
                  return (
                    <div
                      key={ev.id}
                      className={cn("text-[9px] px-1 py-0.5 rounded truncate cursor-pointer border", config.color)}
                      onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                      title={`${ev.title} - ${chef?.full_name || ""}`}
                    >
                      {ev.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[9px] text-muted-foreground text-center">+{dayEvents.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
