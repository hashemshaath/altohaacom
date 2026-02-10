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
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Culinary Masterclasses"
        description="Learn from world-class chefs with our curated masterclasses. From French cuisine to pastry arts."
      />
      <Header />
      <main className="container flex-1 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <h1 className="font-serif text-2xl font-bold md:text-3xl">
              {isAr ? "الدورات التعليمية" : "Masterclasses"}
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            {isAr
              ? "تعلم من أفضل الطهاة والخبراء في عالم الطهي"
              : "Learn from the best chefs and culinary experts"}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "ابحث عن دورة..." : "Search masterclasses..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10"
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={isAr ? "المستوى" : "Level"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "جميع المستويات" : "All Levels"}</SelectItem>
              <SelectItem value="beginner">{isAr ? "مبتدئ" : "Beginner"}</SelectItem>
              <SelectItem value="intermediate">{isAr ? "متوسط" : "Intermediate"}</SelectItem>
              <SelectItem value="advanced">{isAr ? "متقدم" : "Advanced"}</SelectItem>
            </SelectContent>
          </Select>
          {categories.length > 1 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={isAr ? "التصنيف" : "Category"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {countryCodes.length > 1 && (
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <MapPin className="me-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder={isAr ? "الدولة" : "Country"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع الدول" : "All Countries"}</SelectItem>
                {countryCodes.map((code) => (
                  <SelectItem key={code} value={code}>
                    {countryFlag(code)} {getCountryName(code)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="group h-full overflow-hidden cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col"
                  onClick={() => navigate(`/masterclasses/${mc.id}`)}
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {mc.cover_image_url ? (
                      <img
                        src={mc.cover_image_url}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-muted">
                        <BookOpen className="h-10 w-10 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>
                  <CardContent className="flex flex-1 flex-col p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      {getLevelBadge(mc.level)}
                      {mc.is_free && (
                        <Badge variant="secondary" className="text-[10px]">
                          {isAr ? "مجاني" : "Free"}
                        </Badge>
                      )}
                      {isEnrolled && (
                        <Badge variant="default" className="text-[10px]">
                          {isAr ? "مسجل" : "Enrolled"}
                        </Badge>
                      )}
                    </div>
                    <h3 className="mb-1.5 text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                      {title}
                    </h3>
                    <p className="mb-3 flex-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground border-t pt-3">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {moduleCount} {isAr ? "وحدة" : "modules"}
                      </span>
                      {mc.duration_hours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {mc.duration_hours}h
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {enrollmentCount}
                      </span>
                      {avgRating !== null && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-chart-4 text-chart-4" />
                          {avgRating.toFixed(1)}
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
