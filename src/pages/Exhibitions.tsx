import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { AdBanner } from "@/components/ads/AdBanner";
import { useAdTracking } from "@/hooks/useAdTracking";
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
import { Search, CalendarDays, Landmark, MapPin, Plus, Globe, ArrowRight, Clock, History, Building } from "lucide-react";
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
  useAdTracking();
  const [searchQuery, setSearchQuery] = useState("");
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
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
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

      {/* Hero Banner - Premium */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80')] bg-fixed bg-cover bg-center opacity-[0.03] grayscale pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        <div className="absolute -top-40 start-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute -bottom-20 end-1/3 h-72 w-72 rounded-full bg-accent/15 blur-[100px] animate-pulse [animation-delay:1.5s] pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        <div className="container relative py-12 md:py-20">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between animate-fade-in">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 ring-1 ring-primary/20 backdrop-blur-sm shadow-inner transition-transform hover:scale-105">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  {isAr ? "فعاليات الطهي العالمية" : "Global Culinary Events"}
                </span>
              </div>
              
              <div className="space-y-4">
                <h1 className="font-serif text-4xl font-black tracking-tight md:text-6xl lg:text-7xl text-balance leading-[1.05]">
                  {isAr ? (
                    <>أبرز <span className="text-primary italic relative">المعارض<span className="absolute -bottom-2 inset-x-0 h-3 bg-primary/10 -rotate-2 -z-10" /></span> والفعاليات</>
                  ) : (
                    <>Premier <span className="text-primary italic relative">Exhibitions<span className="absolute -bottom-2 inset-x-0 h-4 bg-primary/10 -rotate-1 -z-10" /></span> & Events</>
                  )}
                </h1>
                <p className="max-w-xl text-lg text-muted-foreground font-medium md:text-xl leading-relaxed">
                  {isAr
                    ? "بوابتك لاكتشاف أبرز المعارض والمؤتمرات العالمية في عالم الضيافة وفنون الطهي"
                    : "Your gateway to discovering the world's most prestigious hospitality and culinary trade shows."}
                </p>
              </div>

              {/* Quick Stats Pills */}
              {exhibitions && exhibitions.length > 0 && (
                <div className="flex flex-wrap gap-2.5">
                  <Badge variant="outline" className="gap-2 bg-background/50 px-4 py-2 text-xs backdrop-blur-md border-primary/20 hover:bg-primary/5 transition-colors">
                    <Landmark className="h-3.5 w-3.5 text-primary" />
                    <span className="font-bold">{exhibitions.length}</span>
                    <span className="text-muted-foreground">{isAr ? "فعالية" : "Events"}</span>
                  </Badge>
                  {happeningNowCount > 0 && (
                    <Badge className="gap-2 bg-chart-3/15 text-chart-3 border-chart-3/30 px-4 py-2 text-xs backdrop-blur-md">
                      <div className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-3 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-chart-3"></span>
                      </div>
                      <span className="font-bold">{happeningNowCount}</span>
                      <span>{isAr ? "جارية الآن" : "Live Now"}</span>
                    </Badge>
                  )}
                  {upcomingCount > 0 && (
                    <Badge variant="outline" className="gap-2 bg-background/50 px-4 py-2 text-xs backdrop-blur-md hover:bg-primary/5 transition-colors">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      <span className="font-bold">{upcomingCount}</span>
                      <span className="text-muted-foreground">{isAr ? "قادمة" : "Upcoming"}</span>
                    </Badge>
                  )}
                  {countriesCount > 0 && (
                    <Badge variant="outline" className="gap-2 bg-background/50 px-4 py-2 text-xs backdrop-blur-md hover:bg-primary/5 transition-colors">
                      <Globe className="h-3.5 w-3.5 text-primary" />
                      <span className="font-bold">{countriesCount}</span>
                      <span className="text-muted-foreground">{isAr ? "دولة" : "Countries"}</span>
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {user && (
                <Button size="lg" className="h-12 rounded-xl px-8 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95" asChild>
                  <Link to="/exhibitions/create">
                    <Plus className="me-2 h-5 w-5" />
                    {isAr ? "إضافة فعالية" : "Add Your Event"}
                  </Link>
                </Button>
              )}
            </div>
          </div>
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

        {/* Sticky Filters Bar */}
        <div className="sticky top-[64px] z-40 -mx-4 mb-8 border-y border-border/40 bg-background/80 px-4 py-4 backdrop-blur-md md:rounded-2xl md:border md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative flex-1 lg:max-w-md">
                <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder={isAr ? "ابحث عن اسم الفعالية، المدينة..." : "Search event name, city..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 border-border/40 bg-muted/20 ps-11 transition-all focus:bg-background focus:ring-primary/20 rounded-xl"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-11 w-full border-border/40 bg-muted/20 rounded-xl sm:w-44 focus:ring-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40">
                    {typeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                        {isAr ? opt.ar : opt.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {countries.length > 0 && (
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="h-11 w-full border-border/40 bg-muted/20 rounded-xl sm:w-44 focus:ring-primary/20">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary/60" />
                        <SelectValue placeholder={isAr ? "كل الدول" : "All Countries"} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40">
                      <SelectItem value="all" className="rounded-lg">{isAr ? "كل الدول" : "All Countries"}</SelectItem>
                      {countries.map((c) => (
                        <SelectItem key={c} value={c} className="rounded-lg">
                          <span className="me-2">{countryFlag(c)}</span> {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="h-auto w-full justify-start gap-1.5 overflow-x-auto bg-muted/40 p-1.5 rounded-2xl border border-border/40">
            {[
              { id: "all", label: isAr ? "الكل" : "All", icon: null },
              { id: "current", label: isAr ? "يحدث الآن" : "Live", icon: Clock },
              { id: "upcoming", label: isAr ? "القادمة" : "Upcoming", icon: CalendarDays },
              { id: "past", label: isAr ? "السابقة" : "Past", icon: History }
            ].map((t) => (
              <TabsTrigger 
                key={t.id} 
                value={t.id} 
                className="gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg shadow-primary/20"
              >
                {t.icon && <t.icon className="h-3.5 w-3.5" />}
                {t.label}
              </TabsTrigger>
            ))}
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
                {searchQuery && (
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearchQuery("")}>
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