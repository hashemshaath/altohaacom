import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useReferralCode() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["referral-code", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      // Auto-create if missing
      if (!data) {
        const { data: newCode, error: insertErr } = await supabase
          .from("referral_codes")
          .insert({ user_id: user.id, code: crypto.randomUUID().slice(0, 8).toUpperCase() })
          .select()
          .single();
        if (insertErr) throw insertErr;
        return newCode;
      }
      return data;
    },
    enabled: !!user,
  });
}

export function useReferralStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["referral-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [invRes, convRes, clicksRes] = await Promise.all([
        supabase.from("referral_invitations").select("id, channel, platform, status, sent_at", { count: "exact" }).eq("referrer_id", user.id),
        supabase.from("referral_conversions").select("id, points_awarded_referrer, converted_at", { count: "exact" }).eq("referrer_id", user.id),
        supabase.from("referral_codes").select("total_clicks, total_invites_sent, total_conversions, total_points_earned").eq("user_id", user.id).single(),
      ]);
      return {
        invitations: invRes.data || [],
        invitationsCount: invRes.count || 0,
        conversions: convRes.data || [],
        conversionsCount: convRes.count || 0,
        codeStats: clicksRes.data,
      };
    },
    enabled: !!user,
  });
}

export function useReferralInvitations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["referral-invitations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("referral_invitations")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useSendInvitation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, phone, channel, referralCodeId }: { email?: string; phone?: string; channel: string; referralCodeId: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("referral_invitations").insert({
        referral_code_id: referralCodeId,
        referrer_id: user.id,
        invitee_email: email || null,
        invitee_phone: phone || null,
        channel,
        platform: channel,
        status: "sent",
      });
      if (error) throw error;

      // Update counter
      await supabase.from("referral_codes").update({
        total_invites_sent: (await supabase.from("referral_invitations").select("id", { count: "exact", head: true }).eq("referrer_id", user.id)).count || 0,
      }).eq("user_id", user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referral-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["referral-stats"] });
      queryClient.invalidateQueries({ queryKey: ["referral-code"] });
      toast({ title: "Invitation sent!" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });
}

export function useReferralMilestones() {
  return useQuery({
    queryKey: ["referral-milestones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_milestones")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUserMilestones() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-milestones", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_milestone_achievements")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}
