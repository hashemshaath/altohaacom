import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRecipes, useDistinctCuisines, RecipeWithMeta } from "@/hooks/useRecipes";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
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
      <Card className="group h-full overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20">
        <div className="aspect-video overflow-hidden bg-muted">
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UtensilsCrossed className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
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

  const { data: cuisines = [] } = useDistinctCuisines();
  const { data: recipes = [], isLoading } = useRecipes({
    search: search || undefined,
    cuisine: cuisine !== "all" ? cuisine : undefined,
    difficulty: difficulty !== "all" ? difficulty : undefined,
    category: category !== "all" ? category : undefined,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={isAr ? "الوصفات - الطهاة" : "Recipe Database - Altohaa"}
        description={isAr ? "اكتشف وشارك وصفات الطهي" : "Discover and share culinary recipes with ingredients, steps, and nutritional data"}
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-chart-3/80 py-16 text-primary-foreground">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-primary-foreground/5 blur-2xl" />
          <div className="container relative z-10 mx-auto px-4 text-center">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur-sm mb-4">
              <UtensilsCrossed className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold md:text-4xl">
              {isAr ? "قاعدة الوصفات" : "Recipe Database"}
            </h1>
            <p className="mt-3 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              {isAr
                ? "اكتشف وصفات من طهاة محترفين حول العالم وشاركنا وصفاتك المميزة"
                : "Discover recipes from professional chefs worldwide and share your own culinary creations"}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
              <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground px-3 py-1.5">
                <ChefHat className="h-3 w-3 me-1" />
                {recipes.length} {isAr ? "وصفة" : "Recipes"}
              </Badge>
              <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground px-3 py-1.5">
                <Star className="h-3 w-3 me-1" />
                {cuisines.length} {isAr ? "مطبخ" : "Cuisines"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 py-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={isAr ? "ابحث عن وصفة..." : "Search recipes..."}
                  className="ps-9"
                />
              </div>
              <Select value={cuisine} onValueChange={setCuisine}>
                <SelectTrigger className="w-40"><SelectValue placeholder={isAr ? "المطبخ" : "Cuisine"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "كل المطابخ" : "All Cuisines"}</SelectItem>
                  {cuisines.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "كل المستويات" : "All Levels"}</SelectItem>
                  <SelectItem value="easy">{isAr ? "سهل" : "Easy"}</SelectItem>
                  <SelectItem value="medium">{isAr ? "متوسط" : "Medium"}</SelectItem>
                  <SelectItem value="hard">{isAr ? "صعب" : "Hard"}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "كل الأنواع" : "All Categories"}</SelectItem>
                  {Object.entries(categoryLabels).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{isAr ? val.ar : val.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Grid */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="aspect-video w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-16 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <UtensilsCrossed className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">{isAr ? "لا توجد وصفات" : "No recipes found"}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isAr ? "جرب تغيير معايير البحث" : "Try adjusting your search filters"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} isAr={isAr} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
