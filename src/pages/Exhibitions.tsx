import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAdTracking } from "@/hooks/useAdTracking";
import { useExhibitionSponsors } from "@/hooks/useExhibitionSponsors";
import { PageShell } from "@/components/PageShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, CalendarDays, Landmark, MapPin, Plus, Globe, Clock, History, TrendingUp, LayoutGrid, List } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { ExhibitionCard, type Exhibition } from "@/components/exhibitions/ExhibitionCard";
import { ExhibitionListItem } from "@/components/exhibitions/ExhibitionListItem";
import { NextEventHighlight } from "@/components/exhibitions/NextEventHighlight";
import { isPast, isFuture, isWithinInterval } from "date-fns";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import type { Database } from "@/integrations/supabase/types";

type ExhibitionType = Database["public"]["Enums"]["exhibition_type"];

const typeOptions: { value: ExhibitionType | "all"; en: string; ar: string }[] = [
  { value: "all", en: "All Types", ar: "جميع الأنواع" },
  { value: "exhibition", en: "Exhibitions", ar: "معارض" },
  { value: "conference", en: "Conferences", ar: "مؤتمرات" },
  { value: "summit", en: "Summits", ar: "قمم" },
  { value: "workshop", en: "Workshops", ar: "ورش عمل" },
  { value: "food_festival", en: "Food Festivals", ar: "مهرجانات طعام" },
  { value: "trade_show", en: "Trade Shows", ar: "معارض تجارية" },
  { value: "competition_event", en: "Competition Events", ar: "أحداث تنافسية" },
];

const sortOptions = [
  { value: "date_asc", en: "Date (Earliest)", ar: "التاريخ (الأقرب)" },
  { value: "date_desc", en: "Date (Latest)", ar: "التاريخ (الأحدث)" },
  { value: "name_asc", en: "Name (A-Z)", ar: "الاسم (أ-ي)" },
];

