import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useGlobalEventsCalendar, GLOBAL_EVENT_COLORS, GLOBAL_EVENT_LABELS, type GlobalEvent, type GlobalEventType } from "@/hooks/useGlobalEventsCalendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Trophy, Landmark, ChefHat, Tv, Mic, GraduationCap, Plane, Users, MoreHorizontal, ArrowRight, Globe, BookOpen, UtensilsCrossed, Palmtree, Ban, ChevronLeft, ChevronRight, List, Clock } from "lucide-react";
import { format, parseISO, isSameDay, isSameMonth, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { getDaysInMonth } from "@/hooks/useChefSchedule";

const ICONS: Record<string, any> = {
  Trophy, Landmark, ChefHat, Tv, Mic, GraduationCap, MapPin, Plane, Users,
  MoreHorizontal, BookOpen, UtensilsCrossed, Palmtree, Ban,
};

const FILTER_TYPES: GlobalEventType[] = ["competition", "exhibition", "conference", "tv_interview", "training", "chefs_table"];

export function HomeEventsCalendarPreview() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [viewMode, setViewMode] = useState<"cards" | "mini-cal">("cards");
  const [selectedFilter, setSelectedFilter] = useState<GlobalEventType | null>(null);
  const [calDate, setCalDate] = useState(new Date());
  const { data: events = [] } = useGlobalEventsCalendar();

  const upcoming = useMemo(() => {
    let filtered = events.filter(e => new Date(e.start_date) >= new Date());
    if (selectedFilter) filtered = filtered.filter(e => e.type === selectedFilter);
    return filtered.slice(0, 6);
  }, [events, selectedFilter]);

  const calDays = useMemo(() => getDaysInMonth(calDate.getFullYear(), calDate.getMonth()), [calDate]);
  const dayNames = isAr ? ["أ", "إ", "ث", "أ", "خ", "ج", "س"] : ["S", "M", "T", "W", "T", "F", "S"];

  const getEventsForDay = (day: Date) => events.filter(e => isSameDay(new Date(e.start_date), day));

  if (events.length === 0) return null;

  return (
    <section className="container py-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{isAr ? "تقويم الفعاليات" : "Events Calendar"}</h2>
            <p className="text-xs text-muted-foreground">{isAr ? "الفعاليات القادمة محلياً ودولياً" : "Upcoming local & international events"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs rounded-none px-2.5"
              onClick={() => setViewMode("cards")}
            >
              <List className="h-3 w-3" />
            </Button>
            <Button
              variant={viewMode === "mini-cal" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs rounded-none px-2.5"
              onClick={() => setViewMode("mini-cal")}
            >
              <Calendar className="h-3 w-3" />
            </Button>
          </div>
          <Link to="/events-calendar">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              {isAr ? "عرض التقويم" : "View Calendar"}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Type Filter Chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <Button
          variant={selectedFilter === null ? "default" : "outline"}
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={() => setSelectedFilter(null)}
        >
          {isAr ? "الكل" : "All"}
        </Button>
        {FILTER_TYPES.map(type => {
          const label = GLOBAL_EVENT_LABELS[type];
          const colors = GLOBAL_EVENT_COLORS[type];
          const active = selectedFilter === type;
          return (
            <Button
              key={type}
              variant={active ? "default" : "outline"}
              size="sm"
              className={cn("h-6 text-[10px] px-2", !active && `${colors.bg} ${colors.text} ${colors.border} border`)}
              onClick={() => setSelectedFilter(active ? null : type)}
            >
              {isAr ? label?.ar : label?.en}
            </Button>
          );
        })}
      </div>

      {viewMode === "mini-cal" ? (
        /* ─── Mini Calendar View ─── */
        <Card>
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCalDate(d => subMonths(d, 1))}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-semibold">{format(calDate, "MMMM yyyy")}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCalDate(d => addMonths(d, 1))}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <CardContent className="p-2">
            <div className="grid grid-cols-7 gap-px">
              {dayNames.map((d, i) => (
                <div key={i} className="p-1 text-center text-[10px] font-medium text-muted-foreground">{d}</div>
              ))}
              {calDays.map((day, i) => {
                const dayEvts = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, calDate);
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={i}
                    className={cn(
                      "min-h-[50px] p-0.5 rounded-sm transition-colors",
                      !isCurrentMonth && "opacity-30",
                      isToday && "bg-primary/5 ring-1 ring-primary/20"
                    )}
                  >
                    <div className={cn("text-[10px] text-center mb-0.5", isToday && "text-primary font-bold")}>
                      {day.getDate()}
                    </div>
                    {dayEvts.slice(0, 2).map(ev => {
                      const colors = GLOBAL_EVENT_COLORS[ev.type];
                      return (
                        <div key={ev.id} className={cn("text-[7px] leading-[9px] px-0.5 rounded truncate mb-px", colors.bg, colors.text)}>
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvts.length > 2 && (
                      <div className="text-[7px] text-muted-foreground text-center">+{dayEvts.length - 2}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ─── Cards View ─── */
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.length === 0 ? (
            <div className="col-span-full text-center text-sm text-muted-foreground py-8">
              {isAr ? "لا توجد فعاليات قادمة" : "No upcoming events"}
            </div>
          ) : (
            upcoming.map(ev => {
              const colors = GLOBAL_EVENT_COLORS[ev.type];
              const label = GLOBAL_EVENT_LABELS[ev.type];
              const IconComp = ICONS[label?.icon] || MoreHorizontal;
              return (
                <Card key={ev.id} className={cn("border overflow-hidden hover:shadow-md transition-shadow", colors.border)}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", colors.bg, colors.border)}>
                        <IconComp className={cn("h-4 w-4", colors.text)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 mb-1 border", colors.bg, colors.text, colors.border)}>
                          {isAr ? label?.ar : label?.en}
                        </Badge>
                        {ev.link ? (
                          <Link to={ev.link} className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1 block">{ev.title}</Link>
                        ) : (
                          <p className="text-sm font-semibold line-clamp-1">{ev.title}</p>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                          <span className="flex items-center gap-0.5">
                            <Calendar className="h-2.5 w-2.5" />
                            {format(parseISO(ev.start_date), "MMM d, yyyy")}
                          </span>
                          {ev.city && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5" />{ev.city}
                            </span>
                          )}
                          {ev.is_recurring && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0">{isAr ? "سنوي" : "Annual"}</Badge>
                          )}
                        </div>
                      </div>
                      <div className={cn("w-1 h-10 rounded-full shrink-0", colors.dot)} />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
