import { useState, useMemo } from "react";
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
  ArrowUpRight, Mail, Phone, LayoutGrid, List, Users, TrendingUp, Eye, Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export default function Organizers() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  const filtered = useMemo(() => (organizers || []).filter((o: any) => {
    const matchSearch = !search || o.name?.toLowerCase().includes(search.toLowerCase()) || o.name_ar?.includes(search) || o.city?.toLowerCase().includes(search.toLowerCase());
    const matchCountry = countryFilter === "all" || o.country === countryFilter;
    const matchCategory = categoryFilter === "all" || (o.categories || []).includes(categoryFilter);
    return matchSearch && matchCountry && matchCategory;
  }), [organizers, search, countryFilter, categoryFilter]);

  const featured = filtered.filter((o: any) => o.is_featured);
  const regular = filtered.filter((o: any) => !o.is_featured);

  // Aggregate stats
  const totalEvents = (organizers || []).reduce((s: number, o: any) => s + (o.total_exhibitions || 0), 0);
  const totalOrgs = (organizers || []).length;
  const totalCountries = countries.length;

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead
        title={isAr ? "منظمو الفعاليات | المنصة" : "Event Organizers | Platform"}
        description={isAr ? "تصفح منظمي الفعاليات والمعارض الرائدين" : "Browse leading event and exhibition organizers"}
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <div className="border-b bg-gradient-to-b from-primary/5 via-primary/3 to-transparent">
          <div className="container max-w-6xl py-10 md:py-14">
            <div className="text-center">
              <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{isAr ? "منظمو الفعاليات" : "Event Organizers"}</h1>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base">
                {isAr ? "تعرّف على أبرز منظمي المعارض والفعاليات في القطاع" : "Discover leading exhibition and event organizers in the industry"}
              </p>
            </div>

            {/* Summary Stats */}
            <div className="flex justify-center gap-6 md:gap-10 mt-6">
              {[
                { icon: Building2, value: totalOrgs, label: isAr ? "منظم" : "Organizers" },
                { icon: Landmark, value: totalEvents, label: isAr ? "فعالية" : "Events" },
                { icon: Globe, value: totalCountries, label: isAr ? "دولة" : "Countries" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl md:text-3xl font-bold"><AnimatedCounter value={s.value} /></p>
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                    <s.icon className="h-3 w-3" />{s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mt-8">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isAr ? "ابحث عن منظم..." : "Search organizers..."}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="ps-10 h-10"
                />
              </div>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-40 h-10">
                  <SelectValue placeholder={isAr ? "الدولة" : "Country"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "جميع الدول" : "All Countries"}</SelectItem>
                  {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {allCategories.length > 0 && (
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40 h-10">
                    <SelectValue placeholder={isAr ? "التصنيف" : "Category"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "جميع التصنيفات" : "All Categories"}</SelectItem>
                    {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center justify-between max-w-2xl mx-auto mt-4">
              <p className="text-xs text-muted-foreground">
                {filtered.length} {isAr ? "منظم" : "organizers"}
              </p>
              <div className="flex gap-1">
                <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("grid")}>
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("list")}>
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-6xl py-8 space-y-8">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
            </div>
          ) : (
            <>
              {/* Featured */}
              {featured.length > 0 && (
                <div>
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
                </div>
              )}

              {/* Regular */}
              {viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {regular.map((org: any) => <OrganizerCard key={org.id} org={org} isAr={isAr} />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {regular.map((org: any) => <OrganizerListItem key={org.id} org={org} isAr={isAr} />)}
                </div>
              )}

              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">{isAr ? "لا توجد نتائج" : "No organizers found"}</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function OrganizerCard({ org, isAr, featured }: { org: any; isAr: boolean; featured?: boolean }) {
  const name = isAr && org.name_ar ? org.name_ar : org.name;
  const desc = isAr && org.description_ar ? org.description_ar : org.description;

  return (
    <Link to={`/organizers/${org.slug}`} className="group">
      <Card className={`overflow-hidden hover:shadow-lg transition-all border-border/40 hover:border-primary/30 h-full rounded-2xl ${featured ? "ring-1 ring-primary/20" : ""}`}>
        {/* Cover */}
        <div className="h-36 overflow-hidden relative bg-gradient-to-br from-primary/10 to-primary/5">
          {org.cover_image_url ? (
            <img src={org.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
          {featured && (
            <div className="absolute top-2 end-2">
              <Badge className="text-[9px] gap-1 bg-amber-500/90 text-amber-50 border-0">
                <Star className="h-2.5 w-2.5" />{isAr ? "مميز" : "Featured"}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 -mt-12 relative z-10">
          <div className="flex items-start gap-3">
            <Avatar className="h-16 w-16 rounded-2xl border-3 border-background shadow-lg shrink-0">
              {org.logo_url && <AvatarImage src={org.logo_url} />}
              <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-lg">{org.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pt-6">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{name}</h3>
                {org.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
              </div>
              {org.city && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />{org.city}{org.country ? `, ${org.country}` : ""}
                </p>
              )}
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0 mt-6 group-hover:text-primary transition-colors" />
          </div>

          {desc && <p className="text-[11px] text-muted-foreground mt-3 line-clamp-2">{desc}</p>}

          {/* Stats Row */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/40">
            {org.total_exhibitions > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Landmark className="h-3 w-3" />
                <span className="font-semibold text-foreground">{org.total_exhibitions}</span>
                {isAr ? "فعالية" : "events"}
              </div>
            )}
            {org.average_rating > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Star className="h-3 w-3 text-amber-500" />
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
            <div className="flex flex-wrap gap-1 mt-2">
              {org.categories.slice(0, 3).map((c: string) => (
                <Badge key={c} variant="outline" className="text-[8px] rounded-full">{c}</Badge>
              ))}
              {org.categories.length > 3 && <Badge variant="outline" className="text-[8px] rounded-full">+{org.categories.length - 3}</Badge>}
            </div>
          )}

          {/* Contact icons */}
          <div className="flex gap-2 mt-3 text-muted-foreground">
            {org.email && <Mail className="h-3.5 w-3.5" />}
            {org.phone && <Phone className="h-3.5 w-3.5" />}
            {org.website && <Globe className="h-3.5 w-3.5" />}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function OrganizerListItem({ org, isAr, featured }: { org: any; isAr: boolean; featured?: boolean }) {
  const name = isAr && org.name_ar ? org.name_ar : org.name;
  const desc = isAr && org.description_ar ? org.description_ar : org.description;

  return (
    <Link to={`/organizers/${org.slug}`} className="group block">
      <Card className={`hover:shadow-md transition-all border-border/40 hover:border-primary/30 rounded-2xl ${featured ? "ring-1 ring-primary/20" : ""}`}>
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="h-14 w-14 rounded-2xl border-2 border-background shadow-md shrink-0">
            {org.logo_url && <AvatarImage src={org.logo_url} />}
            <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold">{org.name?.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{name}</h3>
              {org.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
              {featured && (
                <Badge className="text-[8px] gap-0.5 bg-amber-500/90 text-amber-50 border-0 ms-1">
                  <Star className="h-2 w-2" />{isAr ? "مميز" : "Featured"}
                </Badge>
              )}
            </div>
            {org.city && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{org.city}{org.country ? `, ${org.country}` : ""}
              </p>
            )}
            {desc && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{desc}</p>}
          </div>

          <div className="hidden sm:flex items-center gap-4 shrink-0">
            {org.total_exhibitions > 0 && (
              <div className="text-center">
                <p className="text-sm font-bold">{org.total_exhibitions}</p>
                <p className="text-[9px] text-muted-foreground">{isAr ? "فعالية" : "Events"}</p>
              </div>
            )}
            {org.average_rating > 0 && (
              <div className="text-center">
                <p className="text-sm font-bold flex items-center gap-0.5"><Star className="h-3 w-3 text-amber-500" />{org.average_rating.toFixed(1)}</p>
                <p className="text-[9px] text-muted-foreground">{isAr ? "التقييم" : "Rating"}</p>
              </div>
            )}
          </div>

          <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
        </CardContent>
      </Card>
    </Link>
  );
}
