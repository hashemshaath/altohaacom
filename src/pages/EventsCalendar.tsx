import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useGlobalEventsCalendar, GLOBAL_EVENT_COLORS, GLOBAL_EVENT_LABELS, type GlobalEventType, type GlobalEvent } from "@/hooks/useGlobalEventsCalendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trophy, Landmark, ChefHat, Tv, Mic, GraduationCap, MapPin, Plane, Users,
  MoreHorizontal, Calendar, List, Clock, ChevronLeft, ChevronRight, Globe,
  BookOpen, UtensilsCrossed, Palmtree, Ban, X,
  Timer, Building2, ArrowRight, Search, CalendarDays, SlidersHorizontal,
  ChevronDown, Sparkles,
} from "lucide-react";
import {
  format, parseISO, isSameMonth, isSameDay, startOfMonth, endOfMonth,
  addMonths, subMonths, addWeeks, subWeeks, startOfWeek, endOfWeek,
  addDays, eachDayOfInterval, getDay, differenceInDays, differenceInHours,
  isWithinInterval, isBefore, isAfter,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: rawEvents = [], isLoading } = useGlobalEventsCalendar({
    types: selectedTypes.length > 0 ? selectedTypes : undefined,
    country: selectedCountry || undefined,
  });

  // Client-side search filter
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

  const toggleType = (type: GlobalEventType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = events.filter(e => new Date(e.start_date) >= now).length;
    const thisMonth = events.filter(e => isSameMonth(new Date(e.start_date), now)).length;
    return { total: events.length, upcoming, thisMonth };
  }, [events]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); navigatePrev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); navigateNext(); }
      if (e.key === "t" || e.key === "T") { e.preventDefault(); goToday(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

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
      <SEOHead
        title={isAr ? "تقويم الفعاليات العالمية — Altohaa" : "Global Events Calendar — Altohaa"}
        description={isAr ? "تصفح جميع المسابقات والمعارض والفعاليات الطهوية" : "Browse all competitions, exhibitions, and culinary events worldwide"}
      />
      <Header />
      <div className="min-h-screen bg-background">
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

              {/* Stats pills */}
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
                      className={cn("h-7 rounded-full text-[11px] px-3 gap-1")}
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
            {/* View Mode Tabs */}
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

            {/* Navigation */}
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
      </div>
      <Footer />
    </TooltipProvider>
  );
}

