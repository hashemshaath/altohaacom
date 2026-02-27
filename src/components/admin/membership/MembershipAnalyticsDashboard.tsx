import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, DollarSign,
  ArrowUpCircle, ArrowDownCircle, UserPlus, Crown, Gift
} from "lucide-react";
import { useMemo, useCallback } from "react";
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { AdminExportButton } from "@/components/admin/AdminExportButton";
import { useAdminExport } from "@/hooks/useAdminExport";

const TIER_COLORS: Record<string, string> = {
  basic: "hsl(var(--muted-foreground))",
  professional: "hsl(var(--primary))",
  enterprise: "hsl(var(--chart-2))",
};

const TIER_LABELS: Record<string, { en: string; ar: string }> = {
  basic: { en: "Basic", ar: "الأساسي" },
  professional: { en: "Professional", ar: "الاحترافي" },
  enterprise: { en: "Enterprise", ar: "المؤسسي" },
};

export default function MembershipAnalyticsDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Tier distribution
  const { data: tierDist, isLoading: tierLoading } = useQuery({
    queryKey: ["membership-analytics-tier-dist"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("membership_tier");

      const counts: Record<string, number> = { basic: 0, professional: 0, enterprise: 0 };
      for (const p of profiles || []) {
        const tier = p.membership_tier || "basic";
        counts[tier] = (counts[tier] || 0) + 1;
      }
      const total = Object.values(counts).reduce((s, v) => s + v, 0);
      return Object.entries(counts).map(([tier, value]) => ({
        name: TIER_LABELS[tier]?.[isAr ? "ar" : "en"] || tier,
        value,
        tier,
        pct: total > 0 ? ((value / total) * 100).toFixed(1) : "0",
      }));
    },
    staleTime: 1000 * 60 * 3,
  });

  // Upgrade/downgrade trends (last 6 months)
  const { data: movementTrends, isLoading: movementLoading } = useQuery({
    queryKey: ["membership-analytics-movements"],
    queryFn: async () => {
      const { data: history } = await supabase
        .from("membership_history")
        .select("previous_tier, new_tier, created_at")
        .gte("created_at", subMonths(new Date(), 6).toISOString())
        .order("created_at", { ascending: true });

      const tierOrder: Record<string, number> = { basic: 0, professional: 1, enterprise: 2 };
      const months: Record<string, { label: string; upgrades: number; downgrades: number; net: number }> = {};

      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const key = format(d, "yyyy-MM");
        months[key] = { label: format(d, "MMM"), upgrades: 0, downgrades: 0, net: 0 };
      }

      for (const h of history || []) {
        const key = format(new Date(h.created_at), "yyyy-MM");
        if (!months[key]) continue;
        const prev = tierOrder[h.previous_tier as string] ?? 0;
        const next = tierOrder[h.new_tier as string] ?? 0;
        if (next > prev) months[key].upgrades++;
        else if (next < prev) months[key].downgrades++;
      }

      return Object.values(months).map((m) => ({
        ...m,
        net: m.upgrades - m.downgrades,
      }));
    },
    staleTime: 1000 * 60 * 3,
  });

  // Revenue trend (last 6 months estimated)
  const { data: revenueTrend, isLoading: revenueLoading } = useQuery({
    queryKey: ["membership-analytics-revenue"],
    queryFn: async () => {
      const { data: history } = await supabase
        .from("membership_history")
        .select("new_tier, created_at")
        .gte("created_at", subMonths(new Date(), 6).toISOString());

      const { data: profiles } = await supabase
        .from("profiles")
        .select("membership_tier");

      const tierPrice: Record<string, number> = { basic: 0, professional: 19, enterprise: 99 };

      // Current MRR
      let currentMRR = 0;
      for (const p of profiles || []) {
        currentMRR += tierPrice[p.membership_tier || "basic"] || 0;
      }

      // Monthly breakdown from history (new subscriptions revenue)
      const months: { label: string; revenue: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const key = format(d, "yyyy-MM");
        const label = format(d, "MMM");
        const monthRevenue = (history || [])
          .filter((h) => format(new Date(h.created_at), "yyyy-MM") === key)
          .reduce((sum, h) => sum + (tierPrice[h.new_tier as string] || 0), 0);
        months.push({ label, revenue: monthRevenue });
      }

      return { months, currentMRR };
    },
    staleTime: 1000 * 60 * 3,
  });

  // Summary stats
  const { data: summary } = useQuery({
    queryKey: ["membership-analytics-summary"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("membership_tier, membership_status, membership_expires_at, created_at");

      const now = new Date();
      const thisMonth = startOfMonth(now);
      const total = profiles?.length || 0;
      const active = profiles?.filter((p) => p.membership_status === "active").length || 0;
      const paid = profiles?.filter((p) => p.membership_tier === "professional" || p.membership_tier === "enterprise").length || 0;
      const newThisMonth = profiles?.filter((p) => new Date(p.created_at) >= thisMonth).length || 0;
      const expiringSoon = profiles?.filter((p) => {
        if (!p.membership_expires_at) return false;
        const days = differenceInDays(new Date(p.membership_expires_at), now);
        return days >= 0 && days <= 14;
      }).length || 0;

      const { count: totalUpgrades } = await supabase
        .from("membership_history")
        .select("*", { count: "exact", head: true })
        .gte("created_at", subMonths(now, 1).toISOString());

      return { total, active, paid, newThisMonth, expiringSoon, recentChanges: totalUpgrades || 0 };
    },
    staleTime: 1000 * 60 * 3,
  });

  // Gift analytics
  const { data: giftStats } = useQuery({
    queryKey: ["membership-analytics-gifts"],
    queryFn: async () => {
      const { data: gifts } = await supabase
        .from("membership_gifts")
        .select("status, tier, amount, currency, created_at, redeemed_at");

      const total = gifts?.length || 0;
      const pending = gifts?.filter((g: any) => g.status === "pending").length || 0;
      const redeemed = gifts?.filter((g: any) => g.status === "redeemed").length || 0;
      const totalRevenue = gifts?.reduce((s: number, g: any) => s + (Number(g.amount) || 0), 0) || 0;
      const redemptionRate = total > 0 ? ((redeemed / total) * 100).toFixed(1) : "0";

      // Tier breakdown
      const byTier: Record<string, number> = {};
      for (const g of gifts || []) {
        byTier[(g as any).tier] = (byTier[(g as any).tier] || 0) + 1;
      }

      return { total, pending, redeemed, totalRevenue, redemptionRate, byTier };
    },
    staleTime: 1000 * 60 * 3,
  });

  const conversionRate = summary?.total ? ((summary.paid / summary.total) * 100).toFixed(1) : "0";
  const totalUpgrades = movementTrends?.reduce((s, m) => s + m.upgrades, 0) || 0;
  const totalDowngrades = movementTrends?.reduce((s, m) => s + m.downgrades, 0) || 0;

  const { exportData, isExporting } = useAdminExport();

  const handleExport = useCallback((fmt: "csv" | "json") => {
    const rows: Record<string, unknown>[] = [];
    // Tier distribution
    for (const t of tierDist || []) {
      rows.push({ section: "Tier Distribution", tier: t.tier, count: t.value, percentage: t.pct });
    }
    // Movement trends
    for (const m of movementTrends || []) {
      rows.push({ section: "Movement Trends", month: m.label, upgrades: m.upgrades, downgrades: m.downgrades, net: m.net });
    }
    // Revenue
    for (const r of revenueTrend?.months || []) {
      rows.push({ section: "Revenue", month: r.label, revenue_sar: r.revenue });
    }
    // Summary
    rows.push({
      section: "Summary", total_members: summary?.total, active: summary?.active,
      paid: summary?.paid, new_this_month: summary?.newThisMonth, expiring_soon: summary?.expiringSoon,
      conversion_rate: conversionRate, mrr_sar: revenueTrend?.currentMRR,
    });

    exportData(rows, [
      { key: "section", label: "Section" },
      { key: "tier", label: "Tier" },
      { key: "month", label: "Month" },
      { key: "count", label: "Count" },
      { key: "percentage", label: "%" },
      { key: "upgrades", label: "Upgrades" },
      { key: "downgrades", label: "Downgrades" },
      { key: "net", label: "Net" },
      { key: "revenue_sar", label: "Revenue (SAR)" },
      { key: "total_members", label: "Total Members" },
      { key: "active", label: "Active" },
      { key: "paid", label: "Paid" },
      { key: "new_this_month", label: "New This Month" },
      { key: "expiring_soon", label: "Expiring Soon" },
      { key: "conversion_rate", label: "Conversion Rate" },
      { key: "mrr_sar", label: "MRR (SAR)" },
    ], { filename: "membership-analytics", format: fmt });
  }, [tierDist, movementTrends, revenueTrend, summary, conversionRate, exportData]);

  if (tierLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Export */}
      <div className="flex justify-end">
        <AdminExportButton onExport={handleExport} isExporting={isExporting} />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <KPICard
          icon={Users}
          label={isAr ? "إجمالي الأعضاء" : "Total Members"}
          value={summary?.total || 0}
          sub={isAr ? `${summary?.active || 0} نشط` : `${summary?.active || 0} active`}
        />
        <KPICard
          icon={Crown}
          label={isAr ? "معدل التحويل" : "Conversion Rate"}
          value={`${conversionRate}%`}
          sub={isAr ? `${summary?.paid || 0} مدفوع` : `${summary?.paid || 0} paid`}
          color="text-primary"
        />
        <KPICard
          icon={DollarSign}
          label={isAr ? "الإيرادات الشهرية" : "Monthly Revenue"}
          value={`${revenueTrend?.currentMRR || 0} SAR`}
          sub={isAr ? "تقدير شهري" : "Est. MRR"}
          color="text-chart-2"
        />
        <KPICard
          icon={UserPlus}
          label={isAr ? "أعضاء جدد" : "New This Month"}
          value={summary?.newThisMonth || 0}
          sub={isAr ? `${summary?.expiringSoon || 0} ينتهي قريباً` : `${summary?.expiringSoon || 0} expiring soon`}
          color="text-chart-3"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Tier Distribution Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "توزيع المستويات" : "Tier Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            {tierDist && tierDist.length > 0 ? (
              <div className="flex flex-col items-center gap-3">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={tierDist}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {tierDist.map((entry) => (
                        <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] || "hsl(var(--muted))"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center">
                  {tierDist.map((t) => (
                    <div key={t.tier} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TIER_COLORS[t.tier] }} />
                      <span className="text-muted-foreground">{t.name}</span>
                      <span className="font-semibold">{t.value}</span>
                      <span className="text-muted-foreground/60">({t.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState isAr={isAr} />
            )}
          </CardContent>
        </Card>

        {/* Upgrade/Downgrade Trends */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{isAr ? "حركة الترقيات والتخفيضات" : "Upgrade & Downgrade Trends"}</CardTitle>
              <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <ArrowUpCircle className="h-3 w-3 text-primary" />
                  <span className="text-muted-foreground">{totalUpgrades} {isAr ? "ترقية" : "up"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowDownCircle className="h-3 w-3 text-destructive" />
                  <span className="text-muted-foreground">{totalDowngrades} {isAr ? "تخفيض" : "down"}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {movementTrends && movementTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={movementTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="upgrades" fill="hsl(var(--primary))" name={isAr ? "ترقيات" : "Upgrades"} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="downgrades" fill="hsl(var(--destructive))" name={isAr ? "تخفيضات" : "Downgrades"} radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState isAr={isAr} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "اتجاه الإيرادات (6 أشهر)" : "Revenue Trend (6 Months)"}</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueTrend && revenueTrend.months.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueTrend.months}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value} SAR`, isAr ? "الإيرادات" : "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fill="url(#revenueGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState isAr={isAr} />
          )}
        </CardContent>
      </Card>

      {/* Net movement + retention insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "صافي حركة الأعضاء" : "Net Member Movement"}</CardTitle>
          </CardHeader>
          <CardContent>
            {movementTrends && movementTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={movementTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name={isAr ? "صافي الحركة" : "Net Movement"}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState isAr={isAr} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "ملخص سريع" : "Quick Insights"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InsightRow
              icon={TrendingUp}
              label={isAr ? "ترقيات (6 أشهر)" : "Upgrades (6mo)"}
              value={totalUpgrades}
              color="text-primary"
            />
            <InsightRow
              icon={TrendingDown}
              label={isAr ? "تخفيضات (6 أشهر)" : "Downgrades (6mo)"}
              value={totalDowngrades}
              color="text-destructive"
            />
            <InsightRow
              icon={Users}
              label={isAr ? "تغييرات هذا الشهر" : "Changes This Month"}
              value={summary?.recentChanges || 0}
              color="text-chart-3"
            />
            <InsightRow
              icon={Crown}
              label={isAr ? "نسبة الاحتفاظ" : "Retention Rate"}
              value={`${summary?.total ? (((summary.total - (summary.expiringSoon || 0)) / summary.total) * 100).toFixed(0) : 100}%`}
              color="text-chart-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Gift Analytics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            {isAr ? "تحليلات الهدايا" : "Gift Analytics"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold">{giftStats?.total || 0}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "إجمالي الهدايا" : "Total Gifts"}</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold text-primary">{giftStats?.redeemed || 0}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "تم استردادها" : "Redeemed"}</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold text-chart-3">{giftStats?.pending || 0}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "في الانتظار" : "Pending"}</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold text-chart-2">{giftStats?.totalRevenue?.toFixed(0) || 0} SAR</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "إيرادات الهدايا" : "Gift Revenue"}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">{isAr ? "معدل الاسترداد" : "Redemption Rate"}</span>
            <Badge variant="outline" className="font-bold">{giftStats?.redemptionRate || 0}%</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, color = "text-foreground" }: {
  icon: React.ElementType; label: string; value: string | number; sub: string; color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function InsightRow({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}

function EmptyState({ isAr }: { isAr: boolean }) {
  return (
    <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
      {isAr ? "لا توجد بيانات بعد" : "No data yet"}
    </div>
  );
}
