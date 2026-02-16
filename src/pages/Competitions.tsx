import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdBanner } from "@/components/ads/AdBanner";
import { AdVertical } from "@/components/ads/AdVertical";
import { useAdTracking } from "@/hooks/useAdTracking";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Calendar, MapPin, Users, Search, Plus, Globe, Trophy, Clock, ArrowRight, Flame, Sparkles, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, differenceInDays, isFuture } from "date-fns";
import { countryFlag } from "@/lib/countryFlag";
import { useAllCountries } from "@/hooks/useCountries";
import { deriveCompetitionStatus } from "@/lib/competitionStatus";
import { toEnglishDigits } from "@/lib/formatNumber";
import type { Database } from "@/integrations/supabase/types";

type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

interface Competition {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  cover_image_url: string | null;
  status: CompetitionStatus;
  registration_start: string | null;
  registration_end: string | null;
  competition_start: string;
  competition_end: string;
  venue: string | null;
  venue_ar: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  is_virtual: boolean | null;
  max_participants: number | null;
  organizer_id: string;
}

const statusConfig: Record<CompetitionStatus, { bg: string; dot: string; label: string; labelAr: string }> = {
  draft: { bg: "bg-muted/60", dot: "bg-muted-foreground", label: "Draft", labelAr: "مسودة" },
  upcoming: { bg: "bg-accent/10 text-accent-foreground", dot: "bg-accent", label: "Upcoming", labelAr: "قادمة" },
  registration_open: { bg: "bg-primary/10 text-primary", dot: "bg-primary", label: "Registration Open", labelAr: "التسجيل مفتوح" },
  registration_closed: { bg: "bg-muted/60 text-muted-foreground", dot: "bg-muted-foreground", label: "Registration Closed", labelAr: "التسجيل مغلق" },
  in_progress: { bg: "bg-chart-3/10 text-chart-3", dot: "bg-chart-3", label: "In Progress", labelAr: "جارية" },
  judging: { bg: "bg-chart-4/10 text-chart-4", dot: "bg-chart-4", label: "Judging", labelAr: "التحكيم" },
  completed: { bg: "bg-chart-5/10 text-chart-5", dot: "bg-chart-5", label: "Completed", labelAr: "مكتملة" },
  cancelled: { bg: "bg-destructive/10 text-destructive", dot: "bg-destructive", label: "Cancelled", labelAr: "ملغاة" },
};

const TAB_FILTERS = ["all", "upcoming", "active", "past"] as const;

