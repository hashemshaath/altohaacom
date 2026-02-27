import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface TrialInfo {
  trialTier: string | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialExpired: boolean;
  isInTrial: boolean;
  daysRemaining: number;
}

export function useTrialInfo() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["trial-info", user?.id],
    queryFn: async (): Promise<TrialInfo> => {
      if (!user) return { trialTier: null, trialStartedAt: null, trialEndsAt: null, trialExpired: false, isInTrial: false, daysRemaining: 0 };
      const { data, error } = await supabase
        .from("profiles")
        .select("trial_tier, trial_started_at, trial_ends_at, trial_expired")
        .eq("user_id", user.id)
        .single();
      if (error || !data) return { trialTier: null, trialStartedAt: null, trialEndsAt: null, trialExpired: false, isInTrial: false, daysRemaining: 0 };

      const isInTrial = !!data.trial_tier && !data.trial_expired && !!data.trial_ends_at && new Date(data.trial_ends_at) > new Date();
      const daysRemaining = data.trial_ends_at ? Math.max(0, Math.ceil((new Date(data.trial_ends_at).getTime() - Date.now()) / 86400000)) : 0;

      return {
        trialTier: data.trial_tier,
        trialStartedAt: data.trial_started_at,
        trialEndsAt: data.trial_ends_at,
        trialExpired: data.trial_expired ?? false,
        isInTrial,
        daysRemaining,
      };
    },
    enabled: !!user,
  });
}

export function useStartTrial() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tier, durationDays = 14 }: { tier: string; durationDays?: number }) => {
      const { data, error } = await supabase.rpc("start_membership_trial", {
        p_user_id: (await supabase.auth.getUser()).data.user!.id,
        p_tier: tier,
        p_duration_days: durationDays,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Failed to start trial");
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trial-info"] });
      queryClient.invalidateQueries({ queryKey: ["user-tier"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast({ title: `🎉 Trial started!`, description: `Enjoy your free trial.` });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Cannot start trial", description: err.message });
    },
  });
}
