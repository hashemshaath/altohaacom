import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE } from "@/lib/queryConfig";

export interface ContentReview {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  rating: number;
  content: string | null;
  is_visible: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export function useContentReviews(entityType: string, entityId: string) {
  return useQuery<ContentReview[]>({
    queryKey: ["content-reviews", entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_reviews")
        .select("id, user_id, entity_type, entity_id, rating, content, is_visible, helpful_count, created_at, updated_at")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as ContentReview[];
    },
    ...CACHE.default,
  });
}

export function useContentReviewStats(entityType: string, entityId: string) {
  const { data: reviews = [] } = useContentReviews(entityType, entityId);
  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { count, avg: Math.round(avg * 10) / 10 };
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (review: { entity_type: string; entity_id: string; rating: number; content?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("content_reviews")
        .upsert(
          {
            user_id: user.id,
            entity_type: review.entity_type,
            entity_id: review.entity_id,
            rating: review.rating,
            content: review.content || null,
            updated_at: new Date().toISOString(),
          } as unknown as import("@/integrations/supabase/types").Database["public"]["Tables"]["content_reviews"]["Insert"],
          { onConflict: "user_id,entity_type,entity_id" }
        );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["content-reviews", vars.entity_type, vars.entity_id] });
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, entityType, entityId }: { id: string; entityType: string; entityId: string }) => {
      const { error } = await supabase.from("content_reviews").delete().eq("id", id);
      if (error) throw error;
      return { entityType, entityId };
    },
    onSuccess: (vars) => {
      qc.invalidateQueries({ queryKey: ["content-reviews", vars.entityType, vars.entityId] });
    },
  });
}
