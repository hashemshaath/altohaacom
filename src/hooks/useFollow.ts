import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useFollowStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["followStats", userId],
    queryFn: async () => {
      if (!userId) return { followers: 0, following: 0 };
      const [followersRes, followingRes] = await Promise.all([
        supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
        supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
      ]);
      return {
        followers: followersRes.count || 0,
        following: followingRes.count || 0,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useIsFollowing(targetUserId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["isFollowing", user?.id, targetUserId],
    queryFn: async () => {
      if (!user?.id || !targetUserId) return false;
      const { data } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id && !!targetUserId && user.id !== targetUserId,
  });
}

export function useToggleFollow(targetUserId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isCurrentlyFollowing: boolean) => {
      if (!user?.id || !targetUserId) throw new Error("Not authenticated");
      if (isCurrentlyFollowing) {
        const { error } = await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_follows")
          .insert({ follower_id: user.id, following_id: targetUserId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isFollowing", user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["followStats", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["followStats", user?.id] });
    },
  });
}

export function useFollowersList(userId: string | undefined, type: "followers" | "following") {
  return useQuery({
    queryKey: ["followList", userId, type],
    queryFn: async () => {
      if (!userId) return [];
      if (type === "followers") {
        const { data, error } = await supabase
          .from("user_follows")
          .select("follower_id, created_at")
          .eq("following_id", userId)
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        const ids = data.map((d) => d.follower_id);
        if (ids.length === 0) return [];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, username, avatar_url, display_name, account_number, is_verified")
          .in("user_id", ids);
        return profiles || [];
      } else {
        const { data, error } = await supabase
          .from("user_follows")
          .select("following_id, created_at")
          .eq("follower_id", userId)
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        const ids = data.map((d) => d.following_id);
        if (ids.length === 0) return [];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, username, avatar_url, display_name, account_number, is_verified")
          .in("user_id", ids);
        return profiles || [];
      }
    },
    enabled: !!userId,
  });
}
