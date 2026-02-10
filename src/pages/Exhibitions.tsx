import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CalendarDays, Landmark, MapPin, Plus, Globe, ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { countryFlag } from "@/lib/countryFlag";
import { ExhibitionCard, type Exhibition } from "@/components/exhibitions/ExhibitionCard";
import { isPast, isFuture, isWithinInterval } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type ExhibitionType = Database["public"]["Enums"]["exhibition_type"];

const typeOptions: { value: ExhibitionType | "all"; en: string; ar: string }[] = [
  { value: "all", en: "All Types", ar: "جميع الأنواع" },
  { value: "exhibition", en: "Exhibitions", ar: "معارض" },
  { value: "conference", en: "Conferences", ar: "مؤتمرات" },
  { value: "summit", en: "Summits", ar: "قمم" },
  { value: "workshop", en: "Workshops", ar: "ورش عمل" },
  { value: "food_festival", en: "Food Festivals", ar: "مهرجانات طعام" },
  { value: "trade_show", en: "Trade Shows", ar: "معارض تجارية" },
  { value: "competition_event", en: "Competition Events", ar: "أحداث تنافسية" },
];

export default function Exhibitions() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");

  const { data: exhibitions, isLoading } = useQuery({
    queryKey: ["exhibitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibitions")
        .select("*")
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data as Exhibition[];
    },
  });

  // Derive unique countries for filter
  const countries = Array.from(
    new Set(exhibitions?.map(e => e.country).filter(Boolean) as string[])
  ).sort();

  const filtered = exhibitions?.filter((ex) => {
    const title = isAr && ex.title_ar ? ex.title_ar : ex.title;
    const matchesSearch = title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || ex.type === typeFilter;
    const matchesCountry = countryFilter === "all" || ex.country === countryFilter;

    const now = new Date();
    const start = new Date(ex.start_date);
    const end = new Date(ex.end_date);

    let matchesTab = true;
    if (activeTab === "upcoming") matchesTab = isFuture(start);
    else if (activeTab === "current") matchesTab = isWithinInterval(now, { start, end });
    else if (activeTab === "past") matchesTab = isPast(end);

    return matchesSearch && matchesType && matchesCountry && matchesTab;
  });

  const featuredExhibitions = exhibitions?.filter((ex) => ex.is_featured && !isPast(new Date(ex.end_date)));

  const happeningNowCount = exhibitions?.filter(e => {
    try { return isWithinInterval(new Date(), { start: new Date(e.start_date), end: new Date(e.end_date) }); } catch { return false; }
  }).length || 0;

  const upcomingCount = exhibitions?.filter(e => isFuture(new Date(e.start_date))).length || 0;
  const countriesCount = new Set(exhibitions?.map(e => e.country).filter(Boolean)).size;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title="Food Exhibitions & Events"
        description="Discover food exhibitions, conferences, and culinary events worldwide. Stay updated with the latest in gastronomy."
      />
      <Header />

      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute -top-32 start-1/4 h-64 w-64 rounded-full bg-primary/8 blur-[100px] animate-pulse" />
        <div className="absolute -top-20 end-1/3 h-48 w-48 rounded-full bg-accent/10 blur-[80px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="container relative py-10 md:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15 shadow-sm">
                <Landmark className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold md:text-3xl lg:text-4xl">
                  {isAr ? "المعارض والفعاليات" : "Exhibitions & Events"}
                </h1>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                  {isAr
                    ? "اكتشف أبرز المعارض والمؤتمرات والفعاليات في عالم الطعام والطهي"
                    : "Discover the top exhibitions, conferences, and events in the culinary world"}
                </p>
              </div>
            </div>
            {user && (
              <Button className="shadow-sm shadow-primary/20" asChild>
                <Link to="/exhibitions/create">
                  <Plus className="me-2 h-4 w-4" />
                  {isAr ? "إنشاء فعالية" : "Create Event"}
                </Link>
              </Button>
            )}
          </div>

          {/* Quick Stats Pills */}
          {exhibitions && exhibitions.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
                <Landmark className="h-3 w-3" />
                {exhibitions.length} {isAr ? "فعالية" : "Events"}
              </Badge>
              {happeningNowCount > 0 && (
                <Badge className="gap-1.5 bg-chart-3/15 text-chart-3 border-chart-3/20 px-3 py-1.5 text-xs">
                  <Clock className="h-3 w-3" />
                  {happeningNowCount} {isAr ? "جارية الآن" : "Live Now"}
                </Badge>
              )}
              {upcomingCount > 0 && (
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
                  <CalendarDays className="h-3 w-3" />
                  {upcomingCount} {isAr ? "قادمة" : "Upcoming"}
                </Badge>
              )}
              {countriesCount > 1 && (
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs">
                  <Globe className="h-3 w-3" />
                  {countriesCount} {isAr ? "دولة" : "Countries"}
                </Badge>
              )}
            </div>
          )}
        </div>
      </section>

      <main className="container flex-1 py-8 md:py-12">
        {/* Featured */}
        {featuredExhibitions && featuredExhibitions.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                <span>⭐</span>
                {isAr ? "فعاليات مميزة" : "Featured Events"}
              </h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {featuredExhibitions.slice(0, 3).map((ex) => (
                <ExhibitionCard key={ex.id} exhibition={ex} language={language} />
              ))}
            </div>
          </section>
        )}

        {/* Search + Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "ابحث عن فعالية..." : "Search events..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {isAr ? opt.ar : opt.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {countries.length > 1 && (
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <MapPin className="me-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder={isAr ? "الدولة" : "Country"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع الدول" : "All Countries"}</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>{countryFlag(c)} {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-muted/50">
            <TabsTrigger value="all" className="text-xs sm:text-sm">{isAr ? "الكل" : "All"}</TabsTrigger>
            <TabsTrigger value="current" className="gap-1.5 text-xs sm:text-sm">
              <CalendarDays className="hidden h-3.5 w-3.5 sm:inline" />
              {isAr ? "جارية الآن" : "Happening Now"}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs sm:text-sm">{isAr ? "القادمة" : "Upcoming"}</TabsTrigger>
            <TabsTrigger value="past" className="text-xs sm:text-sm">{isAr ? "السابقة" : "Past"}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[16/10] w-full" />
                    <div className="space-y-2.5 p-4">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex gap-2 pt-1">
                        <Skeleton className="h-3.5 w-20" />
                        <Skeleton className="h-3.5 w-24" />
                      </div>
                      <Skeleton className="mt-3 h-9 w-full rounded-md" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : filtered?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/50">
                  <Landmark className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="mb-1 text-lg font-semibold">
                  {isAr ? "لم يتم العثور على فعاليات" : "No events found"}
                </h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {isAr ? "جرب تعديل معايير البحث" : "Try adjusting your search or filters"}
                </p>
                {search && (
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch("")}>
                    {isAr ? "مسح البحث" : "Clear search"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered?.map((ex) => (
                  <ExhibitionCard key={ex.id} exhibition={ex} language={language} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Stats */}
        {exhibitions && exhibitions.length > 0 && (
          <section className="mt-12 border-t pt-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: isAr ? "إجمالي الفعاليات" : "Total Events", value: exhibitions.length, color: "border-s-primary" },
                { label: isAr ? "جارية الآن" : "Happening Now", value: happeningNowCount, color: "border-s-chart-3" },
                { label: isAr ? "القادمة" : "Upcoming", value: upcomingCount, color: "border-s-chart-1" },
                { label: isAr ? "الدول" : "Countries", value: countriesCount, color: "border-s-accent" },
              ].map((stat) => (
                <Card key={stat.label} className={`border-s-[3px] ${stat.color} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-foreground sm:text-3xl">{stat.value}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}