import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAdTracking } from "@/hooks/useAdTracking";
import { useAllCountries } from "@/hooks/useCountries";
import { PageShell } from "@/components/PageShell";
import { AdBanner } from "@/components/ads/AdBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, MapPin, Plus, Globe, Trophy, Flame, Sparkles, Users, TrendingUp, ArrowUpDown, LayoutGrid, List } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { countryFlag } from "@/lib/countryFlag";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  CompetitionCard,
  FeaturedCompetitionCard,
  getDerivedStatus,
  getTabBucket,
  type CompetitionWithRegs,
} from "@/components/competitions/CompetitionCard";

const TAB_FILTERS = ["all", "upcoming", "active", "past"] as const;
type TabFilter = typeof TAB_FILTERS[number];

const tabLabels: Record<TabFilter, { en: string; ar: string }> = {
  all: { en: "All", ar: "الكل" },
  upcoming: { en: "Upcoming", ar: "قادمة" },
  active: { en: "Active", ar: "نشطة" },
  past: { en: "Past", ar: "سابقة" },
};

type SortOption = "date" | "name" | "popularity";

export default function Competitions() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { data: allCountries = [] } = useAllCountries();
  useAdTracking();

  const { data: competitions, isLoading } = useQuery({
    queryKey: ["competitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, title, title_ar, description, description_ar, cover_image_url, status, registration_start, registration_end, competition_start, competition_end, venue, venue_ar, city, country, country_code, is_virtual, max_participants, organizer_id, edition_year, competition_registrations(id)")
        .order("competition_start", { ascending: true });
      if (error) throw error;
      return data as CompetitionWithRegs[];
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: userRoles } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      return data?.map(r => r.role) || [];
    },
    enabled: !!user,
  });

  const canCreate = userRoles?.some(role => ["organizer", "supervisor"].includes(role));

  const countryCodes = useMemo(
    () => Array.from(new Set(competitions?.map(c => c.country_code).filter(Boolean) as string[])).sort(),
    [competitions]
  );

  const getCountryName = useCallback((code: string) => {
    const c = allCountries.find((ct) => ct.code === code);
    return c ? (isAr ? c.name_ar || c.name : c.name) : code;
  }, [allCountries, isAr]);

  const { counts, featured, totalRegistrations } = useMemo(() => {
    if (!competitions) return { counts: { all: 0, upcoming: 0, active: 0, past: 0 }, featured: undefined, totalRegistrations: 0 };
    const c = { all: competitions.length, upcoming: 0, active: 0, past: 0 };
    let feat: CompetitionWithRegs | undefined;
    let totalRegs = 0;

    for (const comp of competitions) {
      const bucket = getTabBucket(comp);
      c[bucket]++;
      totalRegs += comp.competition_registrations?.length || 0;
      if (!feat) {
        const d = getDerivedStatus(comp);
        if (["registration_open", "registration_closing_soon", "in_progress"].includes(d.status)) feat = comp;
      }
    }
    return { counts: c, featured: feat, totalRegistrations: totalRegs };
  }, [competitions]);

  const filtered = useMemo(() => {
    let result = competitions?.filter(comp => {
      const title = isAr && comp.title_ar ? comp.title_ar : comp.title;
      const matchesSearch = !search || title.toLowerCase().includes(search.toLowerCase());
      const matchesCountry = countryFilter === "all" || comp.country_code === countryFilter;
      const matchesTab = activeTab === "all" || getTabBucket(comp) === activeTab;
      return matchesSearch && matchesCountry && matchesTab;
    }) || [];

    if (sortBy === "name") {
      result = [...result].sort((a, b) => {
        const aName = isAr && a.title_ar ? a.title_ar : a.title;
        const bName = isAr && b.title_ar ? b.title_ar : b.title;
        return aName.localeCompare(bName);
      });
    } else if (sortBy === "popularity") {
      result = [...result].sort((a, b) => (b.competition_registrations?.length || 0) - (a.competition_registrations?.length || 0));
    }

    return result;
  }, [competitions, search, countryFilter, activeTab, isAr, sortBy]);

  const hasActiveFilters = search || countryFilter !== "all";

  const clearAll = useCallback(() => {
    setSearch("");
    setCountryFilter("all");
    setActiveTab("all");
    setSortBy("date");
  }, []);

  return (
    <PageShell
      title={isAr ? "مسابقات الطهي — الطهاة" : "Culinary Competitions — Altoha"}
      description={isAr ? "تصفح وانضم لمسابقات الطهي حول العالم." : "Browse and join culinary competitions worldwide."}
      seoProps={{
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: isAr ? "مسابقات الطهي" : "Culinary Competitions",
          description: "Browse culinary competitions on Altoha",
          url: `${window.location.origin}/competitions`,
          isPartOf: { "@type": "WebSite", name: "Altoha", url: window.location.origin },
        },
      }}
      container={false}
      padding="none"
    >
      <main className="flex-1">
        {/* Breadcrumbs */}
        <div className="container mt-3">
          <Breadcrumbs items={[{ label: isAr ? "المسابقات" : "Competitions" }]} />
        </div>
        {/* Top Banner Ad */}
        <div className="container mt-2">
          <AdBanner placementSlug="competitions-top-banner" className="w-full aspect-[5/1]" />
        </div>

        {/* Editorial Hero — compact & clean */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
          <div className="container relative py-6 md:py-10">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-2.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 ring-1 ring-primary/15">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    {isAr ? "مسابقات الطهي" : "Culinary Competitions"}
                  </span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl">
                  {isAr ? "المسابقات" : "Competitions"}
                </h1>
                <p className="hidden sm:block text-muted-foreground text-sm leading-relaxed max-w-lg">
                  {isAr
                    ? "اكتشف مسابقات الطهي واشترك فيها. تنافس مع أفضل الطهاة."
                    : "Discover and join culinary competitions. Compete with top chefs worldwide."}
                </p>

                {/* Stats chips */}
                <div className="flex items-center gap-2 sm:gap-4 pt-1">
                  {[
                    { numValue: counts.all, label: isAr ? "المسابقات" : "Total", icon: <Trophy className="h-3 w-3" /> },
                    { numValue: counts.active, label: isAr ? "نشطة" : "Live", icon: <Flame className="h-3 w-3" />, live: counts.active > 0 },
                    { numValue: countryCodes.length, label: isAr ? "دول" : "Countries", icon: <Globe className="h-3 w-3" /> },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-1.5 rounded-full bg-muted/40 px-2.5 py-1.5 ring-1 ring-border/30">
                      <span className={stat.live ? "text-chart-3" : "text-primary"}>{stat.icon}</span>
                      <AnimatedCounter value={stat.numValue} className="text-sm font-bold tabular-nums" />
                      <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {canCreate && (
                <Button asChild size="sm" className="shadow-lg shadow-primary/20 rounded-xl shrink-0 font-bold">
                  <Link to="/competitions/create">
                    <Plus className="me-1 h-4 w-4" />
                    <span className="hidden sm:inline">{t("createCompetition")}</span>
                    <span className="sm:hidden">{isAr ? "إنشاء" : "Create"}</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        <div className="container py-4 md:py-6 space-y-6">
          {/* Featured Competition */}
          {featured && !search && activeTab === "all" && (
            <FeaturedCompetitionCard competition={featured} language={language} isAr={isAr} />
          )}

          {/* Sticky Filters */}
          <div className="sticky top-12 z-30 -mx-4 px-4 py-2.5 bg-background/90 backdrop-blur-xl border-b border-border/20 md:rounded-2xl md:border md:border-border/20 md:mx-0 md:px-4 md:bg-card/60 space-y-2.5">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  placeholder={isAr ? "ابحث..." : "Search..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 border-border/20 bg-muted/10 ps-9 text-sm rounded-xl"
                />
              </div>
              {countryCodes.length > 1 && (
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="h-9 w-auto min-w-[42px] max-w-[120px] border-border/20 bg-muted/10 rounded-xl text-xs px-2.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    <SelectValue placeholder={isAr ? "دولة" : "Country"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/20">
                    <SelectItem value="all" className="rounded-lg">{isAr ? "جميع الدول" : "All Countries"}</SelectItem>
                    {countryCodes.map((code) => (
                      <SelectItem key={code} value={code} className="rounded-lg">
                        <span className="flex items-center gap-2">
                          <span>{countryFlag(code)}</span>
                          <span className="hidden sm:inline">{getCountryName(code)}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="h-9 w-auto min-w-[42px] max-w-[130px] border-border/20 bg-muted/10 rounded-xl text-xs px-2.5">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/20">
                  <SelectItem value="date" className="rounded-lg text-xs">{isAr ? "التاريخ" : "Date"}</SelectItem>
                  <SelectItem value="name" className="rounded-lg text-xs">{isAr ? "الاسم" : "Name"}</SelectItem>
                  <SelectItem value="popularity" className="rounded-lg text-xs">{isAr ? "الأكثر شعبية" : "Popular"}</SelectItem>
                </SelectContent>
              </Select>
              {/* View Mode Toggle */}
              <div className="flex items-center gap-0.5 border border-border/20 rounded-xl p-0.5 bg-muted/10 shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center justify-center h-7 w-7 rounded-md transition-all ${viewMode === "grid" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center justify-center h-7 w-7 rounded-md transition-all ${viewMode === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  aria-label="List view"
                >
                  <List className="h-3 w-3" />
                </button>
              </div>
            </div>
            {/* Tab Pills */}
            <div className="flex gap-1 overflow-x-auto scrollbar-none">
              {TAB_FILTERS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 touch-manipulation active:scale-95 ${
                    activeTab === tab
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  <span>{isAr ? tabLabels[tab].ar : tabLabels[tab].en}</span>
                  <span className={`ms-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black tabular-nums ${
                    activeTab === tab
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <AnimatedCounter value={counts[tab]} className="inline" />
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Card key={i} className="overflow-hidden rounded-2xl border-border/20">
                  <Skeleton className="aspect-[16/10] w-full" />
                  <CardContent className="space-y-2 p-3">
                    <Skeleton className="h-4 w-3/4 rounded-lg" />
                    <Skeleton className="h-3 w-1/2 rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filtered?.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title={isAr ? "لا توجد مسابقات" : "No competitions found"}
              description={search
                ? (isAr ? "جرّب كلمات بحث مختلفة" : "Try different search terms")
                : (isAr ? "لا توجد مسابقات في هذه الفئة حالياً" : "No competitions in this category yet")}
              action={hasActiveFilters ? (
                <Button variant="outline" size="sm" className="rounded-xl" onClick={clearAll}>
                  {isAr ? "مسح الفلاتر" : "Clear filters"}
                </Button>
              ) : undefined}
            />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {filtered?.map((comp) => (
                <CompetitionCard key={comp.id} competition={comp} language={language} isAr={isAr} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered?.map((comp) => {
                const title = isAr && comp.title_ar ? comp.title_ar : comp.title;
                const status = getDerivedStatus(comp);
                const regs = comp.competition_registrations?.length || 0;
                return (
                  <Link key={comp.id} to={`/competitions/${comp.id}`}>
                    <Card className="group overflow-hidden rounded-2xl border-border/20 transition-all hover:shadow-md hover:-translate-y-0.5">
                      <CardContent className="flex items-center gap-4 p-3.5">
                        <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted shrink-0">
                          {comp.cover_image_url ? (
                            <img src={comp.cover_image_url} alt={title} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex h-full items-center justify-center"><Trophy className="h-6 w-6 text-muted-foreground/20" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                            {comp.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{comp.city}</span>}
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{regs}</span>
                          </div>
                        </div>
                        <Badge variant={status.status === "in_progress" ? "default" : "outline"} className="shrink-0 text-[10px]">
                          {status.label}
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Stats Footer */}
          {competitions && competitions.length > 0 && (
            <section className="border-t border-border/10 pt-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: isAr ? "إجمالي المسابقات" : "Total Competitions", value: counts.all, icon: Trophy, color: "text-primary" },
                  { label: isAr ? "نشطة الآن" : "Active Now", value: counts.active, icon: Flame, color: "text-chart-3" },
                  { label: isAr ? "المسجلين" : "Registrations", value: totalRegistrations, icon: Users, color: "text-chart-1" },
                  { label: isAr ? "الدول" : "Countries", value: countryCodes.length, icon: Globe, color: "text-accent-foreground" },
                ].map((stat) => (
                  <Card key={stat.label} className="border-border/10 bg-card/50 rounded-2xl">
                    <CardContent className="p-3.5 flex flex-col items-center text-center gap-1">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/30">
                        <stat.icon className={`h-4 w-4 ${stat.color} opacity-50`} />
                      </div>
                      <AnimatedCounter value={stat.value} className="text-xl font-bold text-foreground sm:text-2xl tabular-nums" />
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      
    </PageShell>
  );
}
