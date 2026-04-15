import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE } from "@/lib/queryConfig";
import { buildFlexibleFilter, countMatchingWords, sortByRelevance } from "./searchUtils";
import type { RecipeResult } from "./searchTypes";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

export function useSearchRecipes(searchWords: string[], debouncedQuery: string) {
  return useQuery({
    queryKey: ["search-recipes", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || searchWords.length === 0) return [];
      const cols = ["title", "title_ar", "description", "description_ar"];
      const { data, error } = await (supabase
        .from("recipes")
        .select("id, title, title_ar, description, description_ar, image_url, prep_time, cook_time, average_rating, slug") as any)
        .eq("status", "published")
        .or(buildFlexibleFilter(searchWords, cols))
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw handleSupabaseError(error);
      if (!data) return [];
      return sortByRelevance(
        data.map((r: any) => ({
          ...r,
          _relevance: countMatchingWords(searchWords, r.title, r.title_ar, r.description, r.description_ar),
        }))
      ) as RecipeResult[];
    },
    enabled: !!debouncedQuery && searchWords.length > 0,
    ...CACHE.short,
  });
}
