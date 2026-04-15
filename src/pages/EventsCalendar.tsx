import { useIsAr } from "@/hooks/useIsAr";
import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from "react";
import { PageShell } from "@/components/PageShell";
import { useGlobalEventsCalendar, GLOBAL_EVENT_COLORS, GLOBAL_EVENT_LABELS, type GlobalEventType } from "@/hooks/useGlobalEventsCalendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Calendar, List, Clock, ChevronLeft, ChevronRight, Globe,
  X, Search, CalendarDays, SlidersHorizontal, Sparkles, MoreHorizontal,
  TrendingUp, Zap, LucideIcon } from "lucide-react";
import { format, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, startOfWeek, endOfWeek, addDays } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { EVENT_TYPES, COUNTRIES, ICONS, type ViewMode } from "@/lib/eventsCalendarConstants";
import { MonthView } from "./events-calendar/MonthView";

const WeekView = lazy(() => import("./events-calendar/WeekView").then(m => ({ default: m.WeekView })));
const DayView = lazy(() => import("./events-calendar/DayView").then(m => ({ default: m.DayView })));
const YearView = lazy(() => import("./events-calendar/YearView").then(m => ({ default: m.YearView })));
const ListView = lazy(() => import("./events-calendar/ListView").then(m => ({ default: m.ListView })));
const SelectedDayPanel = lazy(() => import("./events-calendar/SelectedDayPanel").then(m => ({ default: m.SelectedDayPanel })));

/* ─── Animated stat card ─── */
function AnimatedStat({ icon: Icon, value, label, accent }: { icon: LucideIcon; value: number; label: string; accent: string }) {
  const isAr = useIsAr();
  return (
    <div className={cn(
      "group relative flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200",
      "bg-background/60 backdrop-blur-xl shadow-sm hover:shadow-md hover:-translate-y-0.5",
      "border-border/40 hover:border-primary/30"
    )}>
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105", accent)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums leading-none tracking-tight">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  );
}

