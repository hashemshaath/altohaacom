import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, Users, Search, GraduationCap, Star, StarIcon } from "lucide-react";

export default function Masterclasses() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

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

  const filtered = masterclasses.filter((mc: any) => {
    const matchesSearch =
      !search ||
      mc.title?.toLowerCase().includes(search.toLowerCase()) ||
      mc.title_ar?.includes(search) ||
      mc.description?.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === "all" || mc.level === levelFilter;
    const matchesCategory = categoryFilter === "all" || mc.category === categoryFilter;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const categories = [...new Set(masterclasses.map((mc: any) => mc.category))];

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      beginner: "bg-green-500/10 text-green-600",
      intermediate: "bg-yellow-500/10 text-yellow-600",
      advanced: "bg-red-500/10 text-red-600",
      all_levels: "bg-blue-500/10 text-blue-600",
    };
    const labels: Record<string, { en: string; ar: string }> = {
      beginner: { en: "Beginner", ar: "مبتدئ" },
      intermediate: { en: "Intermediate", ar: "متوسط" },
      advanced: { en: "Advanced", ar: "متقدم" },
      all_levels: { en: "All Levels", ar: "جميع المستويات" },
    };
    return (
      <Badge variant="outline" className={colors[level] || ""}>
        {language === "ar" ? labels[level]?.ar : labels[level]?.en}
      </Badge>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold">
            {language === "ar" ? "الدورات التعليمية" : "Masterclasses"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "ar"
              ? "تعلم من أفضل الطهاة والخبراء في عالم الطهي"
              : "Learn from the best chefs and culinary experts"}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "ar" ? "ابحث عن دورة..." : "Search masterclasses..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={language === "ar" ? "المستوى" : "Level"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "ar" ? "جميع المستويات" : "All Levels"}</SelectItem>
              <SelectItem value="beginner">{language === "ar" ? "مبتدئ" : "Beginner"}</SelectItem>
              <SelectItem value="intermediate">{language === "ar" ? "متوسط" : "Intermediate"}</SelectItem>
              <SelectItem value="advanced">{language === "ar" ? "متقدم" : "Advanced"}</SelectItem>
            </SelectContent>
          </Select>
          {categories.length > 1 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={language === "ar" ? "التصنيف" : "Category"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <GraduationCap className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {language === "ar" ? "لا توجد دورات متاحة حالياً" : "No masterclasses available yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((mc: any) => {
              const isEnrolled = myEnrollments.includes(mc.id);
              const moduleCount = mc.masterclass_modules?.length || 0;
              const enrollmentCount = mc.masterclass_enrollments?.length || 0;
              const reviews = mc.masterclass_reviews || [];
              const avgRating = reviews.length > 0
                ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length)
                : null;

              return (
                <Card
                  key={mc.id}
                  className="overflow-hidden cursor-pointer transition-shadow hover:shadow-lg"
                  onClick={() => navigate(`/masterclasses/${mc.id}`)}
                >
                  {mc.cover_image_url ? (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={mc.cover_image_url}
                        alt={mc.title}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      {getLevelBadge(mc.level)}
                      {mc.is_free && (
                        <Badge variant="secondary">
                          {language === "ar" ? "مجاني" : "Free"}
                        </Badge>
                      )}
                      {isEnrolled && (
                        <Badge variant="default">
                          {language === "ar" ? "مسجل" : "Enrolled"}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold line-clamp-2">
                      {language === "ar" && mc.title_ar ? mc.title_ar : mc.title}
                    </h3>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {language === "ar" && mc.description_ar ? mc.description_ar : mc.description}
                    </p>
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground gap-4">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {moduleCount} {language === "ar" ? "وحدة" : "modules"}
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
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {avgRating.toFixed(1)}
                      </span>
                    )}
                  </CardFooter>
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
