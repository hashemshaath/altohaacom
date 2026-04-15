import { useIsAr } from "@/hooks/useIsAr";
import { useState, useMemo, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChefHat, Clock, Users as UsersIcon, Star, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRecipesData } from "@/hooks/community/useRecipesData";

const difficultyColor = (d: string) => {
  if (d === "easy") return "bg-chart-3/10 text-chart-3";
  if (d === "hard") return "bg-destructive/10 text-destructive";
  return "bg-chart-4/10 text-chart-4";
};

const INITIAL_FORM = {
  title: "", description: "", cuisine: "", difficulty: "medium",
  prep_time_minutes: "", cook_time_minutes: "", servings: "",
  ingredients: "", steps: "",
};

export const RecipesTab = memo(function RecipesTab() {
  const { user } = useAuth();
  const isAr = useIsAr();
  const { toast } = useToast();
  const { recipes: allRecipes, isLoading, createRecipe, isCreating } = useRecipesData();

  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(INITIAL_FORM);

  // Derived state — no separate useState needed
  const recipes = useMemo(
    () => filter === "all" ? allRecipes : allRecipes.filter((r) => r.difficulty === filter),
    [allRecipes, filter]
  );

  const handleCreate = async () => {
    if (!user || !form.title.trim()) return;
    try {
      await createRecipe(form);
      setShowForm(false);
      setForm(INITIAL_FORM);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between"><Skeleton className="h-10 w-40" /><Skeleton className="h-10 w-32" /></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="space-y-2 p-4">
              <Skeleton className="aspect-video w-full rounded-xl" />
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
              <Button onClick={handleCreate} disabled={isCreating || !form.title.trim()}>
                {isCreating ? "..." : isAr ? "نشر الوصفة" : "Publish Recipe"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="group overflow-hidden rounded-xl border border-border/15 bg-card transition-all hover:shadow-md hover:border-primary/15">
            {recipe.image_url && (
              <div className="aspect-[16/10] overflow-hidden bg-muted">
                <img src={recipe.image_url} alt={recipe.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" decoding="async" />
              </div>
            )}
            <div className="p-3.5">
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <h3 className="line-clamp-1 text-[0.8125rem] font-semibold">{recipe.title}</h3>
                <Badge variant="outline" className={`shrink-0 text-[0.625rem] px-1.5 py-0 ${difficultyColor(recipe.difficulty)}`}>
                  {recipe.difficulty}
                </Badge>
              </div>
              {recipe.description && (
                <p className="mb-2 line-clamp-2 text-[0.6875rem] text-muted-foreground/70 leading-relaxed">{recipe.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-[0.6875rem] text-muted-foreground/60 mb-2">
                {recipe.cuisine && (
                  <span className="flex items-center gap-0.5"><ChefHat className="h-3 w-3" />{recipe.cuisine}</span>
                )}
                {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)}min
                  </span>
                )}
                {recipe.servings && (
                  <span className="flex items-center gap-0.5"><UsersIcon className="h-3 w-3" />{recipe.servings}</span>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/10">
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="bg-primary/8 text-primary text-[0.625rem] font-semibold">
                      {(recipe.author_name || "C")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[0.6875rem] text-muted-foreground/60">{recipe.author_name || "Chef"}</span>
                </div>
                {recipe.ratings_count > 0 && (
                  <span className="flex items-center gap-0.5 text-[0.6875rem]">
                    <Star className="h-3 w-3 fill-chart-4 text-chart-4" />
                    {recipe.avg_rating}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {recipes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
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
});
