import { CACHE } from "@/lib/queryConfig";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { countMatchingWords, sortByRelevance } from "./searchUtils";
import type { PostResult } from "./searchTypes";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

export function useSearchPosts(searchWords: string[], debouncedQuery: string) {
  return useQuery({
    queryKey: ["search-posts", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || searchWords.length === 0) return [];
      const orParts = searchWords.map((w) => `content.ilike.%${w.replace(/[%_]/g, "\\$&")}%`);

      const { data: posts, error } = await supabase
        .from("posts")
        .select("id, content, image_url, video_url, created_at, author_id")
        .eq("moderation_status", "approved")
        .or(orParts.join(","))
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw handleSupabaseError(error);
      if (!posts?.length) return [];

      const scored = posts.map((p) => ({
        ...p,
        _relevance: countMatchingWords(searchWords, p.content),
      }));

      const authorIds = [...new Set(scored.map((p) => p.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", authorIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return sortByRelevance(
        scored.map((p) => {
          const profile = profileMap.get(p.author_id);
          return {
            id: p.id,
            content: p.content,
            image_url: p.image_url,
            video_url: p.video_url || null,
            created_at: p.created_at,
            author_id: p.author_id,
            author_name: profile?.full_name || null,
            author_username: profile?.username || null,
            author_avatar: profile?.avatar_url || null,
            _relevance: p._relevance,
          };
        })
      ) as PostResult[];
    },
    enabled: !!debouncedQuery && searchWords.length > 0,
    ...CACHE.short,
  });
}
