import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useLoyaltyTiers() {
  return useQuery({
    queryKey: ["loyaltyTiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_tiers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useUserTier() {
  const { user } = useAuth();
  const { data: tiers = [] } = useLoyaltyTiers();

  return useQuery({
    queryKey: ["userTier", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("loyalty_points, loyalty_tier")
        .eq("user_id", user.id)
        .maybeSingle();
      
      const points = profile?.loyalty_points || 0;
      // Determine current tier based on points
      let currentTier = tiers[0];
      let nextTier = tiers[1] || null;
      for (let i = 0; i < tiers.length; i++) {
        if (points >= tiers[i].min_points) {
          currentTier = tiers[i];
          nextTier = tiers[i + 1] || null;
        }
      }
      const progress = nextTier
        ? ((points - currentTier.min_points) / (nextTier.min_points - currentTier.min_points)) * 100
        : 100;

      return { points, currentTier, nextTier, progress: Math.min(progress, 100) };
    },
    enabled: !!user?.id && tiers.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useChallenges() {
  return useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useUserChallenges() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["userChallenges", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_challenges")
        .select("*, challenges(*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useRewardsCatalog() {
  return useQuery({
    queryKey: ["rewardsCatalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rewards_catalog")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useUserRedemptions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["userRedemptions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("reward_redemptions")
        .select("*, rewards_catalog(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

export function useRedeemLoyaltyReward() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rewardId, pointsCost }: { rewardId: string; pointsCost: number }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Check balance
      const { data: wallet } = await supabase
        .from("user_wallets")
        .select("points_balance")
        .eq("user_id", user.id)
        .single();

      if (!wallet || (wallet.points_balance || 0) < pointsCost) {
        throw new Error("Insufficient points");
      }

      // Insert redemption
      const { error } = await supabase.from("reward_redemptions").insert({
        user_id: user.id,
        reward_id: rewardId,
        points_spent: pointsCost,
        status: "pending",
        redemption_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
      });
      if (error) throw error;

      // Deduct points
      const newBalance = (wallet.points_balance || 0) - pointsCost;
      await supabase.from("user_wallets").update({ points_balance: newBalance }).eq("user_id", user.id);
      await supabase.from("profiles").update({ loyalty_points: newBalance }).eq("user_id", user.id);

      // Log in ledger
      await supabase.from("points_ledger").insert({
        user_id: user.id,
        action_type: "loyalty_redemption",
        points: -pointsCost,
        balance_after: newBalance,
        description: "Loyalty reward redemption",
        description_ar: "استبدال مكافأة ولاء",
        reference_type: "loyalty_reward",
        reference_id: rewardId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userRedemptions"] });
      queryClient.invalidateQueries({ queryKey: ["userTier"] });
      queryClient.invalidateQueries({ queryKey: ["points-balance"] });
      queryClient.invalidateQueries({ queryKey: ["points-ledger"] });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });
}

export function useUserBadges(userId?: string) {
  const { user } = useAuth();
  const targetId = userId || user?.id;
  return useQuery({
    queryKey: ["userBadges", targetId],
    queryFn: async () => {
      if (!targetId) return [];
      const { data, error } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", targetId)
        .order("earned_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!targetId,
  });
}

export function useUserStreaks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["userStreaks", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}
