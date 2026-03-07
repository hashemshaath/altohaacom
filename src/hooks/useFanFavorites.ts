import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useFanFavorites(entityType?: "chef" | "recipe") {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: favorites = [], ...rest } = useQuery({
    queryKey: ["fan-favorites", user?.id, entityType],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from("fan_favorites")
        .select("id, user_id, entity_type, entity_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (entityType) query = query.eq("entity_type", entityType);
      const { data } = await query;
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const isFavorited = (type: "chef" | "recipe", entityId: string) =>
    favorites.some((f) => f.entity_type === type && f.entity_id === entityId);

  const toggleFavorite = useMutation({
    mutationFn: async ({ type, entityId }: { type: "chef" | "recipe"; entityId: string }) => {
      if (!user) throw new Error("Not authenticated");
      const existing = favorites.find((f) => f.entity_type === type && f.entity_id === entityId);
      if (existing) {
        await supabase.from("fan_favorites").delete().eq("id", existing.id);
      } else {
        await supabase.from("fan_favorites").insert({
          user_id: user.id,
          entity_type: type,
          entity_id: entityId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fan-favorites"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update favorites", variant: "destructive" });
    },
  });

  return { favorites, isFavorited, toggleFavorite, ...rest };
}
