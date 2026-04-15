import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildFlexibleFilter, countMatchingWords, sortByRelevance } from "./searchUtils";
import type { ArticleResult, SearchFilters } from "./searchTypes";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

export function useSearchArticles(searchWords: string[], debouncedQuery: string, filters: SearchFilters) {
  return useQuery({
    queryKey: ["search-articles", debouncedQuery, filters.articleType, filters.articleStatus],
    queryFn: async () => {
      if (!debouncedQuery || searchWords.length === 0) return [];
      const cols = ["title", "title_ar", "excerpt", "excerpt_ar", "content", "content_ar"];
      let query = supabase
        .from("articles")
        .select("id, title, title_ar, excerpt, excerpt_ar, featured_image_url, type, status, published_at, slug")
        .or(buildFlexibleFilter(searchWords, cols));

      if (filters.articleType && filters.articleType !== "all") {
        query = query.eq("type", filters.articleType);
      }
      if (filters.articleStatus && filters.articleStatus !== "all") {
        query = query.eq("status", filters.articleStatus);
      } else {
        query = query.eq("status", "published");
      }

      const { data, error } = await query.order("published_at", { ascending: false }).limit(30);
      if (error) throw handleSupabaseError(error);
      if (!data) return [];

      return sortByRelevance(
        data.map((r) => ({
          ...r,
          _relevance: countMatchingWords(searchWords, r.title, r.title_ar, r.excerpt, r.excerpt_ar),
        }))
      ) as ArticleResult[];
    },
    enabled: !!debouncedQuery && searchWords.length > 0,
    ...CACHE.short,
  });
}
