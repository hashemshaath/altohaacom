import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, UserMinus, BarChart3 } from "lucide-react";
import { toEnglishDigits } from "@/lib/formatNumber";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { StaggeredList } from "@/components/ui/staggered-list";

export function CohortRetentionChart() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-cohort-retention"],
    queryFn: async () => {
      // Fetch user profiles with created_at and last activity proxy (updated_at or last_seen)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, created_at, updated_at")
        .order("created_at", { ascending: true });

      if (!profiles?.length) return null;

      // Build monthly cohorts
      const now = new Date();
      const cohorts: Record<string, { total: number; retained: Record<string, number> }> = {};

      profiles.forEach((p) => {
        const signupMonth = p.created_at?.substring(0, 7);
        if (!signupMonth) return;

        if (!cohorts[signupMonth]) {
          cohorts[signupMonth] = { total: 0, retained: {} };
        }
        cohorts[signupMonth].total++;

        // Check activity in subsequent months
        const activityMonth = p.updated_at?.substring(0, 7);
        if (activityMonth && activityMonth >= signupMonth) {
          cohorts[signupMonth].retained[activityMonth] =
            (cohorts[signupMonth].retained[activityMonth] || 0) + 1;
        }
      });

      // Build cohort table (last 6 months)
      const months = Object.keys(cohorts).sort().slice(-6);
      const allMonths = [...new Set([
        ...months,
        ...months.map(m => {
          const d = new Date(m + "-01");
          return Array.from({ length: 3 }, (_, i) => {
            const nd = new Date(d);
            nd.setMonth(nd.getMonth() + i + 1);
            return nd.toISOString().substring(0, 7);
          });
        }).flat()
      ])].sort().filter(m => m <= now.toISOString().substring(0, 7));

      const cohortTable = months.map(cohortMonth => {
        const c = cohorts[cohortMonth];
        const row: Record<string, any> = {
          cohort: cohortMonth,
          total: c.total,
        };
        // Calculate retention for months 0, 1, 2, 3
        for (let i = 0; i <= 3; i++) {
          const d = new Date(cohortMonth + "-01");
          d.setMonth(d.getMonth() + i);
          const targetMonth = d.toISOString().substring(0, 7);
          const retained = c.retained[targetMonth] || 0;
          row[`m${i}`] = c.total > 0 ? Math.round((retained / c.total) * 100) : 0;
        }
        return row;
      });

      // Monthly signup trend for churn proxy
      const signupTrend = Object.entries(cohorts)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, c]) => ({
          month,
          signups: c.total,
          active: Object.values(c.retained).reduce((s, v) => s + v, 0),
        }));

      // Overall stats
      const totalUsers = profiles.length;
      const thisMonth = now.toISOString().substring(0, 7);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().substring(0, 7);
      const thisMonthSignups = cohorts[thisMonth]?.total || 0;
      const lastMonthSignups = cohorts[lastMonth]?.total || 0;
      const growthRate = lastMonthSignups > 0
        ? ((thisMonthSignups - lastMonthSignups) / lastMonthSignups) * 100
        : 0;

      return { cohortTable, signupTrend, totalUsers, thisMonthSignups, growthRate };
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i}><CardContent className="p-4"><div className="h-20 animate-pulse bg-muted rounded" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <StaggeredList className="space-y-6" stagger={80}>
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-s-[3px] border-s-primary">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي المستخدمين" : "Total Users"}</p>
              <p className="text-2xl font-bold">{toEnglishDigits(data.totalUsers.toLocaleString())}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-2">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-2/10 p-2.5">
              <TrendingUp className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "تسجيلات هذا الشهر" : "This Month"}</p>
              <p className="text-2xl font-bold">{data.thisMonthSignups}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-s-[3px] border-s-chart-4">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-chart-4/10 p-2.5">
              <BarChart3 className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "معدل النمو" : "Growth Rate"}</p>
              <p className={`text-2xl font-bold ${data.growthRate >= 0 ? "text-chart-2" : "text-destructive"}`}>
                {data.growthRate >= 0 ? "+" : ""}{toEnglishDigits(data.growthRate.toFixed(1))}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signup vs Active Trend */}
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

      {/* Cohort Retention Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserMinus className="h-4 w-4 text-primary" />
            {isAr ? "جدول الاحتفاظ بالمجموعات" : "Cohort Retention Table"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-start p-2 text-xs font-medium text-muted-foreground">{isAr ? "الفوج" : "Cohort"}</th>
                  <th className="text-center p-2 text-xs font-medium text-muted-foreground">{isAr ? "الحجم" : "Size"}</th>
                  <th className="text-center p-2 text-xs font-medium text-muted-foreground">M0</th>
                  <th className="text-center p-2 text-xs font-medium text-muted-foreground">M1</th>
                  <th className="text-center p-2 text-xs font-medium text-muted-foreground">M2</th>
                  <th className="text-center p-2 text-xs font-medium text-muted-foreground">M3</th>
                </tr>
              </thead>
              <tbody>
                {data.cohortTable.map((row: any) => (
                  <tr key={row.cohort} className="border-b border-border/40">
                    <td className="p-2 font-mono text-xs">{row.cohort}</td>
                    <td className="p-2 text-center font-medium">{row.total}</td>
                    {[0, 1, 2, 3].map(i => {
                      const val = row[`m${i}`] || 0;
                      const intensity = Math.min(val / 100, 1);
                      return (
                        <td
                          key={i}
                          className="p-2 text-center text-xs font-medium"
                          style={{
                            backgroundColor: `hsl(var(--primary) / ${intensity * 0.3})`,
                            color: intensity > 0.5 ? "hsl(var(--primary-foreground))" : undefined,
                          }}
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
