import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CACHE } from "@/lib/queryConfig";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

export function useOrganizerFollows() {
  const { user } = useAuth();

  const { data: followedIds = [], isLoading } = useQuery({
    queryKey: ["organizer-follows", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("organizer_follows")
        .select("organizer_id")
        .eq("user_id", user.id);
      if (error) throw handleSupabaseError(error);
      return data.map(r => r.organizer_id);
    },
    enabled: !!user?.id,
    ...CACHE.medium,
  });

  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async (organizerId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("organizer_follows")
        .insert({ user_id: user.id, organizer_id: organizerId });
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer-follows"] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (organizerId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("organizer_follows")
        .delete()
        .eq("user_id", user.id)
        .eq("organizer_id", organizerId);
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer-follows"] });
    },
  });

  const toggleFollow = useCallback((organizerId: string, isAr: boolean) => {
    if (!user?.id) {
      toast.error(isAr ? "يرجى تسجيل الدخول أولاً" : "Please sign in first");
      return;
    }
    const isFollowed = followedIds.includes(organizerId);
    if (isFollowed) {
      unfollowMutation.mutate(organizerId);
      toast.success(isAr ? "تم إلغاء المتابعة" : "Unfollowed");
    } else {
      followMutation.mutate(organizerId);
      toast.success(isAr ? "تمت المتابعة" : "Following!");
    }
  }, [user?.id, followedIds, followMutation, unfollowMutation]);

  return { followedIds, isLoading, toggleFollow };
}
