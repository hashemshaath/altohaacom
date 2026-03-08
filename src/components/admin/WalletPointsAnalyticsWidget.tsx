import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Wallet, Coins, ArrowUpRight, ArrowDownRight, Gift, Star, Users, TrendingUp } from "lucide-react";

export const WalletPointsAnalyticsWidget = memo(function WalletPointsAnalyticsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["wallet-points-analytics-widget"],
    queryFn: async () => {
      const [
        { data: wallets },
        { data: recentTxns },
        { data: pointsLedger },
        { count: rewardRedemptions },
      ] = await Promise.all([
        supabase.from("user_wallets").select("balance, points_balance").limit(1000),
        supabase.from("wallet_transactions").select("type, amount, created_at")
          .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()).limit(500),
        supabase.from("points_ledger").select("points, action_type, created_at")
          .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()).limit(500),
        supabase.from("points_ledger").select("*", { count: "exact", head: true })
          .lt("points", 0),
      ]);

      const totalWallets = wallets?.length || 0;
      const totalBalance = wallets?.reduce((s, w) => s + (w.balance || 0), 0) || 0;
      const totalPoints = wallets?.reduce((s, w) => s + (w.points_balance || 0), 0) || 0;
      const activeWallets = wallets?.filter(w => (w.balance || 0) > 0 || (w.points_balance || 0) > 0).length || 0;

      // Weekly transactions
      const weeklyCredits = recentTxns?.filter(t => t.type === "credit").reduce((s, t) => s + (t.amount || 0), 0) || 0;
      const weeklyDebits = recentTxns?.filter(t => t.type === "debit").reduce((s, t) => s + (t.amount || 0), 0) || 0;

      // Points earned/redeemed (30 days)
      const pointsEarned = pointsLedger?.filter(p => (p.points || 0) > 0).reduce((s, p) => s + (p.points || 0), 0) || 0;
      const pointsRedeemed = pointsLedger?.filter(p => (p.points || 0) < 0).reduce((s, p) => s + Math.abs(p.points || 0), 0) || 0;

      // Top action types
      const actionCounts: Record<string, number> = {};
      pointsLedger?.forEach(p => {
        if (p.action_type) actionCounts[p.action_type] = (actionCounts[p.action_type] || 0) + 1;
      });

      const walletUtilization = totalWallets > 0 ? Math.round((activeWallets / totalWallets) * 100) : 0;

      return {
        totalWallets, totalBalance, totalPoints, activeWallets,
        weeklyCredits, weeklyDebits, weeklyNet: weeklyCredits - weeklyDebits,
        pointsEarned, pointsRedeemed,
        rewardRedemptions: rewardRedemptions || 0,
        walletUtilization, actionCounts,
      };
    },
    staleTime: 60000,
  });

  if (!data) return null;

  const fmt = (n: number) => n.toLocaleString("en");

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            {isAr ? "المحافظ والنقاط" : "Wallets & Points"}
          </CardTitle>
          <Badge variant="outline" className="text-[9px]">{data.totalWallets} {isAr ? "محفظة" : "wallets"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: Wallet, label: isAr ? "إجمالي الرصيد" : "Total Balance", value: fmt(data.totalBalance), sub: "SAR", color: "text-chart-1" },
            { icon: Coins, label: isAr ? "إجمالي النقاط" : "Total Points", value: fmt(data.totalPoints), color: "text-chart-4" },
            { icon: ArrowUpRight, label: isAr ? "إيداعات (7ي)" : "Credits (7d)", value: fmt(data.weeklyCredits), color: "text-chart-2" },
            { icon: ArrowDownRight, label: isAr ? "مسحوبات (7ي)" : "Debits (7d)", value: fmt(data.weeklyDebits), color: "text-destructive" },
          ].map((m, i) => (
            <div key={i} className="p-2 rounded-xl bg-muted/30 border border-border/40 group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className={`h-3 w-3 ${m.color} transition-transform duration-300 group-hover:scale-110`} />
                <span className="text-[9px] text-muted-foreground">{m.label}</span>
              </div>
              <p className="text-sm font-bold">{m.value}</p>
              {m.sub && <p className="text-[8px] text-muted-foreground">{m.sub}</p>}
            </div>
          ))}
        </div>

        {/* Wallet utilization */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">{isAr ? "نسبة المحافظ النشطة" : "Active Wallet Rate"}</span>
            <span className="text-[10px] font-medium">{data.walletUtilization}%</span>
          </div>
          <Progress value={data.walletUtilization} className="h-1.5" />
        </div>

        {/* Points stats */}
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="flex items-center gap-1 text-chart-2"><Star className="h-3 w-3" /> {fmt(data.pointsEarned)} {isAr ? "نقطة مكتسبة (30ي)" : "earned (30d)"}</span>
          <span className="flex items-center gap-1 text-chart-4"><Gift className="h-3 w-3" /> {fmt(data.pointsRedeemed)} {isAr ? "مستبدلة" : "redeemed"}</span>
          <span className="flex items-center gap-1 text-primary"><Users className="h-3 w-3" /> {data.activeWallets} {isAr ? "نشطة" : "active"}</span>
        </div>

        {/* Top action types */}
        {Object.keys(data.actionCounts).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(data.actionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type, count]) => (
              <Badge key={type} variant="outline" className="text-[8px] gap-0.5">
                {type}: {count}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
