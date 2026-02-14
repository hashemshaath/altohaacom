import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
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
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useEarningRules() {
  return useQuery({
    queryKey: ["points-earning-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("points_earning_rules")
        .select("*")
        .eq("is_active", true)
        .order("points", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useRedeemReward() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rewardId, pointsCost }: { rewardId: string; pointsCost: number }) => {
      if (!user) throw new Error("Not authenticated");

      // Check balance
      const { data: wallet } = await supabase
        .from("user_wallets")
        .select("points_balance")
        .eq("user_id", user.id)
        .single();

      if (!wallet || wallet.points_balance < pointsCost) {
        throw new Error("Insufficient points");
      }

      // Insert redemption
      const { error } = await supabase.from("points_redemptions").insert({
        user_id: user.id,
        reward_id: rewardId,
        points_spent: pointsCost,
        status: "pending",
        redemption_code: crypto.randomUUID().slice(0, 8).toUpperCase(),
      });
      if (error) throw error;

      // Deduct points via RPC
      const newBalance = wallet.points_balance - pointsCost;
      await supabase.from("user_wallets").update({ points_balance: newBalance }).eq("user_id", user.id);
      await supabase.from("profiles").update({ loyalty_points: newBalance }).eq("user_id", user.id);

      // Log in ledger
      await supabase.from("points_ledger").insert({
        user_id: user.id,
        action_type: "redemption",
        points: -pointsCost,
        balance_after: newBalance,
        description: "Reward redemption",
        description_ar: "استبدال مكافأة",
        reference_type: "reward",
        reference_id: rewardId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["points-balance"] });
      queryClient.invalidateQueries({ queryKey: ["points-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["points-rewards"] });
      toast({ title: "Reward redeemed successfully!" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
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
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}
