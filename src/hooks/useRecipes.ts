import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Recipe {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  ingredients: any[];
  steps: any[];
  image_url: string | null;
  gallery_urls: string[] | null;
  cuisine: string | null;
  difficulty: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  category: string | null;
  tags: string[] | null;
  video_url: string | null;
  country_code: string | null;
  slug: string | null;
  is_published: boolean | null;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export interface RecipeWithMeta extends Recipe {
  author_name: string | null;
  avg_rating: number;
  ratings_count: number;
}

export function useRecipes(filters?: {
  search?: string;
  cuisine?: string;
  difficulty?: string;
  category?: string;
  tag?: string;
}) {
  return useQuery({
    queryKey: ["recipes", filters],
    queryFn: async () => {
      let q = supabase
        .from("recipes")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters?.cuisine) q = q.eq("cuisine", filters.cuisine);
      if (filters?.difficulty) q = q.eq("difficulty", filters.difficulty);
      if (filters?.category) q = q.eq("category", filters.category);
      if (filters?.search) q = q.ilike("title", `%${filters.search}%`);
      if (filters?.tag) q = q.contains("tags", [filters.tag]);

      const { data, error } = await q;
      if (error) throw error;

      const recipes = data || [];
      const authorIds = [...new Set(recipes.map(r => r.author_id))];
      const recipeIds = recipes.map(r => r.id);

      const [profilesRes, ratingsRes] = await Promise.all([
        authorIds.length > 0
          ? supabase.from("profiles").select("user_id, full_name").in("user_id", authorIds)
          : { data: [] },
        recipeIds.length > 0
          ? supabase.from("recipe_ratings").select("recipe_id, rating").in("recipe_id", recipeIds)
          : { data: [] },
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p.full_name]));
      const ratingsMap = new Map<string, { sum: number; count: number }>();
      (ratingsRes.data || []).forEach((r: any) => {
        const existing = ratingsMap.get(r.recipe_id) || { sum: 0, count: 0 };
        ratingsMap.set(r.recipe_id, { sum: existing.sum + r.rating, count: existing.count + 1 });
      });

      return recipes.map(r => {
        const rating = ratingsMap.get(r.id);
        return {
          ...r,
          author_name: profileMap.get(r.author_id) || null,
          avg_rating: rating ? Math.round((rating.sum / rating.count) * 10) / 10 : 0,
          ratings_count: rating?.count || 0,
        } as RecipeWithMeta;
      });
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useRecipeBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["recipe", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const [profileRes, ratingsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url, username").eq("user_id", data.author_id).maybeSingle(),
        supabase.from("recipe_ratings").select("*").eq("recipe_id", data.id),
      ]);

      const ratings = ratingsRes.data || [];
      const avgRating = ratings.length > 0
        ? Math.round(ratings.reduce((s, r) => s + r.rating, 0) / ratings.length * 10) / 10
        : 0;

      return {
        ...data,
        author_name: profileRes.data?.full_name || null,
        author_avatar: profileRes.data?.avatar_url || null,
        author_username: profileRes.data?.username || null,
        avg_rating: avgRating,
        ratings_count: ratings.length,
        ratings,
      };
    },
    enabled: !!slug,
  });
}

export function useRateRecipe() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ recipeId, rating, review }: { recipeId: string; rating: number; review?: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      // Upsert rating
      const { data: existing } = await supabase
        .from("recipe_ratings")
        .select("id")
        .eq("recipe_id", recipeId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from("recipe_ratings")
          .update({ rating, review })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("recipe_ratings")
          .insert({ recipe_id: recipeId, user_id: user.id, rating, review });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipe"] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useDistinctCuisines() {
  return useQuery({
    queryKey: ["recipeCuisines"],
    queryFn: async () => {
      const { data } = await supabase
        .from("recipes")
        .select("cuisine")
        .eq("is_published", true)
        .not("cuisine", "is", null);
      const cuisines = [...new Set((data || []).map(r => r.cuisine).filter(Boolean))] as string[];
      return cuisines.sort();
    },
    staleTime: 1000 * 60 * 5,
  });
}
