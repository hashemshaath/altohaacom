import { useMemo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { getDaysInMonth, EVENT_TYPE_CONFIG, type ChefScheduleEvent, type ScheduleEventType } from "@/hooks/useChefSchedule";
import {
  useGlobalEventsCalendar, GLOBAL_EVENT_COLORS, GLOBAL_EVENT_LABELS,
  type GlobalEvent, type GlobalEventType,
} from "@/hooks/useGlobalEventsCalendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Globe, Trophy, Landmark, ChefHat, Tv, Mic, GraduationCap, MapPin, Plane, Users, MoreHorizontal, BookOpen, UtensilsCrossed, Palmtree, Ban } from "lucide-react";
import { format, isSameDay, isSameMonth, parseISO, isWithinInterval } from "date-fns";
import { Link } from "react-router-dom";

const GLOBAL_ICONS: Record<string, any> = {
  Trophy, Landmark, ChefHat, Tv, Mic, GraduationCap, MapPin, Plane, Users,
  MoreHorizontal, BookOpen, UtensilsCrossed, Palmtree, Ban,
};

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
  const [showGlobal, setShowGlobal] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

  const { data: globalEvents = [] } = useGlobalEventsCalendar();

  const dayNames = isAr
    ? ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getScheduleEventsForDay = (day: Date) =>
    events.filter(ev => {
      const start = parseISO(ev.start_date);
      const end = ev.end_date ? parseISO(ev.end_date) : start;
      return isSameDay(start, day) || isSameDay(end, day) || isWithinInterval(day, { start, end });
    });

  const getGlobalEventsForDay = (day: Date) =>
    globalEvents.filter(ev => {
      const start = parseISO(ev.start_date);
      const end = ev.end_date ? parseISO(ev.end_date) : start;
      return isSameDay(start, day) || isSameDay(end, day) || isWithinInterval(day, { start, end });
    });

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (day: Date, dateStr: string) => {
    setSelectedDay(day);
    onDateClick(dateStr);
  };

  const selectedScheduleEvents = selectedDay ? getScheduleEventsForDay(selectedDay) : [];
  const selectedGlobalEvents = selectedDay ? getGlobalEventsForDay(selectedDay) : [];

  return (
    <div className="space-y-4">
      {/* Toggle global events */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch id="show-global" checked={showGlobal} onCheckedChange={setShowGlobal} />
          <Label htmlFor="show-global" className="text-sm flex items-center gap-1.5 cursor-pointer">
            <Globe className="h-3.5 w-3.5 text-chart-3" />
            {isAr ? "إظهار المسابقات والمعارض والفعاليات" : "Show Competitions, Exhibitions & Events"}
          </Label>
        </div>
        {showGlobal && (
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-chart-1" /> {isAr ? "مسابقات" : "Competitions"}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-chart-3" /> {isAr ? "معارض" : "Exhibitions"}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-chart-4" /> {isAr ? "فعاليات" : "Events"}</span>
          </div>
        )}
      </div>

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
            const scheduleEvents = getScheduleEventsForDay(day);
            const dayGlobalEvents = showGlobal ? getGlobalEventsForDay(day) : [];
            const allDayEvents = [...scheduleEvents.map(e => ({ ...e, _source: "schedule" as const })), ...dayGlobalEvents.map(e => ({ ...e, _source: "global" as const }))];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            return (
              <div
                key={i}
                className={cn(
                  "min-h-[80px] border-b border-e border-border/15 p-1 cursor-pointer hover:bg-muted/30 transition-colors",
                  !isCurrentMonth && "opacity-40 bg-muted/10",
                  isSelected && "bg-primary/5 ring-1 ring-primary/30",
                )}
                onClick={() => handleDayClick(day, format(day, "yyyy-MM-dd"))}
              >
                <div className={cn(
                  "text-[11px] font-medium mb-0.5 w-6 h-6 flex items-center justify-center rounded-full",
                  isToday && "bg-primary text-primary-foreground",
                )}>
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {allDayEvents.slice(0, 3).map((ev, idx) => {
                    if (ev._source === "schedule") {
                      const sev = ev as ChefScheduleEvent & { _source: string };
                      const config = EVENT_TYPE_CONFIG[sev.event_type as ScheduleEventType] || EVENT_TYPE_CONFIG.other;
                      const chef = profileMap[sev.chef_id];
                      return (
                        <div
                          key={sev.id}
                          className={cn("text-[9px] px-1 py-0.5 rounded truncate cursor-pointer border", config.color)}
                          onClick={(e) => { e.stopPropagation(); onEventClick(sev as ChefScheduleEvent); }}
                          title={`${sev.title} - ${chef?.full_name || ""}`}
                        >
                          {sev.title}
                        </div>
                      );
                    } else {
                      const gev = ev as GlobalEvent & { _source: string };
                      const colors = GLOBAL_EVENT_COLORS[gev.type];
                      return (
                        <div
                          key={gev.id}
                          className={cn("text-[9px] px-1 py-0.5 rounded truncate border flex items-center gap-0.5", colors?.bg, colors?.text, colors?.border)}
                          title={`🌐 ${gev.title}`}
                        >
                          <Globe className="h-2 w-2 shrink-0" />
                          {isAr && gev.title_ar ? gev.title_ar : gev.title}
                        </div>
                      );
                    }
                  })}
                  {allDayEvents.length > 3 && (
                    <div className="text-[9px] text-muted-foreground text-center">+{allDayEvents.length - 3}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Selected day detail panel */}
      {selectedDay && (selectedScheduleEvents.length > 0 || selectedGlobalEvents.length > 0) && (
        <Card className="border-border/40 p-4 space-y-3">
          <h4 className="text-sm font-semibold">{format(selectedDay, "EEEE, MMMM d, yyyy")}</h4>

          {selectedScheduleEvents.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "أحداث الطهاة" : "Chef Events"}</p>
              {selectedScheduleEvents.map(ev => {
                const config = EVENT_TYPE_CONFIG[ev.event_type as ScheduleEventType] || EVENT_TYPE_CONFIG.other;
                const chef = profileMap[ev.chef_id];
                return (
                  <div key={ev.id} className={cn("flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/30", config.color)} onClick={() => onEventClick(ev)}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{ev.title}</p>
                      <p className="text-[10px] text-muted-foreground">{chef?.full_name || "—"} · {ev.city || ev.location || ""}</p>
                    </div>
                    <Badge className={`text-[9px] border ${config.color}`}>{isAr ? config.ar : config.en}</Badge>
                  </div>
                );
              })}
            </div>
          )}

          {showGlobal && selectedGlobalEvents.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Globe className="h-3 w-3" /> {isAr ? "مسابقات ومعارض وفعاليات" : "Competitions, Exhibitions & Events"}
              </p>
              {selectedGlobalEvents.map(gev => {
                const colors = GLOBAL_EVENT_COLORS[gev.type];
                const label = GLOBAL_EVENT_LABELS[gev.type];
                const GIcon = GLOBAL_ICONS[gev.icon] || MoreHorizontal;
                return (
                  <div key={gev.id} className={cn("flex items-center gap-2 p-2 rounded-lg border", colors?.bg, colors?.border)}>
                    <GIcon className={cn("h-4 w-4 shrink-0", colors?.text)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{isAr && gev.title_ar ? gev.title_ar : gev.title}</p>
                      <p className="text-[10px] text-muted-foreground">{gev.city || ""}{gev.city && gev.country_code ? `, ${gev.country_code}` : gev.country_code || ""} · {gev.venue || ""}</p>
                    </div>
                    <Badge className={cn("text-[9px] border", colors?.bg, colors?.text, colors?.border)}>
                      {isAr ? label?.ar : label?.en}
                    </Badge>
                    {gev.link && (
                      <Link to={gev.link} className="text-[10px] text-primary hover:underline" onClick={e => e.stopPropagation()}>
                        {isAr ? "عرض" : "View"}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
