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

export function useFollowPrivacy(targetUserId: string | undefined) {
  return useQuery({
    queryKey: ["followPrivacy", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return "public";
      const { data } = await supabase
        .from("profiles")
        .select("follow_privacy")
        .eq("user_id", targetUserId)
        .single();
      return (data?.follow_privacy as string) || "public";
    },
    enabled: !!targetUserId,
  });
}

export function usePendingFollowRequest(targetUserId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["pendingFollowRequest", user?.id, targetUserId],
    queryFn: async () => {
      if (!user?.id || !targetUserId) return null;
      const { data } = await supabase
        .from("follow_requests")
        .select("*")
        .eq("requester_id", user.id)
        .eq("target_id", targetUserId)
        .eq("status", "pending")
        .maybeSingle();
      return data;
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
        // Check privacy setting
        const { data: targetProfile } = await supabase
          .from("profiles")
          .select("follow_privacy")
          .eq("user_id", targetUserId)
          .single();

        const privacy = targetProfile?.follow_privacy || "public";

        if (privacy === "private") {
          throw new Error("This user doesn't accept followers");
        }

        if (privacy === "approval") {
          // Send follow request instead
          const { error } = await supabase
            .from("follow_requests")
            .upsert({ requester_id: user.id, target_id: targetUserId, status: "pending" }, { onConflict: "requester_id,target_id" });
          if (error) throw error;
          return { type: "request_sent" };
        }

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
      queryClient.invalidateQueries({ queryKey: ["pendingFollowRequest", user?.id, targetUserId] });
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
        // Preserve order by matching with ids
        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
        return ids.map(id => profileMap.get(id)).filter(Boolean);
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
        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
        return ids.map(id => profileMap.get(id)).filter(Boolean);
      }
    },
    enabled: !!userId,
  });
}

// New followers (last 7 days)
export function useNewFollowers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["newFollowers", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("user_follows")
        .select("follower_id, created_at")
        .eq("following_id", user.id)
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      const ids = data.map(d => d.follower_id);
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, specialization, country_code, is_verified")
        .in("user_id", ids);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return data.map(d => ({
        ...profileMap.get(d.follower_id),
        followed_at: d.created_at,
      })).filter(p => p.user_id);
    },
    enabled: !!user?.id,
  });
}

// Follow recommendations: users with similar roles/specializations not yet followed
export function useFollowRecommendations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["followRecommendations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get current user's following list + their own profile
      const [followingRes, profileRes] = await Promise.all([
        supabase.from("user_follows").select("following_id").eq("follower_id", user.id),
        supabase.from("profiles").select("specialization, country_code").eq("user_id", user.id).single(),
      ]);

      const followingIds = new Set((followingRes.data || []).map(f => f.following_id));
      followingIds.add(user.id);

      // Get users with similar attributes
      let query = supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, specialization, country_code, is_verified")
        .not("user_id", "in", `(${Array.from(followingIds).join(",")})`)
        .not("full_name", "is", null)
        .limit(12);

      // Prioritize same country if available
      if (profileRes.data?.country_code) {
        query = query.order("country_code", { ascending: true });
      }

      const { data } = await query;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

// Incoming follow requests
export function useIncomingFollowRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["incomingFollowRequests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("follow_requests")
        .select("*")
        .eq("target_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = data.map(d => d.requester_id);
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, specialization, is_verified")
        .in("user_id", ids);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return data.map(d => ({
        ...d,
        profile: profileMap.get(d.requester_id),
      }));
    },
    enabled: !!user?.id,
  });

  const respondToRequest = useMutation({
    mutationFn: async ({ requestId, accept }: { requestId: string; accept: boolean }) => {
      if (!user?.id) throw new Error("Not auth");
      
      const { data: request } = await supabase
        .from("follow_requests")
        .select("*")
        .eq("id", requestId)
        .single();
      
      if (!request) throw new Error("Request not found");

      await supabase
        .from("follow_requests")
        .update({ status: accept ? "accepted" : "rejected", responded_at: new Date().toISOString() })
        .eq("id", requestId);

      if (accept) {
        await supabase
          .from("user_follows")
          .insert({ follower_id: request.requester_id, following_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomingFollowRequests", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["followStats", user?.id] });
    },
  });

  return { ...query, respondToRequest };
}

// Update follow privacy setting
export function useUpdateFollowPrivacy() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (privacy: "public" | "approval" | "private") => {
      if (!user?.id) throw new Error("Not auth");
      const { error } = await supabase
        .from("profiles")
        .update({ follow_privacy: privacy })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followPrivacy"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
