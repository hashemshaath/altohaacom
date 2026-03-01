import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Shield, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { CountryBreakdownChart } from "./CountryBreakdownChart";
import { TrendForecastChart } from "./TrendForecastChart";
import type { DataPoint } from "@/lib/trendPrediction";
import { linearRegression } from "@/lib/trendPrediction";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function UserGrowthAnalytics() {
  const { language } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ["userGrowthAnalytics"],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: suspendedUsers },
        { data: profiles },
        { data: roles },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "active"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "suspended"),
        supabase.from("profiles").select("created_at").order("created_at", { ascending: true }),
        supabase.from("user_roles").select("role"),
      ]);

      // Signups by month
      const monthCounts: Record<string, number> = {};
      (profiles || []).forEach((p: any) => {
        const month = p.created_at?.substring(0, 7) || "unknown";
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      });
      
      // Cumulative growth
      let cumulative = 0;
      const growthData = Object.entries(monthCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, count]) => {
          cumulative += count;
          return { month, signups: count, total: cumulative };
        });

      // Trend data points for forecast chart
      const trendPoints: DataPoint[] = Object.entries(monthCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([date, value]) => ({ date, value }));

      // Role distribution
      const roleCounts: Record<string, number> = {};
      (roles || []).forEach((r: any) => {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
      });
      const roleData = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        suspendedUsers: suspendedUsers || 0,
        totalRoles: (roles || []).length,
        growthData,
        roleData,
        trendPoints,
      };
    },
    staleTime: 1000 * 60,
  });

  const cards = [
    { label: language === "ar" ? "إجمالي المستخدمين" : "Total Users", value: data?.totalUsers, icon: Users },
    { label: language === "ar" ? "نشط" : "Active", value: data?.activeUsers, icon: UserCheck },
    { label: language === "ar" ? "موقوف" : "Suspended", value: data?.suspendedUsers, icon: UserX },
    { label: language === "ar" ? "تعيينات الأدوار" : "Role Assignments", value: data?.totalRoles, icon: Shield },
  ];

  return (
    <div className="space-y-6 mt-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <AnimatedCounter value={isLoading ? 0 : (card.value || 0)} className="text-2xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "نمو المستخدمين" : "User Growth"}</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.growthData && data.growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                  <Area type="monotone" dataKey="signups" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2) / 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-muted-foreground">{language === "ar" ? "لا توجد بيانات" : "No data available"}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "توزيع الأدوار" : "Role Breakdown"}</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.roleData && data.roleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={data.roleData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {data.roleData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-muted-foreground">{language === "ar" ? "لا توجد بيانات" : "No data available"}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Predictive Forecast */}
      <TrendForecastChart
        title={language === "ar" ? "تنبؤ نمو المستخدمين" : "User Growth Forecast"}
        data={data?.trendPoints || []}
        isLoading={isLoading}
        forecastPeriods={3}
        icon={TrendingUp}
        color="primary"
      />

      {/* Country Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CountryBreakdownChart metric="users" />
        <CountryBreakdownChart metric="companies" />
      </div>
    </div>
  );
}