export default function Competitions() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<typeof TAB_FILTERS[number]>("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const { data: allCountries = [] } = useAllCountries();

  const { data: competitions, isLoading } = useQuery({
    queryKey: ["competitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("*, competition_registrations(id)")
        .order("competition_start", { ascending: true });
      if (error) throw error;
      return data as (Competition & { competition_registrations: { id: string }[] })[];
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
  useAdTracking();

  const countryCodes = Array.from(
    new Set(competitions?.map(c => c.country_code).filter(Boolean) as string[])
  ).sort();

  const getCountryName = (code: string) => {
    const c = allCountries.find((ct) => ct.code === code);
    return c ? (isAr ? c.name_ar || c.name : c.name) : code;
  };

  // Derive real-time status for every competition
  const getDerived = (comp: Competition) =>
    deriveCompetitionStatus({
      registrationStart: comp.registration_start,
      registrationEnd: comp.registration_end,
      competitionStart: comp.competition_start,
      competitionEnd: comp.competition_end,
      dbStatus: comp.status,
    });

  const tabBucket = (comp: Competition) => {
    const d = getDerived(comp);
    if (["registration_upcoming", "registration_open", "registration_closing_soon"].includes(d.status)) return "upcoming";
    if (["in_progress", "competition_starting_soon"].includes(d.status)) return "active";
    if (["ended", "registration_closed"].includes(d.status)) return "past";
    return "upcoming";
  };

  const filteredCompetitions = competitions?.filter(comp => {
    const title = isAr && comp.title_ar ? comp.title_ar : comp.title;
    const matchesSearch = title.toLowerCase().includes(search.toLowerCase());
    const matchesCountry = countryFilter === "all" || comp.country_code === countryFilter;
    const matchesTab = activeTab === "all" || tabBucket(comp) === activeTab;
    return matchesSearch && matchesCountry && matchesTab;
  });

  const counts = {
    all: competitions?.length || 0,
    upcoming: competitions?.filter(c => tabBucket(c) === "upcoming").length || 0,
    active: competitions?.filter(c => tabBucket(c) === "active").length || 0,
    past: competitions?.filter(c => tabBucket(c) === "past").length || 0,
  };

  const tabLabels: Record<typeof TAB_FILTERS[number], { en: string; ar: string }> = {
    all: { en: "All", ar: "الكل" },
    upcoming: { en: "Upcoming", ar: "قادمة" },
    active: { en: "Active", ar: "نشطة" },
    past: { en: "Past", ar: "سابقة" },
  };

  const featured = competitions?.find(c => {
    const d = getDerived(c);
    return ["registration_open", "registration_closing_soon", "in_progress"].includes(d.status);
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title={isAr ? "مسابقات الطهي — الطهاة" : "Culinary Competitions — Altohaa"}
        description={isAr ? "تصفح وانضم لمسابقات الطهي حول العالم. أبرز مهاراتك وتنافس مع أفضل الطهاة." : "Browse and join culinary competitions worldwide. Showcase your cooking skills and compete with the best chefs."}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: isAr ? "مسابقات الطهي" : "Culinary Competitions",
          description: "Browse culinary competitions on Altohaa",
          url: `${window.location.origin}/competitions`,
          isPartOf: { "@type": "WebSite", name: "Altohaa", url: window.location.origin },
        }}
      />
      <Header />

      <main className="flex-1">
        {/* Top Banner Ad */}
        <div className="container mt-4">
          <AdBanner placementSlug="competitions-top-banner" className="w-full aspect-[5/1]" />
        </div>

        {/* Compact Hero */}
        <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-8 md:py-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 ring-1 ring-primary/20">
                  <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    {isAr ? "مسابقات الطهي" : "Culinary Competitions"}
                  </span>
                </div>
                <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
                  {isAr ? "المسابقات" : "Competitions"}
                </h1>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  {isAr
                    ? "اكتشف مسابقات الطهي واشترك فيها. تنافس مع أفضل الطهاة."
                    : "Discover and join culinary competitions. Compete with top chefs worldwide."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="gap-1.5 border-primary/20 bg-primary/5 text-primary px-3 py-1.5">
                  <Trophy className="h-3.5 w-3.5" />
                  <span className="font-bold">{toEnglishDigits(counts.all)}</span>
                </Badge>
                {canCreate && (
                  <Button asChild className="shadow-sm shadow-primary/15">
                    <Link to="/competitions/create">
                      <Plus className="me-1.5 h-4 w-4" />
                      {t("createCompetition")}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="container py-4 md:py-6">
          {/* Featured Competition */}
          {featured && !search && activeTab === "all" && (
            <FeaturedCard competition={featured as any} language={language} isAr={isAr} />
          )}

          {/* Sticky Filters + Tab Pills */}
          <div className="sticky top-[64px] z-30 -mx-4 mb-8 border-y border-border/40 bg-background/80 px-4 py-4 backdrop-blur-md md:rounded-2xl md:border md:mx-0 md:px-6 space-y-4">
            {/* Search & Filter */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder={isAr ? "ابحث عن مسابقة..." : "Search competitions..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 border-border/40 bg-muted/20 ps-11 transition-all focus:bg-background focus:ring-primary/20 rounded-xl"
                />
              </div>
              {countryCodes.length > 1 && (
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="h-11 w-full sm:w-48 border-border/40 bg-muted/20 rounded-xl focus:ring-primary/20">
                    <MapPin className="me-1.5 h-3.5 w-3.5 text-muted-foreground/60" />
                    <SelectValue placeholder={isAr ? "الدولة" : "Country"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40">
                    <SelectItem value="all" className="rounded-lg">{isAr ? "جميع الدول" : "All Countries"}</SelectItem>
                    {countryCodes.map((code) => (
                      <SelectItem key={code} value={code} className="rounded-lg">
                        <span className="flex items-center gap-2">
                          <span>{countryFlag(code)}</span>
                          <span>{getCountryName(code)}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {/* Tab Pills */}
            <div className="flex flex-wrap gap-2">
              {TAB_FILTERS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    activeTab === tab
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  {activeTab === tab && (
                    <div className="absolute inset-0 rounded-xl bg-primary shadow-lg shadow-primary/20 animate-in fade-in zoom-in-95 duration-300" />
                  )}
                  <span className="relative z-10">{isAr ? tabLabels[tab].ar : tabLabels[tab].en}</span>
                  <span className={`relative z-10 ms-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-lg px-1.5 text-[10px] font-black ${
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
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[16/10] w-full" />
                  <CardContent className="space-y-3 p-5">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCompetitions?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Trophy className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <h3 className="mb-1.5 text-lg font-semibold">{isAr ? "لا توجد مسابقات" : "No competitions found"}</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                {search
                  ? (isAr ? "جرّب كلمات بحث مختلفة" : "Try different search terms or clear your filters")
                  : (isAr ? "لا توجد مسابقات في هذه الفئة حالياً" : "No competitions in this category yet")}
              </p>
              {search && (
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch("")}>
                  {isAr ? "مسح البحث" : "Clear search"}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCompetitions?.map((comp) => (
                <CompetitionCard key={comp.id} competition={comp} language={language} isAr={isAr} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ─── Featured Competition Banner ─── */
function FeaturedCard({ competition, language, isAr }: { competition: Competition & { competition_registrations?: { id: string }[] }; language: string; isAr: boolean }) {
  const title = isAr && competition.title_ar ? competition.title_ar : competition.title;
  const desc = isAr && competition.description_ar ? competition.description_ar : competition.description;
  const derived = deriveCompetitionStatus({
    registrationStart: competition.registration_start,
    registrationEnd: competition.registration_end,
    competitionStart: competition.competition_start,
    competitionEnd: competition.competition_end,
    dbStatus: competition.status,
  });
  const regCount = competition.competition_registrations?.length || 0;

  return (
    <Link to={`/competitions/${competition.id}`} className="group mb-12 block">
      <Card className="relative overflow-hidden border-primary/15 bg-card/60 backdrop-blur-sm shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30">
        <div className="pointer-events-none absolute -top-24 -end-24 h-64 w-64 rounded-full bg-primary/10 blur-[80px] transition-all duration-500 group-hover:bg-primary/15" />
        <div className="relative flex flex-col md:flex-row">
          <div className="relative aspect-[16/9] w-full overflow-hidden md:aspect-auto md:w-2/5 lg:w-1/2">
            {competition.cover_image_url ? (
              <img src={competition.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1" />
            ) : (
              <div className="flex h-full min-h-[250px] items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                <Trophy className="h-24 w-24 text-primary/10 animate-pulse" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-60" />
            <div className="absolute start-5 top-5">
              <Badge className="gap-2 bg-primary px-4 py-1.5 text-xs font-bold shadow-xl animate-pulse ring-4 ring-primary/20">
                <Flame className="h-3.5 w-3.5" />
                {isAr ? "مسابقة مميزة" : "Featured Spotlight"}
              </Badge>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-between p-6 md:p-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={`${derived.color} px-3 py-1 font-bold text-[10px] tracking-wider uppercase`}>
                  <span className={`me-2 inline-block h-2 w-2 rounded-full ${derived.dot} animate-pulse`} />
                  {isAr ? derived.labelAr : derived.label}
                </Badge>
                {derived.daysLeft && derived.daysLeft > 0 && derived.daysLeft <= 60 && (
                  <Badge variant="outline" className="gap-1.5 text-[10px] font-bold bg-background/40 backdrop-blur-md border-border/40">
                    <Clock className="h-3 w-3 text-primary" />
                    {isAr ? `${toEnglishDigits(derived.daysLeft)} يوم متبقي` : `${derived.daysLeft} DAYS LEFT`}
                  </Badge>
                )}
              </div>
              <h2 className="font-serif text-2xl font-black md:text-3xl lg:text-4xl leading-tight group-hover:text-primary transition-colors duration-300">{title}</h2>
              {desc && <p className="line-clamp-3 text-sm md:text-base text-muted-foreground font-medium leading-relaxed">{desc}</p>}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm font-semibold text-foreground/80">
              <div className="flex items-center gap-2 group/icon">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted group-hover/icon:bg-primary/10 transition-colors">
                  <Calendar className="h-4 w-4 text-muted-foreground group-hover/icon:text-primary" />
                </div>
                {toEnglishDigits(format(new Date(competition.competition_start), "MMMM d, yyyy"))}
              </div>
              {competition.is_virtual ? (
                <div className="flex items-center gap-2 group/icon">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted group-hover/icon:bg-primary/10 transition-colors">
                    <Globe className="h-4 w-4 text-muted-foreground group-hover/icon:text-primary" />
                  </div>
                  {isAr ? "مسابقة افتراضية" : "Virtual Competition"}
                </div>
              ) : competition.city && (
                <div className="flex items-center gap-2 group/icon">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted group-hover/icon:bg-primary/10 transition-colors">
                    <MapPin className="h-4 w-4 text-muted-foreground group-hover/icon:text-primary" />
                  </div>
                  {competition.country_code ? `${countryFlag(competition.country_code)} ` : ""}{competition.city}{competition.country ? `, ${competition.country}` : ""}
                </div>
              )}
              <div className="flex items-center gap-2 group/icon">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted group-hover/icon:bg-primary/10 transition-colors">
                  <Users className="h-4 w-4 text-muted-foreground group-hover/icon:text-primary" />
                </div>
                {toEnglishDigits(regCount)} {isAr ? "مسجل" : "Registered"}
              </div>
              <div className="ms-auto">
                <Button variant="ghost" className="gap-2 text-primary hover:bg-primary/5 p-0 hover:p-2 transition-all group/btn">
                  <span className="font-bold uppercase tracking-widest text-xs">{isAr ? "استكشف الآن" : "Explore Now"}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/* ─── Competition Card ─── */
function CompetitionCard({ competition, language, isAr }: { competition: Competition & { competition_registrations?: { id: string }[] }; language: string; isAr: boolean }) {
  const title = isAr && competition.title_ar ? competition.title_ar : competition.title;
  const regCount = competition.competition_registrations?.length || 0;
  const maxP = competition.max_participants;
  const fillPct = maxP ? Math.min(Math.round((regCount / maxP) * 100), 100) : 0;
  const derived = deriveCompetitionStatus({
    registrationStart: competition.registration_start,
    registrationEnd: competition.registration_end,
    competitionStart: competition.competition_start,
    competitionEnd: competition.competition_end,
    dbStatus: competition.status,
  });

  return (
    <Link to={`/competitions/${competition.id}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 hover:border-primary/25 hover:bg-card">
        <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-muted">
          {competition.cover_image_url ? (
            <img src={competition.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <Trophy className="h-14 w-14 text-primary/15 animate-pulse" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          
          {/* Top Info Bar */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <Badge className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border-0 shadow-xl backdrop-blur-md ${derived.color} ring-1 ring-white/10`}>
              <span className={`me-1.5 inline-block h-1.5 w-1.5 rounded-full ${derived.dot} animate-pulse`} />
              {isAr ? derived.labelAr : derived.label}
            </Badge>
            {derived.daysLeft && derived.daysLeft > 0 && derived.daysLeft <= 30 && (
              <Badge variant="secondary" className="gap-1.5 px-2 py-0.5 text-[9px] font-bold bg-background/80 backdrop-blur-md shadow-lg border-border/40 text-foreground">
                <Clock className="h-2.5 w-2.5 text-primary" />
                {isAr ? `${toEnglishDigits(derived.daysLeft)} يوم` : `${derived.daysLeft}D`}
              </Badge>
            )}
          </div>

          {/* Bottom Info Bar */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[10px] font-bold text-foreground drop-shadow-md">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-background/60 backdrop-blur-md shadow-sm">
                  <Calendar className="h-3 w-3 text-primary" />
                </div>
                {toEnglishDigits(format(new Date(competition.competition_start), "MMM d, yyyy"))}
              </span>
              {maxP && (
                <Badge variant="secondary" className="gap-1.5 px-2 py-0.5 text-[10px] font-bold bg-primary/10 backdrop-blur-md border-primary/20 text-primary shadow-sm">
                  <Users className="h-3 w-3" />
                  {toEnglishDigits(regCount)} <span className="opacity-50 text-[8px]">/</span> {toEnglishDigits(maxP)}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <CardContent className="flex flex-1 flex-col p-5">
          <h3 className="mb-4 flex-1 line-clamp-2 text-base font-black leading-tight group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          
          {maxP && maxP > 0 && (
            <div className="mb-5 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>{isAr ? "سعة المشاركة" : "Capacity"}</span>
                <span className={fillPct > 80 ? "text-destructive" : "text-primary"}>{toEnglishDigits(fillPct)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50 shadow-inner">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    fillPct > 80 ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground">
              {competition.is_virtual ? (
                <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-primary" />{isAr ? "افتراضية" : "Virtual"}</span>
              ) : competition.city ? (
                <span className="flex items-center gap-1.5 truncate max-w-[140px]">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                  {competition.country_code ? `${countryFlag(competition.country_code)} ` : ""}{competition.city}
                </span>
              ) : null}
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105">
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}