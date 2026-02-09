import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader } from "@/components/ui/card";
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
      <Header />

      <main className="container flex-1 py-8">
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Landmark className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-bold md:text-4xl">
            {isAr ? "المعارض والمؤتمرات والفعاليات" : "Exhibitions, Conferences & Events"}
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            {isAr
              ? "اكتشف أبرز المعارض والمؤتمرات والفعاليات في عالم الطعام والطهي والمشروبات والمسابقات"
              : "Discover the top exhibitions, conferences, and events in food, beverages, cooking, and culinary competitions"}
          </p>
        </div>

        {/* Featured Carousel */}
        {featuredExhibitions && featuredExhibitions.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold">
              {isAr ? "⭐ فعاليات مميزة" : "⭐ Featured Events"}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredExhibitions.slice(0, 3).map((ex) => (
                <ExhibitionCard key={ex.id} exhibition={ex} language={language} />
              ))}
            </div>
          </section>
        )}

        {/* Search + Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "ابحث عن معرض أو مؤتمر أو فعالية..." : "Search exhibitions, conferences, events..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
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
          <TabsList className="h-auto w-full justify-start overflow-x-auto overflow-y-hidden whitespace-nowrap">
            <TabsTrigger value="all">{isAr ? "الكل" : "All"}</TabsTrigger>
            <TabsTrigger value="current">
              <CalendarDays className="mr-1.5 h-4 w-4" />
              {isAr ? "جارية الآن" : "Happening Now"}
            </TabsTrigger>
            <TabsTrigger value="upcoming">{isAr ? "القادمة" : "Upcoming"}</TabsTrigger>
            <TabsTrigger value="past">{isAr ? "السابقة" : "Past"}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <Skeleton className="h-52 w-full" />
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : filtered?.length === 0 ? (
              <div className="py-16 text-center">
                <Landmark className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                <p className="text-lg font-medium text-muted-foreground">
                  {isAr ? "لم يتم العثور على فعاليات" : "No events found"}
                </p>
                <p className="text-sm text-muted-foreground/70">
                  {isAr ? "جرب تعديل معايير البحث" : "Try adjusting your search or filters"}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered?.map((ex) => (
                  <ExhibitionCard key={ex.id} exhibition={ex} language={language} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Stats */}
        {exhibitions && exhibitions.length > 0 && (
          <section className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: isAr ? "إجمالي الفعاليات" : "Total Events", value: exhibitions.length },
              { label: isAr ? "جارية الآن" : "Happening Now", value: exhibitions.filter(e => isWithinInterval(new Date(), { start: new Date(e.start_date), end: new Date(e.end_date) })).length },
              { label: isAr ? "القادمة" : "Upcoming", value: exhibitions.filter(e => isFuture(new Date(e.start_date))).length },
              { label: isAr ? "الدول" : "Countries", value: new Set(exhibitions.map(e => e.country).filter(Boolean)).size },
            ].map((stat) => (
              <Card key={stat.label} className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
