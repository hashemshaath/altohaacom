import { useState, useMemo, memo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Building2, Search, MapPin, Globe, CheckCircle2, Star, Landmark,
  ArrowUpRight, Mail, Phone, LayoutGrid, List, Calendar, Eye,
  SlidersHorizontal, TrendingUp, Award, X, Scale, Map,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Footer } from "@/components/Footer";
import { OrganizerLeaderboard } from "@/components/organizers/OrganizerLeaderboard";
import { OrganizerPreviewDrawer } from "@/components/organizers/OrganizerPreviewDrawer";
import { OrganizerCompareBar } from "@/components/organizers/OrganizerCompareBar";
import { OrganizerMapView } from "@/components/organizers/OrganizerMapView";

type SortKey = "featured" | "name" | "events" | "rating" | "newest";
type ViewMode = "grid" | "list" | "map";

export default function Organizers() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  const [showFilters, setShowFilters] = useState(false);

  const { data: organizers, isLoading } = useQuery({
    queryKey: ["public-organizers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizers")
        .select("id, name, name_ar, slug, logo_url, cover_image_url, description, description_ar, city, city_ar, country, country_ar, country_code, categories, services, services_ar, total_exhibitions, average_rating, is_featured, is_verified, website, email, phone, status, total_views, founded_year, created_at")
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .order("total_exhibitions", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const countries = useMemo(() =>
    [...new Set((organizers || []).map((o: any) => o.country).filter(Boolean))] as string[],
    [organizers]
  );

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    (organizers || []).forEach((o: any) => {
      (o.categories || []).forEach((c: string) => cats.add(c));
    });
    return [...cats].sort();
  }, [organizers]);

  const filtered = useMemo(() => {
    let list = (organizers || []).filter((o: any) => {
      const matchSearch = !search || o.name?.toLowerCase().includes(search.toLowerCase()) || o.name_ar?.includes(search) || o.city?.toLowerCase().includes(search.toLowerCase());
      const matchCountry = countryFilter === "all" || o.country === countryFilter;
      const matchCategory = categoryFilter === "all" || (o.categories || []).includes(categoryFilter);
      return matchSearch && matchCountry && matchCategory;
    });

    // Sort
    switch (sortBy) {
      case "name":
        list = [...list].sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "events":
        list = [...list].sort((a: any, b: any) => (b.total_exhibitions || 0) - (a.total_exhibitions || 0));
        break;
      case "rating":
        list = [...list].sort((a: any, b: any) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case "newest":
        list = [...list].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default: // featured first
        list = [...list].sort((a: any, b: any) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }
    return list;
  }, [organizers, search, countryFilter, categoryFilter, sortBy]);

  const featured = useMemo(() => filtered.filter((o: any) => o.is_featured), [filtered]);
  const regular = useMemo(() => filtered.filter((o: any) => !o.is_featured), [filtered]);

  const { totalEvents, totalOrgs, totalCountries, avgRating } = useMemo(() => {
    const orgs = organizers || [];
    const rated = orgs.filter((o: any) => o.average_rating > 0);
    return {
      totalEvents: orgs.reduce((s: number, o: any) => s + (o.total_exhibitions || 0), 0),
      totalOrgs: orgs.length,
      totalCountries: countries.length,
      avgRating: rated.length > 0 ? (rated.reduce((s: number, o: any) => s + o.average_rating, 0) / rated.length).toFixed(1) : "0",
    };
  }, [organizers, countries]);

  const hasActiveFilters = countryFilter !== "all" || categoryFilter !== "all" || search.length > 0;

  const clearFilters = () => {
    setSearch("");
    setCountryFilter("all");
    setCategoryFilter("all");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead
        title={isAr ? "منظمو الفعاليات والمعارض" : "Event & Exhibition Organizers"}
        description={isAr ? "تصفح منظمي الفعاليات والمعارض الرائدين في عالم الطهي" : "Browse leading event and exhibition organizers in the culinary world"}
        keywords={isAr ? "منظمو فعاليات, منظمو معارض, إدارة مسابقات, تنظيم طهوي" : "event organizers, exhibition organizers, competition management, culinary event planning"}
      />
      <Header />

      <main className="flex-1">
        {/* ─── Hero Section ─── */}
        <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/8 via-primary/4 to-transparent">
          {/* Decorative blobs */}
          <div className="absolute -top-20 -end-20 h-60 w-60 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-10 -start-10 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />

          <div className="container relative max-w-6xl py-12 md:py-16">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-5">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">
                  {isAr ? "دليل المنظمين" : "Organizer Directory"}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
                {isAr ? "منظمو الفعاليات" : "Event Organizers"}
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base leading-relaxed">
                {isAr
                  ? "تعرّف على أبرز منظمي المعارض والفعاليات والمسابقات في قطاع الطهي والضيافة"
                  : "Discover leading exhibition, event, and competition organizers in the culinary & hospitality industry"}
              </p>
            </div>

            {/* ─── Stats Cards ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mt-8">
              {[
                { icon: Building2, value: totalOrgs, label: isAr ? "منظم" : "Organizers", color: "text-primary" },
                { icon: Landmark, value: totalEvents, label: isAr ? "فعالية" : "Events", color: "text-emerald-600 dark:text-emerald-400" },
                { icon: Globe, value: totalCountries, label: isAr ? "دولة" : "Countries", color: "text-blue-600 dark:text-blue-400" },
                { icon: Star, value: parseFloat(avgRating as string), label: isAr ? "متوسط التقييم" : "Avg Rating", color: "text-amber-500", isDecimal: true },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center gap-1 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm px-4 py-4">
                  <s.icon className={`h-5 w-5 ${s.color} mb-1`} />
                  <p className="text-xl md:text-2xl font-bold">
                    {s.isDecimal ? s.value : <AnimatedCounter value={s.value} />}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Search & Toolbar ─── */}
        <section className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
          <div className="container max-w-6xl py-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isAr ? "ابحث عن منظم..." : "Search organizers..."}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="ps-10 h-10 rounded-xl"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Button
                variant={showFilters ? "secondary" : "outline"}
                size="sm"
                className="gap-1.5 rounded-xl h-10"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isAr ? "تصفية" : "Filters"}</span>
                {hasActiveFilters && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {(countryFilter !== "all" ? 1 : 0) + (categoryFilter !== "all" ? 1 : 0)}
                  </span>
                )}
              </Button>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
                <SelectTrigger className="w-36 h-10 rounded-xl hidden sm:flex">
                  <TrendingUp className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">{isAr ? "المميزون أولاً" : "Featured First"}</SelectItem>
                  <SelectItem value="name">{isAr ? "الاسم" : "Name"}</SelectItem>
                  <SelectItem value="events">{isAr ? "الأكثر فعاليات" : "Most Events"}</SelectItem>
                  <SelectItem value="rating">{isAr ? "الأعلى تقييماً" : "Top Rated"}</SelectItem>
                  <SelectItem value="newest">{isAr ? "الأحدث" : "Newest"}</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-0.5 ms-auto">
                <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" className="h-9 w-9 rounded-xl" onClick={() => setViewMode("grid")}>
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" className="h-9 w-9 rounded-xl" onClick={() => setViewMode("list")}>
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/40">
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-40 h-9 rounded-xl text-xs">
                    <MapPin className="h-3 w-3 me-1.5 text-muted-foreground" />
                    <SelectValue placeholder={isAr ? "الدولة" : "Country"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "جميع الدول" : "All Countries"}</SelectItem>
                    {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>

                {allCategories.length > 0 && (
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40 h-9 rounded-xl text-xs">
                      <Award className="h-3 w-3 me-1.5 text-muted-foreground" />
                      <SelectValue placeholder={isAr ? "التصنيف" : "Category"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isAr ? "جميع التصنيفات" : "All Categories"}</SelectItem>
                      {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="text-xs gap-1 text-destructive hover:text-destructive rounded-xl" onClick={clearFilters}>
                    <X className="h-3 w-3" />
                    {isAr ? "مسح الكل" : "Clear all"}
                  </Button>
                )}

                <p className="text-xs text-muted-foreground ms-auto">
                  {filtered.length} {isAr ? "نتيجة" : "results"}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ─── Content ─── */}
        <div className="container max-w-6xl py-8 space-y-8">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
            </div>
          ) : (
            <>
              {/* Featured */}
              {featured.length > 0 && sortBy === "featured" && (
                <section>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    {isAr ? "المنظمون المميزون" : "Featured Organizers"}
                  </h2>
                  {viewMode === "grid" ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {featured.map((org: any) => <OrganizerCard key={org.id} org={org} isAr={isAr} featured />)}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {featured.map((org: any) => <OrganizerListItem key={org.id} org={org} isAr={isAr} featured />)}
                    </div>
                  )}
                </section>
              )}

              {/* Regular / All when not sorting by featured */}
              {(() => {
                const items = sortBy === "featured" ? regular : filtered;
                if (items.length === 0 && featured.length === 0) {
                  return (
                    <div className="text-center py-20">
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/50 mb-4">
                        <Building2 className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                      <p className="text-muted-foreground font-medium">{isAr ? "لا توجد نتائج" : "No organizers found"}</p>
                      {hasActiveFilters && (
                        <Button variant="link" onClick={clearFilters} className="mt-2 text-sm">
                          {isAr ? "مسح جميع الفلاتر" : "Clear all filters"}
                        </Button>
                      )}
                    </div>
                  );
                }
                return viewMode === "grid" ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((org: any) => <OrganizerCard key={org.id} org={org} isAr={isAr} />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((org: any) => <OrganizerListItem key={org.id} org={org} isAr={isAr} />)}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ─── Grid Card ─── */
const OrganizerCard = memo(function OrganizerCard({ org, isAr, featured }: { org: any; isAr: boolean; featured?: boolean }) {
  const name = isAr && org.name_ar ? org.name_ar : org.name;
  const desc = isAr && org.description_ar ? org.description_ar : org.description;

  return (
    <Link to={`/organizers/${org.slug}`} className="group block">
      <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 border-border/40 hover:border-primary/30 h-full rounded-2xl active:scale-[0.98] ${featured ? "ring-1 ring-amber-500/20 border-amber-500/15" : ""}`}>
        {/* Cover */}
        <div className="h-32 overflow-hidden relative bg-gradient-to-br from-primary/10 to-primary/5">
          {org.cover_image_url ? (
            <img
              src={org.cover_image_url}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="h-10 w-10 text-primary/15" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          {featured && (
            <div className="absolute top-2.5 end-2.5">
              <Badge className="text-[9px] gap-1 bg-amber-500 text-white border-0 shadow-sm">
                <Star className="h-2.5 w-2.5 fill-current" />{isAr ? "مميز" : "Featured"}
              </Badge>
            </div>
          )}
          {org.is_verified && (
            <div className="absolute top-2.5 start-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-background/90 shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4 -mt-10 relative z-10">
          <div className="flex items-start gap-3">
            <Avatar className="h-16 w-16 rounded-2xl border-[3px] border-background shadow-lg shrink-0 ring-1 ring-border/20">
              {org.logo_url && <AvatarImage src={org.logo_url} />}
              <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-lg">{org.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pt-5">
              <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{name}</h3>
              {org.city && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{isAr && org.city_ar ? org.city_ar : org.city}{org.country ? `, ${isAr && org.country_ar ? org.country_ar : org.country}` : ""}</span>
                </p>
              )}
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-5 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>

          {desc && <p className="text-[11px] text-muted-foreground/80 mt-3 line-clamp-2 leading-relaxed">{desc}</p>}

          {/* Stats */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/30">
            {org.total_exhibitions > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Landmark className="h-3 w-3 text-emerald-500" />
                <span className="font-semibold text-foreground">{org.total_exhibitions}</span>
                {isAr ? "فعالية" : "events"}
              </div>
            )}
            {org.average_rating > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span className="font-semibold text-foreground">{org.average_rating.toFixed(1)}</span>
              </div>
            )}
            {(org.total_views || 0) > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Eye className="h-3 w-3" />
                <span className="font-semibold text-foreground">{(org.total_views || 0).toLocaleString()}</span>
              </div>
            )}
            {org.founded_year && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground ms-auto">
                <Calendar className="h-3 w-3" />
                {org.founded_year}
              </div>
            )}
          </div>

          {/* Categories */}
          {org.categories && org.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {org.categories.slice(0, 3).map((c: string) => (
                <Badge key={c} variant="secondary" className="text-[8px] rounded-full px-2 py-0 h-4 font-normal">{c}</Badge>
              ))}
              {org.categories.length > 3 && <Badge variant="outline" className="text-[8px] rounded-full px-2 py-0 h-4">+{org.categories.length - 3}</Badge>}
            </div>
          )}

          {/* Contact */}
          {(org.email || org.phone || org.website) && (
            <div className="flex gap-1.5 mt-3 pt-2.5 border-t border-border/20">
              {org.website && (
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Globe className="h-3 w-3" />
                </div>
              )}
              {org.email && (
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Mail className="h-3 w-3" />
                </div>
              )}
              {org.phone && (
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Phone className="h-3 w-3" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
});

/* ─── List Item ─── */
const OrganizerListItem = memo(function OrganizerListItem({ org, isAr, featured }: { org: any; isAr: boolean; featured?: boolean }) {
  const name = isAr && org.name_ar ? org.name_ar : org.name;
  const desc = isAr && org.description_ar ? org.description_ar : org.description;

  return (
    <Link to={`/organizers/${org.slug}`} className="group block">
      <Card className={`hover:shadow-md transition-all duration-300 border-border/40 hover:border-primary/30 rounded-2xl active:scale-[0.99] ${featured ? "ring-1 ring-amber-500/20 border-amber-500/15" : ""}`}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar className="h-14 w-14 rounded-2xl border-2 border-border/30 shadow-md">
              {org.logo_url && <AvatarImage src={org.logo_url} />}
              <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold">{org.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            {org.is_verified && (
              <div className="absolute -bottom-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border/30">
                <CheckCircle2 className="h-3 w-3 text-primary" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{name}</h3>
              {featured && (
                <Badge className="text-[8px] gap-0.5 bg-amber-500 text-white border-0 h-4">
                  <Star className="h-2 w-2 fill-current" />{isAr ? "مميز" : "Featured"}
                </Badge>
              )}
            </div>
            {org.city && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />{isAr && org.city_ar ? org.city_ar : org.city}{org.country ? `, ${isAr && org.country_ar ? org.country_ar : org.country}` : ""}
              </p>
            )}
            {desc && <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-1">{desc}</p>}

            {/* Tags in list view */}
            {org.categories && org.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {org.categories.slice(0, 2).map((c: string) => (
                  <Badge key={c} variant="secondary" className="text-[8px] rounded-full px-2 py-0 h-4 font-normal">{c}</Badge>
                ))}
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-5 shrink-0">
            {org.total_exhibitions > 0 && (
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{org.total_exhibitions}</p>
                <p className="text-[9px] text-muted-foreground">{isAr ? "فعالية" : "Events"}</p>
              </div>
            )}
            {org.average_rating > 0 && (
              <div className="text-center">
                <p className="text-sm font-bold flex items-center justify-center gap-0.5"><Star className="h-3 w-3 text-amber-500 fill-amber-500" />{org.average_rating.toFixed(1)}</p>
                <p className="text-[9px] text-muted-foreground">{isAr ? "التقييم" : "Rating"}</p>
              </div>
            )}
            {(org.total_views || 0) > 0 && (
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{(org.total_views || 0).toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">{isAr ? "مشاهدة" : "Views"}</p>
              </div>
            )}
          </div>

          <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 shrink-0 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </CardContent>
      </Card>
    </Link>
  );
});
