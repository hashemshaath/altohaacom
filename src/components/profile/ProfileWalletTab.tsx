import { memo, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Star, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Gift, Clock, Coins, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Link } from "react-router-dom";

interface ProfileWalletTabProps {
  userId: string;
}

export const ProfileWalletTab = memo(function ProfileWalletTab({ userId }: ProfileWalletTabProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [txSearch, setTxSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("all");

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["profile-wallet", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_wallets")
        .select("id, balance, currency, points_balance, created_at, updated_at")
        .eq("user_id", userId)
        .single();
      return data;
    },
  });

  const { data: recentTransactions = [] } = useQuery({
    queryKey: ["profile-wallet-transactions", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("points_ledger")
        .select("id, points, action_type, description, balance_after, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const stats = useMemo(() => {
    const earned = recentTransactions.filter(t => t.points > 0).reduce((s, t) => s + t.points, 0);
    const spent = Math.abs(recentTransactions.filter(t => t.points < 0).reduce((s, t) => s + t.points, 0));
    return { earned, spent, total: recentTransactions.length };
  }, [recentTransactions]);

  const filteredTransactions = useMemo(() => {
    let txs = recentTransactions;
    if (txTypeFilter === "earned") txs = txs.filter(t => t.points > 0);
    else if (txTypeFilter === "spent") txs = txs.filter(t => t.points < 0);
    if (txSearch.trim()) {
      const q = txSearch.toLowerCase();
      txs = txs.filter(t => t.action_type?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    return txs;
  }, [recentTransactions, txTypeFilter, txSearch]);

  if (walletLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const actionLabels: Record<string, { en: string; ar: string }> = {
    purchase: { en: "Purchase", ar: "شراء" },
    reward: { en: "Reward", ar: "مكافأة" },
    referral: { en: "Referral", ar: "إحالة" },
    competition: { en: "Competition", ar: "مسابقة" },
    redemption: { en: "Redemption", ar: "استبدال" },
    bonus: { en: "Bonus", ar: "مكافأة إضافية" },
    login_streak: { en: "Login Streak", ar: "سلسلة دخول" },
    profile_complete: { en: "Profile Complete", ar: "إكمال الملف" },
  };

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="rounded-2xl border-border/40 overflow-hidden bg-gradient-to-br from-primary/5 via-card to-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15 shadow-sm">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{isAr ? "محفظتي" : "My Wallet"}</h2>
                <p className="text-xs text-muted-foreground">{isAr ? "رصيدك ونقاطك" : "Your balance & points"}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-card p-4 text-center border border-border/40 shadow-sm">
              <Coins className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold tabular-nums">{(wallet?.balance || 0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">{wallet?.currency || "SAR"}</p>
            </div>
            <div className="rounded-2xl bg-chart-4/5 p-4 text-center border border-chart-4/15 shadow-sm">
              <Star className="h-5 w-5 mx-auto mb-2 text-chart-4" />
              <AnimatedCounter value={wallet?.points_balance || 0} className="text-2xl font-bold text-chart-4" />
              <p className="text-xs text-muted-foreground mt-1">{isAr ? "نقاط" : "Points"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: isAr ? "نقاط مكتسبة" : "Earned", value: stats.earned, icon: TrendingUp, color: "text-chart-2", bg: "bg-chart-2/10" },
          { label: isAr ? "نقاط مستبدلة" : "Spent", value: stats.spent, icon: TrendingDown, color: "text-chart-4", bg: "bg-chart-4/10" },
          { label: isAr ? "المعاملات" : "Transactions", value: stats.total, icon: Clock, color: "text-primary", bg: "bg-primary/10" },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className={`flex h-8 w-8 mx-auto items-center justify-center rounded-xl ${s.bg} mb-2 transition-transform duration-300 group-hover:scale-110`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <AnimatedCounter value={s.value} className="text-lg font-bold tabular-nums" />
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Transactions */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {isAr ? "آخر المعاملات" : "Recent Transactions"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder={isAr ? "بحث..." : "Search..."}
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="ps-8 h-8 text-xs rounded-xl border-border/30"
              />
            </div>
            <Select value={txTypeFilter} onValueChange={setTxTypeFilter}>
              <SelectTrigger className="h-8 text-xs rounded-xl w-[120px]">
                <Filter className="h-3 w-3 me-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="earned">{isAr ? "مكتسبة" : "Earned"}</SelectItem>
                <SelectItem value="spent">{isAr ? "مستبدلة" : "Spent"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{isAr ? "لا توجد معاملات بعد" : "No transactions yet"}</p>
              <p className="text-xs mt-1">{isAr ? "ابدأ بكسب النقاط من خلال المسابقات والتفاعل" : "Start earning points through competitions & engagement"}</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isPositive = tx.points > 0;
              const label = actionLabels[tx.action_type];
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl border border-border/30 p-3 transition-colors duration-200 hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isPositive ? "bg-chart-2/10" : "bg-chart-4/10"}`}>
                      {isPositive ? (
                        <ArrowUpRight className="h-4 w-4 text-chart-2" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-chart-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {label ? (isAr ? label.ar : label.en) : tx.action_type?.replace(/_/g, " ")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(tx.created_at), "MMM d, HH:mm", { locale: isAr ? ar : enUS })}
                      </p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className={`text-sm font-bold tabular-nums ${isPositive ? "text-chart-2" : "text-chart-4"}`}>
                      {isPositive ? "+" : ""}{tx.points.toLocaleString()}
                    </p>
                    {tx.balance_after != null && (
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {isAr ? "الرصيد:" : "Bal:"} {tx.balance_after.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
});
