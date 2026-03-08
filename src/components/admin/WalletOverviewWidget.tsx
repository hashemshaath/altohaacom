import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, TrendingDown, ArrowRightLeft, CreditCard, Banknote } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { subDays, format } from "date-fns";

export const WalletOverviewWidget = memo(function WalletOverviewWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-wallet-overview"],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();

      const [
        { count: totalWallets },
        { data: transactions },
        { data: recentTxns },
      ] = await Promise.all([
        supabase.from("user_wallets").select("*", { count: "exact", head: true }),
        supabase.from("wallet_transactions").select("type, amount, created_at").gte("created_at", sevenDaysAgo).limit(1000),
        supabase.from("wallet_transactions").select("type, amount, description, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      // Calculate totals
      const totalCredits = transactions?.filter((t: any) => ["credit", "refund"].includes(t.type)).reduce((s: number, t: any) => s + (t.amount || 0), 0) || 0;
      const totalDebits = transactions?.filter((t: any) => ["debit", "payment"].includes(t.type)).reduce((s: number, t: any) => s + (t.amount || 0), 0) || 0;

      // Daily chart data
      const dailyMap: Record<string, { credits: number; debits: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "EEE");
        dailyMap[d] = { credits: 0, debits: 0 };
      }
      transactions?.forEach((t: any) => {
        const day = format(new Date(t.created_at), "EEE");
        if (!dailyMap[day]) return;
        if (["credit", "refund"].includes(t.type)) dailyMap[day].credits += t.amount || 0;
        else dailyMap[day].debits += t.amount || 0;
      });

      const chartData = Object.entries(dailyMap).map(([day, v]) => ({ day, ...v }));

      return {
        totalWallets: totalWallets || 0,
        totalCredits,
        totalDebits,
        totalTxns: transactions?.length || 0,
        chartData,
        recentTxns: recentTxns || [],
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) return <Skeleton className="h-72 w-full rounded-xl" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-4 w-4 text-primary" />
          {isAr ? "نظرة عامة على المحافظ" : "Wallet Overview"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: CreditCard, label: isAr ? "المحافظ" : "Wallets", value: data?.totalWallets, color: "text-primary" },
            { icon: TrendingUp, label: isAr ? "إيداعات 7 أيام" : "Credits 7d", value: `${data?.totalCredits?.toFixed(0)} SAR`, color: "text-chart-2" },
            { icon: TrendingDown, label: isAr ? "سحوبات 7 أيام" : "Debits 7d", value: `${data?.totalDebits?.toFixed(0)} SAR`, color: "text-destructive" },
          ].map((m, i) => (
            <div key={i} className="text-center p-2 rounded-xl bg-muted/30">
              <m.icon className={`h-3.5 w-3.5 mx-auto mb-1 ${m.color}`} />
              <p className="text-xs font-bold">{m.value}</p>
              <p className="text-[9px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Weekly Chart */}
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.chartData || []}>
              <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="credits" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} name={isAr ? "إيداعات" : "Credits"} />
              <Bar dataKey="debits" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} opacity={0.7} name={isAr ? "سحوبات" : "Debits"} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{isAr ? "آخر المعاملات" : "Recent Transactions"}</p>
          {data?.recentTxns.map((txn: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-muted/20">
              <div className="flex items-center gap-1.5 truncate">
                <ArrowRightLeft className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">{txn.description || txn.type}</span>
              </div>
              <Badge variant={["credit", "refund"].includes(txn.type) ? "secondary" : "outline"} className="text-[9px] px-1.5 py-0 shrink-0 ms-2">
                {["credit", "refund"].includes(txn.type) ? "+" : "-"}{txn.amount} SAR
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
