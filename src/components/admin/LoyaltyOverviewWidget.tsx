import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Crown, TrendingUp, Users, Gift, Zap, Star } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export const LoyaltyOverviewWidget = memo(function LoyaltyOverviewWidget() {
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
        supabase.from("membership_cards").select("id", { count: "exact", head: true }).eq("card_status", "active"),
        supabase.from("membership_cards").select("tier").eq("card_status", "active") as unknown as Promise<{ data: { tier: string }[] | null }>,
        supabase.from("challenges").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("rewards_catalog").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("points_ledger").select("points, action_type").order("created_at", { ascending: false }).limit(100),
        supabase.from("referral_codes").select("id", { count: "exact", head: true }),
      ]);

      // Tier distribution
      const tiers: Record<string, number> = {};
      tierDistribution?.forEach((m) => {
        const t = m.tier || "bronze";
        tiers[t] = (tiers[t] || 0) + 1;
      });

      // Points stats
      const totalAwarded = recentPoints?.filter((p) => p.points > 0).reduce((s, p) => s + p.points, 0) || 0;
      const totalRedeemed = Math.abs(recentPoints?.filter((p) => p.points < 0).reduce((s, p) => s + p.points, 0) || 0);

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
    <Card className="overflow-hidden rounded-2xl border-border/40">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-4/10 border border-chart-4/15 transition-transform duration-300 hover:scale-110">
              <Crown className="h-4 w-4 text-chart-4" />
            </div>
            {isAr ? "نظرة عامة على الولاء" : "Loyalty Overview"}
          </CardTitle>
          <Badge variant="outline" className="text-[12px] gap-1 rounded-lg">
            <Star className="h-2.5 w-2.5 text-chart-4" />
            {data?.referralCodes || 0} {isAr ? "رموز إحالة" : "referrals"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Users, label: isAr ? "أعضاء نشطين" : "Active Members", value: data?.totalMembers, color: "text-primary", bg: "bg-primary/5 border-primary/10" },
            { icon: Zap, label: isAr ? "تحديات نشطة" : "Active Challenges", value: data?.activeChallenges, color: "text-chart-2", bg: "bg-chart-2/5 border-chart-2/10" },
            { icon: Gift, label: isAr ? "مكافآت متاحة" : "Active Rewards", value: data?.totalRewards, color: "text-chart-3", bg: "bg-chart-3/5 border-chart-3/10" },
          ].map((m, i) => (
            <div key={i} className={`text-center p-2.5 rounded-xl border transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 group ${m.bg}`}>
              <m.icon className={`h-3.5 w-3.5 mx-auto mb-1 ${m.color} transition-transform duration-300 group-hover:scale-110`} />
              <p className="text-sm font-bold tabular-nums"><AnimatedCounter value={m.value || 0} /></p>
              <p className="text-[12px] text-muted-foreground">{m.label}</p>
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
          <div className="text-center p-2.5 rounded-xl bg-chart-2/5 border border-chart-2/10 transition-all hover:shadow-sm">
            <TrendingUp className="h-3.5 w-3.5 mx-auto mb-1 text-chart-2" />
            <AnimatedCounter value={data?.totalAwarded || 0} className="text-sm font-bold text-chart-2" />
            <p className="text-[12px] text-muted-foreground">{isAr ? "نقاط ممنوحة" : "Points Awarded"}</p>
            {data?.totalAwarded && data.totalAwarded > 0 && (
              <div className="mt-1 h-1 rounded-full bg-chart-2/10 overflow-hidden">
                <div className="h-full rounded-full bg-chart-2/40 transition-all" style={{ width: `${Math.min(100, (data.totalAwarded / (data.totalAwarded + (data?.totalRedeemed || 1))) * 100)}%` }} />
              </div>
            )}
          </div>
          <div className="text-center p-2.5 rounded-xl bg-chart-4/5 border border-chart-4/10 transition-all hover:shadow-sm">
            <Gift className="h-3.5 w-3.5 mx-auto mb-1 text-chart-4" />
            <AnimatedCounter value={data?.totalRedeemed || 0} className="text-sm font-bold text-chart-4" />
            <p className="text-[12px] text-muted-foreground">{isAr ? "نقاط مستبدلة" : "Points Redeemed"}</p>
            {data?.totalRedeemed && data.totalRedeemed > 0 && (
              <div className="mt-1 h-1 rounded-full bg-chart-4/10 overflow-hidden">
                <div className="h-full rounded-full bg-chart-4/40 transition-all" style={{ width: `${Math.min(100, (data.totalRedeemed / (data.totalAwarded || 1)) * 100)}%` }} />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