// ─── Stat Pill ──────────────────────────────
function StatPill({ icon: Icon, value, label, color }: { icon: any; value: number; label: string; color: string }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-xl border px-3.5 py-2 bg-background/60 backdrop-blur-sm shadow-sm", `border-${color}/15`)}>
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", `bg-${color}/10`)}>
        <Icon className={cn("h-4 w-4", `text-${color}`)} />
      </div>
      <div>
        <p className={cn("text-lg font-bold tabular-nums leading-none", `text-${color}`)}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Event Tooltip Content ──────────────────
function EventTooltipContent({ event, isAr }: { event: GlobalEvent; isAr: boolean }) {
  const label = GLOBAL_EVENT_LABELS[event.type];
  const colors = GLOBAL_EVENT_COLORS[event.type];
  const countdown = getCountdown(event.start_date, isAr);
  return (
    <div className="max-w-[300px] space-y-2">
      {event.cover_image_url && (
        <img src={event.cover_image_url} alt="" className="w-full h-24 object-cover rounded-lg" loading="lazy" />
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border", colors.bg, colors.text, colors.border)}>
          {isAr ? label?.ar : label?.en}
        </Badge>
        {!countdown.past && (
          <Badge variant={countdown.urgent ? "destructive" : "outline"} className="text-[9px] px-1.5 py-0 gap-0.5">
            <Timer className="h-2 w-2" />{countdown.text}
          </Badge>
        )}
        {event.source !== "global_event" && (
          <Badge variant="secondary" className="text-[8px] px-1 py-0 capitalize">{event.source.replace("_", " ")}</Badge>
        )}
      </div>
      <p className="text-xs font-bold leading-snug">{isAr && event.title_ar ? event.title_ar : event.title}</p>
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
      {event.link && <p className="text-[9px] text-primary font-medium">{isAr ? "اضغط للتفاصيل ←" : "Click for details →"}</p>}
    </div>
  );
}

// ─── Event Chip for Calendar Grid ───────────
function EventChip({ event, isAr, compact = false }: { event: GlobalEvent; isAr: boolean; compact?: boolean }) {
  const colors = GLOBAL_EVENT_COLORS[event.type];
  const label = GLOBAL_EVENT_LABELS[event.type];
  const IconComp = ICONS[label?.icon] || MoreHorizontal;
  const countdown = getCountdown(event.start_date, isAr);

  const chip = (
    <div className={cn(
      "flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-all cursor-default border",
      colors.bg, colors.text, colors.border,
      "hover:shadow-sm hover:brightness-95",
      compact ? "text-[9px]" : "text-[10px]",
      countdown.urgent && !countdown.past && "ring-1 ring-destructive/30"
    )}>
      <IconComp className={cn(compact ? "h-2.5 w-2.5 shrink-0" : "h-3 w-3 shrink-0")} />
      <span className="truncate font-medium leading-tight">{isAr && event.title_ar ? event.title_ar : event.title}</span>
    </div>
  );

  const inner = event.link ? <Link to={event.link} className="block truncate">{chip}</Link> : chip;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent side="top" className="p-3 shadow-xl">
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

  // Multi-day event span detection
  const getEventsForDay = useCallback((day: Date) => {
    return events.filter(e => {
      const start = new Date(e.start_date);
      if (isSameDay(start, day)) return true;
      if (e.end_date) {
        const end = new Date(e.end_date);
        return isWithinInterval(day, { start, end });
      }
      return false;
    });
  }, [events]);

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm">
      <CardContent className="p-0">
        {/* Day name headers */}
        <div className="grid grid-cols-7 bg-muted/30">
          {dayNames.map(d => (
            <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">{d}</div>
          ))}
        </div>
        {/* Day cells */}
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
                  "min-h-[90px] md:min-h-[115px] p-1.5 border-b border-e border-border/15 transition-all cursor-pointer relative",
                  !isCurrentMonth && "opacity-25 bg-muted/10",
                  isSelected && "bg-primary/8 ring-1 ring-inset ring-primary/20",
                  !isSelected && hasEvents && isCurrentMonth && "hover:bg-primary/5",
                  !isSelected && !hasEvents && isCurrentMonth && "hover:bg-muted/20"
                )}
              >
                {/* Day number */}
                <div className="flex items-start justify-between mb-1">
                  <span className={cn(
                    "flex items-center justify-center h-6 w-6 rounded-full text-xs tabular-nums transition-colors",
                    isToday && "bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/20",
                    !isToday && isCurrentMonth && "font-medium text-foreground",
                    !isToday && hasEvents && isCurrentMonth && "text-primary font-semibold",
                  )}>
                    {day.getDate()}
                  </span>
                  {hasEvents && isCurrentMonth && dayEvents.length > 2 && (
                    <Badge variant="secondary" className="h-4 text-[8px] px-1 tabular-nums">{dayEvents.length}</Badge>
                  )}
                </div>
                {/* Event list */}
                {hasEvents && isCurrentMonth && (
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <EventChip key={`${ev.id}-${day.toISOString()}`} event={ev} isAr={isAr} compact />
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[8px] text-center text-primary font-semibold mt-0.5">
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

  const getEventsForDay = useCallback((day: Date) => {
    return events.filter(e => {
      const start = new Date(e.start_date);
      if (isSameDay(start, day)) return true;
      if (e.end_date) return isWithinInterval(day, { start, end: new Date(e.end_date) });
      return false;
    });
  }, [events]);

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm">
      <CardContent className="p-0">
        <div className="grid grid-cols-7 divide-x divide-border/20">
          {weekDays.map((day, i) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div key={i} className={cn("min-h-[380px]", isToday && "bg-primary/3")}>
                <div className={cn(
                  "text-center py-3 border-b border-border/20 transition-colors",
                  isToday ? "bg-primary/8" : "bg-muted/20"
                )}>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{format(day, "EEE")}</p>
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

// ─── Day View ───────────────────────────────
function DayView({ events, currentDate, isAr }: { events: GlobalEvent[]; currentDate: Date; isAr: boolean }) {
  const dayEvents = useMemo(() => events.filter(e => {
    const start = new Date(e.start_date);
    if (isSameDay(start, currentDate)) return true;
    if (e.end_date) return isWithinInterval(currentDate, { start, end: new Date(e.end_date) });
    return false;
  }), [events, currentDate]);
  const isToday = isSameDay(currentDate, new Date());

  return (
    <Card className="shadow-sm border-border/40">
      <div className={cn("flex items-center gap-4 px-5 py-5 border-b border-border/20", isToday && "bg-primary/5")}>
        <div className={cn(
          "flex h-16 w-16 flex-col items-center justify-center rounded-2xl shadow-sm",
          isToday ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <span className="text-[10px] font-bold uppercase leading-none tracking-wider">{format(currentDate, "EEE")}</span>
          <span className="text-3xl font-bold leading-none tabular-nums mt-1">{currentDate.getDate()}</span>
        </div>
        <div>
          <h3 className="text-lg font-bold">{format(currentDate, isAr ? "d MMMM yyyy" : "MMMM d, yyyy")}</h3>
          <p className="text-sm text-muted-foreground">
            {dayEvents.length} {isAr ? "فعاليات مجدولة" : "events scheduled"}
            {isToday && <span className="text-primary font-semibold ms-1.5">• {isAr ? "اليوم" : "Today"}</span>}
          </p>
        </div>
      </div>
      <CardContent className="p-5">
        {dayEvents.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-12 w-12 text-muted-foreground/10 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{isAr ? "لا توجد فعاليات في هذا اليوم" : "No events scheduled for this day"}</p>
            <p className="text-xs text-muted-foreground/50 mt-1">{isAr ? "استخدم ← → للتنقل" : "Use ← → to navigate"}</p>
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
    <div className={cn(
      "flex gap-3 p-4 rounded-xl border transition-all hover:shadow-lg group",
      colors.border, "hover:bg-muted/20",
      countdown.urgent && !countdown.past && "ring-1 ring-destructive/20"
    )}>
      {event.cover_image_url ? (
        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-muted shadow-sm">
          <img src={event.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        </div>
      ) : (
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", colors.bg)}>
          <IconComp className={cn("h-5 w-5", colors.text)} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border gap-0.5", colors.bg, colors.text, colors.border)}>
            <IconComp className="h-2.5 w-2.5" />
            {isAr ? label?.ar : label?.en}
          </Badge>
          {!countdown.past && (
            <Badge variant={countdown.urgent ? "destructive" : "secondary"} className="text-[9px] px-1.5 py-0 gap-0.5">
              <Timer className="h-2.5 w-2.5" />{countdown.text}
            </Badge>
          )}
        </div>
        <p className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-2">
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
      {event.link && (
        <div className="hidden sm:flex items-center">
          <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
        </div>
      )}
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

// ─── List View ──────────────────────────────
function ListView({ events, isAr }: { events: GlobalEvent[]; isAr: boolean }) {
  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.start_date) >= now);
  const pastEvents = events.filter(e => new Date(e.start_date) < now);

  // Group upcoming by month
  const groupedUpcoming = useMemo(() => {
    const groups: Record<string, GlobalEvent[]> = {};
    upcomingEvents.forEach(e => {
      const key = format(new Date(e.start_date), "yyyy-MM");
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [upcomingEvents]);

  if (events.length === 0) {
    return (
      <div className="text-center py-20">
        <Calendar className="h-12 w-12 text-muted-foreground/10 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">{isAr ? "لا توجد فعاليات" : "No events found"}</p>
        <p className="text-xs text-muted-foreground/50 mt-1">{isAr ? "جرّب تغيير الفلاتر" : "Try adjusting your filters"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedUpcoming.map(([monthKey, monthEvents]) => (
        <div key={monthKey}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <h3 className="text-sm font-bold text-foreground">
              {format(new Date(monthKey + "-01"), isAr ? "MMMM yyyy" : "MMMM yyyy")}
            </h3>
            <Badge variant="outline" className="text-[10px] tabular-nums">{monthEvents.length}</Badge>
            <div className="flex-1 h-px bg-border/30" />
          </div>
          <div className="space-y-2.5">
            {monthEvents.map(ev => <ListEventCard key={ev.id} event={ev} isAr={isAr} />)}
          </div>
        </div>
      ))}

      {pastEvents.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-bold text-muted-foreground">
              {isAr ? "فعاليات سابقة" : "Past Events"}
            </h3>
            <Badge variant="outline" className="text-[10px] tabular-nums">{pastEvents.length}</Badge>
            <div className="flex-1 h-px bg-border/30" />
          </div>
          <div className="space-y-2 opacity-60">
            {pastEvents.slice(-8).reverse().map(ev => <ListEventCard key={ev.id} event={ev} isAr={isAr} />)}
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
      "overflow-hidden transition-all hover:shadow-xl group border-border/40",
      countdown.past && "opacity-70"
    )}>
      <div className="flex">
        {/* Image / Icon Side */}
        <div className={cn(
          "w-28 sm:w-36 shrink-0 relative overflow-hidden",
          !event.cover_image_url && colors.bg
        )}>
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <IconComp className={cn("h-8 w-8 opacity-30", colors.text)} />
            </div>
          )}
          {event.logo_url && (
            <div className="absolute bottom-1.5 start-1.5 h-8 w-8 rounded-lg bg-background/90 shadow-sm flex items-center justify-center overflow-hidden ring-1 ring-border/20">
              <img src={event.logo_url} alt="" className="h-6 w-6 object-contain" />
            </div>
          )}
          {!countdown.past && (
            <div className={cn(
              "absolute top-1.5 end-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold shadow-sm",
              countdown.urgent ? "bg-destructive text-destructive-foreground" : "bg-background/90 text-foreground backdrop-blur-sm"
            )}>
              <Timer className="h-2.5 w-2.5 inline me-0.5" />{countdown.text}
            </div>
          )}
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col justify-between">
          <div>
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
            <h4 className="text-sm sm:text-base font-bold line-clamp-2 group-hover:text-primary transition-colors">
              {isAr && event.title_ar ? event.title_ar : event.title}
            </h4>
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
            </div>
          </div>
          {event.link && (
            <div className="flex items-center justify-end mt-2 pt-2 border-t border-border/15">
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
    <Card className="border-primary/20 animate-in slide-in-from-top-2 duration-200 shadow-lg shadow-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            {format(day, isAr ? "EEEE, d MMMM yyyy" : "EEEE, MMMM d, yyyy")}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] tabular-nums">
              {events.length} {isAr ? "فعاليات" : "events"}
            </Badge>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {events.map(ev => <DayEventCard key={ev.id} event={ev} isAr={isAr} />)}
        </div>
      </CardContent>
    </Card>
  );
}