export default function Exhibitions() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  useAdTracking();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: exhibitions, isLoading } = useQuery({
    queryKey: ["exhibitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibitions")
        .select("*")
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data as Exhibition[];
    },
    staleTime: 1000 * 60 * 3,
  });

  // Batch sponsor fetch for all exhibitions (eliminates N+1)
  const exhibitionIds = useMemo(() => exhibitions?.map(e => e.id) || [], [exhibitions]);
  const { data: sponsorsMap } = useExhibitionSponsors(exhibitionIds);

  // Derived data
  const countries = useMemo(
    () => Array.from(new Set(exhibitions?.map(e => e.country).filter(Boolean) as string[])).sort(),
    [exhibitions]
  );

  const years = useMemo(
    () => Array.from(new Set(exhibitions?.map(e => new Date(e.start_date).getFullYear().toString()) || [])).sort((a, b) => Number(b) - Number(a)),
    [exhibitions]
  );

  const { happeningNowCount, upcomingCount, countriesCount, featuredExhibitions, nextEvent } = useMemo(() => {
    if (!exhibitions) return { happeningNowCount: 0, upcomingCount: 0, countriesCount: 0, featuredExhibitions: [], nextEvent: undefined };
    const now = new Date();
    let happeningNow = 0;
    let upcoming = 0;
    const featured: Exhibition[] = [];
    let next: Exhibition | undefined;

    for (const e of exhibitions) {
      const start = new Date(e.start_date);
      const end = new Date(e.end_date);
      try {
        if (isWithinInterval(now, { start, end })) happeningNow++;
      } catch { /* invalid interval */ }
      if (isFuture(start)) {
        upcoming++;
        if (!next) next = e;
      }
      if (e.is_featured && !isPast(end)) featured.push(e);
    }

    return {
      happeningNowCount: happeningNow,
      upcomingCount: upcoming,
      countriesCount: new Set(exhibitions.map(e => e.country).filter(Boolean)).size,
      featuredExhibitions: featured,
      nextEvent: next,
    };
  }, [exhibitions]);

  const filtered = useMemo(() => {
    return exhibitions?.filter((ex) => {
      const title = isAr && ex.title_ar ? ex.title_ar : ex.title;
      const matchesSearch = !searchQuery ||
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.organizer_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || ex.type === typeFilter;
      const matchesCountry = countryFilter === "all" || ex.country === countryFilter;
      const matchesYear = yearFilter === "all" || new Date(ex.start_date).getFullYear().toString() === yearFilter;

      const now = new Date();
      const start = new Date(ex.start_date);
      const end = new Date(ex.end_date);

      let matchesTab = true;
      if (activeTab === "upcoming") matchesTab = isFuture(start);
      else if (activeTab === "current") {
        try { matchesTab = isWithinInterval(now, { start, end }); } catch { matchesTab = false; }
      }
      else if (activeTab === "past") matchesTab = isPast(end);

      return matchesSearch && matchesType && matchesCountry && matchesYear && matchesTab;
    })?.sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      if (sortBy === "name_asc") return (isAr && a.title_ar ? a.title_ar : a.title).localeCompare(isAr && b.title_ar ? b.title_ar : b.title);
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    });
  }, [exhibitions, searchQuery, typeFilter, countryFilter, yearFilter, activeTab, sortBy, isAr]);

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setCountryFilter("all");
    setYearFilter("all");
  };

  const hasActiveFilters = searchQuery || typeFilter !== "all" || countryFilter !== "all" || yearFilter !== "all";

  return (
    <PageShell
      title={isAr ? "المعارض والفعاليات — الطهاة" : "Food Exhibitions & Events — Altoha"}
      description={isAr ? "اكتشف معارض الطعام والمؤتمرات والفعاليات" : "Discover food exhibitions, conferences, and culinary events worldwide."}
      seoProps={{
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: isAr ? "المعارض والفعاليات" : "Food Exhibitions & Events",
          url: `${window.location.origin}/exhibitions`,
          isPartOf: { "@type": "WebSite", name: "Altoha", url: window.location.origin },
        },
      }}
      container={false}
      padding="none"
    >
      {/* Editorial Hero */}
      <section className="relative border-b border-border/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-background to-accent/4" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="container relative py-10 md:py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4 max-w-2xl flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 ring-1 ring-primary/20">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                  {isAr ? "فعاليات الطهي العالمية" : "Global Culinary Events"}
                </span>
              </div>
              <h1 className="font-serif text-3xl font-bold tracking-tight md:text-5xl bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text">
                {isAr ? "المعارض والفعاليات" : "Exhibitions & Events"}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-lg">
                {isAr
                  ? "اكتشف أبرز المعارض والمؤتمرات العالمية في عالم الضيافة وفنون الطهي."
                  : "Discover prestigious hospitality and culinary trade shows, conferences, and festivals worldwide."}
              </p>

              {/* Quick stats */}
              {exhibitions && exhibitions.length > 0 && (
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Landmark className="h-4 w-4 text-primary/60" />
                    <span className="font-bold text-foreground">{toEnglishDigits(exhibitions.length)}</span>
                    <span className="text-muted-foreground text-xs">{isAr ? "فعالية" : "Events"}</span>
                  </div>
                  {happeningNowCount > 0 && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <div className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-3 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-chart-3" />
                      </div>
                      <span className="font-bold text-chart-3">{toEnglishDigits(happeningNowCount)}</span>
                      <span className="text-muted-foreground text-xs">{isAr ? "الآن" : "Live"}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-sm">
                    <Globe className="h-4 w-4 text-accent-foreground/40" />
                    <span className="font-bold text-foreground">{toEnglishDigits(countriesCount)}</span>
                    <span className="text-muted-foreground text-xs">{isAr ? "دولة" : "Countries"}</span>
                  </div>
                </div>
              )}

              {user && (
                <div className="pt-2">
                  <Button className="shadow-lg shadow-primary/15 rounded-xl" asChild>
                    <Link to="/exhibitions/create">
                      <Plus className="me-1.5 h-4 w-4" />
                      {isAr ? "إضافة فعالية" : "Add Event"}
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Next Event Highlight */}
            {nextEvent && (
              <div className="w-full lg:w-80 xl:w-96 shrink-0">
                <NextEventHighlight exhibition={nextEvent} isAr={isAr} />
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="container flex-1 py-6 md:py-8">
        {/* Featured Section */}
        {featuredExhibitions.length > 0 && (
          <section className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                <span>⭐</span>
                {isAr ? "فعاليات مميزة" : "Featured Events"}
              </h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featuredExhibitions.slice(0, 3).map((ex) => (
                <ExhibitionCard
                  key={ex.id}
                  exhibition={ex}
                  language={language}
                  variant="featured"
                  sponsors={sponsorsMap?.get(ex.id) || []}
                />
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <div className="sticky top-12 z-40 -mx-2 mb-8 border-y border-border/30 bg-background/90 px-2 py-3.5 backdrop-blur-xl sm:-mx-4 sm:px-4 md:rounded-2xl md:border md:px-5 md:shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1 lg:max-w-sm">
                <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  placeholder={isAr ? "ابحث عن فعالية..." : "Search events..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 border-border/40 bg-muted/30 ps-10 rounded-xl text-sm transition-all focus:bg-background focus:ring-primary/20"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-10 w-full border-border/40 bg-muted/30 rounded-xl sm:w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {typeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {countries.length > 0 && (
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="h-10 w-full border-border/40 bg-muted/30 rounded-xl sm:w-36 text-xs">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary/50" />
                        <SelectValue placeholder={isAr ? "كل الدول" : "All Countries"} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">{isAr ? "كل الدول" : "All Countries"}</SelectItem>
                      {countries.map((c) => (
                        <SelectItem key={c} value={c}>
                          <span className="me-1.5">{countryFlag(c)}</span>{c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {years.length > 1 && (
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="h-10 w-full border-border/40 bg-muted/30 rounded-xl sm:w-28 text-xs">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-primary/50" />
                        <SelectValue placeholder={isAr ? "كل السنوات" : "All Years"} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">{isAr ? "كل السنوات" : "All Years"}</SelectItem>
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-10 w-full border-border/40 bg-muted/30 rounded-xl sm:w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border border-border/40 rounded-xl p-0.5 bg-muted/30 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center justify-center h-8 w-8 rounded-md transition-all ${viewMode === "grid" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center justify-center h-8 w-8 rounded-md transition-all ${viewMode === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                aria-label="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Popular Cities Quick Filter */}
        {countries.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-2 px-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
              {isAr ? "مدن شائعة:" : "Popular:"}
            </span>
            {countries.slice(0, 8).map(c => (
              <button
                key={c}
                onClick={() => setCountryFilter(countryFilter === c ? "all" : c)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium border transition-all ${
                  countryFilter === c
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <span>{countryFlag(c)}</span>
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-muted/30 p-1 rounded-xl border border-border/30">
            {[
              { id: "all", label: isAr ? "الكل" : "All", icon: null, count: exhibitions?.length },
              { id: "current", label: isAr ? "يحدث الآن" : "Live", icon: Clock, count: happeningNowCount },
              { id: "upcoming", label: isAr ? "القادمة" : "Upcoming", icon: CalendarDays, count: upcomingCount },
              { id: "past", label: isAr ? "السابقة" : "Past", icon: History, count: null },
            ].map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="gap-1.5 rounded-xl px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
              >
                {t.icon && <t.icon className="h-3.5 w-3.5" />}
                {t.label}
                {t.count != null && t.count > 0 && (
                  <span className="ms-1 text-[9px] opacity-70">(<AnimatedCounter value={t.count} className="inline" />)</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <Card key={i} className="overflow-hidden border-border/30">
                    <Skeleton className="aspect-[16/10] w-full" />
                    <div className="space-y-2.5 p-4">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3.5 w-2/3" />
                      <div className="flex gap-2 pt-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filtered?.length === 0 ? (
              <EmptyState
                icon={Landmark}
                title={isAr ? "لم يتم العثور على فعاليات" : "No events found"}
                description={isAr ? "جرب تعديل معايير البحث أو الفلاتر" : "Try adjusting your search criteria or filters"}
                action={hasActiveFilters ? (
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={clearFilters}>
                    {isAr ? "مسح جميع الفلاتر" : "Clear all filters"}
                  </Button>
                ) : undefined}
              />
            ) : viewMode === "grid" ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered?.map((ex) => (
                  <ExhibitionCard
                    key={ex.id}
                    exhibition={ex}
                    language={language}
                    sponsors={sponsorsMap?.get(ex.id) || []}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered?.map((ex) => (
                  <ExhibitionListItem
                    key={ex.id}
                    exhibition={ex}
                    language={language}
                    sponsors={sponsorsMap?.get(ex.id) || []}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Stats Footer */}
        {exhibitions && exhibitions.length > 0 && (
          <section className="mt-14 border-t border-border/30 pt-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: isAr ? "إجمالي الفعاليات" : "Total Events", value: exhibitions.length, icon: Landmark, color: "text-primary" },
                { label: isAr ? "جارية الآن" : "Happening Now", value: happeningNowCount, icon: Clock, color: "text-chart-3" },
                { label: isAr ? "القادمة" : "Upcoming", value: upcomingCount, icon: TrendingUp, color: "text-chart-1" },
                { label: isAr ? "الدول" : "Countries", value: countriesCount, icon: Globe, color: "text-accent-foreground" },
              ].map((stat) => (
                <Card key={stat.label} className="border-border/30 bg-muted/10 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
                    <stat.icon className={`h-5 w-5 ${stat.color} opacity-60`} />
                    <p className="text-2xl font-bold text-foreground sm:text-3xl">{toEnglishDigits(stat.value)}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </PageShell>
  );
}
