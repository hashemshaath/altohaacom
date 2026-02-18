import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useGlobalEventsCalendar, GLOBAL_EVENT_COLORS, GLOBAL_EVENT_LABELS, type GlobalEventType, type GlobalEvent } from "@/hooks/useGlobalEventsCalendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Trophy, Landmark, ChefHat, Tv, Mic, GraduationCap, MapPin, Plane, Users,
  MoreHorizontal, Calendar, List, Clock, ChevronLeft, ChevronRight, Globe,
  Filter, BookOpen, UtensilsCrossed, Palmtree, Ban, X, CalendarDays,
  CalendarRange, LayoutGrid, Timer, Building2, ArrowRight,
} from "lucide-react";
import {
  format, parseISO, isSameMonth, isSameDay, startOfMonth, endOfMonth,
  addMonths, subMonths, addWeeks, subWeeks, startOfWeek, endOfWeek,
  addDays, eachDayOfInterval, getDay, differenceInDays, differenceInHours,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { getDaysInMonth } from "@/hooks/useChefSchedule";

const ICONS: Record<string, any> = {
  Trophy, Landmark, ChefHat, Tv, Mic, GraduationCap, MapPin, Plane, Users,
  MoreHorizontal, BookOpen, UtensilsCrossed, Palmtree, Ban,
};

const EVENT_TYPES: GlobalEventType[] = [
  "competition", "exhibition", "chefs_table", "tv_interview", "conference",
  "training", "masterclass", "tasting", "visit", "travel", "vacation", "meeting", "other",
];

const COUNTRIES = [
  { code: "SA", en: "Saudi Arabia", ar: "السعودية" },
  { code: "AE", en: "UAE", ar: "الإمارات" },
  { code: "KW", en: "Kuwait", ar: "الكويت" },
  { code: "BH", en: "Bahrain", ar: "البحرين" },
  { code: "QA", en: "Qatar", ar: "قطر" },
  { code: "OM", en: "Oman", ar: "عُمان" },
  { code: "EG", en: "Egypt", ar: "مصر" },
  { code: "JO", en: "Jordan", ar: "الأردن" },
  { code: "LB", en: "Lebanon", ar: "لبنان" },
  { code: "MA", en: "Morocco", ar: "المغرب" },
  { code: "TR", en: "Turkey", ar: "تركيا" },
  { code: "FR", en: "France", ar: "فرنسا" },
  { code: "US", en: "USA", ar: "أمريكا" },
  { code: "GB", en: "UK", ar: "بريطانيا" },
];

type ViewMode = "day" | "week" | "month" | "year" | "list";

function getCountdown(startDate: string, isAr: boolean): { text: string; urgent: boolean; past: boolean } {
  const now = new Date();
  const start = new Date(startDate);
  const diffDays = differenceInDays(start, now);
  const diffHours = differenceInHours(start, now);

  if (diffDays < 0) return { text: isAr ? "انتهى" : "Ended", urgent: false, past: true };
  if (diffDays === 0) {
    if (diffHours <= 0) return { text: isAr ? "الآن" : "Now", urgent: true, past: false };
    return { text: isAr ? `${diffHours} ساعة` : `${diffHours}h left`, urgent: true, past: false };
  }
  if (diffDays <= 3) return { text: isAr ? `${diffDays} أيام` : `${diffDays} days`, urgent: true, past: false };
  if (diffDays <= 30) return { text: isAr ? `${diffDays} يوم` : `${diffDays} days`, urgent: false, past: false };
  const months = Math.floor(diffDays / 30);
  return { text: isAr ? `${months} شهر` : `${months}mo`, urgent: false, past: false };
}

export default function EventsCalendar() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedTypes, setSelectedTypes] = useState<GlobalEventType[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: events = [], isLoading } = useGlobalEventsCalendar({
    types: selectedTypes.length > 0 ? selectedTypes : undefined,
    country: selectedCountry || undefined,
  });

  const toggleType = (type: GlobalEventType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const upcomingEvents = useMemo(() => events.filter(e => new Date(e.start_date) >= new Date()).length, [events]);

  const navigatePrev = () => {
    if (viewMode === "day") setCurrentDate(d => addDays(d, -1));
    else if (viewMode === "week") setCurrentDate(d => subWeeks(d, 1));
    else if (viewMode === "month") setCurrentDate(d => subMonths(d, 1));
    else if (viewMode === "year") setCurrentDate(d => new Date(d.getFullYear() - 1, 0, 1));
    setSelectedDay(null);
  };
  const navigateNext = () => {
    if (viewMode === "day") setCurrentDate(d => addDays(d, 1));
    else if (viewMode === "week") setCurrentDate(d => addWeeks(d, 1));
    else if (viewMode === "month") setCurrentDate(d => addMonths(d, 1));
    else if (viewMode === "year") setCurrentDate(d => new Date(d.getFullYear() + 1, 0, 1));
    setSelectedDay(null);
  };
  const goToday = () => { setCurrentDate(new Date()); setSelectedDay(null); };

  const headerLabel = useMemo(() => {
    if (viewMode === "day") return format(currentDate, isAr ? "EEEE, d MMMM yyyy" : "EEEE, MMMM d, yyyy");
    if (viewMode === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 });
      const we = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`;
    }
    if (viewMode === "month") return format(currentDate, "MMMM yyyy");
    if (viewMode === "year") return format(currentDate, "yyyy");
    return isAr ? "جميع الفعاليات" : "All Events";
  }, [currentDate, viewMode, isAr]);

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<GlobalEventType, number>> = {};
    events.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
    return counts;
  }, [events]);

  return (
    <TooltipProvider delayDuration={200}>
      <SEOHead
        title={isAr ? "تقويم الفعاليات العالمية" : "Global Events Calendar"}
        description={isAr ? "تصفح جميع المسابقات والمعارض والفعاليات" : "Browse all competitions, exhibitions, and events"}
      />
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <div className="border-b bg-gradient-to-b from-primary/5 via-primary/3 to-background">
          <div className="container py-8 md:py-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 shadow-sm">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {isAr ? "تقويم الفعاليات" : "Events Calendar"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {isAr
                      ? "اكتشف المسابقات والمعارض والفعاليات القادمة في مكان واحد"
                      : "Discover upcoming competitions, exhibitions & culinary events in one place"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary tabular-nums">{events.length}</span>
                  <span className="text-xs text-primary/70">{isAr ? "فعالية" : "events"}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-chart-2/10 px-3 py-1.5">
                  <Clock className="h-3.5 w-3.5 text-chart-2" />
                  <span className="text-xs font-semibold text-chart-2 tabular-nums">{upcomingEvents}</span>
                  <span className="text-xs text-chart-2/70">{isAr ? "قادمة" : "upcoming"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-5 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="h-9">
                <TabsTrigger value="day" className="h-7 px-2.5 text-xs gap-1">
                  <CalendarDays className="h-3 w-3" />{isAr ? "يوم" : "Day"}
                </TabsTrigger>
                <TabsTrigger value="week" className="h-7 px-2.5 text-xs gap-1">
                  <CalendarRange className="h-3 w-3" />{isAr ? "أسبوع" : "Week"}
                </TabsTrigger>
                <TabsTrigger value="month" className="h-7 px-2.5 text-xs gap-1">
                  <LayoutGrid className="h-3 w-3" />{isAr ? "شهر" : "Month"}
                </TabsTrigger>
                <TabsTrigger value="year" className="h-7 px-2.5 text-xs gap-1">
                  <Calendar className="h-3 w-3" />{isAr ? "سنة" : "Year"}
                </TabsTrigger>
                <TabsTrigger value="list" className="h-7 px-2.5 text-xs gap-1">
                  <List className="h-3 w-3" />{isAr ? "قائمة" : "List"}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {viewMode !== "list" && (
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={navigatePrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold min-w-[140px] justify-center" onClick={goToday}>
                  {headerLabel}
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={navigateNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs ms-1" onClick={goToday}>
                  {isAr ? "اليوم" : "Today"}
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2 sm:ms-auto">
              <Button
                variant={showFilters ? "secondary" : "outline"}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-3 w-3" />
                {isAr ? "تصفية" : "Filter"}
                {selectedTypes.length > 0 && (
                  <Badge className="h-4 min-w-[16px] px-1 text-[9px] bg-primary text-primary-foreground">{selectedTypes.length}</Badge>
                )}
              </Button>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue placeholder={isAr ? "جميع الدول" : "All Countries"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "جميع الدول" : "All Countries"}</SelectItem>
                  {COUNTRIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{isAr ? c.ar : c.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="animate-in slide-in-from-top-2 duration-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">{isAr ? "تصفية حسب النوع" : "Filter by Event Type"}</span>
                  {selectedTypes.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => setSelectedTypes([])}>
                      <X className="h-2.5 w-2.5" />{isAr ? "مسح" : "Clear"}
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {EVENT_TYPES.map(type => {
                    const label = GLOBAL_EVENT_LABELS[type];
                    const colors = GLOBAL_EVENT_COLORS[type];
                    const active = selectedTypes.includes(type);
                    const IconComp = ICONS[label.icon] || MoreHorizontal;
                    const count = typeCounts[type] || 0;
                    return (
                      <Button
                        key={type}
                        variant={active ? "default" : "outline"}
                        size="sm"
                        className={cn("h-7 text-[11px] gap-1 transition-all", !active && `${colors.bg} ${colors.text} ${colors.border} border`)}
                        onClick={() => toggleType(type)}
                      >
                        <IconComp className="h-3 w-3" />
                        {isAr ? label.ar : label.en}
                        {count > 0 && <span className="opacity-50 text-[9px]">({count})</span>}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
          ) : (
            <>
              {viewMode === "month" && <MonthView events={events} currentDate={currentDate} selectedDay={selectedDay} onSelectDay={setSelectedDay} isAr={isAr} />}
              {viewMode === "week" && <WeekView events={events} currentDate={currentDate} isAr={isAr} />}
              {viewMode === "day" && <DayView events={events} currentDate={currentDate} isAr={isAr} />}
              {viewMode === "year" && <YearView events={events} currentDate={currentDate} onNavigate={(d) => { setCurrentDate(d); setViewMode("month"); }} isAr={isAr} />}
              {viewMode === "list" && <ListView events={events} isAr={isAr} />}

              {viewMode === "month" && selectedDay && (
                <SelectedDayPanel
                  day={selectedDay}
                  events={events.filter(e => isSameDay(new Date(e.start_date), selectedDay))}
                  onClose={() => setSelectedDay(null)}
                  isAr={isAr}
                />
              )}
            </>
          )}

          {/* Legend */}
          {!isLoading && viewMode !== "list" && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 pb-4">
              {EVENT_TYPES.filter(t => (typeCounts[t] || 0) > 0).map(type => {
                const label = GLOBAL_EVENT_LABELS[type];
                const colors = GLOBAL_EVENT_COLORS[type];
                return (
                  <div key={type} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <div className={cn("h-2 w-2 rounded-full", colors.dot)} />
                    <span>{isAr ? label.ar : label.en}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </TooltipProvider>
  );
}

// ─── Event Tooltip Content ──────────────────
function EventTooltipContent({ event, isAr }: { event: GlobalEvent; isAr: boolean }) {
  const label = GLOBAL_EVENT_LABELS[event.type];
  const colors = GLOBAL_EVENT_COLORS[event.type];
  const countdown = getCountdown(event.start_date, isAr);
  return (
    <div className="max-w-[280px] space-y-1.5">
      {event.cover_image_url && (
        <img src={event.cover_image_url} alt="" className="w-full h-20 object-cover rounded-md" />
      )}
      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border", colors.bg, colors.text, colors.border)}>
          {isAr ? label?.ar : label?.en}
        </Badge>
        {!countdown.past && (
          <Badge variant={countdown.urgent ? "destructive" : "outline"} className="text-[9px] px-1.5 py-0">
            <Timer className="h-2 w-2 me-0.5" />{countdown.text}
          </Badge>
        )}
      </div>
      <p className="text-xs font-semibold leading-snug">{isAr && event.title_ar ? event.title_ar : event.title}</p>
      <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-2.5 w-2.5" />
          {format(parseISO(event.start_date), "MMM d, yyyy")}
          {event.end_date && ` – ${format(parseISO(event.end_date), "MMM d")}`}
        </span>
        {event.city && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{event.city}{event.country_code ? `, ${event.country_code}` : ""}</span>}
        {event.venue && <span className="flex items-center gap-1"><Landmark className="h-2.5 w-2.5" />{isAr && event.venue_ar ? event.venue_ar : event.venue}</span>}
        {event.organizer_name && <span className="flex items-center gap-1"><Building2 className="h-2.5 w-2.5" />{isAr && event.organizer_name_ar ? event.organizer_name_ar : event.organizer_name}</span>}
        {event.channel_name && <span className="flex items-center gap-1"><Tv className="h-2.5 w-2.5" />{event.channel_name}</span>}
      </div>
      {event.link && <p className="text-[9px] text-primary">{isAr ? "اضغط للتفاصيل" : "Click for details"}</p>}
    </div>
  );
}

// ─── Event Chip for Calendar Grid ───────────
function EventChip({ event, isAr, compact = false }: { event: GlobalEvent; isAr: boolean; compact?: boolean }) {
  const colors = GLOBAL_EVENT_COLORS[event.type];
  const label = GLOBAL_EVENT_LABELS[event.type];
  const IconComp = ICONS[label?.icon] || MoreHorizontal;

  const chip = (
    <div className={cn(
      "flex items-center gap-1 rounded-md px-1.5 py-0.5 border truncate transition-all cursor-default",
      colors.bg, colors.text, colors.border,
      "hover:shadow-sm hover:scale-[1.02]",
      compact ? "text-[8px]" : "text-[10px]"
    )}>
      <IconComp className={cn(compact ? "h-2 w-2 shrink-0" : "h-2.5 w-2.5 shrink-0")} />
      <span className="truncate font-medium">{isAr && event.title_ar ? event.title_ar : event.title}</span>
    </div>
  );

  const inner = event.link ? <Link to={event.link} className="block truncate">{chip}</Link> : chip;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent side="top" className="p-2.5">
        <EventTooltipContent event={event} isAr={isAr} />
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Month View ─────────────────────────────
function MonthView({ events, currentDate, selectedDay, onSelectDay, isAr }: {
  events: GlobalEvent[]; currentDate: Date;
  selectedDay: Date | null; onSelectDay: (d: Date) => void; isAr: boolean;
}) {
  const days = useMemo(() => getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()), [currentDate]);
  const dayNames = isAr
    ? ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getEventsForDay = (day: Date) => events.filter(e => isSameDay(new Date(e.start_date), day));

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="p-0">
        <div className="grid grid-cols-7 bg-muted/40">
          {dayNames.map(d => (
            <div key={d} className="px-2 py-2.5 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const hasEvents = dayEvents.length > 0;
            return (
              <div
                key={i}
                onClick={() => onSelectDay(day)}
                className={cn(
                  "min-h-[90px] md:min-h-[110px] p-1.5 border-b border-e border-border/15 transition-all cursor-pointer relative group",
                  !isCurrentMonth && "bg-muted/5 opacity-35",
                  isToday && "bg-primary/5 border-primary/20",
                  isSelected && "bg-primary/10 ring-2 ring-inset ring-primary/30 shadow-inner",
                  hasEvents && "hover:bg-accent/30",
                  !hasEvents && "hover:bg-muted/20"
                )}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1 px-0.5">
                  <div className={cn(
                    "flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold transition-colors",
                    isToday && "bg-primary text-primary-foreground shadow-sm",
                    !isToday && isSelected && "text-primary font-bold",
                  )}>
                    {day.getDate()}
                  </div>
                  {hasEvents && (
                    <span className={cn(
                      "text-[9px] font-bold tabular-nums px-1 rounded-full",
                      isToday ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {dayEvents.length}
                    </span>
                  )}
                </div>
                {/* Event dots row for compact display */}
                {hasEvents && (
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <EventChip key={ev.id} event={ev} isAr={isAr} compact />
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[8px] text-center text-muted-foreground font-semibold opacity-70">
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

// ─── Week View ──────────────────────────────
function WeekView({ events, currentDate, isAr }: { events: GlobalEvent[]; currentDate: Date; isAr: boolean }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate, { weekStartsOn: 0 }) });
  const getEventsForDay = (day: Date) => events.filter(e => isSameDay(new Date(e.start_date), day));

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="p-0">
        <div className="grid grid-cols-7 divide-x divide-border/15">
          {weekDays.map((day, i) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div key={i} className={cn("min-h-[350px]", isToday && "bg-primary/3")}>
                <div className={cn(
                  "text-center py-3 border-b transition-colors",
                  isToday ? "bg-primary/10" : "bg-muted/20"
                )}>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{format(day, "EEE")}</p>
                  <p className={cn(
                    "text-xl font-bold tabular-nums mt-0.5",
                    isToday ? "text-primary" : "text-foreground"
                  )}>{day.getDate()}</p>
                  {dayEvents.length > 0 && (
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      {dayEvents.slice(0, 4).map(ev => {
                        const colors = GLOBAL_EVENT_COLORS[ev.type];
                        return <div key={ev.id} className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />;
                      })}
                    </div>
                  )}
                </div>
                <div className="p-1.5 space-y-1">
                  {dayEvents.length === 0 && (
                    <p className="text-[9px] text-muted-foreground/30 text-center pt-8">—</p>
                  )}
                  {dayEvents.map(ev => (
                    <EventChip key={ev.id} event={ev} isAr={isAr} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Day View ───────────────────────────────
function DayView({ events, currentDate, isAr }: { events: GlobalEvent[]; currentDate: Date; isAr: boolean }) {
  const dayEvents = useMemo(() => events.filter(e => isSameDay(new Date(e.start_date), currentDate)), [events, currentDate]);
  const isToday = isSameDay(currentDate, new Date());

  return (
    <Card className="shadow-sm">
      <div className={cn("flex items-center gap-3 px-4 py-4 border-b", isToday && "bg-primary/5")}>
        <div className={cn(
          "flex h-14 w-14 flex-col items-center justify-center rounded-xl shadow-sm",
          isToday ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <span className="text-[10px] font-bold uppercase leading-none">{format(currentDate, "EEE")}</span>
          <span className="text-2xl font-bold leading-none tabular-nums mt-0.5">{currentDate.getDate()}</span>
        </div>
        <div>
          <h3 className="text-base font-bold">{format(currentDate, isAr ? "d MMMM yyyy" : "MMMM d, yyyy")}</h3>
          <p className="text-xs text-muted-foreground">
            {dayEvents.length} {isAr ? "فعاليات مجدولة" : "events scheduled"}
            {isToday && <span className="text-primary font-semibold ms-1.5">• {isAr ? "اليوم" : "Today"}</span>}
          </p>
        </div>
      </div>
      <CardContent className="p-4">
        {dayEvents.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{isAr ? "لا توجد فعاليات في هذا اليوم" : "No events scheduled for this day"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map(ev => <DayEventCard key={ev.id} event={ev} isAr={isAr} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DayEventCard({ event, isAr }: { event: GlobalEvent; isAr: boolean }) {
  const colors = GLOBAL_EVENT_COLORS[event.type];
  const label = GLOBAL_EVENT_LABELS[event.type];
  const IconComp = ICONS[label?.icon] || MoreHorizontal;
  const countdown = getCountdown(event.start_date, isAr);

  const content = (
    <div className={cn("flex gap-3 p-3.5 rounded-xl border transition-all hover:shadow-md group", colors.border, "hover:bg-muted/20")}>
      {/* Cover or icon */}
      {event.cover_image_url ? (
        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-muted">
          <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", colors.bg)}>
          <IconComp className={cn("h-5 w-5", colors.text)} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", colors.bg, colors.text, colors.border)}>
            {isAr ? label?.ar : label?.en}
          </Badge>
          {!countdown.past && (
            <Badge variant={countdown.urgent ? "destructive" : "secondary"} className="text-[9px] px-1.5 py-0 gap-0.5">
              <Timer className="h-2.5 w-2.5" />{countdown.text}
            </Badge>
          )}
        </div>
        <p className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-1">
          {isAr && event.title_ar ? event.title_ar : event.title}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {event.all_day ? (isAr ? "طوال اليوم" : "All Day") : format(parseISO(event.start_date), "h:mm a")}
            {event.end_date && ` – ${format(parseISO(event.end_date), "MMM d")}`}
          </span>
          {event.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.city}</span>}
          {event.organizer_name && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{isAr && event.organizer_name_ar ? event.organizer_name_ar : event.organizer_name}</span>}
        </div>
      </div>
    </div>
  );

  return event.link ? <Link to={event.link}>{content}</Link> : content;
}

// ─── Year View ──────────────────────────────
function YearView({ events, currentDate, onNavigate, isAr }: {
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
        return (
          <Card
            key={mi}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md hover:border-primary/30",
              isCurrentMonth && "ring-1 ring-primary/30 border-primary/20"
            )}
            onClick={() => onNavigate(monthDate)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className={cn("text-xs font-bold", isCurrentMonth && "text-primary")}>{format(monthDate, "MMMM")}</h4>
                {monthEvents.length > 0 && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1 tabular-nums">{monthEvents.length}</Badge>
                )}
              </div>
              <MiniMonthGrid monthDate={monthDate} events={monthEvents} />
              {monthEvents.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.from(new Set(monthEvents.map(e => e.type))).slice(0, 5).map(type => {
                    const colors = GLOBAL_EVENT_COLORS[type];
                    return <div key={type} className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />;
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
        const hasEvent = events.some(e => isSameDay(new Date(e.start_date), day));
        const isToday = isSameDay(day, new Date());
        return (
          <div key={i} className={cn(
            "h-4 flex items-center justify-center text-[8px] rounded-sm",
            isToday && "bg-primary text-primary-foreground font-bold",
            hasEvent && !isToday && "bg-primary/15 text-primary font-semibold",
          )}>
            {day.getDate()}
          </div>
        );
      })}
    </div>
  );
}

// ─── List View (Rich Cards with Countdown) ──
function ListView({ events, isAr }: { events: GlobalEvent[]; isAr: boolean }) {
  const upcomingEvents = events.filter(e => new Date(e.start_date) >= new Date());
  const pastEvents = events.filter(e => new Date(e.start_date) < new Date());

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{isAr ? "لا توجد فعاليات" : "No events found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upcoming */}
      {upcomingEvents.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-chart-2 animate-pulse" />
            {isAr ? "الفعاليات القادمة" : "Upcoming Events"}
            <Badge variant="outline" className="text-[10px] tabular-nums">{upcomingEvents.length}</Badge>
          </h3>
          <div className="space-y-3">
            {upcomingEvents.map(ev => <ListEventCard key={ev.id} event={ev} isAr={isAr} />)}
          </div>
        </div>
      )}

      {/* Past */}
      {pastEvents.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
            {isAr ? "فعاليات سابقة" : "Past Events"}
            <Badge variant="outline" className="text-[10px] tabular-nums">{pastEvents.length}</Badge>
          </h3>
          <div className="space-y-2 opacity-70">
            {pastEvents.slice(-10).reverse().map(ev => <ListEventCard key={ev.id} event={ev} isAr={isAr} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ListEventCard({ event, isAr }: { event: GlobalEvent; isAr: boolean }) {
  const colors = GLOBAL_EVENT_COLORS[event.type];
  const label = GLOBAL_EVENT_LABELS[event.type];
  const IconComp = ICONS[label?.icon] || MoreHorizontal;
  const countdown = getCountdown(event.start_date, isAr);
  const country = COUNTRIES.find(c => c.code === event.country_code);

  const card = (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-lg group border",
      colors.border,
      countdown.past && "opacity-75"
    )}>
      <div className="flex">
        {/* Cover Image / Logo area */}
        <div className={cn(
          "w-28 sm:w-36 shrink-0 relative overflow-hidden",
          !event.cover_image_url && colors.bg
        )}>
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <IconComp className={cn("h-8 w-8 opacity-40", colors.text)} />
            </div>
          )}
          {/* Logo overlay */}
          {event.logo_url && (
            <div className="absolute bottom-1.5 start-1.5 h-8 w-8 rounded-md bg-background/90 shadow-sm flex items-center justify-center overflow-hidden">
              <img src={event.logo_url} alt="" className="h-6 w-6 object-contain" />
            </div>
          )}
          {/* Countdown badge */}
          {!countdown.past && (
            <div className={cn(
              "absolute top-1.5 end-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold shadow-sm",
              countdown.urgent
                ? "bg-destructive text-destructive-foreground"
                : "bg-background/90 text-foreground"
            )}>
              <Timer className="h-2.5 w-2.5 inline me-0.5" />
              {countdown.text}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col justify-between">
          <div>
            {/* Type + Status row */}
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border gap-0.5", colors.bg, colors.text, colors.border)}>
                <IconComp className="h-2.5 w-2.5" />
                {isAr ? label?.ar : label?.en}
              </Badge>
              {event.is_recurring && (
                <Badge variant="outline" className="text-[9px] px-1 py-0">{isAr ? "سنوي" : "Annual"}</Badge>
              )}
              {event.status && event.status !== "upcoming" && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 capitalize">{event.status}</Badge>
              )}
            </div>

            {/* Title */}
            <h4 className="text-sm sm:text-base font-bold line-clamp-2 group-hover:text-primary transition-colors">
              {isAr && event.title_ar ? event.title_ar : event.title}
            </h4>

            {/* Details grid */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="h-3 w-3 text-primary" />
                {format(parseISO(event.start_date), "MMM d, yyyy")}
                {event.end_date && ` – ${format(parseISO(event.end_date), "MMM d")}`}
              </span>
              {(event.city || country) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.city}{event.city && country ? ", " : ""}{country ? (isAr ? country.ar : country.en) : event.country_code}
                </span>
              )}
              {event.venue && (
                <span className="flex items-center gap-1">
                  <Landmark className="h-3 w-3" />
                  {isAr && event.venue_ar ? event.venue_ar : event.venue}
                </span>
              )}
              {event.organizer_name && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {isAr && event.organizer_name_ar ? event.organizer_name_ar : event.organizer_name}
                </span>
              )}
              {event.channel_name && (
                <span className="flex items-center gap-1"><Tv className="h-3 w-3" />{event.channel_name}</span>
              )}
              {event.program_name && (
                <span className="text-[10px]">{event.program_name}</span>
              )}
            </div>
          </div>

          {/* Footer */}
          {event.link && (
            <div className="flex items-center justify-end mt-2 pt-2 border-t border-border/20">
              <span className="text-[11px] text-primary font-medium flex items-center gap-1 group-hover:gap-1.5 transition-all">
                {isAr ? "عرض التفاصيل" : "View Details"}
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return event.link ? <Link to={event.link} className="block">{card}</Link> : card;
}

// ─── Selected Day Panel ─────────────────────
function SelectedDayPanel({ day, events, onClose, isAr }: {
  day: Date; events: GlobalEvent[]; onClose: () => void; isAr: boolean;
}) {
  if (events.length === 0) return null;

  return (
    <Card className="border-primary/20 animate-in slide-in-from-top-2 duration-200 shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            {format(day, isAr ? "EEEE, d MMMM yyyy" : "EEEE, MMMM d, yyyy")}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] tabular-nums">
              {events.length} {isAr ? "فعاليات" : "events"}
            </Badge>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {events.map(ev => <DayEventCard key={ev.id} event={ev} isAr={isAr} />)}
        </div>
      </CardContent>
    </Card>
  );
}
