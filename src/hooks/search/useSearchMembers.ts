import { CACHE } from "@/lib/queryConfig";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { buildFlexibleFilter, countMatchingWords, sortByRelevance } from "./searchUtils";
import type { MemberResult, SearchFilters } from "./searchTypes";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

export function useSearchMembers(searchWords: string[], debouncedQuery: string, filters: SearchFilters) {
  return useQuery({
    queryKey: ["search-members", debouncedQuery, filters.memberRole, filters.experienceLevel],
    queryFn: async () => {
      if (!debouncedQuery || searchWords.length === 0) return [];
      const cols = [
        "full_name", "full_name_ar", "display_name", "display_name_ar",
        "username", "bio", "bio_ar", "specialization", "specialization_ar", "location",
      ];
      let query = supabase
        .from("profiles")
        .select("id, user_id, full_name, full_name_ar, display_name, display_name_ar, username, avatar_url, bio, bio_ar, specialization, specialization_ar, experience_level, location, is_verified")
        .eq("account_status", "active")
        .or(buildFlexibleFilter(searchWords, cols));

      if (filters.experienceLevel && filters.experienceLevel !== "all") {
        query = query.eq("experience_level", filters.experienceLevel);
      }

      const { data, error } = await query.limit(30);
      if (error) throw handleSupabaseError(error);

      let scored = (data || []).map((r) => ({
        ...r,
        _relevance: countMatchingWords(searchWords, r.full_name, r.full_name_ar, r.display_name, r.display_name_ar, r.username, r.bio, r.bio_ar, r.specialization, r.specialization_ar, r.location),
      }));

      if (filters.memberRole && filters.memberRole !== "all" && scored.length > 0) {
        const userIds = scored.map((m) => m.user_id);
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", filters.memberRole as Database["public"]["Enums"]["app_role"])
          .in("user_id", userIds);
        const filteredUserIds = new Set(rolesData?.map((r) => r.user_id) || []);
        scored = scored.filter((m) => filteredUserIds.has(m.user_id));
      }

      return sortByRelevance(scored) as MemberResult[];
    },
    enabled: !!debouncedQuery && searchWords.length > 0,
    ...CACHE.short,
  });
}
