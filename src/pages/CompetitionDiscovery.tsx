import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "react-router-dom";
import {
  Search, MapPin, Calendar, Trophy, Filter, Star, TrendingUp,
  ArrowRight, Globe, Users, Clock, Flame,
} from "lucide-react";
import { format } from "date-fns";
import { deriveCompetitionStatus } from "@/lib/competitionStatus";
import { toEnglishDigits } from "@/lib/formatNumber";
import { countryFlag } from "@/lib/countryFlag";

interface DiscoveryCompetition {
  id: string;
  title: string;
  title_ar: string | null;
  status: string | null;
  competition_start: string | null;
  competition_end: string | null;
  registration_start: string | null;
  registration_end: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  cover_image_url: string | null;
  max_participants: number | null;
  competition_registrations?: { id: string }[];
}

function getDerived(c: DiscoveryCompetition) {
  return deriveCompetitionStatus({
    registrationStart: c.registration_start,
    registrationEnd: c.registration_end,
    competitionStart: c.competition_start,
    competitionEnd: c.competition_end,
    dbStatus: c.status || undefined,
  });
}

/* ─── Discovery Card ─── */
function DiscoveryCard({ comp, isAr }: { comp: DiscoveryCompetition; isAr: boolean }) {
  const derived = getDerived(comp);
  const regCount = comp.competition_registrations?.length || 0;

  return (
    <Link to={`/competitions/${comp.id}`} className="group block h-full">
      <Card className="overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col border-border/40 bg-card/60 backdrop-blur-sm hover:border-primary/25">
        {comp.cover_image_url ? (
          <div className="h-36 bg-muted overflow-hidden relative">
            <img src={comp.cover_image_url} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
            <Badge className={`absolute top-2.5 start-2.5 text-[9px] font-black uppercase tracking-wider border-0 shadow-lg backdrop-blur-md ring-1 ring-white/10 ${derived.color}`}>
              <span className={`me-1.5 inline-block h-1.5 w-1.5 rounded-full ${derived.dot}`} />
              {isAr ? derived.labelAr : derived.label}
            </Badge>
            {derived.daysLeft && derived.daysLeft > 0 && derived.daysLeft <= 30 && (
              <Badge variant="secondary" className="absolute top-2.5 end-2.5 gap-1 px-2 py-0.5 text-[9px] font-bold bg-background/80 backdrop-blur-md shadow-lg border-border/40 text-foreground">
                <Clock className="h-2.5 w-2.5 text-primary" />
                {isAr ? `${toEnglishDigits(derived.daysLeft)} يوم` : `${derived.daysLeft}D`}
              </Badge>
            )}
            <div className="absolute inset-x-0 bottom-0 p-2.5 flex items-center justify-between">
              {comp.competition_start && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-foreground drop-shadow-md">
                  <Calendar className="h-3 w-3 text-primary" />
                  {toEnglishDigits(format(new Date(comp.competition_start), "MMM d, yyyy"))}
                </span>
              )}
              {comp.max_participants && (
                <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[9px] font-bold bg-primary/10 backdrop-blur-md border-primary/20 text-primary shadow-sm">
                  <Users className="h-2.5 w-2.5" />
                  {toEnglishDigits(regCount)} / {toEnglishDigits(comp.max_participants)}
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative">
            <Trophy className="h-10 w-10 text-primary/15" />
            <Badge className={`absolute top-2.5 start-2.5 text-[9px] font-black uppercase tracking-wider border-0 shadow-lg backdrop-blur-md ring-1 ring-white/10 ${derived.color}`}>
              <span className={`me-1.5 inline-block h-1.5 w-1.5 rounded-full ${derived.dot}`} />
              {isAr ? derived.labelAr : derived.label}
            </Badge>
          </div>
        )}
        <CardContent className="pt-3 pb-4 flex-1 flex flex-col">
          <h3 className="text-sm font-bold line-clamp-2 group-hover:text-primary transition-colors flex-1">
            {isAr && comp.title_ar ? comp.title_ar : comp.title}
          </h3>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium min-w-0">
              {comp.city && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
                  <span className="truncate">{comp.country_code ? `${countryFlag(comp.country_code)} ` : ""}{comp.city}</span>
                </span>
              )}
            </div>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
              <ArrowRight className="h-3 w-3 rtl:rotate-180" />
            </div>
          </div>
          {derived.urgent && comp.registration_end && new Date(comp.registration_end) > new Date() && (
            <p className="mt-1.5 text-[10px] font-bold text-destructive flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {isAr ? "التسجيل يغلق قريباً!" : "Registration closing soon!"}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

/* ─── Featured Card ─── */
function FeaturedDiscoveryCard({ comp, isAr }: { comp: DiscoveryCompetition; isAr: boolean }) {
  const derived = getDerived(comp);

  return (
    <Link to={`/competitions/${comp.id}`} className="group block">
      <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 h-full border-primary/15 bg-card/60 backdrop-blur-sm">
        {comp.cover_image_url && (
          <div className="h-32 bg-muted overflow-hidden relative">
            <img src={comp.cover_image_url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
          </div>
        )}
        <CardContent className={comp.cover_image_url ? "pt-3 pb-3" : "pt-4 pb-3"}>
          <Badge className={`text-[9px] mb-2 font-black uppercase tracking-wider border-0 ${derived.color}`}>
            <span className={`me-1 inline-block h-1.5 w-1.5 rounded-full ${derived.dot}`} />
            {isAr ? derived.labelAr : derived.label}
          </Badge>
          <h3 className="text-sm font-bold truncate group-hover:text-primary transition-colors">
            {isAr && comp.title_ar ? comp.title_ar : comp.title}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
            {comp.competition_start && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary/50" />
                {toEnglishDigits(format(new Date(comp.competition_start), "MMM d, yyyy"))}
              </span>
            )}
            {comp.city && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 text-primary/50" />
                {comp.city}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function CompetitionDiscovery() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const { data: competitions = [], isLoading } = useQuery({
    queryKey: ["discovery-competitions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, title, title_ar, status, competition_start, competition_end, registration_start, registration_end, city, country, country_code, cover_image_url, max_participants, competition_registrations(id)")
        .not("status", "eq", "draft")
        .order("competition_start", { ascending: true });
      return (data || []) as DiscoveryCompetition[];
    },
    staleTime: 1000 * 60 * 3,
  });

  const countries = useMemo(() => {
    const set = new Set<string>();
    competitions.forEach(c => { if (c.country_code) set.add(c.country_code); });
    return Array.from(set).sort();
  }, [competitions]);

  const filtered = useMemo(() => {
    let result = competitions;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.title_ar?.includes(search) ||
        c.city?.toLowerCase().includes(q) ||
        c.country?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(c => {
        const d = getDerived(c);
        if (statusFilter === "registration_open") return ["registration_open", "registration_closing_soon"].includes(d.status);
        if (statusFilter === "upcoming") return ["registration_upcoming"].includes(d.status);
        if (statusFilter === "in_progress") return d.status === "in_progress";
        if (statusFilter === "completed") return d.status === "ended";
        return true;
      });
    }

    if (countryFilter !== "all") {
      result = result.filter(c => c.country_code === countryFilter);
    }

    if (sortBy === "date") {
      result = [...result].sort((a, b) => new Date(a.competition_start || "").getTime() - new Date(b.competition_start || "").getTime());
    } else if (sortBy === "name") {
      result = [...result].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    return result;
  }, [competitions, search, statusFilter, countryFilter, sortBy]);

  const featured = useMemo(() => {
    const now = new Date();
    return competitions
      .filter(c => {
        const d = getDerived(c);
        return ["registration_open", "registration_closing_soon", "registration_upcoming", "competition_starting_soon"].includes(d.status);
      })
      .sort((a, b) => new Date(a.competition_start || "").getTime() - new Date(b.competition_start || "").getTime())
      .slice(0, 3);
  }, [competitions]);

  const hasActiveFilters = search || statusFilter !== "all" || countryFilter !== "all";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold sm:text-3xl">
              {isAr ? "اكتشف المسابقات" : "Discover Competitions"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              {isAr ? "ابحث عن المسابقات القادمة وسجل الآن" : "Find upcoming culinary competitions and register today"}
            </p>
          </div>

          <div className="mt-6 mx-auto max-w-2xl">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="ps-10 h-11 rounded-xl border-border/40 bg-muted/20 focus:bg-background"
                placeholder={isAr ? "ابحث عن مسابقة، مدينة، أو دولة..." : "Search competitions, cities, or countries..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Featured */}
        {!search && statusFilter === "all" && featured.length > 0 && (
          <div className="mb-8">
            <h2 className="flex items-center gap-2 text-sm font-bold mb-3">
              <Star className="h-4 w-4 text-primary" />
              {isAr ? "المسابقات المميزة" : "Featured Competitions"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {featured.map(comp => (
                <FeaturedDiscoveryCard key={comp.id} comp={comp} isAr={isAr} />
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 text-xs rounded-xl border-border/40">
              <Filter className="me-1.5 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">{isAr ? "جميع الحالات" : "All Status"}</SelectItem>
              <SelectItem value="registration_open">{isAr ? "التسجيل مفتوح" : "Registration Open"}</SelectItem>
              <SelectItem value="upcoming">{isAr ? "قادمة" : "Upcoming"}</SelectItem>
              <SelectItem value="in_progress">{isAr ? "جارية" : "In Progress"}</SelectItem>
              <SelectItem value="completed">{isAr ? "مكتملة" : "Completed"}</SelectItem>
            </SelectContent>
          </Select>

          {countries.length > 0 && (
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[160px] h-9 text-xs rounded-xl border-border/40">
                <Globe className="me-1.5 h-3 w-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">{isAr ? "جميع الدول" : "All Countries"}</SelectItem>
                {countries.map(code => (
                  <SelectItem key={code} value={code}>
                    {countryFlag(code)} {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl border-border/40">
              <TrendingUp className="me-1.5 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="date">{isAr ? "حسب التاريخ" : "By Date"}</SelectItem>
              <SelectItem value="name">{isAr ? "حسب الاسم" : "By Name"}</SelectItem>
            </SelectContent>
          </Select>

          <Badge variant="outline" className="h-9 px-3 flex items-center text-xs border-border/40">
            {toEnglishDigits(filtered.length)} {isAr ? "مسابقة" : "competitions"}
          </Badge>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title={isAr ? "لم يتم العثور على مسابقات" : "No competitions found"}
            description={isAr ? "جرب تغيير الفلاتر" : "Try adjusting your filters"}
            action={hasActiveFilters ? (
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { setSearch(""); setStatusFilter("all"); setCountryFilter("all"); }}>
                {isAr ? "مسح الفلاتر" : "Clear filters"}
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(comp => (
              <DiscoveryCard key={comp.id} comp={comp} isAr={isAr} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
