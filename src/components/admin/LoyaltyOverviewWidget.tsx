import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Crown, TrendingUp, Users, Gift, Zap, Star } from "lucide-react";

export function LoyaltyOverviewWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-loyalty-overview"],
    queryFn: async () => {
      const [
        { count: totalMembers },
        { data: tierDistribution },
        { count: activeChallenges },
        { count: totalRewards },
        { data: recentPoints },
        { count: referralCodes },
      ] = await Promise.all([
        supabase.from("membership_cards").select("*", { count: "exact", head: true }).eq("card_status", "active"),
        supabase.from("membership_cards").select("tier").eq("card_status", "active"),
        supabase.from("challenges").select("*", { count: "exact", head: true }).eq("is_active", true),
        (supabase as any).from("loyalty_rewards").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("points_ledger").select("points, action_type").order("created_at", { ascending: false }).limit(100),
        supabase.from("referral_codes").select("*", { count: "exact", head: true }),
      ]);

      // Tier distribution
      const tiers: Record<string, number> = {};
      tierDistribution?.forEach((m: any) => {
        const t = m.tier || "bronze";
        tiers[t] = (tiers[t] || 0) + 1;
      });

      // Points stats
      const totalAwarded = recentPoints?.filter((p: any) => p.points > 0).reduce((s: number, p: any) => s + p.points, 0) || 0;
      const totalRedeemed = Math.abs(recentPoints?.filter((p: any) => p.points < 0).reduce((s: number, p: any) => s + p.points, 0) || 0);

      return {
        totalMembers: totalMembers || 0,
        tiers,
        activeChallenges: activeChallenges || 0,
        totalRewards: totalRewards || 0,
        totalAwarded,
        totalRedeemed,
        referralCodes: referralCodes || 0,
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  const tierColors: Record<string, string> = {
    bronze: "text-chart-4",
    silver: "text-muted-foreground",
    gold: "text-chart-4",
    platinum: "text-chart-3",
    diamond: "text-primary",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Crown className="h-4 w-4 text-chart-4" />
          {isAr ? "نظرة عامة على الولاء" : "Loyalty Overview"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Users, label: isAr ? "أعضاء نشطين" : "Active Members", value: data?.totalMembers, color: "text-primary" },
            { icon: Zap, label: isAr ? "تحديات نشطة" : "Active Challenges", value: data?.activeChallenges, color: "text-chart-2" },
            { icon: Gift, label: isAr ? "مكافآت متاحة" : "Active Rewards", value: data?.totalRewards, color: "text-chart-3" },
          ].map((m, i) => (
            <div key={i} className="text-center p-2 rounded-lg bg-muted/30">
              <m.icon className={`h-3.5 w-3.5 mx-auto mb-1 ${m.color}`} />
              <p className="text-sm font-bold">{m.value}</p>
              <p className="text-[9px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Tier Distribution */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{isAr ? "توزيع المستويات" : "Tier Distribution"}</p>
          {Object.entries(data?.tiers || {}).sort((a, b) => b[1] - a[1]).map(([tier, count]) => (
            <div key={tier} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Star className={`h-3 w-3 ${tierColors[tier] || "text-muted-foreground"}`} />
                <span className="capitalize">{tier}</span>
              </div>
              <div className="flex items-center gap-2 flex-1 ms-3">
                <Progress value={data?.totalMembers ? (count / data.totalMembers) * 100 : 0} className="h-1 flex-1" />
                <span className="text-muted-foreground w-6 text-end">{count}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Points Flow */}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 rounded-lg bg-chart-2/5 border border-chart-2/10">
            <TrendingUp className="h-3 w-3 mx-auto mb-0.5 text-chart-2" />
            <p className="text-sm font-bold text-chart-2">{data?.totalAwarded?.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "نقاط ممنوحة" : "Points Awarded"}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-chart-4/5 border border-chart-4/10">
            <Gift className="h-3 w-3 mx-auto mb-0.5 text-chart-4" />
            <p className="text-sm font-bold text-chart-4">{data?.totalRedeemed?.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">{isAr ? "نقاط مستبدلة" : "Points Redeemed"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
