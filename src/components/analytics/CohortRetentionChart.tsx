import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, TrendingDown, UserMinus, BarChart3, AlertTriangle, Target } from "lucide-react";
import { toEnglishDigits } from "@/lib/formatNumber";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell, ComposedChart, Line,
} from "recharts";
import { StaggeredList } from "@/components/ui/staggered-list";
import { linearRegression, forecast, type DataPoint } from "@/lib/trendPrediction";

export function CohortRetentionChart() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-cohort-retention-v2"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, created_at, updated_at")
        .order("created_at", { ascending: true });

      if (!profiles?.length) return null;

      const now = new Date();
      const cohorts: Record<string, { total: number; retained: Record<string, number> }> = {};

      profiles.forEach((p) => {
        const signupMonth = p.created_at?.substring(0, 7);
        if (!signupMonth) return;
        if (!cohorts[signupMonth]) cohorts[signupMonth] = { total: 0, retained: {} };
        cohorts[signupMonth].total++;

        const activityMonth = p.updated_at?.substring(0, 7);
        if (activityMonth && activityMonth >= signupMonth) {
          cohorts[signupMonth].retained[activityMonth] =
            (cohorts[signupMonth].retained[activityMonth] || 0) + 1;
        }
      });

      // Extended cohort table (last 8 months, up to 6 retention months)
      const months = Object.keys(cohorts).sort().slice(-8);
      const maxRetention = 6;

      const cohortTable = months.map(cohortMonth => {
        const c = cohorts[cohortMonth];
        const row: Record<string, any> = { cohort: cohortMonth, total: c.total };
        for (let i = 0; i <= maxRetention; i++) {
          const d = new Date(cohortMonth + "-01");
          d.setMonth(d.getMonth() + i);
          const targetMonth = d.toISOString().substring(0, 7);
          if (targetMonth > now.toISOString().substring(0, 7)) {
            row[`m${i}`] = null;
          } else {
            const retained = c.retained[targetMonth] || 0;
            row[`m${i}`] = c.total > 0 ? Math.round((retained / c.total) * 100) : 0;
          }
        }
        return row;
      });

      // Monthly churn rate calculation
      const sortedMonths = Object.keys(cohorts).sort();
      const churnTrend: { month: string; churnRate: number; retentionRate: number }[] = [];
      for (let i = 1; i < sortedMonths.length; i++) {
        const prevMonth = sortedMonths[i - 1];
        const curMonth = sortedMonths[i];
        const prevCohort = cohorts[prevMonth];
        const retainedInCurrent = prevCohort.retained[curMonth] || 0;
        const churnRate = prevCohort.total > 0
          ? Math.round(((prevCohort.total - retainedInCurrent) / prevCohort.total) * 100)
          : 0;
        churnTrend.push({ month: curMonth, churnRate, retentionRate: 100 - churnRate });
      }
      const recentChurnTrend = churnTrend.slice(-12);

      // Churn prediction using linear regression
      const churnDataPoints: DataPoint[] = recentChurnTrend.map(c => ({ date: c.month, value: c.churnRate }));
      const churnRegression = linearRegression(churnDataPoints);
      const churnForecast = forecast(churnDataPoints, 3);

      // Signup trend for chart
      const signupTrend = Object.entries(cohorts)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, c]) => ({
          month,
          signups: c.total,
          active: Object.values(c.retained).reduce((s, v) => s + v, 0),
        }));

      // Stats
      const totalUsers = profiles.length;
      const thisMonth = now.toISOString().substring(0, 7);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().substring(0, 7);
      const thisMonthSignups = cohorts[thisMonth]?.total || 0;
      const lastMonthSignups = cohorts[lastMonth]?.total || 0;
      const growthRate = lastMonthSignups > 0
        ? ((thisMonthSignups - lastMonthSignups) / lastMonthSignups) * 100
        : 0;

      // Average churn and retention
      const avgChurn = recentChurnTrend.length > 0
        ? Math.round(recentChurnTrend.reduce((s, c) => s + c.churnRate, 0) / recentChurnTrend.length)
        : 0;
      const predictedChurn = Math.round(churnRegression.predictedNext);

      return {
        cohortTable,
        signupTrend,
        churnTrend: recentChurnTrend,
        churnForecast,
        totalUsers,
        thisMonthSignups,
        growthRate,
        avgChurn,
        predictedChurn,
        churnDirection: churnRegression.direction,
        maxRetention,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-4"><Skeleton className="h-72 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <UserMinus className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">{isAr ? "لا توجد بيانات كافية" : "Not enough data yet"}</p>
          <p className="text-xs text-muted-foreground mt-1">{isAr ? "ستظهر بيانات الاحتفاظ عند وجود مستخدمين كافيين" : "Retention data will appear as users grow"}</p>
        </CardContent>
      </Card>
    );
  }

  // Combined churn chart data (historical + predicted)
  const churnChartData = [
    ...data.churnTrend.map(c => ({ month: c.month, churn: c.churnRate, retention: c.retentionRate, predicted: null as number | null })),
    ...data.churnForecast.map(f => ({ month: f.date, churn: null as number | null, retention: null as number | null, predicted: f.value })),
  ];

  return (
    <StaggeredList className="space-y-6 mt-4" stagger={80}>
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-s-[3px] border-s-primary">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-primary/10 p-2.5"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي المستخدمين" : "Total Users"}</p>
              <p className="text-2xl font-bold">{toEnglishDigits(data.totalUsers.toLocaleString())}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-2">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-2/10 p-2.5"><TrendingUp className="h-5 w-5 text-chart-2" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "تسجيلات هذا الشهر" : "This Month"}</p>
              <p className="text-2xl font-bold">{data.thisMonthSignups}</p>
              <p className={`text-[10px] ${data.growthRate >= 0 ? "text-chart-2" : "text-destructive"}`}>
                {data.growthRate >= 0 ? "+" : ""}{toEnglishDigits(data.growthRate.toFixed(1))}%
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-5/10 p-2.5"><UserMinus className="h-5 w-5 text-chart-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "معدل الانسحاب" : "Avg Churn Rate"}</p>
              <p className="text-2xl font-bold">{data.avgChurn}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-4">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-4/10 p-2.5">
              {data.churnDirection === "up" ? <TrendingUp className="h-5 w-5 text-destructive" /> : data.churnDirection === "down" ? <TrendingDown className="h-5 w-5 text-chart-2" /> : <Target className="h-5 w-5 text-chart-4" />}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "تنبؤ الانسحاب القادم" : "Predicted Churn"}</p>
              <p className="text-2xl font-bold">{data.predictedChurn}%</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "الشهر القادم" : "Next month"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Churn & Retention Trend */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-chart-5" />
              {isAr ? "اتجاه الانسحاب والاحتفاظ" : "Churn & Retention Trend"}
            </CardTitle>
            {data.churnDirection === "up" && (
              <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30 gap-1">
                <TrendingUp className="h-3 w-3" />
                {isAr ? "الانسحاب يتزايد" : "Churn increasing"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={churnChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                  formatter={(val: number, name: string) => [`${val}%`, name === "churn" ? (isAr ? "انسحاب" : "Churn") : name === "retention" ? (isAr ? "احتفاظ" : "Retention") : (isAr ? "تنبؤ" : "Predicted")]}
                />
                <Legend formatter={v => v === "churn" ? (isAr ? "انسحاب" : "Churn") : v === "retention" ? (isAr ? "احتفاظ" : "Retention") : (isAr ? "تنبؤ انسحاب" : "Predicted Churn")} />
                <Area type="monotone" dataKey="retention" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.1} strokeWidth={2} connectNulls={false} />
                <Line type="monotone" dataKey="churn" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
                <Line type="monotone" dataKey="predicted" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 4, fill: "hsl(var(--destructive))" }} connectNulls={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Signup vs Activity Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {isAr ? "التسجيلات مقابل النشاط" : "Signups vs Activity"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.signupTrend}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Legend formatter={v => v === "signups" ? (isAr ? "تسجيلات" : "Signups") : (isAr ? "نشاط" : "Active")} />
                <Area type="monotone" dataKey="signups" stroke="hsl(var(--primary))" fill="url(#signupGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="active" stroke="hsl(var(--chart-2))" fill="url(#activeGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Extended Cohort Retention Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {isAr ? "خريطة حرارية للاحتفاظ بالمجموعات" : "Cohort Retention Heatmap"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-start p-2 text-xs font-medium text-muted-foreground">{isAr ? "الفوج" : "Cohort"}</th>
                  <th className="text-center p-2 text-xs font-medium text-muted-foreground">{isAr ? "الحجم" : "Size"}</th>
                  {Array.from({ length: data.maxRetention + 1 }, (_, i) => (
                    <th key={i} className="text-center p-2 text-xs font-medium text-muted-foreground">M{i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.cohortTable.map((row: any) => (
                  <tr key={row.cohort} className="border-b border-border/40">
                    <td className="p-2 font-mono text-xs">{row.cohort}</td>
                    <td className="p-2 text-center font-medium">{row.total}</td>
                    {Array.from({ length: data.maxRetention + 1 }, (_, i) => {
                      const val = row[`m${i}`];
                      if (val === null || val === undefined) {
                        return <td key={i} className="p-2 text-center text-xs text-muted-foreground/40">—</td>;
                      }
                      const intensity = Math.min(val / 100, 1);
                      const bgColor = val >= 70
                        ? `hsl(var(--chart-2) / ${intensity * 0.4})`
                        : val >= 40
                        ? `hsl(var(--chart-4) / ${intensity * 0.5})`
                        : `hsl(var(--chart-5) / ${Math.max(intensity, 0.15) * 0.5})`;
                      return (
                        <td
                          key={i}
                          className="p-2 text-center text-xs font-medium rounded-sm"
                          style={{ backgroundColor: bgColor }}
                        >
                          {val}%
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </StaggeredList>
  );
}
