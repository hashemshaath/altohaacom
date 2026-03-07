import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRecipes, useDistinctCuisines, RecipeWithMeta } from "@/hooks/useRecipes";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ChefHat, Clock, Users as UsersIcon, Star, Search, Flame,
  UtensilsCrossed, ArrowRight, Plus,
} from "lucide-react";

const difficultyColor = (d: string) => {
  if (d === "easy") return "bg-chart-3/10 text-chart-3 border-chart-3/20";
  if (d === "hard") return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-chart-4/10 text-chart-4 border-chart-4/20";
};

const categoryLabels: Record<string, { en: string; ar: string }> = {
  appetizer: { en: "Appetizer", ar: "مقبلات" },
  main_course: { en: "Main Course", ar: "طبق رئيسي" },
  dessert: { en: "Dessert", ar: "حلويات" },
  salad: { en: "Salad", ar: "سلطة" },
  soup: { en: "Soup", ar: "شوربة" },
  beverage: { en: "Beverage", ar: "مشروب" },
  snack: { en: "Snack", ar: "وجبة خفيفة" },
  bread: { en: "Bread", ar: "خبز" },
  sauce: { en: "Sauce", ar: "صلصة" },
  side_dish: { en: "Side Dish", ar: "طبق جانبي" },
};

function RecipeCard({ recipe, isAr }: { recipe: RecipeWithMeta; isAr: boolean }) {
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
  const cat = categoryLabels[recipe.category || "main_course"];

  return (
    <Link to={`/recipes/${recipe.slug || recipe.id}`}>
      <Card className="group h-full overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30 hover:bg-card">
        <div className="aspect-video overflow-hidden bg-muted relative">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.title} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-chart-3/5">
              <UtensilsCrossed className="h-12 w-12 text-primary/15 animate-pulse" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
        </div>
        <CardContent className="p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-semibold">{isAr && recipe.title_ar ? recipe.title_ar : recipe.title}</h3>
            {recipe.difficulty && (
              <Badge variant="outline" className={`shrink-0 text-[10px] ${difficultyColor(recipe.difficulty)}`}>
                {recipe.difficulty}
              </Badge>
            )}
          </div>
          {recipe.description && (
            <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
              {isAr && recipe.description_ar ? recipe.description_ar : recipe.description}
            </p>
          )}
          <div className="mb-3 flex flex-wrap items-center gap-2.5 text-[11px] text-muted-foreground">
            {recipe.cuisine && (
              <span className="flex items-center gap-1"><ChefHat className="h-3 w-3" />{recipe.cuisine}</span>
            )}
            {totalTime > 0 && (
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{totalTime}min</span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-1"><UsersIcon className="h-3 w-3" />{recipe.servings}</span>
            )}
            {recipe.calories && (
              <span className="flex items-center gap-1"><Flame className="h-3 w-3" />{recipe.calories} cal</span>
            )}
          </div>
          {cat && (
            <Badge variant="secondary" className="mb-3 text-[10px]">{isAr ? cat.ar : cat.en}</Badge>
          )}
          <Separator className="mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="bg-primary/10 text-primary text-[8px]">
                  {(recipe.author_name || "C")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground">{recipe.author_name || "Chef"}</span>
            </div>
            <div className="flex items-center gap-2">
              {recipe.ratings_count > 0 && (
                <span className="flex items-center gap-1 text-[10px]">
                  <Star className="h-3 w-3 fill-chart-4 text-chart-4" />
                  {recipe.avg_rating} ({recipe.ratings_count})
                </span>
              )}
              <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Recipes() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { data: cuisines = [] } = useDistinctCuisines();
  const { data: recipes = [], isLoading } = useRecipes({
    search: search || undefined,
    cuisine: cuisine !== "all" ? cuisine : undefined,
    difficulty: difficulty !== "all" ? difficulty : undefined,
    category: category !== "all" ? category : undefined,
  });

  return (
    <PageShell
      title={isAr ? "الوصفات — الطهاة" : "Recipe Database — Altoha"}
      description={isAr ? "اكتشف وشارك وصفات الطهي" : "Discover and share culinary recipes with ingredients, steps, and nutritional data"}
      seoProps={{
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: isAr ? "وصفات الطهي" : "Culinary Recipes",
          url: `${window.location.origin}/recipes`,
          isPartOf: { "@type": "WebSite", name: "Altoha", url: window.location.origin },
        },
      }}
      container={false}
      padding="none"
    >

      <main className="flex-1">
        {/* Compact Hero */}
        <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-5 md:py-12">
            <div className="flex flex-col gap-4 md:gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2 md:space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 ring-1 ring-primary/20">
                  <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    {isAr ? "قاعدة الوصفات" : "Recipe Vault"}
                  </span>
                </div>
                <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
                  {isAr ? "الوصفات" : "Recipes"}
                </h1>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  {isAr
                    ? "اكتشف وصفات من طهاة محترفين حول العالم وشاركنا وصفاتك المميزة."
                    : "Discover recipes from professional chefs worldwide and share your own culinary creations."}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {recipes.length > 0 && (
                  <Badge variant="outline" className="gap-1.5 border-primary/20 bg-primary/5 text-primary px-3 py-1.5">
                    <ChefHat className="h-3.5 w-3.5" />
                    <span className="font-bold">{recipes.length}</span>
                    <span className="text-[10px]">{isAr ? "وصفة" : "Recipes"}</span>
                  </Badge>
                )}
                {user && (
                  <Button className="shadow-sm shadow-primary/15" asChild>
                    <Link to="/recipes/create">
                      <Plus className="me-1.5 h-4 w-4" />
                      {isAr ? "إضافة وصفة" : "Add Recipe"}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="container py-4 md:py-6 space-y-8">
          {/* Sticky Filters Bar */}
          <div className="sticky top-12 z-40 -mx-4 mb-8 border-y border-border/40 bg-background/80 px-4 py-4 backdrop-blur-md md:rounded-2xl md:border md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={isAr ? "ابحث عن وصفة..." : "Search recipes..."}
                  className="h-11 border-border/40 bg-muted/20 ps-11 transition-all focus:bg-background focus:ring-primary/20 rounded-xl"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={cuisine} onValueChange={setCuisine}>
                  <SelectTrigger className="h-11 w-full border-border/40 bg-muted/20 rounded-xl sm:w-40 focus:ring-primary/20"><SelectValue placeholder={isAr ? "المطبخ" : "Cuisine"} /></SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40">
                    <SelectItem value="all" className="rounded-xl">{isAr ? "كل المطابخ" : "All Cuisines"}</SelectItem>
                    {cuisines.map(c => <SelectItem key={c} value={c} className="rounded-xl">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="h-11 w-full border-border/40 bg-muted/20 rounded-xl sm:w-36 focus:ring-primary/20"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40">
                    <SelectItem value="all" className="rounded-xl">{isAr ? "كل المستويات" : "All Levels"}</SelectItem>
                    <SelectItem value="easy" className="rounded-xl">{isAr ? "سهل" : "Easy"}</SelectItem>
                    <SelectItem value="medium" className="rounded-xl">{isAr ? "متوسط" : "Medium"}</SelectItem>
                    <SelectItem value="hard" className="rounded-xl">{isAr ? "صعب" : "Hard"}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 w-full border-border/40 bg-muted/20 rounded-xl sm:w-40 focus:ring-primary/20"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40">
                    <SelectItem value="all" className="rounded-xl">{isAr ? "كل الأنواع" : "All Categories"}</SelectItem>
                    {Object.entries(categoryLabels).map(([key, val]) => (
                      <SelectItem key={key} value={key} className="rounded-xl">{isAr ? val.ar : val.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-11 w-full border-border/40 bg-muted/20 rounded-xl sm:w-36 focus:ring-primary/20"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40">
                    <SelectItem value="newest" className="rounded-xl">{isAr ? "الأحدث" : "Newest"}</SelectItem>
                    <SelectItem value="top_rated" className="rounded-xl">{isAr ? "الأعلى تقييماً" : "Top Rated"}</SelectItem>
                    <SelectItem value="quickest" className="rounded-xl">{isAr ? "الأسرع" : "Quickest"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/50">
                <UtensilsCrossed className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">{isAr ? "لا توجد وصفات" : "No recipes found"}</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                {isAr ? "جرب تغيير معايير البحث" : "Try adjusting your search filters"}
              </p>
              {search && (
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch("")}>
                  {isAr ? "مسح البحث" : "Clear search"}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...recipes].sort((a, b) => {
                if (sortBy === "top_rated") return b.avg_rating - a.avg_rating;
                if (sortBy === "quickest") return ((a.prep_time_minutes || 0) + (a.cook_time_minutes || 0)) - ((b.prep_time_minutes || 0) + (b.cook_time_minutes || 0));
                return 0; // newest is default from API
              }).map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} isAr={isAr} />
              ))}
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}