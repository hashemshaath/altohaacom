import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

export function usePointsBalance() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["points-balance", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data } = await supabase
        .from("user_wallets")
        .select("points_balance")
        .eq("user_id", user.id)
        .single();
      return data?.points_balance || 0;
    },
    enabled: !!user,
    ...CACHE.short,
  });
}

export function usePointsLedger() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["points-ledger", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("points_ledger")
        .select("id, user_id, action_type, points, balance_after, description, description_ar, reference_type, reference_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw handleSupabaseError(error);
      return data || [];
    },
    enabled: !!user,
  });
}

export function usePointsRewards() {
  return useQuery({
    queryKey: ["points-rewards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("points_rewards")
        .select("id, name, name_ar, description, description_ar, points_cost, category, reward_type, image_url, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw handleSupabaseError(error);
      return data || [];
    },
    ...CACHE.long,
  });
}

export function useEarningRules() {
  return useQuery({
    queryKey: ["points-earning-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("points_earning_rules")
        .select("id, action_type, action_label, action_label_ar, points, is_active, max_per_day, max_per_user")
        .eq("is_active", true)
        .order("points", { ascending: false });
      if (error) throw handleSupabaseError(error);
      return data || [];
    },
    ...CACHE.long,
  });
}

export function useRedeemReward() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rewardId, pointsCost }: { rewardId: string; pointsCost: number }) => {
      if (!user) throw new Error("Not authenticated");

      // Insert redemption
      const { error } = await supabase.from("points_redemptions").insert({
        user_id: user.id,
        reward_id: rewardId,
        points_spent: pointsCost,
        status: "pending",
        redemption_code: crypto.randomUUID().slice(0, 8).toUpperCase(),
      });
      if (error) throw handleSupabaseError(error);

      // Atomic deduction via server-side RPC
      const { error: rpcError } = await supabase.rpc("redeem_points", {
        p_user_id: user.id,
        p_points: pointsCost,
        p_description: "Reward redemption",
        p_description_ar: "استبدال مكافأة",
        p_reference_type: "reward",
        p_reference_id: rewardId,
      });
      if (rpcError) throw rpcError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["points-balance"] });
      queryClient.invalidateQueries({ queryKey: ["points-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["points-rewards"] });
      toast({ title: "Reward redeemed successfully!" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : String(err) });
    },
  });
}

export function useMyRedemptions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-redemptions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("points_redemptions")
        .select("*, points_rewards(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw handleSupabaseError(error);
      return data || [];
    },
    enabled: !!user,
  });
}
