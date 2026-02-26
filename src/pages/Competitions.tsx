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
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, MapPin, Plus, Globe, Trophy, Flame, Sparkles, Users, TrendingUp, ArrowUpDown } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { toEnglishDigits } from "@/lib/formatNumber";
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
  const { data: allCountries = [] } = useAllCountries();
  useAdTracking();

  const { data: competitions, isLoading } = useQuery({
    queryKey: ["competitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("*, competition_registrations(id)")
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

  // Pre-compute counts & featured
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

    // Apply sort
    if (sortBy === "name") {
      result = [...result].sort((a, b) => {
        const aName = isAr && a.title_ar ? a.title_ar : a.title;
        const bName = isAr && b.title_ar ? b.title_ar : b.title;
        return aName.localeCompare(bName);
      });
    } else if (sortBy === "popularity") {
      result = [...result].sort((a, b) => (b.competition_registrations?.length || 0) - (a.competition_registrations?.length || 0));
    }
    // "date" is default from query order

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
        {/* Top Banner Ad */}
        <div className="container mt-4">
          <AdBanner placementSlug="competitions-top-banner" className="w-full aspect-[5/1]" />
        </div>

        {/* Editorial Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.12),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--accent)/0.10),transparent_50%)]" />
          <div className="container relative py-5 md:py-14">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-2 sm:space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 ring-1 ring-primary/20">
                  <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-primary">
                    {isAr ? "مسابقات الطهي" : "Culinary Competitions"}
                  </span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight md:text-5xl">
                  {isAr ? "المسابقات" : "Competitions"}
                </h1>
                <p className="hidden sm:block text-muted-foreground text-sm md:text-base leading-relaxed max-w-xl">
                  {isAr
                    ? "اكتشف مسابقات الطهي واشترك فيها. تنافس مع أفضل الطهاة."
                    : "Discover and join culinary competitions. Compete with top chefs worldwide."}
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-3 sm:gap-6">
                  {[
                    { value: toEnglishDigits(counts.all), label: isAr ? "المسابقات" : "Total", icon: <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> },
                    { value: toEnglishDigits(counts.active), label: isAr ? "نشطة الآن" : "Live Now", icon: <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5" />, live: counts.active > 0 },
                    { value: toEnglishDigits(countryCodes.length), label: isAr ? "الدول" : "Countries", icon: <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl ${stat.live ? "bg-chart-3/10 text-chart-3" : "bg-primary/10 text-primary"} ring-1 ${stat.live ? "ring-chart-3/20" : "ring-primary/10"}`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-base sm:text-lg font-black leading-none">{stat.value}</p>
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                      </div>
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

        <div className="container py-4 md:py-6">
          {/* Featured Competition */}
          {featured && !search && activeTab === "all" && (
            <FeaturedCompetitionCard competition={featured} language={language} isAr={isAr} />
          )}

          {/* Sticky Filters + Tab Pills + Sort */}
          <div className="sticky top-12 z-30 -mx-4 mb-6 border-y border-border/40 bg-background/90 px-4 py-3 backdrop-blur-md md:rounded-2xl md:border md:mx-0 md:px-6 space-y-3">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute start-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder={isAr ? "ابحث..." : "Search..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 border-border/40 bg-muted/20 ps-9 text-sm transition-all focus:bg-background rounded-xl"
                />
              </div>
              {countryCodes.length > 1 && (
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="h-9 w-auto min-w-[42px] max-w-[120px] border-border/40 bg-muted/20 rounded-xl text-xs px-2.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                    <SelectValue placeholder={isAr ? "دولة" : "Country"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40">
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
                <SelectTrigger className="h-9 w-auto min-w-[42px] max-w-[130px] border-border/40 bg-muted/20 rounded-xl text-xs px-2.5">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/40">
                  <SelectItem value="date" className="rounded-lg text-xs">{isAr ? "التاريخ" : "Date"}</SelectItem>
                  <SelectItem value="name" className="rounded-lg text-xs">{isAr ? "الاسم" : "Name"}</SelectItem>
                  <SelectItem value="popularity" className="rounded-lg text-xs">{isAr ? "الأكثر شعبية" : "Popular"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Tab Pills */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
              {TAB_FILTERS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 touch-manipulation ${
                    activeTab === tab
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  {activeTab === tab && (
                    <div className="absolute inset-0 rounded-xl bg-primary shadow-lg shadow-primary/20 animate-in fade-in zoom-in-95 duration-300" />
                  )}
                  <span className="relative z-10">{isAr ? tabLabels[tab].ar : tabLabels[tab].en}</span>
                  <span className={`relative z-10 ms-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-md px-1 text-[9px] font-black ${
                    activeTab === tab
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {toEnglishDigits(counts[tab])}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[16/10] w-full" />
                  <CardContent className="space-y-2 p-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
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
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
              {filtered?.map((comp) => (
                <CompetitionCard key={comp.id} competition={comp} language={language} isAr={isAr} />
              ))}
            </div>
          )}

          {/* Stats Footer */}
          {competitions && competitions.length > 0 && (
            <section className="mt-14 border-t border-border/30 pt-8">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: isAr ? "إجمالي المسابقات" : "Total Competitions", value: counts.all, icon: Trophy, color: "text-primary" },
                  { label: isAr ? "نشطة الآن" : "Active Now", value: counts.active, icon: Flame, color: "text-chart-3" },
                  { label: isAr ? "المسجلين" : "Registrations", value: totalRegistrations, icon: Users, color: "text-chart-1" },
                  { label: isAr ? "الدول" : "Countries", value: countryCodes.length, icon: Globe, color: "text-accent-foreground" },
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
        </div>
      </main>
    </PageShell>
  );
}
