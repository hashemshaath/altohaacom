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
import { Search, CalendarDays, Landmark } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

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

  const filtered = exhibitions?.filter((ex) => {
    const title = isAr && ex.title_ar ? ex.title_ar : ex.title;
    const matchesSearch = title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || ex.type === typeFilter;

    const now = new Date();
    const start = new Date(ex.start_date);
    const end = new Date(ex.end_date);

    let matchesTab = true;
    if (activeTab === "upcoming") matchesTab = isFuture(start);
    else if (activeTab === "current") matchesTab = isWithinInterval(now, { start, end });
    else if (activeTab === "past") matchesTab = isPast(end);

    return matchesSearch && matchesType && matchesTab;
  });

  const featuredExhibitions = exhibitions?.filter((ex) => ex.is_featured && !isPast(new Date(ex.end_date)));

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Food Exhibitions & Events"
        description="Discover food exhibitions, conferences, and culinary events worldwide. Stay updated with the latest in gastronomy."
      />
      <Header />

      <main className="container flex-1 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Landmark className="h-4 w-4 text-primary" />
            </div>
            <h1 className="font-serif text-2xl font-bold md:text-3xl">
              {isAr ? "المعارض والمؤتمرات والفعاليات" : "Exhibitions & Events"}
            </h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground md:text-base">
            {isAr
              ? "اكتشف أبرز المعارض والمؤتمرات والفعاليات في عالم الطعام والطهي"
              : "Discover the top exhibitions, conferences, and events in the culinary world"}
          </p>
        </div>

        {/* Featured */}
        {featuredExhibitions && featuredExhibitions.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {isAr ? "فعاليات مميزة" : "Featured Events"}
            </h2>
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
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="h-auto w-full justify-start overflow-x-auto bg-muted/50">
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
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[16/10] w-full" />
                    <CardContent className="space-y-2.5 p-4">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filtered?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 rounded-2xl bg-muted/60 p-5">
                  <Landmark className="h-10 w-10 text-muted-foreground/40" />
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
                { label: isAr ? "إجمالي الفعاليات" : "Total Events", value: exhibitions.length },
                { label: isAr ? "جارية الآن" : "Happening Now", value: exhibitions.filter(e => { try { return isWithinInterval(new Date(), { start: new Date(e.start_date), end: new Date(e.end_date) }); } catch { return false; } }).length },
                { label: isAr ? "القادمة" : "Upcoming", value: exhibitions.filter(e => isFuture(new Date(e.start_date))).length },
                { label: isAr ? "الدول" : "Countries", value: new Set(exhibitions.map(e => e.country).filter(Boolean)).size },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-4 text-center">
                    <p className="text-xl font-bold text-primary sm:text-2xl">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground sm:text-xs">{stat.label}</p>
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
