import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE } from "@/lib/queryConfig";
import { buildFlexibleFilter, countMatchingWords, sortByRelevance } from "./searchUtils";
import type { CompetitionResult, SearchFilters } from "./searchTypes";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

export function useSearchCompetitions(searchWords: string[], debouncedQuery: string, filters: SearchFilters) {
  return useQuery({
    queryKey: ["search-competitions", debouncedQuery, filters.competitionStatus, filters.isVirtual],
    queryFn: async () => {
      if (!debouncedQuery || searchWords.length === 0) return [];
      const cols = ["title", "title_ar", "description", "description_ar", "city", "venue", "venue_ar", "country"];
      let query = supabase
        .from("competitions")
        .select("id, title, title_ar, description, description_ar, cover_image_url, status, competition_start, competition_end, venue, venue_ar, city, country, is_virtual")
        .neq("status", "draft")
        .or(buildFlexibleFilter(searchWords, cols));

      if (filters.competitionStatus && filters.competitionStatus !== "all") {
        query = query.eq("status", filters.competitionStatus);
      }
      if (filters.isVirtual !== null) {
        query = query.eq("is_virtual", filters.isVirtual);
      }

      const { data, error } = await query.order("competition_start", { ascending: false }).limit(30);
      if (error) throw handleSupabaseError(error);
      if (!data) return [];

      return sortByRelevance(
        data.map((r) => ({
          ...r,
          _relevance: countMatchingWords(searchWords, r.title, r.title_ar, r.description, r.description_ar, r.city, r.venue, r.venue_ar, r.country),
        }))
      ) as CompetitionResult[];
    },
    enabled: !!debouncedQuery && searchWords.length > 0,
    ...CACHE.short,
  });
}
