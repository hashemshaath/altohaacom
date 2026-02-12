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
        title="Culinary Competitions"
        description="Browse and join culinary competitions worldwide. Showcase your cooking skills and compete with the best chefs."
      />
      <Header />

      <main className="flex-1">
        {/* Top Banner Ad */}
        <div className="container mt-4">
          <AdBanner placementSlug="competitions-top-banner" className="w-full aspect-[5/1]" />
        </div>
        {/* Hero Banner */}
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="absolute -top-32 start-1/4 h-64 w-64 rounded-full bg-primary/8 blur-[100px] animate-pulse pointer-events-none" />
          <div className="absolute -top-20 end-1/3 h-48 w-48 rounded-full bg-accent/10 blur-[80px] animate-pulse [animation-delay:1s] pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="container relative py-10 md:py-14">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15 shadow-sm">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="outline" className="gap-1.5 border-primary/20 text-primary">
                    <Sparkles className="h-3 w-3" />
                    {counts.all} {isAr ? "مسابقة" : "Competitions"}
                  </Badge>
                </div>
                <h1 className="font-serif text-2xl font-bold md:text-3xl lg:text-4xl">
                  {isAr ? "مسابقات الطهي" : "Culinary Competitions"}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed sm:text-base">
                  {isAr
                    ? "اكتشف مسابقات الطهي واشترك فيها. أظهر مهاراتك وتنافس مع أفضل الطهاة."
                    : "Discover world-class culinary competitions. Showcase your skills, compete with top chefs, and earn recognition."}
                </p>
              </div>
              {canCreate && (
                <Button asChild size="lg" className="w-full md:w-auto shadow-lg shadow-primary/20">
                  <Link to="/competitions/create">
                    <Plus className="me-2 h-4 w-4" />
                    {t("createCompetition")}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        <div className="container py-8">
          {/* Featured Competition */}
          {featured && !search && activeTab === "all" && (
            <FeaturedCard competition={featured as any} language={language} isAr={isAr} />
          )}

          {/* Search & Filter Bar */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={isAr ? "ابحث عن مسابقة..." : "Search competitions..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-10"
              />
            </div>
            {countryCodes.length > 1 && (
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="me-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder={isAr ? "الدولة" : "Country"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "جميع الدول" : "All Countries"}</SelectItem>
                  {countryCodes.map((code) => (
                    <SelectItem key={code} value={code}>
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
          <div className="mb-8 flex flex-wrap gap-2">
            {TAB_FILTERS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "border-border bg-card hover:border-primary/30 hover:bg-primary/5 text-foreground"
                }`}
              >
                {isAr ? tabLabels[tab].ar : tabLabels[tab].en}
                <span className={`ms-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                  activeTab === tab
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {counts[tab]}
                </span>
              </button>
            ))}
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
    <Link to={`/competitions/${competition.id}`} className="group mb-8 block">
      <Card className="relative overflow-hidden border-primary/15 transition-all hover:shadow-xl hover:shadow-primary/5">
        <div className="pointer-events-none absolute -top-16 -end-16 h-40 w-40 rounded-full bg-primary/5 blur-[50px]" />
        <div className="relative flex flex-col md:flex-row">
          <div className="relative aspect-[16/9] w-full overflow-hidden md:aspect-auto md:w-2/5 lg:w-1/3">
            {competition.cover_image_url ? (
              <img src={competition.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                <Trophy className="h-16 w-16 text-primary/20" />
              </div>
            )}
            <div className="absolute start-4 top-4">
              <Badge className="gap-1.5 bg-primary text-primary-foreground shadow-lg">
                <Flame className="h-3 w-3" />
                {isAr ? "مميزة" : "Featured"}
              </Badge>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-between p-5 md:p-7">
            <div>
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                <Badge className={derived.color}>
                  <span className={`me-1.5 inline-block h-1.5 w-1.5 rounded-full ${derived.dot}`} />
                  {isAr ? derived.labelAr : derived.label}
                </Badge>
                {derived.daysLeft && derived.daysLeft > 0 && derived.daysLeft <= 60 && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    {isAr ? `${derived.daysLeft} يوم` : `${derived.daysLeft} days left`}
                  </Badge>
                )}
              </div>
              <h2 className="mb-2 font-serif text-xl font-bold md:text-2xl group-hover:text-primary transition-colors">{title}</h2>
              {desc && <p className="mb-4 line-clamp-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(competition.competition_start), "MMM d, yyyy")}
              </span>
              {competition.is_virtual ? (
                <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />{isAr ? "عبر الإنترنت" : "Virtual"}</span>
              ) : competition.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {competition.country_code ? `${countryFlag(competition.country_code)} ` : ""}{competition.city}{competition.country ? `, ${competition.country}` : ""}
                </span>
              )}
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{regCount} {isAr ? "مشارك" : "registered"}</span>
              <span className="ms-auto flex items-center gap-1 text-primary font-medium text-xs group-hover:gap-2 transition-all">
                {isAr ? "عرض التفاصيل" : "View Details"}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
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
    <Link to={`/competitions/${competition.id}`} className="group block">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 hover:border-primary/20">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {competition.cover_image_url ? (
            <img src={competition.cover_image_url} alt={title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
              <Trophy className="h-12 w-12 text-primary/15" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          <div className="absolute start-3 top-3 flex flex-wrap gap-1.5">
            <Badge className={`text-[10px] font-semibold border-0 shadow-sm backdrop-blur-sm ${derived.color}`}>
              <span className={`me-1 inline-block h-1.5 w-1.5 rounded-full ${derived.dot}`} />
              {isAr ? derived.labelAr : derived.label}
            </Badge>
          </div>
          {derived.daysLeft && derived.daysLeft > 0 && derived.daysLeft <= 30 && (
            <div className="absolute end-3 top-3">
              <Badge variant="secondary" className="gap-1 text-[10px] bg-background/80 backdrop-blur-sm shadow-sm font-semibold">
                <Clock className="h-2.5 w-2.5" />
                {isAr ? `${derived.daysLeft} يوم` : `${derived.daysLeft}d`}
              </Badge>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] text-foreground/80 font-medium">
                <Calendar className="h-3 w-3" />
                {format(new Date(competition.competition_start), "MMM d, yyyy")}
              </span>
              {maxP && (
                <Badge variant="secondary" className="gap-1 text-[10px] bg-background/80 backdrop-blur-sm">
                  <Users className="h-2.5 w-2.5" />
                  {regCount}/{maxP}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <CardContent className="p-4 space-y-3">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug group-hover:text-primary transition-colors">{title}</h3>
          {maxP && maxP > 0 && (
            <div className="space-y-1">
              <Progress value={fillPct} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground">{fillPct}% {isAr ? "ممتلئ" : "filled"}</p>
            </div>
          )}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            {competition.is_virtual ? (
              <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{isAr ? "افتراضية" : "Virtual"}</span>
            ) : competition.city ? (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                {competition.country_code ? `${countryFlag(competition.country_code)} ` : ""}{competition.city}{competition.country ? `, ${competition.country}` : ""}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}