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
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import {
  Search, MapPin, Calendar, Trophy, Filter, Star, TrendingUp,
  ArrowUpRight, Globe, Users, ChevronDown,
} from "lucide-react";
import { format } from "date-fns";

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
        .select("id, title, title_ar, status, competition_start, competition_end, city, country, country_code, cover_image_url, registration_end, max_participants")
        .not("status", "eq", "draft")
        .order("competition_start", { ascending: true });
      return data || [];
    },
    staleTime: 1000 * 60 * 3,
  });

  // Get unique countries
  const countries = useMemo(() => {
    const set = new Set<string>();
    competitions.forEach(c => { if (c.country) set.add(c.country); });
    return Array.from(set).sort();
  }, [competitions]);

  // Filter and sort
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
      result = result.filter(c => c.status === statusFilter);
    }

    if (countryFilter !== "all") {
      result = result.filter(c => c.country === countryFilter);
    }

    // Sort
    if (sortBy === "date") {
      result = [...result].sort((a, b) => new Date(a.competition_start || "").getTime() - new Date(b.competition_start || "").getTime());
    } else if (sortBy === "name") {
      result = [...result].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    return result;
  }, [competitions, search, statusFilter, countryFilter, sortBy]);

  // Featured (upcoming with closest dates)
  const featured = useMemo(() => {
    const now = new Date();
    return competitions
      .filter(c => c.competition_start && new Date(c.competition_start) > now && c.status !== "draft")
      .sort((a, b) => new Date(a.competition_start!).getTime() - new Date(b.competition_start!).getTime())
      .slice(0, 3);
  }, [competitions]);

  const getStatusLabel = (status: string) => {
    const map: Record<string, [string, string]> = {
      upcoming: ["Upcoming", "قادمة"],
      registration_open: ["Registration Open", "التسجيل مفتوح"],
      registration_closed: ["Registration Closed", "التسجيل مغلق"],
      in_progress: ["In Progress", "جارية"],
      completed: ["Completed", "مكتملة"],
    };
    return (map[status] || [status, status])[isAr ? 1 : 0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "registration_open": return "bg-chart-3/10 text-chart-3 border-chart-3/30";
      case "in_progress": return "bg-primary/10 text-primary border-primary/30";
      case "completed": return "bg-muted text-muted-foreground";
      default: return "bg-chart-4/10 text-chart-4 border-chart-4/30";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold sm:text-3xl">
              {isAr ? "اكتشف المسابقات" : "Discover Competitions"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              {isAr ? "ابحث عن المسابقات القادمة وسجل الآن" : "Find upcoming culinary competitions and register today"}
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-6 mx-auto max-w-2xl">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="ps-10 h-11"
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
            <h2 className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Star className="h-4 w-4 text-chart-3" />
              {isAr ? "المسابقات المميزة" : "Featured Competitions"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {featured.map(comp => (
                <Link key={comp.id} to={`/competitions/${comp.id}`}>
                  <Card className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 h-full">
                    {comp.cover_image_url && (
                      <div className="h-32 bg-muted overflow-hidden">
                        <img src={comp.cover_image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className={comp.cover_image_url ? "pt-3 pb-3" : "pt-4 pb-3"}>
                      <Badge variant="outline" className={`text-[10px] mb-2 ${getStatusColor(comp.status || "")}`}>
                        {getStatusLabel(comp.status || "")}
                      </Badge>
                      <h3 className="text-sm font-semibold truncate">
                        {isAr && comp.title_ar ? comp.title_ar : comp.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        {comp.competition_start && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(comp.competition_start), "MMM d, yyyy")}
                          </span>
                        )}
                        {comp.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {comp.city}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <Filter className="me-1.5 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "جميع الحالات" : "All Status"}</SelectItem>
              <SelectItem value="registration_open">{isAr ? "التسجيل مفتوح" : "Registration Open"}</SelectItem>
              <SelectItem value="upcoming">{isAr ? "قادمة" : "Upcoming"}</SelectItem>
              <SelectItem value="in_progress">{isAr ? "جارية" : "In Progress"}</SelectItem>
              <SelectItem value="completed">{isAr ? "مكتملة" : "Completed"}</SelectItem>
            </SelectContent>
          </Select>

          {countries.length > 0 && (
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <Globe className="me-1.5 h-3 w-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع الدول" : "All Countries"}</SelectItem>
                {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <TrendingUp className="me-1.5 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">{isAr ? "حسب التاريخ" : "By Date"}</SelectItem>
              <SelectItem value="name">{isAr ? "حسب الاسم" : "By Name"}</SelectItem>
            </SelectContent>
          </Select>

          <Badge variant="outline" className="h-9 px-3 flex items-center text-xs">
            {filtered.length} {isAr ? "مسابقة" : "competitions"}
          </Badge>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground">{isAr ? "لم يتم العثور على مسابقات" : "No competitions found"}</p>
            <p className="text-xs text-muted-foreground mt-1">{isAr ? "جرب تغيير الفلاتر" : "Try adjusting your filters"}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(comp => (
              <Link key={comp.id} to={`/competitions/${comp.id}`}>
                <Card className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 h-full group">
                  {comp.cover_image_url ? (
                    <div className="h-36 bg-muted overflow-hidden relative">
                      <img src={comp.cover_image_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <Badge variant="outline" className={`absolute bottom-2 start-2 text-[10px] ${getStatusColor(comp.status || "")}`}>
                        {getStatusLabel(comp.status || "")}
                      </Badge>
                    </div>
                  ) : (
                    <div className="h-20 bg-gradient-to-br from-primary/10 to-chart-3/10 flex items-center justify-center relative">
                      <Trophy className="h-8 w-8 text-primary/30" />
                      <Badge variant="outline" className={`absolute bottom-2 start-2 text-[10px] ${getStatusColor(comp.status || "")}`}>
                        {getStatusLabel(comp.status || "")}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="pt-3 pb-4">
                    <h3 className="text-sm font-semibold line-clamp-2">
                      {isAr && comp.title_ar ? comp.title_ar : comp.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      {comp.competition_start && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(comp.competition_start), "MMM d, yyyy")}
                        </span>
                      )}
                      {comp.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {comp.city}{comp.country ? `, ${comp.country}` : ""}
                        </span>
                      )}
                    </div>
                    {comp.registration_end && new Date(comp.registration_end) > new Date() && (
                      <p className="mt-2 text-[10px] text-chart-4 font-medium">
                        {isAr ? "آخر موعد للتسجيل:" : "Deadline:"} {format(new Date(comp.registration_end), "MMM d")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
