import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Users } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export const WalletTransactionHeatmap = memo(function WalletTransactionHeatmap() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["wallet-txn-heatmap"],
    queryFn: async () => {
      // Recent transactions
      const { data: txns } = await supabase
        .from("wallet_transactions")
        .select("type, amount, currency, created_at, description")
        .order("created_at", { ascending: false })
        .limit(30);

      // Top wallets by balance
      const { data: topWallets } = await supabase
        .from("user_wallets")
        .select("user_id, balance, points_balance, wallet_number")
        .order("balance", { ascending: false })
        .limit(5);

      // Get profile names for top wallets
      const userIds = topWallets?.map(w => w.user_id) || [];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, username")
          .in("user_id", userIds);
        profiles?.forEach(p => {
          profileMap[p.user_id] = p.full_name || p.username || "—";
        });
      }

      // Weekly summary
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data: weekTxns } = await supabase
        .from("wallet_transactions")
        .select("type, amount")
        .gte("created_at", weekAgo);

      const weekCredits = weekTxns?.filter(t => t.type === "credit").reduce((s, t) => s + (t.amount || 0), 0) || 0;
      const weekDebits = weekTxns?.filter(t => t.type === "debit").reduce((s, t) => s + (t.amount || 0), 0) || 0;

      return {
        recentTxns: txns || [],
        topWallets: (topWallets || []).map(w => ({ ...w, name: profileMap[w.user_id] || "—" })),
        weekCredits,
        weekDebits,
      };
    },
    staleTime: 60000,
  });

  if (!data) return null;

  const typeColors: Record<string, string> = {
    credit: "text-chart-2",
    debit: "text-destructive",
    refund: "text-chart-4",
    adjustment: "text-primary",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            {isAr ? "آخر المعاملات" : "Recent Transactions"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-1.5 max-h-[280px] overflow-y-auto">
          {data.recentTxns.slice(0, 12).map((txn: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                {txn.type === "credit" ? (
                  <ArrowDownRight className="h-3.5 w-3.5 text-chart-2 shrink-0" />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5 text-destructive shrink-0" />
                )}
                <span className="text-xs truncate">{txn.description || txn.type}</span>
              </div>
              <span className={`text-xs font-mono font-bold ${typeColors[txn.type] || "text-foreground"}`}>
                {txn.type === "credit" ? "+" : "-"}{txn.amount?.toFixed(2)} {txn.currency || "SAR"}
              </span>
            </div>
          ))}
          {data.recentTxns.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">{isAr ? "لا توجد معاملات" : "No transactions"}</p>
          )}
        </CardContent>
      </Card>

      {/* Top Wallets + Weekly Summary */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-chart-1" />
              {isAr ? "أعلى الأرصدة" : "Top Wallets"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {data.topWallets.map((w: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] w-5 h-5 flex items-center justify-center rounded-full p-0">
                    {i + 1}
                  </Badge>
                  <span className="text-xs font-medium truncate max-w-[120px]">{w.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold">{w.balance?.toFixed(2)} SAR</p>
                  <p className="text-[9px] text-muted-foreground">{w.points_balance || 0} pts</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "إيرادات الأسبوع" : "Weekly Credits"}</p>
              <p className="text-lg font-bold text-chart-2">+<AnimatedCounter value={Math.round(data.weekCredits * 100) / 100} /></p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "مصروفات الأسبوع" : "Weekly Debits"}</p>
              <p className="text-lg font-bold text-destructive">-<AnimatedCounter value={Math.round(data.weekDebits * 100) / 100} /></p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "الصافي" : "Net"}</p>
            <p className={`text-lg font-bold ${data.weekCredits - data.weekDebits >= 0 ? "text-chart-2" : "text-destructive"}`}>
                <AnimatedCounter value={Math.round((data.weekCredits - data.weekDebits) * 100) / 100} />
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
