import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AwardPointsParams {
  actionType: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  silent?: boolean; // Don't show toast
}

interface AwardPointsResult {
  awarded: boolean;
  points?: number;
  newBalance?: number;
  actionLabel?: string;
  actionLabelAr?: string;
  error?: string;
}

export function useAwardPoints() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AwardPointsParams): Promise<AwardPointsResult> => {
      const { data, error } = await supabase.functions.invoke("award-user-points", {
        body: {
          actionType: params.actionType,
          referenceType: params.referenceType,
          referenceId: params.referenceId,
          metadata: params.metadata,
        },
      });

      if (error) throw error;
      return data as AwardPointsResult;
    },
    onSuccess: (data, variables) => {
      if (data.awarded) {
        queryClient.invalidateQueries({ queryKey: ["points-balance"] });
        queryClient.invalidateQueries({ queryKey: ["points-ledger"] });
        queryClient.invalidateQueries({ queryKey: ["referral-stats"] });

        if (!variables.silent) {
          toast({
            title: `+${data.points} points! 🎉`,
            description: data.actionLabel,
          });
        }
      }
    },
    onError: (err: any) => {
      console.error("Award points error:", err);
    },
  });
}
