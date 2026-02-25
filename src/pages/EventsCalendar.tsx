import { useState, useMemo, useCallback, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
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
} from "lucide-react";
import { format, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, startOfWeek, endOfWeek, addDays } from "date-fns";
import { cn } from "@/lib/utils";

import { EVENT_TYPES, COUNTRIES, ICONS, type ViewMode } from "./events-calendar/constants";
import { StatPill } from "./events-calendar/StatPill";
import { MonthView } from "./events-calendar/MonthView";
import { WeekView } from "./events-calendar/WeekView";
import { DayView } from "./events-calendar/DayView";
import { YearView } from "./events-calendar/YearView";
import { ListView } from "./events-calendar/ListView";
import { SelectedDayPanel } from "./events-calendar/SelectedDayPanel";

export default function EventsCalendar() {
  const { language } = useLanguage();
  const isAr = language === "ar";
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
    return { total: events.length, upcoming, thisMonth };
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

  // Keyboard navigation — deps array prevents re-registering every render
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

  const activeFiltersCount = selectedTypes.length + (selectedCountry ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <TooltipProvider delayDuration={200}>
      <PageShell
        title={isAr ? "تقويم الفعاليات العالمية" : "Global Events Calendar"}
        description={isAr ? "تصفح جميع المسابقات والمعارض والفعاليات الطهوية" : "Browse all competitions, exhibitions, and culinary events worldwide"}
        container={false}
        padding="none"
      >
        {/* ─── Hero Section ─── */}
        <section className="relative border-b overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/3 to-accent/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.06),transparent_60%)]" />
          <div className="container relative py-8 md:py-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-lg shadow-primary/10">
                  <CalendarDays className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 py-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-[11px] font-semibold text-primary">
                      {isAr ? "تقويم تفاعلي" : "Interactive Calendar"}
                    </span>
                  </div>
                  <h1 className="font-serif text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
                    {isAr ? "تقويم الفعاليات العالمية" : "Global Events Calendar"}
                  </h1>
                  <p className="mt-1 max-w-lg text-sm text-muted-foreground leading-relaxed">
                    {isAr
                      ? "اكتشف المسابقات والمعارض والفعاليات الطهوية من جميع أنحاء العالم في مكان واحد"
                      : "Discover competitions, exhibitions & culinary events from around the world in one place"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <StatPill icon={Calendar} value={stats.total} label={isAr ? "إجمالي" : "Total"} color="primary" />
                <StatPill icon={Clock} value={stats.upcoming} label={isAr ? "قادمة" : "Upcoming"} color="chart-2" />
                <StatPill icon={CalendarDays} value={stats.thisMonth} label={isAr ? "هذا الشهر" : "This Month"} color="chart-5" />
              </div>
            </div>

            {/* ─── Search + Filter Bar ─── */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? "ابحث عن فعالية، مدينة، أو جهة..." : "Search events, cities, organizers..."}
                  className="ps-9 h-10 bg-background/80 backdrop-blur-sm"
                />
                {searchQuery && (
                  <Button
                    variant="ghost" size="icon"
                    className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              <Select value={selectedCountry} onValueChange={(v) => setSelectedCountry(v === "all" ? "" : v)}>
                <SelectTrigger className="w-auto min-w-[140px] h-10 bg-background/80 backdrop-blur-sm">
                  <Globe className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
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
                variant={showFilters ? "default" : "outline"}
                size="sm"
                className="h-10 gap-1.5"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {isAr ? "تصفية" : "Filters"}
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="h-5 w-5 p-0 justify-center text-[10px] rounded-full">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* ─── Collapsible Type Filters ─── */}
            {showFilters && (
              <div className="mt-3 flex flex-wrap gap-1.5 animate-in slide-in-from-top-2 duration-200">
                <Button
                  variant={selectedTypes.length === 0 ? "default" : "outline"}
                  size="sm"
                  className="h-7 rounded-full text-[11px] px-3"
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
                      className="h-7 rounded-full text-[11px] px-3 gap-1"
                      onClick={() => toggleType(type)}
                    >
                      <IconComp className="h-3 w-3" />
                      {isAr ? label.ar : label.en}
                      <span className="opacity-50 text-[9px]">({count})</span>
                    </Button>
                  );
                })}
                {selectedTypes.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-[11px] text-destructive hover:text-destructive" onClick={() => setSelectedTypes([])}>
                    <X className="h-3 w-3 me-0.5" />{isAr ? "مسح" : "Clear"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ─── Calendar Controls ─── */}
        <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-md">
          <div className="container flex items-center justify-between py-2.5 gap-3">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="h-9 bg-muted/50 p-0.5">
                <TabsTrigger value="month" className="h-8 px-3 text-xs gap-1 data-[state=active]:shadow-sm">
                  <Calendar className="h-3 w-3" />
                  <span className="hidden sm:inline">{isAr ? "شهر" : "Month"}</span>
                </TabsTrigger>
                <TabsTrigger value="week" className="h-8 px-3 text-xs gap-1 data-[state=active]:shadow-sm">
                  <span className="hidden sm:inline">{isAr ? "أسبوع" : "Week"}</span>
                  <span className="sm:hidden">W</span>
                </TabsTrigger>
                <TabsTrigger value="day" className="h-8 px-3 text-xs gap-1 data-[state=active]:shadow-sm">
                  <span className="hidden sm:inline">{isAr ? "يوم" : "Day"}</span>
                  <span className="sm:hidden">D</span>
                </TabsTrigger>
                <TabsTrigger value="year" className="h-8 px-3 text-xs gap-1 data-[state=active]:shadow-sm">
                  <span className="hidden sm:inline">{isAr ? "سنة" : "Year"}</span>
                  <span className="sm:hidden">Y</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="h-8 px-3 text-xs gap-1 data-[state=active]:shadow-sm">
                  <List className="h-3 w-3" />
                  <span className="hidden sm:inline">{isAr ? "قائمة" : "List"}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {viewMode !== "list" && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={navigatePrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className="h-8 text-sm font-semibold min-w-[140px] sm:min-w-[180px] justify-center tracking-tight"
                  onClick={goToday}
                >
                  {headerLabel}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={navigateNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {!isSameDay(currentDate, new Date()) && (
                  <Button variant="outline" size="sm" className="h-7 text-[11px] ms-1 rounded-full px-3" onClick={goToday}>
                    {isAr ? "اليوم" : "Today"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="container py-5 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
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

          {/* ─── Legend ─── */}
          {!isLoading && viewMode !== "list" && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-3 pb-4 border-t border-border/20">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider me-2">
                {isAr ? "دليل الألوان" : "Legend"}
              </span>
              {EVENT_TYPES.filter(t => (typeCounts[t] || 0) > 0).map(type => {
                const label = GLOBAL_EVENT_LABELS[type];
                const colors = GLOBAL_EVENT_COLORS[type];
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={cn(
                      "flex items-center gap-1.5 text-[10px] transition-all rounded-full px-2 py-0.5 -mx-2",
                      selectedTypes.includes(type) ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className={cn("h-2 w-2 rounded-full", colors.dot)} />
                    {isAr ? label.ar : label.en}
                  </button>
                );
              })}
            </div>
          )}

          {/* Keyboard shortcuts hint */}
          <div className="hidden lg:flex items-center justify-center gap-4 py-2 text-[10px] text-muted-foreground/50">
            <span>← → {isAr ? "للتنقل" : "Navigate"}</span>
            <span>T = {isAr ? "اليوم" : "Today"}</span>
          </div>
        </div>
      </PageShell>
    </TooltipProvider>
  );
}
