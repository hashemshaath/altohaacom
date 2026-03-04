import { useState } from "react";
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
  ChevronRight, Eye, ArrowUpRight, Mail, Phone,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Organizers() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");

  const { data: organizers, isLoading } = useQuery({
    queryKey: ["public-organizers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizers")
        .select("id, name, name_ar, slug, logo_url, cover_image_url, description, description_ar, city, city_ar, country, country_ar, country_code, categories, services, services_ar, total_exhibitions, average_rating, is_featured, is_verified, website, email, phone, status")
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .order("total_exhibitions", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const countries = [...new Set((organizers || []).map((o: any) => o.country).filter(Boolean))] as string[];

  const filtered = (organizers || []).filter((o: any) => {
    const matchSearch = !search || o.name?.toLowerCase().includes(search.toLowerCase()) || o.name_ar?.includes(search) || o.city?.toLowerCase().includes(search.toLowerCase());
    const matchCountry = countryFilter === "all" || o.country === countryFilter;
    return matchSearch && matchCountry;
  });

  const featured = filtered.filter((o: any) => o.is_featured);
  const regular = filtered.filter((o: any) => !o.is_featured);

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead
        title={isAr ? "منظمو الفعاليات | المنصة" : "Event Organizers | Platform"}
        description={isAr ? "تصفح منظمي الفعاليات والمعارض الرائدين" : "Browse leading event and exhibition organizers"}
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <div className="border-b bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container max-w-6xl py-10 text-center">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-primary/10 mb-4">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{isAr ? "منظمو الفعاليات" : "Event Organizers"}</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {isAr ? "تعرّف على أبرز منظمي المعارض والفعاليات في القطاع" : "Discover leading exhibition and event organizers in the industry"}
            </p>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mt-6">
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
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              {filtered.length} {isAr ? "منظم" : "organizers"}
            </p>
          </div>
        </div>

        <div className="container max-w-6xl py-8 space-y-8">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    {featured.map((org: any) => (
                      <OrganizerCard key={org.id} org={org} isAr={isAr} featured />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {regular.map((org: any) => (
                  <OrganizerCard key={org.id} org={org} isAr={isAr} />
                ))}
              </div>

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
      <Card className={`overflow-hidden hover:shadow-lg transition-all border-border/40 hover:border-primary/30 h-full ${featured ? "ring-1 ring-primary/20" : ""}`}>
        {org.cover_image_url && (
          <div className="h-32 overflow-hidden relative">
            <img src={org.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        )}
        <CardContent className={`p-4 ${org.cover_image_url ? "-mt-10 relative z-10" : ""}`}>
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14 rounded-xl border-2 border-background shadow-md shrink-0">
              {org.logo_url && <AvatarImage src={org.logo_url} />}
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">{org.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
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
            <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
          </div>

          {desc && <p className="text-[11px] text-muted-foreground mt-3 line-clamp-2">{desc}</p>}

          <div className="flex flex-wrap gap-2 mt-3">
            {org.total_exhibitions > 0 && (
              <Badge variant="secondary" className="text-[9px] gap-1">
                <Landmark className="h-3 w-3" />{org.total_exhibitions} {isAr ? "فعالية" : "events"}
              </Badge>
            )}
            {org.total_views > 0 && (
              <Badge variant="outline" className="text-[9px] gap-1">
                <Eye className="h-3 w-3" />{org.total_views.toLocaleString()}
              </Badge>
            )}
            {org.average_rating > 0 && (
              <Badge variant="outline" className="text-[9px] gap-1">
                <Star className="h-3 w-3" />{org.average_rating}
              </Badge>
            )}
          </div>

          {/* Services */}
          {org.services && org.services.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {org.services.slice(0, 3).map((s: string) => (
                <Badge key={s} variant="outline" className="text-[8px]">{s}</Badge>
              ))}
              {org.services.length > 3 && <Badge variant="outline" className="text-[8px]">+{org.services.length - 3}</Badge>}
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
