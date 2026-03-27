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
import { OrganizerSearchAutocomplete } from "@/components/organizers/OrganizerSearchAutocomplete";
import { OrganizerReviewsCarousel } from "@/components/organizers/OrganizerReviewsCarousel";
import { useOrganizerFollows } from "@/hooks/useOrganizerFollow";
import { Heart } from "lucide-react";

type SortKey = "featured" | "name" | "events" | "rating" | "newest";
type ViewMode = "grid" | "list" | "map";

/** Convert ISO country code (e.g. "SA") to flag emoji */
const countryFlag = (code?: string | null) => {
  if (!code || code.length !== 2) return null;
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1f1e6 - 65 + c.charCodeAt(0)));
};

export default function Organizers() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [previewOrg, setPreviewOrg] = useState<any | null>(null);
  const [compareList, setCompareList] = useState<any[]>([]);
  const { followedIds, toggleFollow } = useOrganizerFollows();

  const toggleCompare = useCallback((org: any) => {
    setCompareList(prev => {
      const exists = prev.some(o => o.id === org.id);
      if (exists) return prev.filter(o => o.id !== org.id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, org];
    });
  }, []);

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

          <div className="container relative max-w-6xl py-14 md:py-20">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">
                  {isAr ? "دليل المنظمين" : "Organizer Directory"}
                </span>
              </div>

              {/* Bilingual Title - Arabic prominent, English below */}
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight font-['Noto_Sans_Arabic',sans-serif]" dir="rtl">
                  منظمو الفعاليات والمعارض
                </h1>
                {!isAr && (
                  <p className="text-lg md:text-xl font-semibold text-muted-foreground/70 tracking-wide">
                    Event & Exhibition Organizers
                  </p>
                )}
              </div>

              <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                {isAr
                  ? "تعرّف على أبرز منظمي المعارض والفعاليات والمسابقات في قطاع الطهي والضيافة حول العالم"
                  : "Discover leading exhibition, event, and competition organizers in the culinary & hospitality industry worldwide"}
              </p>
            </div>

            {/* ─── Stats Cards ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mt-10">
              {[
                { icon: Building2, value: totalOrgs, label: isAr ? "منظم" : "Organizers", labelEn: "Organizers", color: "text-primary" },
                { icon: Landmark, value: totalEvents, label: isAr ? "فعالية" : "Events", labelEn: "Events", color: "text-emerald-600 dark:text-emerald-400" },
                { icon: Globe, value: totalCountries, label: isAr ? "دولة" : "Countries", labelEn: "Countries", color: "text-blue-600 dark:text-blue-400" },
                { icon: Star, value: parseFloat(avgRating as string), label: isAr ? "متوسط التقييم" : "Avg Rating", labelEn: "Avg Rating", color: "text-amber-500", isDecimal: true },
              ].map(s => (
                <div key={s.labelEn} className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm px-4 py-5 hover:border-primary/20 transition-colors">
                  <s.icon className={`h-5 w-5 ${s.color} mb-0.5`} />
                  <p className="text-2xl md:text-3xl font-bold tabular-nums">
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
              <OrganizerSearchAutocomplete
                organizers={organizers || []}
                search={search}
                onSearchChange={setSearch}
                isAr={isAr}
                onPreview={setPreviewOrg}
              />

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
                <Button variant={viewMode === "map" ? "default" : "ghost"} size="icon" className="h-9 w-9 rounded-xl" onClick={() => setViewMode("map")}>
                  <Map className="h-3.5 w-3.5" />
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
              {/* Leaderboard - show when no active filters */}
              {!hasActiveFilters && viewMode !== "map" && (organizers || []).length >= 3 && (
                <OrganizerLeaderboard
                  organizers={organizers || []}
                  isAr={isAr}
                  onPreview={setPreviewOrg}
                />
              )}

              {/* Reviews Carousel */}
              {!hasActiveFilters && viewMode !== "map" && (
                <OrganizerReviewsCarousel isAr={isAr} />
              )}

              {/* Map View */}
              {viewMode === "map" ? (
                <OrganizerMapView
                  organizers={filtered}
                  isAr={isAr}
                  onPreview={setPreviewOrg}
                />
              ) : (
                <>
                  {/* Featured */}
                  {featured.length > 0 && sortBy === "featured" && (
                     <section>
                      <div className="mb-5">
                        <h2 className="text-lg font-bold flex items-center gap-2" dir={isAr ? "rtl" : "ltr"}>
                          <Star className="h-5 w-5 text-amber-500" />
                          {isAr ? "المنظمون المميزون" : "Featured Organizers"}
                        </h2>
                        {!isAr && (
                          <p className="text-xs text-muted-foreground/60 mt-0.5 ms-7 font-medium" dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>المنظمون المميزون</p>
                        )}
                      </div>
                      {viewMode === "grid" ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {featured.map((org: any) => <OrganizerCard key={org.id} org={org} isAr={isAr} featured onPreview={setPreviewOrg} onCompare={toggleCompare} compareIds={compareList.map(c => c.id)} isFollowed={followedIds.includes(org.id)} onToggleFollow={id => toggleFollow(id, isAr)} />)}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {featured.map((org: any) => <OrganizerListItem key={org.id} org={org} isAr={isAr} featured onPreview={setPreviewOrg} onCompare={toggleCompare} compareIds={compareList.map(c => c.id)} isFollowed={followedIds.includes(org.id)} onToggleFollow={id => toggleFollow(id, isAr)} />)}
                        </div>
                      )}
                    </section>
                  )}

                  {/* Regular / All */}
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
                        {items.map((org: any) => <OrganizerCard key={org.id} org={org} isAr={isAr} onPreview={setPreviewOrg} onCompare={toggleCompare} compareIds={compareList.map(c => c.id)} isFollowed={followedIds.includes(org.id)} onToggleFollow={id => toggleFollow(id, isAr)} />)}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {items.map((org: any) => <OrganizerListItem key={org.id} org={org} isAr={isAr} onPreview={setPreviewOrg} onCompare={toggleCompare} compareIds={compareList.map(c => c.id)} isFollowed={followedIds.includes(org.id)} onToggleFollow={id => toggleFollow(id, isAr)} />)}
                      </div>
                    );
                  })()}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Preview Drawer */}
      <OrganizerPreviewDrawer
        org={previewOrg}
        open={!!previewOrg}
        onOpenChange={open => !open && setPreviewOrg(null)}
        isAr={isAr}
        onCompare={toggleCompare}
        isInCompare={previewOrg ? compareList.some(c => c.id === previewOrg.id) : false}
      />

      {/* Compare Bar */}
      <OrganizerCompareBar
        items={compareList}
        onRemove={id => setCompareList(prev => prev.filter(o => o.id !== id))}
        onClear={() => setCompareList([])}
        isAr={isAr}
      />

      <Footer />
    </div>
  );
}

