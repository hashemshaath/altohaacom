import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useReferralAnalytics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["referral-analytics", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get referral code id
      const { data: refCode } = await supabase
        .from("referral_codes")
        .select("id, total_clicks, total_invites_sent, total_conversions, total_points_earned")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!refCode) return null;

      // Get clicks by day (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: clicks } = await supabase
        .from("referral_clicks")
        .select("clicked_at, source")
        .eq("referral_code_id", refCode.id)
        .gte("clicked_at", thirtyDaysAgo.toISOString())
        .order("clicked_at", { ascending: true }) as any;

      // Get invitations with status
      const { data: invitations } = await supabase
        .from("referral_invitations")
        .select("channel, status, sent_at, platform")
        .eq("referrer_id", user.id);

      // Get conversions over time
      const { data: conversions } = await supabase
        .from("referral_conversions")
        .select("converted_at, points_awarded_referrer")
        .eq("referrer_id", user.id)
        .order("converted_at", { ascending: true });

      // Aggregate clicks by day
      const clicksByDay: Record<string, number> = {};
      clicks?.forEach((c) => {
        const day = new Date(c.clicked_at).toISOString().split("T")[0];
        clicksByDay[day] = (clicksByDay[day] || 0) + 1;
      });

      // Aggregate clicks by source
      const clicksBySource: Record<string, number> = {};
      clicks?.forEach((c) => {
        clicksBySource[c.source || "direct"] = (clicksBySource[c.source || "direct"] || 0) + 1;
      });

      // Aggregate channel performance (invites + conversion rate per channel)
      const channelStats: Record<string, { sent: number; converted: number }> = {};
      invitations?.forEach((inv) => {
        const ch = inv.channel || "unknown";
        if (!channelStats[ch]) channelStats[ch] = { sent: 0, converted: 0 };
        channelStats[ch].sent++;
        if (inv.status === "converted") channelStats[ch].converted++;
      });

      // Build daily trend (last 14 days)
      const dailyTrend: { date: string; clicks: number; conversions: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const convCount = conversions?.filter(
          (c) => new Date(c.converted_at).toISOString().split("T")[0] === key
        ).length || 0;
        dailyTrend.push({
          date: key,
          clicks: clicksByDay[key] || 0,
          conversions: convCount,
        });
      }

      // Funnel data
      const totalClicks = refCode.total_clicks || 0;
      const totalInvites = refCode.total_invites_sent || 0;
      const totalConversions = refCode.total_conversions || 0;

      const funnel = [
        { stage: "Clicks", stageAr: "نقرات", value: totalClicks },
        { stage: "Invites Sent", stageAr: "دعوات مرسلة", value: totalInvites },
        { stage: "Conversions", stageAr: "تحويلات", value: totalConversions },
      ];

      return {
        funnel,
        dailyTrend,
        clicksBySource,
        channelStats,
        totalPoints: refCode.total_points_earned || 0,
      };
    },
    enabled: !!user,
  });
}