export default function EventsCalendar() {
  const isAr = useIsAr();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedTypes, setSelectedTypes] = useState<GlobalEventType[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: rawEvents = [], isLoading } = useGlobalEventsCalendar({
    types: selectedTypes.length > 0 ? selectedTypes : undefined,
    country: selectedCountry || undefined,
  });

  const events = useMemo(() => {
    if (!searchQuery.trim()) return rawEvents;
    const q = searchQuery.toLowerCase();
    return rawEvents.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.title_ar?.toLowerCase().includes(q) ||
      e.city?.toLowerCase().includes(q) ||
      e.venue?.toLowerCase().includes(q) ||
      e.organizer_name?.toLowerCase().includes(q)
    );
  }, [rawEvents, searchQuery]);

  const toggleType = useCallback((type: GlobalEventType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = events.filter(e => new Date(e.start_date) >= now).length;
    const thisMonth = events.filter(e => isSameMonth(new Date(e.start_date), now)).length;
    const typesCount = new Set(events.map(e => e.type)).size;
    return { total: events.length, upcoming, thisMonth, typesCount };
  }, [events]);

  const navigatePrev = useCallback(() => {
    if (viewMode === "day") setCurrentDate(d => addDays(d, -1));
    else if (viewMode === "week") setCurrentDate(d => subWeeks(d, 1));
    else if (viewMode === "month") setCurrentDate(d => subMonths(d, 1));
    else if (viewMode === "year") setCurrentDate(d => new Date(d.getFullYear() - 1, 0, 1));
    setSelectedDay(null);
  }, [viewMode]);

  const navigateNext = useCallback(() => {
    if (viewMode === "day") setCurrentDate(d => addDays(d, 1));
    else if (viewMode === "week") setCurrentDate(d => addWeeks(d, 1));
    else if (viewMode === "month") setCurrentDate(d => addMonths(d, 1));
    else if (viewMode === "year") setCurrentDate(d => new Date(d.getFullYear() + 1, 0, 1));
    setSelectedDay(null);
  }, [viewMode]);

  const goToday = useCallback(() => { setCurrentDate(new Date()); setSelectedDay(null); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); navigatePrev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); navigateNext(); }
      if (e.key === "t" || e.key === "T") { e.preventDefault(); goToday(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigatePrev, navigateNext, goToday]);

  const loc = isAr ? { locale: arLocale } : undefined;
  const headerLabel = useMemo(() => {
    if (viewMode === "day") return format(currentDate, isAr ? "EEEE, d MMMM yyyy" : "EEEE, MMMM d, yyyy", loc);
    if (viewMode === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 });
      const we = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(ws, "MMM d", loc)} – ${format(we, "MMM d, yyyy", loc)}`;
    }
    if (viewMode === "month") return format(currentDate, "MMMM yyyy", loc);
    if (viewMode === "year") return format(currentDate, "yyyy");
    return isAr ? "جميع الفعاليات" : "All Events";
  }, [currentDate, viewMode, isAr]);

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<GlobalEventType, number>> = {};
    events.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
    return counts;
  }, [events]);

  const activeFiltersCount = selectedTypes.length + (selectedCountry ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <TooltipProvider delayDuration={200}>
      <PageShell
        title={isAr ? "تقويم الفعاليات العالمية" : "Global Events Calendar"}
        description={isAr ? "تصفح جميع المسابقات والمعارض والفعاليات الطهوية" : "Browse all competitions, exhibitions, and culinary events worldwide"}
        seoProps={{ keywords: isAr ? "تقويم فعاليات, مسابقات طهي, معارض أغذية, فعاليات قادمة" : "events calendar, culinary competitions, food exhibitions, upcoming events" }}
        container={false}
        padding="none"
      >
        {/* ─── Premium Hero ─── */}
        <section className="relative overflow-hidden border-b border-border/30">
          {/* Layered gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-accent/4" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,hsl(var(--primary)/0.08),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,hsl(var(--chart-3)/0.05),transparent)]" />
          
          <div className="container relative py-6 sm:py-10 md:py-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              {/* Title area */}
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 shadow-lg shadow-primary/10 shrink-0 backdrop-blur-sm">
                  <CalendarDays className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 backdrop-blur-sm">
                    <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                      {isAr ? "تقويم تفاعلي" : "Interactive Calendar"}
                    </span>
                  </div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    {isAr ? "تقويم الفعاليات" : "Events Calendar"}
                  </h1>
                  <p className="max-w-lg text-sm text-muted-foreground leading-relaxed hidden sm:block">
                    {isAr
                      ? "اكتشف المسابقات والمعارض والفعاليات الطهوية من جميع أنحاء العالم"
                      : "Discover competitions, exhibitions & culinary events from around the world"}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:flex items-center gap-2.5">
                <AnimatedStat icon={Calendar} value={stats.total} label={isAr ? "إجمالي الفعاليات" : "Total Events"} accent="bg-primary/10 text-primary" />
                <AnimatedStat icon={TrendingUp} value={stats.upcoming} label={isAr ? "فعاليات قادمة" : "Upcoming"} accent="bg-chart-2/10 text-chart-2" />
                <AnimatedStat icon={Zap} value={stats.thisMonth} label={isAr ? "هذا الشهر" : "This Month"} accent="bg-chart-5/10 text-chart-5" />
              </div>
            </div>

            {/* ─── Search + Filter Bar ─── */}
            <div className="mt-8 rounded-2xl border border-border/30 bg-background/60 backdrop-blur-xl p-3 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isAr ? "ابحث عن فعالية، مدينة، أو جهة..." : "Search events, cities, organizers..."}
                    className="ps-10 h-11 bg-muted/30 border-0 rounded-xl focus-visible:ring-primary/20 text-sm"
                  />
                  {searchQuery && (
                    <Button variant="ghost" size="icon" className="absolute end-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg" onClick={() => setSearchQuery("")}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Select value={selectedCountry} onValueChange={(v) => setSelectedCountry(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-auto min-w-[140px] h-11 bg-muted/30 border-0 rounded-xl">
                      <Globe className="h-3.5 w-3.5 me-1.5 text-muted-foreground/60" />
                      <SelectValue placeholder={isAr ? "كل الدول" : "All Countries"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isAr ? "كل الدول" : "All Countries"}</SelectItem>
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>{isAr ? c.ar : c.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant={showFilters ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-11 gap-1.5 rounded-xl px-4 transition-all",
                      showFilters ? "shadow-sm" : "bg-muted/30 hover:bg-muted/50"
                    )}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    {isAr ? "تصفية" : "Filters"}
                    {activeFiltersCount > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-5 p-0 justify-center text-[10px] rounded-full">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>

              {/* ─── Type Filters ─── */}
              {showFilters && (
                <div className="mt-3 pt-3 border-t border-border/20 flex flex-wrap gap-1.5 animate-in slide-in-from-top-2 fade-in-0 duration-300">
                  <Button
                    variant={selectedTypes.length === 0 ? "default" : "outline"}
                    size="sm"
                    className="h-8 rounded-full text-xs px-4 active:scale-[0.98]"
                    onClick={() => setSelectedTypes([])}
                  >
                    {isAr ? "الكل" : "All"}
                  </Button>
                  {EVENT_TYPES.filter(t => (typeCounts[t] || 0) > 0).map(type => {
                    const label = GLOBAL_EVENT_LABELS[type];
                    const colors = GLOBAL_EVENT_COLORS[type];
                    const active = selectedTypes.includes(type);
                    const count = typeCounts[type] || 0;
                    const IconComp = ICONS[label?.icon] || MoreHorizontal;
                    return (
                      <Button
                        key={type}
                        variant={active ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-8 rounded-full text-xs px-3.5 gap-1.5 active:scale-[0.98] transition-all",
                          !active && "hover:border-primary/30"
                        )}
                        onClick={() => toggleType(type)}
                      >
                        <IconComp className="h-3 w-3" />
                        {isAr ? label.ar : label.en}
                        <span className="opacity-50 text-[10px] tabular-nums">({count})</span>
                      </Button>
                    );
                  })}
                  {selectedTypes.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive rounded-full" onClick={() => setSelectedTypes([])}>
                      <X className="h-3 w-3 me-0.5" />{isAr ? "مسح الكل" : "Clear all"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── Calendar Controls (sticky) ─── */}
        <div className="sticky top-0 z-30 border-b border-border/30 bg-background/90 backdrop-blur-xl">
          <div className="container flex items-center justify-between py-2 gap-3">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="h-9 bg-muted/40 p-0.5 rounded-xl">
                <TabsTrigger value="month" className="h-8 px-3 text-xs gap-1.5 rounded-lg data-[state=active]:shadow-sm">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{isAr ? "شهر" : "Month"}</span>
                </TabsTrigger>
                <TabsTrigger value="week" className="h-8 px-3 text-xs gap-1.5 rounded-lg data-[state=active]:shadow-sm">
                  <span className="hidden sm:inline">{isAr ? "أسبوع" : "Week"}</span>
                  <span className="sm:hidden text-xs">W</span>
                </TabsTrigger>
                <TabsTrigger value="day" className="h-8 px-3 text-xs gap-1.5 rounded-lg data-[state=active]:shadow-sm">
                  <span className="hidden sm:inline">{isAr ? "يوم" : "Day"}</span>
                  <span className="sm:hidden text-xs">D</span>
                </TabsTrigger>
                <TabsTrigger value="year" className="h-8 px-3 text-xs gap-1.5 rounded-lg data-[state=active]:shadow-sm">
                  <span className="hidden sm:inline">{isAr ? "سنة" : "Year"}</span>
                  <span className="sm:hidden text-xs">Y</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="h-8 px-3 text-xs gap-1.5 rounded-lg data-[state=active]:shadow-sm">
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{isAr ? "قائمة" : "List"}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {viewMode !== "list" && (
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-muted/50 active:scale-[0.95]" onClick={navigatePrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <button
                  className="h-8 text-sm font-bold min-w-[150px] sm:min-w-[200px] text-center tracking-tight hover:text-primary transition-colors"
                  onClick={goToday}
                >
                  {headerLabel}
                </button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-muted/50 active:scale-[0.95]" onClick={navigateNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {!isSameDay(currentDate, new Date()) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] ms-1 rounded-full px-3.5 font-bold border-primary/20 text-primary hover:bg-primary/5 active:scale-[0.98]"
                    onClick={goToday}
                  >
                    {isAr ? "اليوم" : "Today"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="container py-6 space-y-5">
          {isLoading ? (
            <CalendarSkeleton viewMode={viewMode} />
          ) : (
            <Suspense fallback={<CalendarSkeleton viewMode={viewMode} />}>
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
            </Suspense>
          )}

          {/* ─── Interactive Legend ─── */}
          {!isLoading && viewMode !== "list" && (
            <div className="rounded-2xl border border-border/20 bg-muted/10 px-4 py-3">
              <div className="flex items-center flex-wrap gap-x-3 gap-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest me-1">
                  {isAr ? "الأنواع" : "Types"}
                </span>
                {EVENT_TYPES.filter(t => (typeCounts[t] || 0) > 0).map(type => {
                  const label = GLOBAL_EVENT_LABELS[type];
                  const colors = GLOBAL_EVENT_COLORS[type];
                  const isActive = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={cn(
                        "flex items-center gap-1.5 text-[11px] transition-all rounded-full px-2.5 py-1 active:scale-[0.97]",
                        isActive
                          ? "bg-primary/15 text-primary font-bold ring-1 ring-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      )}
                    >
                      <div className={cn("h-2 w-2 rounded-full ring-1 ring-inset ring-border/20", colors.dot)} />
                      {isAr ? label.ar : label.en}
                      <span className="text-[10px] opacity-40 tabular-nums">{typeCounts[type]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Keyboard shortcuts */}
          <div className="hidden lg:flex items-center justify-center gap-6 py-2">
            {[
              { keys: "← →", label: isAr ? "تنقل" : "Navigate" },
              { keys: "T", label: isAr ? "اليوم" : "Today" },
            ].map(({ keys, label }) => (
              <span key={keys} className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40">
                <kbd className="px-1.5 py-0.5 rounded-md bg-muted/40 border border-border/30 font-mono text-[10px]">{keys}</kbd>
                {label}
              </span>
            ))}
          </div>
        </div>
      </PageShell>
    </TooltipProvider>
  );
}

/* ─── Skeleton loader per view mode ─── */
function CalendarSkeleton({ viewMode }: { viewMode: ViewMode }) {
  const isAr = useIsAr();
  if (viewMode === "month") {
    return (
      <div className="rounded-2xl border border-border/30 overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-muted/20">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-8 rounded-none" />)}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-none" />)}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
    </div>
  );
}
