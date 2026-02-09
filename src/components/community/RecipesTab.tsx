import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChefHat, Clock, Users as UsersIcon, Star, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  cuisine: string | null;
  difficulty: string;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  author_id: string;
  author_name: string | null;
  avg_rating: number;
  ratings_count: number;
  created_at: string;
}

const difficultyColor = (d: string) => {
  if (d === "easy") return "bg-chart-3/10 text-chart-3";
  if (d === "hard") return "bg-destructive/10 text-destructive";
  return "bg-chart-4/10 text-chart-4";
};

export function RecipesTab() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    title: "", description: "", cuisine: "", difficulty: "medium",
    prep_time_minutes: "", cook_time_minutes: "", servings: "",
    ingredients: "", steps: "",
  });

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) { setLoading(false); return; }

    const authorIds = [...new Set(data?.map((r) => r.author_id) || [])];
    const recipeIds = data?.map((r) => r.id) || [];

    const [profilesRes, ratingsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").in("user_id", authorIds),
      supabase.from("recipe_ratings").select("recipe_id, rating").in("recipe_id", recipeIds),
    ]);

    const profileMap = new Map(profilesRes.data?.map((p) => [p.user_id, p.full_name]) || []);
    const ratingsMap = new Map<string, { sum: number; count: number }>();
    ratingsRes.data?.forEach((r) => {
      const existing = ratingsMap.get(r.recipe_id) || { sum: 0, count: 0 };
      ratingsMap.set(r.recipe_id, { sum: existing.sum + r.rating, count: existing.count + 1 });
    });

    const enriched: Recipe[] = (data || []).map((r) => {
      const rating = ratingsMap.get(r.id);
      return {
        id: r.id, title: r.title, description: r.description, image_url: r.image_url,
        cuisine: r.cuisine, difficulty: r.difficulty || "medium",
        prep_time_minutes: r.prep_time_minutes, cook_time_minutes: r.cook_time_minutes,
        servings: r.servings, author_id: r.author_id,
        author_name: profileMap.get(r.author_id) || null,
        avg_rating: rating ? Math.round((rating.sum / rating.count) * 10) / 10 : 0,
        ratings_count: rating?.count || 0,
        created_at: r.created_at,
      };
    });

    setRecipes(filter === "all" ? enriched : enriched.filter((r) => r.difficulty === filter));
    setLoading(false);
  };

  useEffect(() => { fetchRecipes(); }, [filter]);

  const handleCreate = async () => {
    if (!user || !form.title.trim()) return;
    setCreating(true);

    const ingredients = form.ingredients.split("\n").filter(Boolean).map((i) => ({ text: i.trim() }));
    const steps = form.steps.split("\n").filter(Boolean).map((s, idx) => ({ step: idx + 1, text: s.trim() }));

    const { error } = await supabase.from("recipes").insert({
      author_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      cuisine: form.cuisine.trim() || null,
      difficulty: form.difficulty,
      prep_time_minutes: form.prep_time_minutes ? parseInt(form.prep_time_minutes) : null,
      cook_time_minutes: form.cook_time_minutes ? parseInt(form.cook_time_minutes) : null,
      servings: form.servings ? parseInt(form.servings) : null,
      ingredients, steps,
    });

    setCreating(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setShowForm(false);
      setForm({ title: "", description: "", cuisine: "", difficulty: "medium", prep_time_minutes: "", cook_time_minutes: "", servings: "", ingredients: "", steps: "" });
      fetchRecipes();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between"><Skeleton className="h-10 w-40" /><Skeleton className="h-10 w-32" /></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="space-y-2 p-4">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-full" />
            </CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All Levels"}</SelectItem>
            <SelectItem value="easy">{isAr ? "سهل" : "Easy"}</SelectItem>
            <SelectItem value="medium">{isAr ? "متوسط" : "Medium"}</SelectItem>
            <SelectItem value="hard">{isAr ? "صعب" : "Hard"}</SelectItem>
          </SelectContent>
        </Select>
        {user && (
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"} className="gap-1.5">
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? (isAr ? "إلغاء" : "Cancel") : (isAr ? "إضافة وصفة" : "Add Recipe")}
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isAr ? "وصفة جديدة" : "New Recipe"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "اسم الوصفة" : "Recipe Title"}</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "المطبخ" : "Cuisine"}</Label>
                <Input value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })} placeholder="e.g. Italian, Middle Eastern" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الوصف" : "Description"}</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الصعوبة" : "Difficulty"}</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">{isAr ? "سهل" : "Easy"}</SelectItem>
                    <SelectItem value="medium">{isAr ? "متوسط" : "Medium"}</SelectItem>
                    <SelectItem value="hard">{isAr ? "صعب" : "Hard"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "تحضير (دقيقة)" : "Prep (min)"}</Label>
                <Input type="number" value={form.prep_time_minutes} onChange={(e) => setForm({ ...form, prep_time_minutes: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "طبخ (دقيقة)" : "Cook (min)"}</Label>
                <Input type="number" value={form.cook_time_minutes} onChange={(e) => setForm({ ...form, cook_time_minutes: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الحصص" : "Servings"}</Label>
                <Input type="number" value={form.servings} onChange={(e) => setForm({ ...form, servings: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "المكونات (سطر لكل مكون)" : "Ingredients (one per line)"}</Label>
              <Textarea value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} rows={3} placeholder="200g flour&#10;3 eggs&#10;100ml milk" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الخطوات (سطر لكل خطوة)" : "Steps (one per line)"}</Label>
              <Textarea value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} rows={3} placeholder="Mix dry ingredients&#10;Add eggs and milk&#10;Bake at 180°C for 25 minutes" />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleCreate} disabled={creating || !form.title.trim()}>
                {creating ? "..." : isAr ? "نشر الوصفة" : "Publish Recipe"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <Card key={recipe.id} className="group overflow-hidden">
            {recipe.image_url && (
              <div className="aspect-video overflow-hidden bg-muted">
                <img src={recipe.image_url} alt={recipe.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
              </div>
            )}
            <CardContent className="p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="line-clamp-1 text-sm font-semibold">{recipe.title}</h3>
                <Badge variant="outline" className={`shrink-0 text-[10px] ${difficultyColor(recipe.difficulty)}`}>
                  {recipe.difficulty}
                </Badge>
              </div>
              {recipe.description && (
                <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{recipe.description}</p>
              )}
              <div className="mb-3 flex flex-wrap items-center gap-2.5 text-[10px] text-muted-foreground">
                {recipe.cuisine && (
                  <span className="flex items-center gap-1"><ChefHat className="h-3 w-3" />{recipe.cuisine}</span>
                )}
                {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)}min
                  </span>
                )}
                {recipe.servings && (
                  <span className="flex items-center gap-1"><UsersIcon className="h-3 w-3" />{recipe.servings}</span>
                )}
              </div>
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
                {recipe.ratings_count > 0 && (
                  <span className="flex items-center gap-1 text-[10px]">
                    <Star className="h-3 w-3 fill-chart-4 text-chart-4" />
                    {recipe.avg_rating} ({recipe.ratings_count})
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {recipes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 rounded-2xl bg-muted/60 p-4">
              <ChefHat className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isAr ? "لا توجد وصفات بعد" : "No recipes yet. Be the first to share one!"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
