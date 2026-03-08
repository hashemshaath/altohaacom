import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Coins, Users } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export const WalletAdminOverview = memo(function WalletAdminOverview() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: walletStats } = useQuery({
    queryKey: ["admin-wallet-overview"],
    queryFn: async () => {
      const now = new Date();
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [walletsRes, txnRes, recentTxnRes, pointsRes] = await Promise.all([
        supabase.from("user_wallets").select("balance, points_balance"),
        supabase.from("wallet_transactions").select("id", { count: "exact", head: true }),
        supabase.from("wallet_transactions").select("type, amount").gte("created_at", last7d),
        supabase.from("points_ledger").select("id", { count: "exact", head: true }).gte("created_at", last7d),
      ]);

      const wallets = walletsRes.data || [];
      const totalBalance = wallets.reduce((s, w) => s + (w.balance || 0), 0);
      const totalPoints = wallets.reduce((s, w) => s + (w.points_balance || 0), 0);
      const activeWallets = wallets.filter(w => (w.balance || 0) > 0 || (w.points_balance || 0) > 0).length;

      const recentTxns = recentTxnRes.data || [];
      const weeklyCredits = recentTxns.filter(t => t.type === "credit").reduce((s, t) => s + (t.amount || 0), 0);
      const weeklyDebits = recentTxns.filter(t => t.type === "debit").reduce((s, t) => s + (t.amount || 0), 0);

      return {
        totalWallets: wallets.length,
        activeWallets,
        totalBalance,
        totalPoints,
        totalTransactions: txnRes.count || 0,
        weeklyCredits,
        weeklyDebits,
        weeklyPointsActivity: pointsRes.count || 0,
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  const cards = [
    {
      icon: Wallet, label: isAr ? "إجمالي الرصيد" : "Total Balance",
      value: Math.round(walletStats?.totalBalance || 0), suffix: " SAR",
      sub: `${walletStats?.totalWallets || 0} ${isAr ? "محفظة" : "wallets"}`,
      color: "text-primary",
    },
    {
      icon: Coins, label: isAr ? "إجمالي النقاط" : "Total Points",
      value: walletStats?.totalPoints || 0, suffix: "",
      sub: `${walletStats?.weeklyPointsActivity || 0} ${isAr ? "نشاط هذا الأسبوع" : "this week"}`,
      color: "text-chart-1",
    },
    {
      icon: ArrowUpRight, label: isAr ? "إيداعات الأسبوع" : "Weekly Credits",
      value: Math.round(walletStats?.weeklyCredits || 0), suffix: " SAR",
      sub: isAr ? "آخر 7 أيام" : "Last 7 days",
      color: "text-chart-2",
    },
    {
      icon: ArrowDownRight, label: isAr ? "سحوبات الأسبوع" : "Weekly Debits",
      value: Math.round(walletStats?.weeklyDebits || 0), suffix: " SAR",
      sub: isAr ? "آخر 7 أيام" : "Last 7 days",
      color: "text-chart-4",
    },
    {
      icon: Users, label: isAr ? "محافظ نشطة" : "Active Wallets",
      value: walletStats?.activeWallets || 0, suffix: "",
      sub: `${isAr ? "من" : "of"} ${walletStats?.totalWallets || 0}`,
      color: "text-chart-3",
    },
    {
      icon: TrendingUp, label: isAr ? "إجمالي التحويلات" : "Total Transactions",
      value: walletStats?.totalTransactions || 0, suffix: "",
      sub: isAr ? "كل الأوقات" : "All time",
      color: "text-chart-5",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`h-4 w-4 ${c.color}`} />
              <span className="text-[10px] text-muted-foreground truncate">{c.label}</span>
            </div>
            <p className="text-base font-bold truncate"><AnimatedCounter value={c.value} />{c.suffix}</p>
            <p className="text-[10px] text-muted-foreground">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