/* ─── Grid Card ─── */
const OrganizerCard = memo(function OrganizerCard({ org, isAr, featured, onPreview, onCompare, compareIds = [], isFollowed, onToggleFollow }: { org: any; isAr: boolean; featured?: boolean; onPreview?: (org: any) => void; onCompare?: (org: any) => void; compareIds?: string[]; isFollowed?: boolean; onToggleFollow?: (id: string) => void }) {
  const primaryName = isAr ? (org.name_ar || org.name) : org.name;
  const secondaryName = isAr ? org.name : org.name_ar;
  const desc = isAr && org.description_ar ? org.description_ar : org.description;
  const cityText = isAr && org.city_ar ? org.city_ar : org.city;
  const countryText = org.country ? (isAr && org.country_ar ? org.country_ar : org.country) : "";
  const locationText = [cityText, countryText].filter(Boolean).join("، ");
  const isCompared = compareIds.includes(org.id);

  return (
    <div className="group block cursor-pointer" onClick={() => onPreview?.(org)}>
      <Card className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-border/40 hover:border-primary/30 h-full rounded-2xl active:scale-[0.98] ${featured ? "ring-1 ring-amber-500/20 border-amber-500/15" : ""}`}>
        {/* Cover */}
        <div className="h-36 overflow-hidden relative bg-gradient-to-br from-primary/10 to-primary/5">
          {org.cover_image_url ? (
            <img src={org.cover_image_url} alt={primaryName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="h-10 w-10 text-primary/15" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
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
          {/* Avatar + Title block */}
          <div className="flex items-start gap-3">
            <Avatar className="h-16 w-16 rounded-2xl border-[3px] border-background shadow-lg shrink-0 ring-1 ring-border/20">
              {org.logo_url && <AvatarImage src={org.logo_url} />}
              <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-lg">{org.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pt-4">
              {/* Primary title */}
              <h3
                className="font-bold text-[15px] leading-snug group-hover:text-primary transition-colors"
                dir={isAr ? "rtl" : "ltr"}
                style={isAr ? { fontFamily: "'Noto Sans Arabic', sans-serif" } : undefined}
              >
                {primaryName}
              </h3>
              {/* Secondary title (other language) */}
              {secondaryName && secondaryName !== primaryName && (
                <p
                  className="text-[11px] text-muted-foreground/50 font-medium mt-0.5 leading-snug"
                  dir={isAr ? "ltr" : "rtl"}
                  style={!isAr ? { fontFamily: "'Noto Sans Arabic', sans-serif" } : undefined}
                >
                  {secondaryName}
                </p>
              )}
            </div>
          </div>

          {/* Location with flag */}
          {(locationText || org.country_code) && (
            <div className="flex items-center gap-1.5 mt-3 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/20">
              {flag && <span className="text-base leading-none">{flag}</span>}
              <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
              <span className="text-[11px] text-muted-foreground font-medium">{locationText}</span>
            </div>
          )}

          {/* Description */}
          {desc && (
            <p
              className="text-[11px] text-muted-foreground/70 mt-2.5 line-clamp-2 leading-relaxed"
              dir={isAr && org.description_ar ? "rtl" : "ltr"}
              style={isAr && org.description_ar ? { fontFamily: "'Noto Sans Arabic', sans-serif" } : undefined}
            >
              {desc}
            </p>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/30">
            <div className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg bg-muted/30">
              <Landmark className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-sm font-bold text-foreground">{org.total_exhibitions || 0}</span>
              <span className="text-[9px] text-muted-foreground">{isAr ? "معرض" : "Events"}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg bg-muted/30">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold text-foreground">{org.average_rating > 0 ? org.average_rating.toFixed(1) : "—"}</span>
              <span className="text-[9px] text-muted-foreground">{isAr ? "التقييم" : "Rating"}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg bg-muted/30">
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">{(org.total_views || 0).toLocaleString()}</span>
              <span className="text-[9px] text-muted-foreground">{isAr ? "مشاهدة" : "Views"}</span>
            </div>
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

          {/* Actions row */}
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-border/20">
            {(org.email || org.phone || org.website) && (
              <div className="flex gap-1">
                {org.website && <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Globe className="h-3 w-3" /></div>}
                {org.email && <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Mail className="h-3 w-3" /></div>}
                {org.phone && <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Phone className="h-3 w-3" /></div>}
              </div>
            )}
            <div className="flex items-center gap-1 ms-auto">
              {onCompare && (
                <button
                  onClick={e => { e.stopPropagation(); onCompare(org); }}
                  className={`flex items-center gap-1 text-[10px] font-medium rounded-lg px-2 py-1 transition-colors ${isCompared ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                >
                  <Scale className="h-3 w-3" />
                  {isCompared ? (isAr ? "✓" : "✓") : (isAr ? "قارن" : "Compare")}
                </button>
              )}
              {onToggleFollow && (
                <button
                  onClick={e => { e.stopPropagation(); onToggleFollow(org.id); }}
                  className={`flex items-center gap-1 text-[10px] font-medium rounded-lg px-2 py-1 transition-colors ${isFollowed ? "text-rose-500" : "text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"}`}
                >
                  <Heart className={`h-3 w-3 ${isFollowed ? "fill-current" : ""}`} />
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
/* ─── List Item ─── */
const OrganizerListItem = memo(function OrganizerListItem({ org, isAr, featured, onPreview, onCompare, compareIds = [], isFollowed, onToggleFollow }: { org: any; isAr: boolean; featured?: boolean; onPreview?: (org: any) => void; onCompare?: (org: any) => void; compareIds?: string[]; isFollowed?: boolean; onToggleFollow?: (id: string) => void }) {
  const primaryName = isAr ? (org.name_ar || org.name) : org.name;
  const secondaryName = isAr ? org.name : org.name_ar;
  const desc = isAr && org.description_ar ? org.description_ar : org.description;
  const cityText = isAr && org.city_ar ? org.city_ar : org.city;
  const countryText = org.country ? (isAr && org.country_ar ? org.country_ar : org.country) : "";
  const locationText = [cityText, countryText].filter(Boolean).join("، ");
  const isCompared = compareIds.includes(org.id);

  return (
    <div className="group block cursor-pointer" onClick={() => onPreview?.(org)}>
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
              <h3
                className="font-bold text-sm group-hover:text-primary transition-colors leading-snug"
                dir={isAr ? "rtl" : "ltr"}
                style={isAr ? { fontFamily: "'Noto Sans Arabic', sans-serif" } : undefined}
              >
                {primaryName}
              </h3>
              {featured && (
                <Badge className="text-[8px] gap-0.5 bg-amber-500 text-white border-0 h-4">
                  <Star className="h-2 w-2 fill-current" />{isAr ? "مميز" : "Featured"}
                </Badge>
              )}
            </div>
            {secondaryName && secondaryName !== primaryName && (
              <p
                className="text-[11px] text-muted-foreground/60 font-medium leading-snug"
                dir={isAr ? "ltr" : "rtl"}
                style={!isAr ? { fontFamily: "'Noto Sans Arabic', sans-serif" } : undefined}
              >
                {secondaryName}
              </p>
            )}
            {locationText && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0 text-primary/50" />
                {locationText}
              </p>
            )}
            {desc && (
              <p
                className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-1"
                dir={isAr && org.description_ar ? "rtl" : "ltr"}
              >
                {desc}
              </p>
            )}

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

          {onToggleFollow && (
            <button
              onClick={e => { e.stopPropagation(); onToggleFollow(org.id); }}
              className={`shrink-0 text-[10px] rounded-lg p-1 transition-colors ${isFollowed ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"}`}
            >
              <Heart className={`h-3.5 w-3.5 ${isFollowed ? "fill-current" : ""}`} />
            </button>
          )}

          {onCompare && (
            <button
              onClick={e => { e.stopPropagation(); onCompare(org); }}
              className={`shrink-0 flex items-center gap-1 text-[10px] font-medium rounded-lg px-2 py-1 transition-colors ${isCompared ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
            >
              <Scale className="h-3 w-3" />
            </button>
          )}

          <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 shrink-0 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </CardContent>
      </Card>
    </div>
  );
});
