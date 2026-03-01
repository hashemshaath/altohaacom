import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Search, Trophy, Filter, Star, TrendingUp, Globe,
} from "lucide-react";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { countryFlag } from "@/lib/countryFlag";
import {
  CompetitionCard,
  FeaturedCompetitionCard,
  getDerivedStatus,
  type CompetitionWithRegs,
} from "@/components/competitions/CompetitionCard";

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
        .select("*, competition_registrations(id)")
        .not("status", "eq", "draft")
        .order("competition_start", { ascending: true });
      return (data || []) as CompetitionWithRegs[];
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
        const d = getDerivedStatus(c);
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

    if (sortBy === "name") {
      result = [...result].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "popularity") {
      result = [...result].sort((a, b) => (b.competition_registrations?.length || 0) - (a.competition_registrations?.length || 0));
    }

    return result;
  }, [competitions, search, statusFilter, countryFilter, sortBy]);

  const featured = useMemo(() => {
    return competitions
      .filter(c => {
        const d = getDerivedStatus(c);
        return ["registration_open", "registration_closing_soon", "registration_upcoming", "competition_starting_soon"].includes(d.status);
      })
      .slice(0, 1)[0];
  }, [competitions]);

  const hasActiveFilters = search || statusFilter !== "all" || countryFilter !== "all";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border/30 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-3.5 py-1.5 ring-1 ring-primary/15 mx-auto">
              <Trophy className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {isAr ? "استكشاف" : "Discover"}
              </span>
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl font-serif tracking-tight">
              {isAr ? "اكتشف المسابقات" : "Discover Competitions"}
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {isAr ? "ابحث عن المسابقات القادمة وسجل الآن" : "Find upcoming culinary competitions and register today"}
            </p>
          </div>

          <div className="mt-6 mx-auto max-w-2xl">
            <div className="relative">
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                className="ps-10 h-11 rounded-xl border-border/30 bg-muted/15 focus:bg-background"
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
        {!search && statusFilter === "all" && featured && (
          <div className="mb-8">
            <h2 className="flex items-center gap-2 text-sm font-bold mb-3">
              <Star className="h-4 w-4 text-primary" />
              {isAr ? "المسابقة المميزة" : "Featured Competition"}
            </h2>
            <FeaturedCompetitionCard competition={featured} language={language} isAr={isAr} />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2.5 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 text-xs rounded-xl border-border/30 bg-muted/15">
              <Filter className="me-1.5 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/30">
              <SelectItem value="all">{isAr ? "جميع الحالات" : "All Status"}</SelectItem>
              <SelectItem value="registration_open">{isAr ? "التسجيل مفتوح" : "Registration Open"}</SelectItem>
              <SelectItem value="upcoming">{isAr ? "قادمة" : "Upcoming"}</SelectItem>
              <SelectItem value="in_progress">{isAr ? "جارية" : "In Progress"}</SelectItem>
              <SelectItem value="completed">{isAr ? "مكتملة" : "Completed"}</SelectItem>
            </SelectContent>
          </Select>

          {countries.length > 0 && (
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[160px] h-9 text-xs rounded-xl border-border/30 bg-muted/15">
                <Globe className="me-1.5 h-3 w-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/30">
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
            <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl border-border/30 bg-muted/15">
              <TrendingUp className="me-1.5 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/30">
              <SelectItem value="date">{isAr ? "حسب التاريخ" : "By Date"}</SelectItem>
              <SelectItem value="name">{isAr ? "حسب الاسم" : "By Name"}</SelectItem>
              <SelectItem value="popularity">{isAr ? "الأكثر تسجيلاً" : "Most Popular"}</SelectItem>
            </SelectContent>
          </Select>

          <Badge variant="outline" className="h-9 px-3 flex items-center text-xs border-border/30 rounded-xl tabular-nums">
            <AnimatedCounter value={filtered.length} className="inline" /> {isAr ? "مسابقة" : "competitions"}
          </Badge>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
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
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            {filtered.map(comp => (
              <CompetitionCard key={comp.id} competition={comp} language={language} isAr={isAr} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
