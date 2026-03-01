import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, AreaChart, Area, Cell
} from "recharts";
import {
  TrendingDown, TrendingUp, Users, AlertTriangle, ShieldAlert,
  Clock, UserMinus, RefreshCcw, ArrowRight, Crown
} from "lucide-react";
import { useMemo, useCallback } from "react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { format, subMonths, differenceInDays, startOfMonth, endOfMonth, subDays } from "date-fns";
import { AdminExportButton } from "@/components/admin/AdminExportButton";
import { useAdminExport } from "@/hooks/useAdminExport";

const TIER_COLORS: Record<string, string> = {
  basic: "hsl(var(--muted-foreground))",
  professional: "hsl(var(--primary))",
  enterprise: "hsl(var(--chart-2))",
};

export default function MembershipChurnRetention() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Churn rate (monthly) - users who downgraded or had membership suspended/expired
  const { data: churnData, isLoading: churnLoading } = useQuery({
    queryKey: ["membership-churn-monthly"],
    queryFn: async () => {
      const { data: history } = await supabase
        .from("membership_history")
        .select("previous_tier, new_tier, created_at, reason")
        .gte("created_at", subMonths(new Date(), 6).toISOString())
        .order("created_at", { ascending: true });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("membership_tier, membership_status, membership_started_at, membership_expires_at");

      const tierOrder: Record<string, number> = { basic: 0, professional: 1, enterprise: 2 };
      const months: Record<string, { label: string; churned: number; retained: number; churnRate: number; total: number }> = {};

      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const key = format(d, "yyyy-MM");
        months[key] = { label: format(d, "MMM"), churned: 0, retained: 0, churnRate: 0, total: 0 };
      }

      // Count churns (downgrades or suspensions)
      for (const h of history || []) {
        const key = format(new Date(h.created_at), "yyyy-MM");
        if (!months[key]) continue;
        const prev = tierOrder[h.previous_tier as string] ?? 0;
        const next = tierOrder[h.new_tier as string] ?? 0;
        if (next < prev) months[key].churned++;
      }

      // Estimate total paid members per month for churn rate
      const totalPaid = profiles?.filter((p) => p.membership_tier !== "basic").length || 1;
      Object.values(months).forEach((m) => {
        m.total = totalPaid;
        m.retained = Math.max(0, totalPaid - m.churned);
        m.churnRate = totalPaid > 0 ? parseFloat(((m.churned / totalPaid) * 100).toFixed(1)) : 0;
      });

      const avgChurn = Object.values(months).reduce((s, m) => s + m.churnRate, 0) / 6;

      return { months: Object.values(months), avgChurn: avgChurn.toFixed(1), totalPaid };
    },
    staleTime: 1000 * 60 * 5,
  });

  // Retention cohorts - users grouped by signup month, tracked over time
  const { data: cohortData, isLoading: cohortLoading } = useQuery({
    queryKey: ["membership-retention-cohorts"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, membership_tier, membership_status, membership_started_at, created_at")
        .neq("membership_tier", "basic")
        .not("membership_started_at", "is", null);

      const { data: history } = await supabase
        .from("membership_history")
        .select("user_id, previous_tier, new_tier, created_at");

      const now = new Date();
      const cohorts: { label: string; month: string; total: number; retained: number[]; retentionPct: number[] }[] = [];

      for (let i = 5; i >= 0; i--) {
        const cohortDate = subMonths(now, i);
        const cohortKey = format(cohortDate, "yyyy-MM");
        const cohortStart = startOfMonth(cohortDate);
        const cohortEnd = endOfMonth(cohortDate);

        // Users who started membership in this month
        const cohortUsers = (profiles || []).filter((p) => {
          const started = new Date(p.membership_started_at);
          return started >= cohortStart && started <= cohortEnd;
        });

        const total = cohortUsers.length;
        if (total === 0) {
          cohorts.push({ label: format(cohortDate, "MMM"), month: cohortKey, total: 0, retained: [], retentionPct: [] });
          continue;
        }

        const userIds = new Set(cohortUsers.map((u) => u.user_id));
        const retained: number[] = [];
        const retentionPct: number[] = [];

        // Check retention at month 1, 2, 3... from cohort start
        for (let m = 0; m <= Math.min(5 - i, 5); m++) {
          const checkDate = subMonths(now, i - m);
          const checkEnd = endOfMonth(checkDate);

          if (checkEnd > now) break;

          // Users who churned (downgraded to basic) before checkEnd
          const churnedIds = new Set<string>();
          for (const h of history || []) {
            if (!userIds.has(h.user_id)) continue;
            if (new Date(h.created_at) > checkEnd) continue;
            if ((h.new_tier as string) === "basic" && (h.previous_tier as string) !== "basic") {
              churnedIds.add(h.user_id);
            }
          }

          const retainedCount = total - churnedIds.size;
          retained.push(retainedCount);
          retentionPct.push(parseFloat(((retainedCount / total) * 100).toFixed(0)));
        }

        cohorts.push({ label: format(cohortDate, "MMM"), month: cohortKey, total, retained, retentionPct });
      }

      return cohorts;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Predictive expiry alerts - users at risk
  const { data: atRiskData, isLoading: riskLoading } = useQuery({
    queryKey: ["membership-at-risk"],
    queryFn: async () => {
      const now = new Date();
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, membership_tier, membership_status, membership_expires_at, membership_started_at")
        .neq("membership_tier", "basic")
        .not("membership_expires_at", "is", null)
        .gt("membership_expires_at", now.toISOString())
        .lte("membership_expires_at", subDays(now, -30).toISOString())
        .order("membership_expires_at", { ascending: true });

      const critical: any[] = [];
      const warning: any[] = [];
      const upcoming: any[] = [];

      for (const p of profiles || []) {
        const daysLeft = differenceInDays(new Date(p.membership_expires_at), now);
        const entry = {
          ...p,
          daysLeft,
          name: p.full_name || p.username || "Unknown",
        };

        if (daysLeft <= 3) critical.push(entry);
        else if (daysLeft <= 7) warning.push(entry);
        else if (daysLeft <= 30) upcoming.push(entry);
      }

      // Status breakdown for expired/suspended
      const { data: statusProfiles } = await supabase
        .from("profiles")
        .select("membership_status")
        .neq("membership_tier", "basic");

      const statusCounts: Record<string, number> = { active: 0, expired: 0, suspended: 0 };
      for (const p of statusProfiles || []) {
        const s = p.membership_status || "active";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      }

      return { critical, warning, upcoming, statusCounts };
    },
    staleTime: 1000 * 60 * 3,
  });

  // Cancellation/churn reasons breakdown from membership_history
  const { data: cancelReasons } = useQuery({
    queryKey: ["membership-cancel-reasons"],
    queryFn: async () => {
      const { data } = await supabase
        .from("membership_history")
        .select("reason, created_at, previous_tier, new_tier")
        .gte("created_at", subMonths(new Date(), 6).toISOString());

      const tierOrder: Record<string, number> = { basic: 0, professional: 1, enterprise: 2 };
      const counts: Record<string, number> = {};
      for (const c of data || []) {
        const prev = tierOrder[c.previous_tier as string] ?? 0;
        const next = tierOrder[c.new_tier as string] ?? 0;
        if (next >= prev) continue; // Only count downgrades/churns
        const reason = c.reason || "unknown";
        counts[reason] = (counts[reason] || 0) + 1;
      }
      return Object.entries(counts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    },
    staleTime: 1000 * 60 * 5,
  });

  const totalAtRisk = (atRiskData?.critical.length || 0) + (atRiskData?.warning.length || 0) + (atRiskData?.upcoming.length || 0);

  const { exportData, isExporting } = useAdminExport();

  const handleExport = useCallback((fmt: "csv" | "json") => {
    const rows: Record<string, unknown>[] = [];
    // Churn monthly data
    for (const m of churnData?.months || []) {
      rows.push({ section: "Monthly Churn", month: m.label, churn_rate: m.churnRate, churned: m.churned, retained: m.retained });
    }
    // At-risk members
    for (const u of [...(atRiskData?.critical || []), ...(atRiskData?.warning || []), ...(atRiskData?.upcoming || [])]) {
      rows.push({ section: "At Risk", name: u.name, tier: u.membership_tier, days_left: u.daysLeft, status: u.membership_status });
    }
    // Cancel reasons
    for (const r of cancelReasons || []) {
      rows.push({ section: "Churn Reasons", reason: r.reason, count: r.count });
    }
    rows.push({
      section: "Summary", avg_churn_rate: churnData?.avgChurn,
      retention_rate: (100 - parseFloat(churnData?.avgChurn || "0")).toFixed(1),
      total_at_risk: totalAtRisk, suspended: atRiskData?.statusCounts?.suspended,
    });

    exportData(rows, [
      { key: "section", label: "Section" },
      { key: "month", label: "Month" },
      { key: "churn_rate", label: "Churn Rate %" },
      { key: "churned", label: "Churned" },
      { key: "retained", label: "Retained" },
      { key: "name", label: "Name" },
      { key: "tier", label: "Tier" },
      { key: "days_left", label: "Days Left" },
      { key: "status", label: "Status" },
      { key: "reason", label: "Reason" },
      { key: "count", label: "Count" },
      { key: "avg_churn_rate", label: "Avg Churn Rate" },
      { key: "retention_rate", label: "Retention Rate" },
      { key: "total_at_risk", label: "Total At Risk" },
      { key: "suspended", label: "Suspended" },
    ], { filename: "membership-churn-retention", format: fmt });
  }, [churnData, atRiskData, cancelReasons, totalAtRisk, exportData]);

  if (churnLoading || cohortLoading) {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{isAr ? "التسرب والاحتفاظ" : "Churn & Retention"}</h3>
          <p className="text-sm text-muted-foreground">{isAr ? "تحليل معدلات التسرب والاحتفاظ بالأعضاء المدفوعين" : "Analyze paid member churn rates, retention cohorts & at-risk alerts"}</p>
        </div>
        <AdminExportButton onExport={handleExport} isExporting={isExporting} />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-xs font-medium text-muted-foreground">{isAr ? "معدل التسرب" : "Avg Churn Rate"}</span>
            </div>
            <span className="text-2xl font-bold"><AnimatedCounter value={parseFloat(churnData?.avgChurn || "0")} suffix="%" /></span>
            <p className="text-[10px] text-muted-foreground mt-0.5">{isAr ? "متوسط 6 أشهر" : "6-month avg"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCcw className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">{isAr ? "معدل الاحتفاظ" : "Retention Rate"}</span>
            </div>
            <span className="text-2xl font-bold"><AnimatedCounter value={Math.round((100 - parseFloat(churnData?.avgChurn || "0")) * 10) / 10} suffix="%" /></span>
            <p className="text-[10px] text-muted-foreground mt-0.5">{isAr ? "أعضاء مدفوعين" : "paid members"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-chart-3" />
              <span className="text-xs font-medium text-muted-foreground">{isAr ? "معرضون للخطر" : "At Risk"}</span>
            </div>
            <AnimatedCounter value={totalAtRisk} className="text-2xl" />
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {atRiskData?.critical.length || 0} {isAr ? "حرج" : "critical"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserMinus className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{isAr ? "معلقون" : "Suspended"}</span>
            </div>
            <AnimatedCounter value={atRiskData?.statusCounts?.suspended || 0} className="text-2xl" />
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {atRiskData?.statusCounts?.expired || 0} {isAr ? "منتهي" : "expired"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical alerts */}
      {(atRiskData?.critical.length || 0) > 0 && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>{isAr ? "أعضاء في خطر حرج" : "Critical: Members expiring soon"}</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-1.5">
              {atRiskData!.critical.slice(0, 5).map((u: any) => (
                <div key={u.user_id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Crown className="h-3 w-3" />
                    <span className="font-medium">{u.name}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">{u.membership_tier}</Badge>
                  </div>
                  <Badge variant="destructive" className="text-[10px]">
                    {u.daysLeft <= 0 ? (isAr ? "اليوم" : "Today") : `${u.daysLeft}d`}
                  </Badge>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Monthly Churn Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "معدل التسرب الشهري" : "Monthly Churn Rate"}</CardTitle>
          </CardHeader>
          <CardContent>
            {churnData?.months && churnData.months.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={churnData.months}>
                  <defs>
                    <linearGradient id="churnGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={35} unit="%" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`${value}%`, isAr ? "معدل التسرب" : "Churn Rate"]}
                  />
                  <Area type="monotone" dataKey="churnRate" stroke="hsl(var(--destructive))" fill="url(#churnGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState isAr={isAr} />
            )}
          </CardContent>
        </Card>

        {/* Churned vs Retained */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "المتسربون مقابل المحتفظ بهم" : "Churned vs Retained"}</CardTitle>
          </CardHeader>
          <CardContent>
            {churnData?.months && churnData.months.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={churnData.months}>
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
                  <Bar dataKey="retained" fill="hsl(var(--primary))" name={isAr ? "محتفظ" : "Retained"} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="churned" fill="hsl(var(--destructive))" name={isAr ? "متسرب" : "Churned"} radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState isAr={isAr} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Retention Cohort Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "تحليل الأفواج (Cohort)" : "Retention Cohort Analysis"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-start py-2.5 pe-4 font-medium text-muted-foreground">{isAr ? "الفوج" : "Cohort"}</th>
                  <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">{isAr ? "الحجم" : "Size"}</th>
                  {[0, 1, 2, 3, 4, 5].map((m) => (
                    <th key={m} className="text-center py-2.5 px-2 font-medium text-muted-foreground text-xs">
                      {isAr ? `شهر ${m}` : `M${m}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(cohortData || []).map((cohort) => (
                  <tr key={cohort.month} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pe-4 font-medium">{cohort.label}</td>
                    <td className="text-center py-2.5 px-3 tabular-nums">{cohort.total}</td>
                    {[0, 1, 2, 3, 4, 5].map((m) => {
                      const pct = cohort.retentionPct[m];
                      return (
                        <td key={m} className="text-center py-2.5 px-2">
                          {pct !== undefined ? (
                            <span
                              className="inline-block px-2 py-0.5 rounded text-xs font-medium tabular-nums"
                              style={{
                                backgroundColor: `hsl(var(--primary) / ${Math.max(0.1, pct / 100)})`,
                                color: pct > 50 ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                              }}
                            >
                              {pct}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {(!cohortData || cohortData.length === 0) && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      {isAr ? "لا توجد بيانات كافية" : "Not enough data yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* At-Risk Members & Cancel Reasons */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* At-Risk Members */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-chart-3" />
              {isAr ? "أعضاء معرضون للخطر" : "At-Risk Members"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: isAr ? "حرج (≤3 أيام)" : "Critical (≤3 days)", data: atRiskData?.critical || [], color: "destructive" as const },
              { label: isAr ? "تحذير (≤7 أيام)" : "Warning (≤7 days)", data: atRiskData?.warning || [], color: "default" as const },
              { label: isAr ? "قادم (≤30 يوم)" : "Upcoming (≤30 days)", data: atRiskData?.upcoming || [], color: "secondary" as const },
            ].map((group) => (
              <div key={group.label} className="rounded-xl border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">{group.label}</span>
                  <Badge variant={group.color} className="text-[10px]">{group.data.length}</Badge>
                </div>
                {group.data.length > 0 ? (
                  <div className="space-y-1">
                    {group.data.slice(0, 3).map((u: any) => (
                      <div key={u.user_id} className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[140px]">{u.name}</span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[8px] px-1 py-0">{u.membership_tier}</Badge>
                          <span className="text-muted-foreground tabular-nums">{u.daysLeft}d</span>
                        </div>
                      </div>
                    ))}
                    {group.data.length > 3 && (
                      <p className="text-[10px] text-muted-foreground">+{group.data.length - 3} {isAr ? "آخرين" : "more"}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/60">{isAr ? "لا يوجد" : "None"}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Cancellation Reasons */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "أسباب الإلغاء" : "Cancellation Reasons"}</CardTitle>
          </CardHeader>
          <CardContent>
            {cancelReasons && cancelReasons.length > 0 ? (
              <div className="space-y-2">
                {cancelReasons.map((r) => {
                  const total = cancelReasons.reduce((s, x) => s + x.count, 0);
                  const pct = total > 0 ? (r.count / total) * 100 : 0;
                  return (
                    <div key={r.reason} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize truncate max-w-[180px]">{r.reason.replace(/_/g, " ")}</span>
                        <span className="text-muted-foreground tabular-nums">{r.count} ({pct.toFixed(0)}%)</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                {isAr ? "لا توجد بيانات إلغاء" : "No cancellation data yet"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Member Health Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "صحة العضويات المدفوعة" : "Paid Membership Health"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-3">
            {[
              { label: isAr ? "نشط" : "Active", count: atRiskData?.statusCounts?.active || 0, color: "hsl(var(--primary))" },
              { label: isAr ? "منتهي" : "Expired", count: atRiskData?.statusCounts?.expired || 0, color: "hsl(var(--chart-3))" },
              { label: isAr ? "معلق" : "Suspended", count: atRiskData?.statusCounts?.suspended || 0, color: "hsl(var(--destructive))" },
            ].map((s) => {
              const total = Object.values(atRiskData?.statusCounts || {}).reduce((sum, v) => sum + v, 0) || 1;
              const pct = ((s.count / total) * 100).toFixed(0);
              return (
                <div key={s.label} className="text-center rounded-xl border p-3">
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label} ({pct}%)</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
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
