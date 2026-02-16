import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, Users, Search, GraduationCap, Star, MapPin } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { useAllCountries } from "@/hooks/useCountries";
import { toEnglishDigits } from "@/lib/formatNumber";

export default function Masterclasses() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const { data: allCountries = [] } = useAllCountries();

  const { data: masterclasses = [], isLoading } = useQuery({
    queryKey: ["masterclasses", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("masterclasses")
        .select("*, masterclass_modules(id), masterclass_enrollments(id), masterclass_reviews(rating)")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 3,
  });

  const { data: myEnrollments = [] } = useQuery({
    queryKey: ["my-enrollments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("masterclass_enrollments")
        .select("masterclass_id")
        .eq("user_id", user.id)
        .eq("status", "active");
      if (error) throw error;
      return data?.map((e) => e.masterclass_id) || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const countryCodes = Array.from(
    new Set(masterclasses.map((mc: any) => mc.country_code).filter(Boolean) as string[])
  ).sort();

  const getCountryName = (code: string) => {
    const c = allCountries.find((ct) => ct.code === code);
    return c ? (isAr ? c.name_ar || c.name : c.name) : code;
  };

  const filtered = masterclasses.filter((mc: any) => {
    const matchesSearch =
      !search ||
      mc.title?.toLowerCase().includes(search.toLowerCase()) ||
      mc.title_ar?.includes(search) ||
      mc.description?.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === "all" || mc.level === levelFilter;
    const matchesCategory = categoryFilter === "all" || mc.category === categoryFilter;
    const matchesCountry = countryFilter === "all" || mc.country_code === countryFilter;
    return matchesSearch && matchesLevel && matchesCategory && matchesCountry;
  });

  const categories = [...new Set(masterclasses.map((mc: any) => mc.category))];

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      beginner: "bg-chart-3/10 text-chart-3",
      intermediate: "bg-chart-4/10 text-chart-4",
      advanced: "bg-destructive/10 text-destructive",
      all_levels: "bg-primary/10 text-primary",
    };
    const labels: Record<string, { en: string; ar: string }> = {
      beginner: { en: "Beginner", ar: "مبتدئ" },
      intermediate: { en: "Intermediate", ar: "متوسط" },
      advanced: { en: "Advanced", ar: "متقدم" },
      all_levels: { en: "All Levels", ar: "جميع المستويات" },
    };
    return (
      <Badge variant="outline" className={`text-[10px] ${colors[level] || ""}`}>
        {isAr ? labels[level]?.ar : labels[level]?.en}
      </Badge>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title={isAr ? "الدروس المتقدمة — الطهاة" : "Culinary Masterclasses — Altohaa"}
        description={isAr ? "تعلم من أمهر الطهاة عبر دروس حصرية" : "Learn from world-class chefs with our curated masterclasses. From French cuisine to pastry arts."}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: isAr ? "الدروس المتقدمة" : "Culinary Masterclasses",
          url: `${window.location.origin}/masterclasses`,
          isPartOf: { "@type": "WebSite", name: "Altohaa", url: window.location.origin },
        }}
      />
      <Header />
      {/* Compact Hero */}
      <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
        <div className="container py-8 md:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 ring-1 ring-primary/20">
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {isAr ? "التعلم المهني" : "Professional Learning"}
                </span>
              </div>
              <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
                {isAr ? "الدورات التعليمية" : "Masterclasses"}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {isAr
                  ? "تعلم من أفضل الطهاة والخبراء في عالم الطهي العالمي"
                  : "Master the art of culinary excellence with world-renowned chefs and industry experts."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5 border-primary/20 bg-primary/5 text-primary px-3 py-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                <span className="font-bold">{filtered.length}</span>
                <span className="text-[10px]">{isAr ? "دورة" : "Available"}</span>
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <main className="container flex-1 py-4 md:py-6">

        {/* Sticky Glass Filters */}
        <div className="sticky top-[56px] z-30 -mx-3 mb-6 bg-background/80 px-3 py-3 backdrop-blur-md border-y border-border/40 sm:rounded-2xl sm:border sm:mx-0 sm:px-6 sm:mb-10">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder={isAr ? "ابحث عن دورة..." : "Search masterclasses..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 border-border/40 bg-muted/20 ps-11 transition-all focus:bg-background focus:ring-primary/20 rounded-xl"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="h-11 w-full sm:w-40 border-border/40 bg-muted/20 rounded-xl focus:ring-primary/20">
                  <SelectValue placeholder={isAr ? "المستوى" : "Level"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/40">
                  <SelectItem value="all" className="rounded-lg">{isAr ? "جميع المستويات" : "All Levels"}</SelectItem>
                  <SelectItem value="beginner" className="rounded-lg">{isAr ? "مبتدئ" : "Beginner"}</SelectItem>
                  <SelectItem value="intermediate" className="rounded-lg">{isAr ? "متوسط" : "Intermediate"}</SelectItem>
                  <SelectItem value="advanced" className="rounded-lg">{isAr ? "متقدم" : "Advanced"}</SelectItem>
                </SelectContent>
              </Select>
              {categories.length > 1 && (
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-11 w-full sm:w-40 border-border/40 bg-muted/20 rounded-xl focus:ring-primary/20">
                    <SelectValue placeholder={isAr ? "التصنيف" : "Category"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40">
                    <SelectItem value="all" className="rounded-lg">{isAr ? "الكل" : "All"}</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="rounded-lg">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {countryCodes.length > 1 && (
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="h-11 w-full sm:w-44 border-border/40 bg-muted/20 rounded-xl focus:ring-primary/20">
                    <MapPin className="me-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder={isAr ? "الدولة" : "Country"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40">
                    <SelectItem value="all" className="rounded-lg">{isAr ? "جميع الدول" : "All Countries"}</SelectItem>
                    {countryCodes.map((code) => (
                      <SelectItem key={code} value={code} className="rounded-lg">
                        {countryFlag(code)} {getCountryName(code)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="space-y-2.5 p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-2xl bg-muted/60 p-5">
              <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">
              {isAr ? "لا توجد دورات متاحة" : "No masterclasses found"}
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              {search
                ? (isAr ? "جرّب كلمات بحث مختلفة" : "Try different search terms")
                : (isAr ? "لا توجد دورات متاحة حالياً" : "No masterclasses available yet")}
            </p>
            {search && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch("")}>
                {isAr ? "مسح البحث" : "Clear search"}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((mc: any) => {
              const isEnrolled = myEnrollments.includes(mc.id);
              const moduleCount = mc.masterclass_modules?.length || 0;
              const enrollmentCount = mc.masterclass_enrollments?.length || 0;
              const reviews = mc.masterclass_reviews || [];
              const avgRating = reviews.length > 0
                ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length)
                : null;
              const title = isAr && mc.title_ar ? mc.title_ar : mc.title;
              const description = isAr && mc.description_ar ? mc.description_ar : mc.description;

              return (
                <Card
                  key={mc.id}
                  className="group flex h-full flex-col overflow-hidden cursor-pointer border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30 hover:bg-card"
                  onClick={() => navigate(`/masterclasses/${mc.id}`)}
                >
                  <div className="relative aspect-video shrink-0 overflow-hidden bg-muted">
                    {mc.cover_image_url ? (
                      <img
                        src={mc.cover_image_url}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-chart-3/10">
                        <BookOpen className="h-12 w-12 text-primary/15 animate-pulse" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                    {/* Badges overlay */}
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                      {getLevelBadge(mc.level)}
                      <div className="flex gap-1.5">
                        {mc.is_free && (
                          <Badge className="bg-chart-2/20 text-chart-2 backdrop-blur-md border-0 text-[9px] font-black uppercase tracking-wider shadow-lg">
                            {isAr ? "مجاني" : "Free"}
                          </Badge>
                        )}
                        {isEnrolled && (
                          <Badge className="bg-primary/20 text-primary backdrop-blur-md border-0 text-[9px] font-black uppercase tracking-wider shadow-lg animate-pulse">
                            {isAr ? "مسجل" : "Enrolled"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {/* Rating overlay */}
                    {avgRating !== null && (
                      <div className="absolute end-4 bottom-4">
                        <Badge variant="secondary" className="gap-1.5 bg-background/80 backdrop-blur-md shadow-lg font-bold text-xs border-chart-4/30">
                          <Star className="h-3 w-3 fill-chart-4 text-chart-4" />
                          {toEnglishDigits(avgRating.toFixed(1))}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="flex flex-1 flex-col p-5">
                    <h3 className="mb-2 text-base font-black line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-tight">
                      {title}
                    </h3>
                    <p className="mb-5 flex-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                      {description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-muted-foreground border-t border-border/40 pt-4">
                      <span className="flex items-center gap-1.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                          <BookOpen className="h-3 w-3 text-primary" />
                        </div>
                        {toEnglishDigits(moduleCount)} {isAr ? "وحدة" : "modules"}
                      </span>
                      {mc.duration_hours && (
                        <span className="flex items-center gap-1.5">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-chart-4/10">
                            <Clock className="h-3 w-3 text-chart-4" />
                          </div>
                          {toEnglishDigits(mc.duration_hours)}h
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-chart-2/10">
                          <Users className="h-3 w-3 text-chart-2" />
                        </div>
                        {toEnglishDigits(enrollmentCount)}
                      </span>
                      {mc.country_code && (
                        <span className="flex items-center gap-1.5 ms-auto">
                          <MapPin className="h-3 w-3 text-primary" />
                          {countryFlag(mc.country_code)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
