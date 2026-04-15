import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CACHE } from "@/lib/queryConfig";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

export interface Recipe {
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

interface CreateRecipeInput {
  title: string;
  description: string;
  cuisine: string;
  difficulty: string;
  prep_time_minutes: string;
  cook_time_minutes: string;
  servings: string;
  ingredients: string;
  steps: string;
}

async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title, title_ar, description, description_ar, image_url, author_id, cuisine, difficulty, prep_time_minutes, cook_time_minutes, servings, is_published, created_at, save_count, slug")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data?.length) return [];

  const authorIds = [...new Set(data.map((r) => r.author_id))];
  const recipeIds = data.map((r) => r.id);

  const [profilesRes, ratingsRes] = await Promise.all([
    supabase.from("profiles").select("user_id, full_name, full_name_ar, display_name, display_name_ar").in("user_id", authorIds),
    supabase.from("recipe_ratings").select("recipe_id, rating").in("recipe_id", recipeIds),
  ]);

  const profileMap = new Map(profilesRes.data?.map((p) => [p.user_id, p.display_name || p.full_name]) || []);
  const ratingsMap = new Map<string, { sum: number; count: number }>();
  ratingsRes.data?.forEach((r) => {
    const existing = ratingsMap.get(r.recipe_id) || { sum: 0, count: 0 };
    ratingsMap.set(r.recipe_id, { sum: existing.sum + r.rating, count: existing.count + 1 });
  });

  return data.map((r) => {
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
}

interface UseRecipesDataReturn {
  recipes: Recipe[];
  isLoading: boolean;
  createRecipe: (input: CreateRecipeInput) => Promise<void>;
  isCreating: boolean;
}

export function useRecipesData(): UseRecipesDataReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["community-recipes"],
    queryFn: fetchRecipes,
    ...CACHE.short,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateRecipeInput) => {
      if (!user) throw new Error("Not authenticated");
      const ingredients = input.ingredients.split("\n").filter(Boolean).map((i) => ({ text: i.trim() }));
      const steps = input.steps.split("\n").filter(Boolean).map((s, idx) => ({ step: idx + 1, text: s.trim() }));
      const { error } = await supabase.from("recipes").insert({
        author_id: user.id,
        title: input.title.trim(),
        description: input.description.trim() || null,
        cuisine: input.cuisine.trim() || null,
        difficulty: input.difficulty,
        prep_time_minutes: input.prep_time_minutes ? parseInt(input.prep_time_minutes) : null,
        cook_time_minutes: input.cook_time_minutes ? parseInt(input.cook_time_minutes) : null,
        servings: input.servings ? parseInt(input.servings) : null,
        ingredients, steps,
      });
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-recipes"] });
    },
  });

  return {
    recipes,
    isLoading,
    createRecipe: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
