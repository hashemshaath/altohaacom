import React, { useState, useMemo, forwardRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useGlobalEventsCalendar, GLOBAL_EVENT_COLORS, GLOBAL_EVENT_LABELS, type GlobalEvent, type GlobalEventType } from "@/hooks/useGlobalEventsCalendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Calendar, MapPin, MoreHorizontal, Globe,
  ChevronLeft, ChevronRight, List, Timer, Building2,
} from "lucide-react";
import { format, parseISO, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { getDaysInMonth } from "@/hooks/useChefSchedule";
import { ICONS } from "@/pages/events-calendar/constants";
import { getCountdown } from "@/pages/events-calendar/utils";
import { SectionHeader } from "./SectionHeader";
import { FilterChip } from "./FilterChip";

const FILTER_TYPES: GlobalEventType[] = ["competition", "exhibition", "conference", "tv_interview", "training", "chefs_table"];

export const HomeEventsCalendarPreview = forwardRef<HTMLDivElement>(function HomeEventsCalendarPreview(_props, ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [viewMode, setViewMode] = useState<"cards" | "mini-cal">("cards");
  const [selectedFilter, setSelectedFilter] = useState<GlobalEventType | null>(null);
  const [calDate, setCalDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const { data: events = [] } = useGlobalEventsCalendar();

  const upcoming = useMemo(() => {
    let filtered = events.filter(e => new Date(e.start_date) >= new Date());
    if (selectedFilter) filtered = filtered.filter(e => e.type === selectedFilter);
    return filtered.slice(0, 6);
  }, [events, selectedFilter]);

  const calDays = useMemo(() => getDaysInMonth(calDate.getFullYear(), calDate.getMonth()), [calDate]);
  const dayNames = isAr
    ? ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getEventsForDay = (day: Date) => events.filter(e => isSameDay(new Date(e.start_date), day));

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return getEventsForDay(selectedDay);
  }, [selectedDay, events]);

  if (events.length === 0) return null;

  return (
    <div ref={ref}>
    <TooltipProvider delayDuration={200}>
      <section className="container py-8">
        <SectionHeader
          icon={Globe}
          badge={isAr ? "التقويم" : "Calendar"}
          title={isAr ? "تقويم الفعاليات" : "Events Calendar"}
          subtitle={isAr ? "الفعاليات القادمة محلياً ودولياً" : "Upcoming local & international events"}
          dataSource="competitions • exhibitions"
          itemCount={upcoming.length}
          viewAllHref="/events-calendar"
          viewAllLabel={isAr ? "عرض التقويم" : "View Calendar"}
          isAr={isAr}
          actions={
            <div className="hidden sm:flex items-center rounded-full border bg-muted/30 p-0.5">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => setViewMode("cards")}
              >
                <List className="h-3 w-3" />
              </Button>
              <Button
                variant={viewMode === "mini-cal" ? "default" : "ghost"}
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => setViewMode("mini-cal")}
              >
                <Calendar className="h-3 w-3" />
              </Button>
            </div>
          }
          filters={
            <>
              <FilterChip
                label={isAr ? "الكل" : "All"}
                active={selectedFilter === null}
                onClick={() => setSelectedFilter(null)}
              />
              {FILTER_TYPES.map(type => {
                const label = GLOBAL_EVENT_LABELS[type];
                const count = events.filter(e => e.type === type && new Date(e.start_date) >= new Date()).length;
                return (
                  <FilterChip
                    key={type}
                    label={isAr ? label?.ar : label?.en}
                    active={selectedFilter === type}
                    count={count}
                    onClick={() => setSelectedFilter(selectedFilter === type ? null : type)}
                  />
                );
              })}
            </>
          }
        />

        {viewMode === "mini-cal" ? (
          /* ─── Modern Calendar Grid ─── */
          <div className="space-y-3">
            <Card className="overflow-hidden border-border/40 shadow-sm">
              {/* Month navigation */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCalDate(d => subMonths(d, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-bold tracking-tight">{format(calDate, "MMMM yyyy")}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCalDate(d => addMonths(d, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="p-0">
                <div className="grid grid-cols-7">
                  {dayNames.map((d, i) => (
                    <div key={i} className="py-2.5 text-center text-[11px] font-medium text-muted-foreground tracking-wide border-b border-border/20">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calDays.map((day, i) => {
                    const dayEvts = getEventsForDay(day);
                    const isCurrentMonth = isSameMonth(day, calDate);
                    const isToday = isSameDay(day, new Date());
                    const isSelected = selectedDay && isSameDay(day, selectedDay);
                    const hasEvents = dayEvts.length > 0;
                    return (
                      <div
                        key={i}
                        onClick={() => hasEvents && setSelectedDay(day)}
                        className={cn(
                          "min-h-[72px] p-1.5 border-b border-e border-border/15 transition-all cursor-pointer",
                          !isCurrentMonth && "opacity-25",
                          isSelected && "bg-primary/5",
                          hasEvents && isCurrentMonth && "hover:bg-accent/20",
                          !hasEvents && isCurrentMonth && "hover:bg-muted/10"
                        )}
                      >
                        <div className="flex items-start justify-center mb-1">
                          <span className={cn(
                            "flex items-center justify-center h-6 w-6 rounded-full text-xs tabular-nums transition-colors",
                            isToday && "bg-primary text-primary-foreground font-bold",
                            !isToday && isCurrentMonth && "font-medium text-foreground",
                            !isToday && hasEvents && isCurrentMonth && "text-primary font-semibold",
                          )}>
                            {day.getDate()}
                          </span>
                        </div>
                        {hasEvents && isCurrentMonth && (
                          <div className="space-y-0.5">
                            {dayEvts.slice(0, 2).map(ev => {
                              const colors = GLOBAL_EVENT_COLORS[ev.type];
                              const evLabel = GLOBAL_EVENT_LABELS[ev.type];
                              const IconComp = ICONS[evLabel?.icon] || MoreHorizontal;
                              return (
                                <Tooltip key={ev.id}>
                                  <TooltipTrigger asChild>
                                    <div className={cn("flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[8px] leading-tight truncate", colors.bg, colors.text, "hover:shadow-sm hover:brightness-95 transition-all cursor-default")}>
                                      <IconComp className="h-2 w-2 shrink-0" />
                                      <span className="truncate font-medium">{ev.title}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="p-2">
                                    <MiniTooltip event={ev} isAr={isAr} />
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                            {dayEvts.length > 2 && (
                              <p className="text-[8px] text-center text-muted-foreground font-medium">+{dayEvts.length - 2}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {selectedDay && selectedDayEvents.length > 0 && (
              <Card className="border-primary/20 animate-in slide-in-from-top-2 duration-200 shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {format(selectedDay, isAr ? "EEEE, d MMMM" : "EEEE, MMMM d")}
                    </h3>
                    <Badge variant="outline" className="text-[9px] tabular-nums">{selectedDayEvents.length} {isAr ? "فعاليات" : "events"}</Badge>
                  </div>
                  {selectedDayEvents.map(ev => <CompactEventCard key={ev.id} event={ev} isAr={isAr} />)}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="w-full">
            {upcoming.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="h-10 w-10 text-muted-foreground/15 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{isAr ? "لا توجد فعاليات قادمة" : "No upcoming events"}</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
                {upcoming.map(ev => (
                  <div key={ev.id} className="min-w-[320px] max-w-[380px] shrink-0 snap-start">
                    <HomeListEventCard event={ev} isAr={isAr} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </TooltipProvider>
    </div>
  );
});

/* ─── Mini Tooltip ─── */
function MiniTooltip({ event, isAr }: { event: GlobalEvent; isAr: boolean }) {
  const label = GLOBAL_EVENT_LABELS[event.type];
  const colors = GLOBAL_EVENT_COLORS[event.type];
  const countdown = getCountdown(event.start_date, isAr);
  return (
    <div className="max-w-[240px] space-y-1">
      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className={cn("text-[9px] px-1 py-0 border", colors.bg, colors.text, colors.border)}>
          {isAr ? label?.ar : label?.en}
        </Badge>
        {!countdown.past && (
          <Badge variant={countdown.urgent ? "destructive" : "outline"} className="text-[9px] px-1 py-0">
            <Timer className="h-2 w-2 me-0.5" />{countdown.text}
          </Badge>
        )}
      </div>
      <p className="text-xs font-semibold leading-snug">{isAr && event.title_ar ? event.title_ar : event.title}</p>
      <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-2.5 w-2.5" />
          {format(parseISO(event.start_date), "MMM d, yyyy")}
        </span>
        {event.city && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{event.city}{event.country_code ? `, ${event.country_code}` : ""}</span>}
      </div>
    </div>
  );
}

/* ─── Compact Event Card ─── */
function CompactEventCard({ event, isAr }: { event: GlobalEvent; isAr: boolean }) {
  const colors = GLOBAL_EVENT_COLORS[event.type];
  const label = GLOBAL_EVENT_LABELS[event.type];
  const IconComp = ICONS[label?.icon] || MoreHorizontal;
  const countdown = getCountdown(event.start_date, isAr);

  const content = (
    <div className={cn("flex gap-3 p-3 rounded-xl border transition-all hover:shadow-md group", colors.border, "hover:bg-muted/20")}>
      {event.cover_image_url ? (
        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
          <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", colors.bg)}>
          <IconComp className={cn("h-4 w-4", colors.text)} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Badge variant="outline" className={cn("text-[9px] px-1 py-0 border", colors.bg, colors.text, colors.border)}>
            {isAr ? label?.ar : label?.en}
          </Badge>
          {!countdown.past && (
            <Badge variant={countdown.urgent ? "destructive" : "secondary"} className="text-[9px] px-1 py-0 gap-0.5">
              <Timer className="h-2 w-2" />{countdown.text}
            </Badge>
          )}
        </div>
        {event.link ? (
          <Link to={event.link} className="text-xs font-bold hover:text-primary transition-colors line-clamp-1 block">{event.title}</Link>
        ) : (
          <p className="text-xs font-bold line-clamp-1">{event.title}</p>
        )}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
          {event.city && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{event.city}</span>}
          {event.organizer_name && <span className="flex items-center gap-0.5"><Building2 className="h-2.5 w-2.5" />{isAr && event.organizer_name_ar ? event.organizer_name_ar : event.organizer_name}</span>}
        </div>
      </div>
    </div>
  );

  return event.link ? <Link to={event.link}>{content}</Link> : content;
}

/* ─── Home List Event Card ─── */
const HomeListEventCard = forwardRef<HTMLDivElement, { event: GlobalEvent; isAr: boolean }>(function HomeListEventCard({ event, isAr }, ref) {
  const colors = GLOBAL_EVENT_COLORS[event.type];
  const label = GLOBAL_EVENT_LABELS[event.type];
  const IconComp = ICONS[label?.icon] || MoreHorizontal;
  const countdown = getCountdown(event.start_date, isAr);

  const card = (
    <Card className={cn("overflow-hidden transition-all hover:shadow-lg group border-border/40")}>
      <div className="flex">
        <div className={cn("w-24 sm:w-32 shrink-0 relative overflow-hidden", !event.cover_image_url && colors.bg)}>
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <IconComp className={cn("h-7 w-7 opacity-40", colors.text)} />
            </div>
          )}
          {event.logo_url && (
            <div className="absolute bottom-1.5 start-1.5 h-7 w-7 rounded-md bg-background/90 shadow-sm flex items-center justify-center overflow-hidden">
              <img src={event.logo_url} alt="" className="h-5 w-5 object-contain" />
            </div>
          )}
          {!countdown.past && (
            <div className={cn(
              "absolute top-1.5 end-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold shadow-sm",
              countdown.urgent ? "bg-destructive text-destructive-foreground" : "bg-background/90 text-foreground"
            )}>
              <Timer className="h-2.5 w-2.5 inline me-0.5" />{countdown.text}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border gap-0.5", colors.bg, colors.text, colors.border)}>
                <IconComp className="h-2.5 w-2.5" />
                {isAr ? label?.ar : label?.en}
              </Badge>
            </div>
            <h3 className="text-sm font-bold line-clamp-2 group-hover:text-primary transition-colors">
              {isAr && event.title_ar ? event.title_ar : event.title}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-primary/50" />
              {format(parseISO(event.start_date), "d MMM yyyy")}
            </span>
            {event.city && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 text-primary/50 shrink-0" />
                {event.city}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  return event.link ? <Link to={event.link}>{card}</Link> : card;
});
