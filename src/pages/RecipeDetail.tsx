import { useParams, Link } from "react-router-dom";
import { useState, lazy, Suspense } from "react";

import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRecipeBySlug, useRateRecipe } from "@/hooks/useRecipes";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, ChefHat, Clock, Users as UsersIcon, Star, Flame,
  UtensilsCrossed, Share2, Check, Wheat, Beef, Droplets,
} from "lucide-react";

const RecipeReviews = lazy(() => import("@/components/fan/RecipeReviews").then(m => ({ default: m.RecipeReviews })));

const difficultyColor = (d: string) => {
  if (d === "easy") return "bg-chart-3/10 text-chart-3";
  if (d === "hard") return "bg-destructive/10 text-destructive";
  return "bg-chart-4/10 text-chart-4";
};

export default function RecipeDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const { data: recipe, isLoading } = useRecipeBySlug(slug);
  const rateMutation = useRateRecipe();
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState("");
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="container flex-1 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full rounded-xl mb-6" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-40 w-full" />
            </div>
            <Skeleton className="h-60 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="container flex-1 py-16 text-center">
          <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-xl font-bold">{isAr ? "الوصفة غير موجودة" : "Recipe not found"}</h2>
          <Button variant="outline" className="mt-4 gap-2" asChild>
            <Link to="/recipes"><ArrowLeft className="h-4 w-4" />{isAr ? "العودة" : "Back to Recipes"}</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const title = isAr && recipe.title_ar ? recipe.title_ar : recipe.title;
  const description = isAr && recipe.description_ar ? recipe.description_ar : recipe.description;
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
  const hasNutrition = recipe.calories || recipe.protein_g || recipe.carbs_g || recipe.fat_g;

  const toggleStep = (idx: number) => {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const handleRate = () => {
    if (!myRating) return;
    rateMutation.mutate(
      { recipeId: recipe.id, rating: myRating, review: myReview || undefined },
      { onSuccess: () => toast({ title: isAr ? "تم التقييم" : "Rating submitted!" }) }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={`${title} - Altoha`}
        description={description || ""}
        ogImage={recipe.image_url || undefined}
        ogType="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Recipe",
          name: title,
          description: description || undefined,
          image: recipe.image_url || undefined,
          prepTime: recipe.prep_time_minutes ? `PT${recipe.prep_time_minutes}M` : undefined,
          cookTime: recipe.cook_time_minutes ? `PT${recipe.cook_time_minutes}M` : undefined,
          totalTime: totalTime ? `PT${totalTime}M` : undefined,
          recipeYield: recipe.servings ? `${recipe.servings} servings` : undefined,
          recipeCategory: recipe.cuisine || undefined,
          nutrition: hasNutrition ? {
            "@type": "NutritionInformation",
            calories: recipe.calories ? `${recipe.calories} cal` : undefined,
            proteinContent: recipe.protein_g ? `${recipe.protein_g}g` : undefined,
            carbohydrateContent: recipe.carbs_g ? `${recipe.carbs_g}g` : undefined,
            fatContent: recipe.fat_g ? `${recipe.fat_g}g` : undefined,
          } : undefined,
          recipeIngredient: ingredients.map((i: any) => typeof i === "string" ? i : i.name || ""),
          recipeInstructions: steps.map((s: any, idx: number) => ({
            "@type": "HowToStep",
            position: idx + 1,
            text: typeof s === "string" ? s : s.text || s.instruction || "",
          })),
        }}
      />
      <Header />

      <main className="flex-1">
        {/* Hero image */}
        {recipe.image_url && (
          <div className="relative h-64 md:h-80 overflow-hidden">
            <img src={recipe.image_url} alt={title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-4 start-4">
              <Button variant="ghost" size="sm" className="text-primary-foreground" asChild>
                <Link to="/recipes"><ArrowLeft className="me-1.5 h-4 w-4" />{isAr ? "العودة" : "Back"}</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="container py-8">
          {!recipe.image_url && (
            <Button variant="ghost" size="sm" className="mb-4 -ms-2" asChild>
              <Link to="/recipes"><ArrowLeft className="me-1.5 h-4 w-4" />{isAr ? "العودة للوصفات" : "Back to Recipes"}</Link>
            </Button>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title & meta */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {recipe.cuisine && <Badge variant="secondary"><ChefHat className="h-3 w-3 me-1" />{recipe.cuisine}</Badge>}
                  {recipe.difficulty && <Badge variant="outline" className={difficultyColor(recipe.difficulty)}>{recipe.difficulty}</Badge>}
                  {recipe.category && <Badge variant="outline">{recipe.category.replace("_", " ")}</Badge>}
                </div>
                <h1 className="text-3xl font-bold font-serif">{title}</h1>
                {description && <p className="mt-2 text-muted-foreground">{description}</p>}

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {totalTime > 0 && (
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{totalTime} min</span>
                  )}
                  {recipe.servings && (
                    <span className="flex items-center gap-1"><UsersIcon className="h-4 w-4" />{recipe.servings} {isAr ? "حصة" : "servings"}</span>
                  )}
                  {recipe.calories && (
                    <span className="flex items-center gap-1"><Flame className="h-4 w-4" />{recipe.calories} cal</span>
                  )}
                  {recipe.ratings_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-chart-4 text-chart-4" />
                      {recipe.avg_rating} ({recipe.ratings_count})
                    </span>
                  )}
                </div>

                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {recipe.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-[10px]">#{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Time breakdown */}
              {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                <div className="grid grid-cols-3 gap-3">
                  {recipe.prep_time_minutes && (
                    <Card><CardContent className="py-4 text-center">
                      <p className="text-xs text-muted-foreground">{isAr ? "تحضير" : "Prep"}</p>
                      <p className="text-lg font-bold">{recipe.prep_time_minutes}<span className="text-xs text-muted-foreground ms-1">min</span></p>
                    </CardContent></Card>
                  )}
                  {recipe.cook_time_minutes && (
                    <Card><CardContent className="py-4 text-center">
                      <p className="text-xs text-muted-foreground">{isAr ? "طبخ" : "Cook"}</p>
                      <p className="text-lg font-bold">{recipe.cook_time_minutes}<span className="text-xs text-muted-foreground ms-1">min</span></p>
                    </CardContent></Card>
                  )}
                  <Card><CardContent className="py-4 text-center">
                    <p className="text-xs text-muted-foreground">{isAr ? "إجمالي" : "Total"}</p>
                    <p className="text-lg font-bold">{totalTime}<span className="text-xs text-muted-foreground ms-1">min</span></p>
                  </CardContent></Card>
                </div>
              )}

              {/* Ingredients */}
              <section>
                <h2 className="text-xl font-semibold mb-3">{isAr ? "المكونات" : "Ingredients"}</h2>
                <Card>
                  <CardContent className="py-4">
                    <ul className="space-y-2">
                      {ingredients.map((ing: any, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                          {typeof ing === "string" ? ing : ing.text || JSON.stringify(ing)}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>

              {/* Steps */}
              <section>
                <h2 className="text-xl font-semibold mb-3">
                  {isAr ? "الخطوات" : "Instructions"}
                  <span className="text-sm text-muted-foreground font-normal ms-2">
                    {checkedSteps.size}/{steps.length}
                  </span>
                </h2>
                {steps.length > 0 && (
                  <Progress value={(checkedSteps.size / steps.length) * 100} className="mb-4 h-1.5" />
                )}
                <div className="space-y-3">
                  {steps.map((step: any, i: number) => {
                    const text = typeof step === "string" ? step : step.text || JSON.stringify(step);
                    const done = checkedSteps.has(i);
                    return (
                      <Card
                        key={i}
                        className={`cursor-pointer transition-all ${done ? "border-chart-2/30 bg-chart-2/5" : ""}`}
                        onClick={() => toggleStep(i)}
                      >
                        <CardContent className="flex items-start gap-3 py-4">
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-chart-2 text-chart-2-foreground" : "bg-primary/10 text-primary"}`}>
                            {done ? <Check className="h-4 w-4" /> : i + 1}
                          </div>
                          <p className={`text-sm ${done ? "line-through text-muted-foreground" : ""}`}>{text}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>

              {/* Gallery */}
              {recipe.gallery_urls && recipe.gallery_urls.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-3">{isAr ? "معرض الصور" : "Gallery"}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {recipe.gallery_urls.map((url, i) => (
                      <img key={i} src={url} alt={`${title} ${i + 1}`} className="rounded-lg aspect-video object-cover" />
                    ))}
                  </div>
                </section>
              )}

              {/* Rating */}
              {user && (
                <section>
                  <h2 className="text-xl font-semibold mb-3">{isAr ? "قيّم هذه الوصفة" : "Rate this Recipe"}</h2>
                  <Card>
                    <CardContent className="py-4 space-y-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} onClick={() => setMyRating(s)} className="p-1">
                            <Star className={`h-6 w-6 transition-colors ${s <= myRating ? "fill-chart-4 text-chart-4" : "text-muted-foreground/30"}`} />
                          </button>
                        ))}
                      </div>
                      <Textarea
                        value={myReview}
                        onChange={e => setMyReview(e.target.value)}
                        placeholder={isAr ? "أضف تعليقاً (اختياري)..." : "Add a review (optional)..."}
                        rows={2}
                      />
                      <Button onClick={handleRate} disabled={!myRating || rateMutation.isPending} size="sm">
                        {isAr ? "إرسال التقييم" : "Submit Rating"}
                      </Button>
                    </CardContent>
                  </Card>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Author */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{isAr ? "الطاهي" : "Chef"}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {recipe.author_avatar && <AvatarImage src={recipe.author_avatar} />}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(recipe.author_name || "C")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{recipe.author_name || "Chef"}</p>
                    {recipe.author_username && (
                      <Link to={`/profile/${recipe.author_username}`} className="text-xs text-primary hover:underline">
                        @{recipe.author_username}
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Nutritional Info */}
              {hasNutrition && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Flame className="h-4 w-4 text-chart-5" />
                      {isAr ? "القيمة الغذائية" : "Nutrition Facts"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {recipe.calories && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isAr ? "سعرات حرارية" : "Calories"}</span>
                        <span className="font-semibold">{recipe.calories}</span>
                      </div>
                    )}
                    <Separator />
                    {recipe.protein_g && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground"><Beef className="h-3 w-3" />{isAr ? "بروتين" : "Protein"}</span>
                        <span className="font-semibold">{recipe.protein_g}g</span>
                      </div>
                    )}
                    {recipe.carbs_g && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground"><Wheat className="h-3 w-3" />{isAr ? "كربوهيدرات" : "Carbs"}</span>
                        <span className="font-semibold">{recipe.carbs_g}g</span>
                      </div>
                    )}
                    {recipe.fat_g && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground"><Droplets className="h-3 w-3" />{isAr ? "دهون" : "Fat"}</span>
                        <span className="font-semibold">{recipe.fat_g}g</span>
                      </div>
                    )}
                    {recipe.fiber_g && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{isAr ? "ألياف" : "Fiber"}</span>
                        <span className="font-semibold">{recipe.fiber_g}g</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Share */}
              <Button variant="outline" className="w-full gap-2" onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast({ title: isAr ? "تم نسخ الرابط" : "Link copied!" });
              }}>
                <Share2 className="h-4 w-4" />{isAr ? "مشاركة الوصفة" : "Share Recipe"}
              </Button>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-8">
            <Suspense fallback={<div className="h-32 rounded-xl bg-muted animate-pulse" />}>
              <RecipeReviews recipeId={recipe.id} />
            </Suspense>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
