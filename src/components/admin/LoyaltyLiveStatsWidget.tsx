import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Trophy, Gift, Zap, Star, TrendingUp, Users, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { format, subDays } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { CACHE } from "@/lib/queryConfig";
import { QUERY_LIMIT_LARGE, REFETCH_INTERVAL_DEFAULT } from "@/lib/constants";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export const LoyaltyLiveStatsWidget = memo(function LoyaltyLiveStatsWidget() {
  const isAr = useIsAr();

  const { data } = useQuery({
    queryKey: ["loyaltyLiveStats"],
    queryFn: async () => {
      const [ledgerRes, challengesRes, tiersRes, campaignsRes, walletsRes] = await Promise.all([
        supabase.from("points_ledger").select("id, user_id, action_type, points, created_at, balance_after").order("created_at", { ascending: false }).limit(1000),
        supabase.from("challenges").select("id, title, is_active").limit(QUERY_LIMIT_LARGE),
        supabase.from("loyalty_tiers").select("id, name, name_ar, min_points, sort_order").order("sort_order").limit(QUERY_LIMIT_LARGE),
        supabase.from("bonus_campaigns").select("id, name, is_active, starts_at, ends_at").limit(QUERY_LIMIT_LARGE),
        supabase.from("user_wallets").select("user_id, points_balance").limit(QUERY_LIMIT_LARGE),
      ]);

      const ledger = ledgerRes.data || [];
      const challenges = challengesRes.data || [];
      const tiers = tiersRes.data || [];
      const campaigns = campaignsRes.data || [];
      const wallets = walletsRes.data || [];

      // Total points in circulation
      const totalPoints = wallets.reduce((s, w) => s + (w.points_balance || 0), 0);
      const usersWithPoints = wallets.filter(w => (w.points_balance || 0) > 0).length;

      // 14-day points trend
      const trend: Record<string, { earned: number; redeemed: number }> = {};
      for (let i = 13; i >= 0; i--) {
        trend[format(subDays(new Date(), i), "MM/dd")] = { earned: 0, redeemed: 0 };
      }
      ledger.forEach(l => {
        const d = format(new Date(l.created_at), "MM/dd");
        if (d in trend) {
          if (l.points > 0) trend[d].earned += l.points;
          else trend[d].redeemed += Math.abs(l.points);
        }
      });
      const trendData = Object.entries(trend).map(([date, v]) => ({ date, ...v }));

      // Action type distribution
      const actionMap: Record<string, number> = {};
      ledger.forEach(l => {
        const a = l.action_type || "other";
        actionMap[a] = (actionMap[a] || 0) + 1;
      });
      const actionData = Object.entries(actionMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

      // Active campaigns
      const now = new Date();
      const activeCampaigns = campaigns.filter(c => c.is_active && new Date(c.starts_at) <= now && new Date(c.ends_at) >= now);

      // Challenge stats
      const activeChallenges = challenges.filter(c => c.is_active).length;
      const totalChallenges = challenges.length;

      // Tier distribution (from wallets points)
      const tierDist = tiers.map(t => {
        const tierRecord = t as Record<string, unknown>;
        const minPts = (tierRecord.min_points as number) || 0;
        const maxPts = (tierRecord.max_points as number) || Infinity;
        const count = wallets.filter(w => (w.points_balance || 0) >= minPts && (w.points_balance || 0) < maxPts).length;
        return { name: isAr ? (String(tierRecord.name_ar || t.name)) : t.name, count };
      });

      return {
        totalPoints,
        usersWithPoints,
        totalTransactions: ledger.length,
        activeCampaigns: activeCampaigns.length,
        activeChallenges,
        totalChallenges,
        trendData,
        actionData,
        tierDist,
      };
    },
    refetchInterval: useVisibleRefetchInterval(REFETCH_INTERVAL_DEFAULT),
    staleTime: CACHE.short.staleTime,
  });

  if (!data) return null;

  const stats = [
    { label: isAr ? "النقاط المتداولة" : "Points in Circulation", value: data.totalPoints, icon: Crown, color: "text-chart-4" },
    { label: isAr ? "مستخدمون نشطون" : "Users with Points", value: data.usersWithPoints, icon: Users, color: "text-primary" },
    { label: isAr ? "التحديات النشطة" : "Active Challenges", value: `${data.activeChallenges}/${data.totalChallenges}`, icon: Target, color: "text-chart-3" },
    { label: isAr ? "الحملات النشطة" : "Active Campaigns", value: data.activeCampaigns, icon: Gift, color: "text-chart-4" },
  ];

  return (
    <Card className="mb-6 rounded-2xl border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-4/10 border border-chart-4/15 transition-transform duration-300 hover:scale-110">
            <Crown className="h-4 w-4 text-chart-4" />
          </div>
          {isAr ? "إحصائيات الولاء والمكافآت المباشرة" : "Loyalty & Rewards Live Stats"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-3 text-center border border-border/30 transition-all hover:border-border/60 hover:shadow-sm group">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color} transition-transform group-hover:scale-110`} />
              <div className="text-lg font-bold tabular-nums">
                {typeof s.value === "number" ? <AnimatedCounter value={s.value} /> : <span>{s.value}</span>}
              </div>
              <div className="text-[12px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Points Trend */}
          <div className="md:col-span-2">
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "حركة النقاط - 14 يوم" : "Points Movement - 14 Days"}
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={data.trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="earned" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.2} name={isAr ? "مكتسب" : "Earned"} />
                <Area type="monotone" dataKey="redeemed" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4))" fillOpacity={0.2} name={isAr ? "مستبدل" : "Redeemed"} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Action Distribution */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "أنواع الإجراءات" : "Action Types"}
            </p>
            {data.actionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={data.actionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} innerRadius={25}>
                    {data.actionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-xs text-muted-foreground">
                {isAr ? "لا توجد بيانات" : "No data"}
              </div>
            )}
          </div>
        </div>

        {/* Tier Distribution */}
        {data.tierDist.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "توزيع المستويات" : "Tier Distribution"}
            </p>
            <div className="flex gap-2 flex-wrap">
              {data.tierDist.map((t, i) => (
                <Badge key={i} variant="outline" className="gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {t.name}: {t.count}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
