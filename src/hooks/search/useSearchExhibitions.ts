import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE } from "@/lib/queryConfig";
import { buildFlexibleFilter, countMatchingWords, sortByRelevance } from "./searchUtils";
import type { ExhibitionResult } from "./searchTypes";

export function useSearchExhibitions(searchWords: string[], debouncedQuery: string) {
  return useQuery({
    queryKey: ["search-exhibitions", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || searchWords.length === 0) return [];
      const cols = ["title", "title_ar", "description", "description_ar", "venue", "venue_ar", "city", "country"];
      const { data, error } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, description, description_ar, cover_image_url, slug, start_date, end_date, venue, venue_ar, city, country, status")
        .or(buildFlexibleFilter(searchWords, cols))
        .order("start_date", { ascending: false })
        .limit(20);
      if (error) throw error;
      if (!data) return [];
      return sortByRelevance(
        data.map((r) => ({
          ...r,
          _relevance: countMatchingWords(searchWords, r.title, r.title_ar, r.description, r.description_ar, r.venue, r.city, r.country),
        }))
      ) as ExhibitionResult[];
    },
    enabled: !!debouncedQuery && searchWords.length > 0,
    ...CACHE.short,
  });
}
