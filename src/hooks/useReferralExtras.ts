import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useReferralLeaderboard() {
  return useQuery({
    queryKey: ["referral-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_codes")
        .select("user_id, total_conversions, total_points_earned")
        .gt("total_conversions", 0)
        .order("total_conversions", { ascending: false })
        .limit(20);
      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Fetch profile info for top referrers
      const userIds = data.map((d) => d.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, username, avatar_url, country_code")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return data.map((entry, idx) => ({
        rank: idx + 1,
        userId: entry.user_id,
        conversions: entry.total_conversions || 0,
        pointsEarned: entry.total_points_earned || 0,
        profile: profileMap.get(entry.user_id) || null,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useActiveBonusCampaigns() {
  return useQuery({
    queryKey: ["active-bonus-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bonus_campaigns")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", new Date().toISOString())
        .gte("ends_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useReferralTiers() {
  return useQuery({
    queryKey: ["referral-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_tier_bonuses")
        .select("*")
        .order("min_referrals");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSocialProofStats() {
  return useQuery({
    queryKey: ["social-proof-stats"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [conversionsRes, totalUsersRes] = await Promise.all([
        supabase
          .from("referral_conversions")
          .select("id", { count: "exact", head: true })
          .gte("converted_at", thirtyDaysAgo.toISOString()),
        supabase
          .from("referral_codes")
          .select("total_conversions")
          .gt("total_conversions", 0),
      ]);

      const totalActiveReferrers = totalUsersRes.data?.length || 0;
      const recentConversions = conversionsRes.count || 0;

      return {
        recentConversions,
        totalActiveReferrers,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
