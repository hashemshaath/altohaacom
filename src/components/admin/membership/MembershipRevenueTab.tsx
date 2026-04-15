import { memo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { AdminExportButton } from "@/components/admin/AdminExportButton";
import { useAdminExport } from "@/hooks/useAdminExport";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart,
} from "recharts";
import {
  DollarSign, TrendingUp, TrendingDown, Users, CreditCard,
  ArrowUpCircle, ArrowDownCircle, Percent, Target, Wallet, Coins,
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { CACHE } from "@/lib/queryConfig";

const MembershipRevenueTab = memo(function MembershipRevenueTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: revenueData } = useQuery({
    queryKey: ["membership-revenue-analytics"],
    queryFn: async () => {
      const [
        { data: profiles },
        { data: invoices },
        { data: history },
        { data: wallets },
      ] = await Promise.all([
        supabase.from("profiles").select("membership_tier, membership_status, membership_started_at, created_at").limit(5000),
        supabase.from("invoices").select("amount, currency, status, created_at, paid_at").order("created_at", { ascending: false }).limit(5000),
        supabase.from("membership_history").select("previous_tier, new_tier, created_at, reason").order("created_at", { ascending: false }).limit(500),
        supabase.from("user_wallets").select("balance, points_balance").limit(5000),
      ]);

      const now = new Date();
      const total = profiles?.length || 0;
      const professional = profiles?.filter(p => p.membership_tier === "professional").length || 0;
      const enterprise = profiles?.filter(p => p.membership_tier === "enterprise").length || 0;

      // Wallet totals
      const totalWalletBalance = wallets?.reduce((s, w) => s + (w.balance || 0), 0) || 0;
      const totalPoints = wallets?.reduce((s, w) => s + (w.points_balance || 0), 0) || 0;

      // Monthly Revenue Rate
      const mrr = (professional * 19) + (enterprise * 99);
      const arr = mrr * 12;

      // Revenue from invoices (paid)
      const paidInvoices = invoices?.filter(i => i.status === "paid") || [];
      const totalRevenue = paidInvoices.reduce((s, i) => s + (i.amount || 0), 0);
      const pendingRevenue = invoices?.filter(i => i.status === "pending").reduce((s, i) => s + (i.amount || 0), 0) || 0;

      // Monthly trend data (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const monthLabel = format(monthDate, "MMM");

        const monthInvoices = paidInvoices.filter(inv => {
          const d = new Date(inv.paid_at || inv.created_at);
          return d >= monthStart && d <= monthEnd;
        });

        const monthUpgrades = history?.filter(h => {
          const d = new Date(h.created_at);
          const tierOrder: Record<string, number> = { basic: 0, professional: 1, enterprise: 2 };
          return d >= monthStart && d <= monthEnd &&
            (tierOrder[h.new_tier] || 0) > (tierOrder[h.previous_tier || "basic"] || 0);
        }).length || 0;

        const monthDowngrades = history?.filter(h => {
          const d = new Date(h.created_at);
          const tierOrder: Record<string, number> = { basic: 0, professional: 1, enterprise: 2 };
          return d >= monthStart && d <= monthEnd &&
            (tierOrder[h.new_tier] || 0) < (tierOrder[h.previous_tier || "basic"] || 0);
        }).length || 0;

        monthlyTrend.push({
          month: monthLabel,
          revenue: monthInvoices.reduce((s, i) => s + (i.amount || 0), 0),
          upgrades: monthUpgrades,
          downgrades: monthDowngrades,
        });
      }

      // ARPU
      const paidMembers = professional + enterprise;
      const arpu = paidMembers > 0 ? Math.round(mrr / paidMembers) : 0;

      // Conversion rate
      const conversionRate = total > 0 ? Math.round((paidMembers / total) * 100) : 0;

      // Member loss (downgrades in last 30 days)
      const thirtyDaysAgo = subMonths(now, 1);
      const recentLoss = history?.filter(h => {
        const tierOrder: Record<string, number> = { basic: 0, professional: 1, enterprise: 2 };
        return new Date(h.created_at) >= thirtyDaysAgo &&
          (tierOrder[h.new_tier] || 0) < (tierOrder[h.previous_tier || "basic"] || 0);
      }).length || 0;

      const lossRate = paidMembers > 0 ? Math.round((recentLoss / paidMembers) * 100) : 0;

      // Tier revenue breakdown
      const tierBreakdown = [
        { name: isAr ? "احترافي" : "Professional", members: professional, rate: 19, revenue: professional * 19 },
        { name: isAr ? "مؤسسي" : "Enterprise", members: enterprise, rate: 99, revenue: enterprise * 99 },
      ];

      // LTV estimate (ARPU * avg months)
      const avgMonths = 6; // assumed average
      const ltv = arpu * avgMonths;

      return {
        mrr, arr, totalRevenue, pendingRevenue, arpu, conversionRate, lossRate,
        paidMembers, total, monthlyTrend, tierBreakdown, recentLoss,
        totalWalletBalance, totalPoints, ltv,
      };
    },
    staleTime: CACHE.medium.staleTime,
  });

  const kpiCards = [
    { icon: DollarSign, label: isAr ? "الإيرادات الشهرية (MRR)" : "Monthly Revenue (MRR)", value: revenueData?.mrr || 0, suffix: " SAR", color: "text-primary" },
    { icon: TrendingUp, label: isAr ? "الإيرادات السنوية (ARR)" : "Annual Revenue (ARR)", value: revenueData?.arr || 0, suffix: " SAR", color: "text-chart-2" },
    { icon: Target, label: isAr ? "ARPU" : "ARPU", value: revenueData?.arpu || 0, suffix: " SAR", color: "text-chart-3" },
    { icon: Percent, label: isAr ? "معدل التحويل" : "Conversion Rate", value: revenueData?.conversionRate || 0, suffix: "%", color: "text-chart-4" },
  ];

  const secondaryCards = [
    { icon: CreditCard, label: isAr ? "إجمالي المحصّل" : "Total Collected", value: revenueData?.totalRevenue || 0, suffix: " SAR", color: "text-chart-2" },
    { icon: DollarSign, label: isAr ? "إيرادات معلقة" : "Pending Revenue", value: revenueData?.pendingRevenue || 0, suffix: " SAR", color: "text-chart-4" },
    { icon: Wallet, label: isAr ? "رصيد المحافظ" : "Wallet Balances", value: revenueData?.totalWalletBalance || 0, suffix: " SAR", color: "text-chart-3" },
    { icon: Coins, label: isAr ? "إجمالي النقاط" : "Total Points", value: revenueData?.totalPoints || 0, color: "text-chart-5" },
    { icon: Users, label: isAr ? "أعضاء مدفوعون" : "Paid Members", value: revenueData?.paidMembers || 0, color: "text-primary" },
    { icon: TrendingDown, label: isAr ? "معدل فقدان الأعضاء" : "Member Loss Rate", value: revenueData?.lossRate || 0, suffix: "%", color: "text-destructive" },
    { icon: Target, label: isAr ? "قيمة العمر (LTV)" : "Lifetime Value", value: revenueData?.ltv || 0, suffix: " SAR", color: "text-chart-1" },
    { icon: ArrowDownCircle, label: isAr ? "فقدان أخير" : "Recent Loss", value: revenueData?.recentLoss || 0, color: "text-destructive" },
  ];

  const { exportData, isExporting } = useAdminExport();
  const handleExport = useCallback((fmt: "csv" | "json") => {
    if (!revenueData) return;
    const rows = [
      { metric: "MRR", value: revenueData.mrr, unit: "SAR" },
      { metric: "ARR", value: revenueData.arr, unit: "SAR" },
      { metric: "ARPU", value: revenueData.arpu, unit: "SAR" },
      { metric: "Conversion Rate", value: revenueData.conversionRate, unit: "%" },
      { metric: "Total Revenue", value: revenueData.totalRevenue, unit: "SAR" },
      { metric: "Pending Revenue", value: revenueData.pendingRevenue, unit: "SAR" },
      { metric: "Paid Members", value: revenueData.paidMembers, unit: "" },
      { metric: "Member Loss Rate", value: revenueData.lossRate, unit: "%" },
      { metric: "LTV", value: revenueData.ltv, unit: "SAR" },
      ...(revenueData.monthlyTrend || []).map(m => ({
        metric: `Revenue (${m.month})`, value: m.revenue, unit: "SAR",
      })),
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic export columns
    exportData(rows as any, [
      { key: "metric" as keyof typeof rows[0], label: "Metric" },
      { key: "value" as keyof typeof rows[0], label: "Value" },
      { key: "unit" as keyof typeof rows[0], label: "Unit" },
    ], { filename: "membership-revenue", format: fmt });
  }, [revenueData, exportData]);

  // MRR growth from trend data
  const mrrGrowth = (() => {
    const trend = revenueData?.monthlyTrend;
    if (!trend || trend.length < 2) return null;
    const prev = trend[trend.length - 2].revenue;
    const curr = trend[trend.length - 1].revenue;
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold">{isAr ? "الإيرادات" : "Revenue Analytics"}</h3>
          {mrrGrowth !== null && (
            <Badge variant={mrrGrowth >= 0 ? "default" : "destructive"} className="gap-1 text-xs">
              {mrrGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {mrrGrowth > 0 ? "+" : ""}{mrrGrowth}% {isAr ? "هذا الشهر" : "this month"}
            </Badge>
          )}
        </div>
        <AdminExportButton onExport={handleExport} isExporting={isExporting} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map(card => (
          <Card key={card.label} className="relative overflow-hidden">
            <div className="absolute top-0 end-0 w-20 h-20 rounded-full bg-gradient-to-br from-primary/5 to-transparent -translate-y-6 translate-x-6" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <AnimatedCounter value={card.value} className="text-2xl" />
                {card.suffix && <span className="text-sm text-muted-foreground">{card.suffix}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {secondaryCards.map(card => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <AnimatedCounter value={card.value} className="text-xl" />
                {card.suffix && <span className="text-xs text-muted-foreground">{card.suffix}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? "اتجاه الإيرادات" : "Revenue Trend"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name={isAr ? "الإيرادات" : "Revenue"}
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.15)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Upgrades vs Downgrades */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? "الترقيات مقابل التخفيضات" : "Upgrades vs Downgrades"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="upgrades" name={isAr ? "ترقيات" : "Upgrades"} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="downgrades" name={isAr ? "تخفيضات" : "Downgrades"} fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isAr ? "تفاصيل الإيرادات حسب المستوى" : "Revenue by Tier"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {revenueData?.tierBreakdown?.map(tier => (
              <div key={tier.name} className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{tier.name}</h4>
                  <Badge variant="outline">{tier.members} {isAr ? "عضو" : "members"}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{isAr ? "السعر الشهري" : "Monthly Rate"}</p>
                    <p className="text-lg font-bold">{tier.rate} <span className="text-xs font-normal text-muted-foreground">SAR</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{isAr ? "إيرادات شهرية" : "Monthly Rev"}</p>
                    <p className="text-lg font-bold text-primary">{tier.revenue} <span className="text-xs font-normal text-muted-foreground">SAR</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default MembershipRevenueTab;
