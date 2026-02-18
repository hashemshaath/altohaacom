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
import { Trophy, Landmark, ChefHat, Tv, Mic, GraduationCap, MapPin, Plane, Users, MoreHorizontal, Calendar, List, Clock, ChevronLeft, ChevronRight, Globe, Filter, BookOpen, UtensilsCrossed, Palmtree, Ban, ExternalLink, X } from "lucide-react";
import { format, parseISO, isSameMonth, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
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

export default function EventsCalendar() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [viewMode, setViewMode] = useState<"calendar" | "timeline" | "list">("calendar");
  const [selectedTypes, setSelectedTypes] = useState<GlobalEventType[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const { data: events = [], isLoading } = useGlobalEventsCalendar({
    types: selectedTypes.length > 0 ? selectedTypes : undefined,
    country: selectedCountry || undefined,
  });

  const toggleType = (type: GlobalEventType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const monthEvents = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return events.filter(e => {
      const d = new Date(e.start_date);
      return d >= start && d <= end;
    });
  }, [events, currentDate]);

  const calendarDays = useMemo(
    () => getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate]
  );

  const upcomingEvents = useMemo(() => {
    return events.filter(e => new Date(e.start_date) >= new Date()).length;
  }, [events]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return events.filter(e => isSameDay(new Date(e.start_date), selectedDay));
  }, [selectedDay, events]);

  return (
    <>
      <SEOHead
        title={isAr ? "تقويم الفعاليات العالمية" : "Global Events Calendar"}
        description={isAr ? "تصفح جميع المسابقات والمعارض والفعاليات العالمية والمحلية" : "Browse all global and local competitions, exhibitions, and events"}
      />
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <div className="border-b bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-8 md:py-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {isAr ? "تقويم الفعاليات العالمية" : "Global Events Calendar"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? `${events.length} فعالية • ${upcomingEvents} قادمة`
                    : `${events.length} events • ${upcomingEvents} upcoming`}
                </p>
              </div>
            </div>
            <p className="text-muted-foreground max-w-2xl text-sm">
              {isAr
                ? "تصفح جميع المسابقات والمعارض والمقابلات التلفزيونية والفعاليات المحلية والدولية في مكان واحد"
                : "Browse all competitions, exhibitions, TV interviews, and local & international events in one place"}
            </p>
          </div>
        </div>

        <div className="container py-6 space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Filter className="h-4 w-4" />
                {isAr ? "تصفية حسب النوع" : "Filter by Type"}
              </div>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map(type => {
                  const label = GLOBAL_EVENT_LABELS[type];
                  const colors = GLOBAL_EVENT_COLORS[type];
                  const active = selectedTypes.includes(type);
                  const IconComp = ICONS[label.icon] || MoreHorizontal;
                  const count = events.filter(e => e.type === type).length;
                  return (
                    <Button
                      key={type}
                      variant={active ? "default" : "outline"}
                      size="sm"
                      className={cn("h-8 text-xs gap-1.5 transition-all", !active && `${colors.bg} ${colors.text} ${colors.border} border`)}
                      onClick={() => toggleType(type)}
                    >
                      <IconComp className="h-3 w-3" />
                      {isAr ? label.ar : label.en}
                      {count > 0 && <span className="opacity-60 text-[10px]">({count})</span>}
                    </Button>
                  );
                })}
                {selectedTypes.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => setSelectedTypes([])}>
                    <X className="h-3 w-3" />
                    {isAr ? "مسح الكل" : "Clear All"}
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder={isAr ? "جميع الدول" : "All Countries"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "جميع الدول" : "All Countries"}</SelectItem>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>{isAr ? c.ar : c.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="ms-auto">
                  <TabsList className="h-9">
                    <TabsTrigger value="calendar" className="h-7 px-3 text-xs gap-1.5">
                      <Calendar className="h-3 w-3" />{isAr ? "تقويم" : "Calendar"}
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="h-7 px-3 text-xs gap-1.5">
                      <Clock className="h-3 w-3" />{isAr ? "زمني" : "Timeline"}
                    </TabsTrigger>
                    <TabsTrigger value="list" className="h-7 px-3 text-xs gap-1.5">
                      <List className="h-3 w-3" />{isAr ? "قائمة" : "List"}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { type: "competition" as GlobalEventType, count: events.filter(e => e.type === "competition").length },
              { type: "exhibition" as GlobalEventType, count: events.filter(e => e.type === "exhibition").length },
              { type: "tv_interview" as GlobalEventType, count: events.filter(e => e.type === "tv_interview").length },
              { type: "conference" as GlobalEventType, count: events.filter(e => e.type === "conference" || e.type === "training").length },
            ].map(stat => {
              const label = GLOBAL_EVENT_LABELS[stat.type];
              const colors = GLOBAL_EVENT_COLORS[stat.type];
              const IconComp = ICONS[label.icon] || MoreHorizontal;
              return (
                <Card key={stat.type} className={cn("border transition-shadow hover:shadow-sm", colors.border)}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", colors.bg)}>
                      <IconComp className={cn("h-4 w-4", colors.text)} />
                    </div>
                    <div>
                      <p className="text-lg font-bold tabular-nums">{stat.count}</p>
                      <p className="text-[10px] text-muted-foreground">{isAr ? label.ar : label.en}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : viewMode === "calendar" ? (
            <div className="space-y-4">
              <CalendarView
                events={monthEvents}
                days={calendarDays}
                currentDate={currentDate}
                onPrev={() => { setCurrentDate(d => subMonths(d, 1)); setSelectedDay(null); }}
                onNext={() => { setCurrentDate(d => addMonths(d, 1)); setSelectedDay(null); }}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                isAr={isAr}
              />
              {/* Selected Day Detail Panel */}
              {selectedDay && selectedDayEvents.length > 0 && (
                <Card className="border-primary/20 animate-in slide-in-from-top-2 duration-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        {format(selectedDay, isAr ? "EEEE, d MMMM yyyy" : "EEEE, MMMM d, yyyy")}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {selectedDayEvents.length} {isAr ? "فعاليات" : "events"}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedDay(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {selectedDayEvents.map(ev => {
                        const colors = GLOBAL_EVENT_COLORS[ev.type];
                        const label = GLOBAL_EVENT_LABELS[ev.type];
                        const IconComp = ICONS[label?.icon] || MoreHorizontal;
                        return (
                          <div key={ev.id} className={cn("flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/30", colors.border)}>
                            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", colors.bg)}>
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
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1 flex-wrap">
                                {ev.city && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{ev.city}</span>}
                                {ev.venue && <span>• {ev.venue}</span>}
                                {ev.end_date && <span>→ {format(parseISO(ev.end_date), "MMM d")}</span>}
                                {ev.channel_name && <span>📺 {ev.channel_name}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : viewMode === "timeline" ? (
            <TimelineView events={events} isAr={isAr} />
          ) : (
            <ListView events={events} isAr={isAr} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

// ─── Calendar View ─────────────────────────
function CalendarView({ events, days, currentDate, onPrev, onNext, selectedDay, onSelectDay, isAr }: {
  events: GlobalEvent[]; days: Date[]; currentDate: Date;
  onPrev: () => void; onNext: () => void;
  selectedDay: Date | null; onSelectDay: (d: Date) => void;
  isAr: boolean;
}) {
  const dayNames = isAr
    ? ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getEventsForDay = (day: Date) =>
    events.filter(e => isSameDay(new Date(e.start_date), day));

  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <Button variant="ghost" size="icon" onClick={onPrev}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="text-center">
          <h3 className="font-semibold">{format(currentDate, "MMMM yyyy")}</h3>
          <p className="text-[10px] text-muted-foreground">{events.length} {isAr ? "فعاليات هذا الشهر" : "events this month"}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onNext}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      <CardContent className="p-2">
        <div className="grid grid-cols-7 gap-px">
          {dayNames.map(d => (
            <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
          {days.map((day, i) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            return (
              <div
                key={i}
                onClick={() => dayEvents.length > 0 && onSelectDay(day)}
                className={cn(
                  "min-h-[80px] md:min-h-[100px] p-1 border border-border/30 rounded-md transition-all",
                  !isCurrentMonth && "opacity-40",
                  isToday && "bg-primary/5 border-primary/30",
                  isSelected && "ring-2 ring-primary/40 bg-primary/10",
                  dayEvents.length > 0 && "cursor-pointer hover:border-primary/40 hover:shadow-sm"
                )}
              >
                <div className={cn(
                  "text-xs font-medium mb-1 text-center",
                  isToday && "text-primary font-bold",
                  isSelected && "text-primary"
                )}>
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map(ev => {
                    const colors = GLOBAL_EVENT_COLORS[ev.type];
                    return (
                      <div key={ev.id} className={cn("text-[9px] px-1 py-0.5 rounded truncate border", colors.bg, colors.text, colors.border)}>
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
      </CardContent>
    </Card>
  );
}

// ─── Timeline View ─────────────────────────
function TimelineView({ events, isAr }: { events: GlobalEvent[]; isAr: boolean }) {
  const grouped = useMemo(() => {
    const groups: Record<string, GlobalEvent[]> = {};
    events.forEach(e => {
      const key = format(parseISO(e.start_date), "yyyy-MM");
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  if (events.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">{isAr ? "لا توجد فعاليات" : "No events found"}</div>;
  }

  return (
    <div className="space-y-6">
      {grouped.map(([month, monthEvents]) => (
        <div key={month}>
          <h3 className="text-sm font-semibold text-primary mb-3 sticky top-0 bg-background py-1 z-10">
            {format(parseISO(month + "-01"), "MMMM yyyy")}
            <Badge variant="outline" className="ms-2 text-[10px]">{monthEvents.length}</Badge>
          </h3>
          <div className="relative ps-6">
            <div className="absolute start-[11px] top-2 bottom-2 w-0.5 bg-border" />
            <div className="space-y-3">
              {monthEvents.map(ev => (
                <EventTimelineItem key={ev.id} event={ev} isAr={isAr} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EventTimelineItem({ event, isAr }: { event: GlobalEvent; isAr: boolean }) {
  const colors = GLOBAL_EVENT_COLORS[event.type];
  const label = GLOBAL_EVENT_LABELS[event.type];
  const IconComp = ICONS[label?.icon] || MoreHorizontal;

  return (
    <div className="relative flex items-start gap-3 group">
      <div className={cn("relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-shadow group-hover:shadow-sm", colors.bg, colors.border)}>
        <IconComp className={cn("h-3 w-3", colors.text)} />
      </div>
      <Card className={cn("flex-1 border transition-shadow group-hover:shadow-sm", colors.border)}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", colors.bg, colors.text, colors.border)}>
                  {isAr ? label?.ar : label?.en}
                </Badge>
                {event.is_recurring && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{isAr ? "سنوي" : "Annual"}</Badge>
                )}
              </div>
              {event.link ? (
                <Link to={event.link} className="text-sm font-semibold hover:text-primary transition-colors">{event.title}</Link>
              ) : (
                <p className="text-sm font-semibold">{event.title}</p>
              )}
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(parseISO(event.start_date), "MMM d, yyyy")}
                  {event.end_date && ` – ${format(parseISO(event.end_date), "MMM d")}`}
                </span>
                {event.city && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.city}</span>
                )}
                {event.channel_name && (
                  <span className="flex items-center gap-1"><Tv className="h-3 w-3" />{event.channel_name}</span>
                )}
              </div>
              {event.program_name && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {isAr ? "البرنامج:" : "Program:"} {event.program_name}
                  {event.broadcast_type && ` (${event.broadcast_type})`}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── List View ─────────────────────────────
function ListView({ events, isAr }: { events: GlobalEvent[]; isAr: boolean }) {
  if (events.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">{isAr ? "لا توجد فعاليات" : "No events found"}</div>;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-border/30">
          {events.map(ev => {
            const colors = GLOBAL_EVENT_COLORS[ev.type];
            const label = GLOBAL_EVENT_LABELS[ev.type];
            const IconComp = ICONS[label?.icon] || MoreHorizontal;
            return (
              <div key={ev.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", colors.bg, colors.text, colors.border)}>
                  <IconComp className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className={cn("text-[9px] px-1 py-0 border", colors.bg, colors.text, colors.border)}>
                      {isAr ? label?.ar : label?.en}
                    </Badge>
                    {ev.country_code && (
                      <span className="text-[10px] text-muted-foreground">{ev.country_code}</span>
                    )}
                  </div>
                  {ev.link ? (
                    <Link to={ev.link} className="text-sm font-semibold hover:text-primary transition-colors truncate block">{ev.title}</Link>
                  ) : (
                    <p className="text-sm font-semibold truncate">{ev.title}</p>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span>{format(parseISO(ev.start_date), "MMM d, yyyy")}</span>
                    {ev.city && <span>• {ev.city}</span>}
                    {ev.channel_name && <span>• 📺 {ev.channel_name}</span>}
                    {ev.participation_type && <span>• {ev.participation_type}</span>}
                  </div>
                </div>
                <div className={cn("w-1.5 h-8 rounded-full", colors.dot)} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
