import { CACHE } from "@/lib/queryConfig";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildFlexibleFilter, countMatchingWords, sortByRelevance } from "./searchUtils";
import type { EntityResult } from "./searchTypes";

export function useSearchEntities(searchWords: string[], debouncedQuery: string) {
  return useQuery({
    queryKey: ["search-entities", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || searchWords.length === 0) return [];

      const entityCols = ["name", "name_ar", "description", "description_ar", "city", "country"];
      const estabCols = ["name", "name_ar", "description", "description_ar", "city", "cuisine_type", "cuisine_type_ar"];
      const companyCols = ["name", "name_ar", "description", "description_ar", "city", "country"];

      const [entRes, estRes, compRes] = await Promise.all([
        supabase
          .from("culinary_entities")
          .select("id, name, name_ar, type, description, description_ar, logo_url, city, country, is_verified")
          .eq("is_visible", true)
          .or(buildFlexibleFilter(searchWords, entityCols))
          .limit(15),
        supabase
          .from("establishments")
          .select("id, name, name_ar, type, description, description_ar, logo_url, city, city_ar, is_verified")
          .eq("is_active", true)
          .or(buildFlexibleFilter(searchWords, estabCols))
          .limit(15),
        supabase
          .from("companies")
          .select("id, name, name_ar, type, description, description_ar, logo_url, city, country")
          .eq("status", "active")
          .or(buildFlexibleFilter(searchWords, companyCols))
          .limit(15),
      ]);

      const entities: EntityResult[] = (entRes.data || []).map((e) => ({
        id: e.id, name: e.name, name_ar: e.name_ar, type: e.type, description: e.description,
        description_ar: e.description_ar, logo_url: e.logo_url, city: e.city, country: e.country,
        is_verified: e.is_verified, source: "entity" as const,
        _relevance: countMatchingWords(searchWords, e.name, e.name_ar, e.description, e.description_ar, e.city, e.country),
      }));

      const establishments: EntityResult[] = (estRes.data || []).map((e) => ({
        id: e.id, name: e.name, name_ar: e.name_ar, type: e.type, description: e.description,
        description_ar: e.description_ar, logo_url: e.logo_url, city: e.city, country: null,
        is_verified: e.is_verified, source: "establishment" as const,
        _relevance: countMatchingWords(searchWords, e.name, e.name_ar, e.description, e.description_ar, e.city),
      }));

      const companies: EntityResult[] = (compRes.data || []).map((e) => ({
        id: e.id, name: e.name, name_ar: e.name_ar, type: e.type, description: e.description,
        description_ar: e.description_ar, logo_url: e.logo_url, city: e.city, country: e.country,
        is_verified: true, source: "entity" as const,
        _relevance: countMatchingWords(searchWords, e.name, e.name_ar, e.description, e.description_ar, e.city, e.country),
      }));

      return sortByRelevance([...entities, ...establishments, ...companies]);
    },
    enabled: !!debouncedQuery && searchWords.length > 0,
    ...CACHE.short,
  });
}
