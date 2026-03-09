import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Newspaper, GraduationCap, MessageSquare, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { CountryBreakdownChart } from "./CountryBreakdownChart";
import { TrendForecastChart } from "./TrendForecastChart";
import { SparklineCard } from "./SparklineCard";
import {
  CHART_COLORS, TOOLTIP_STYLE, X_AXIS_PROPS, Y_AXIS_PROPS,
  GRID_PROPS, LEGEND_STYLE, BAR_RADIUS, CHART_HEIGHT, getNoDataText,
} from "@/lib/chartConfig";
import type { DataPoint } from "@/lib/trendPrediction";
import type { DateRange } from "./AnalyticsDateRange";

interface Props {
  dateRange?: DateRange;
}

const PlatformOverview = memo(function PlatformOverview({ dateRange }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const fromISO = dateRange?.from.toISOString();
  const toISO = dateRange?.to.toISOString();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["analyticsOverview", fromISO, toISO],
    queryFn: async () => {
      const baseQueries = [
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("competitions").select("*", { count: "exact", head: true }),
        supabase.from("articles").select("*", { count: "exact", head: true }),
        supabase.from("masterclasses").select("*", { count: "exact", head: true }),
        supabase.from("certificates").select("*", { count: "exact", head: true }),
        supabase.from("messages").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("role"),
        supabase.from("competitions").select("status"),
        supabase.from("profiles").select("created_at").order("created_at", { ascending: true }),
        supabase.from("competitions").select("created_at").order("created_at", { ascending: true }),
      ] as const;

      const rangeQueries = fromISO && toISO ? [
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", fromISO).lte("created_at", toISO),
        supabase.from("competitions").select("*", { count: "exact", head: true }).gte("created_at", fromISO).lte("created_at", toISO),
        supabase.from("articles").select("*", { count: "exact", head: true }).gte("created_at", fromISO).lte("created_at", toISO),
        supabase.from("certificates").select("*", { count: "exact", head: true }).gte("created_at", fromISO).lte("created_at", toISO),
        supabase.from("messages").select("*", { count: "exact", head: true }).gte("created_at", fromISO).lte("created_at", toISO),
      ] : [];

      const [
        { count: totalUsers }, { count: totalCompetitions }, { count: totalArticles },
        { count: totalMasterclasses }, { count: totalCertificates }, { count: totalMessages },
        { data: roleDistribution }, { data: competitionsByStatus },
        { data: profileDates }, { data: competitionDates },
        ...rangeResults
      ] = await Promise.all([...baseQueries, ...rangeQueries]);

      const rangeUsers = rangeResults[0]?.count || 0;
      const rangeCompetitions = rangeResults[1]?.count || 0;
      const rangeArticles = rangeResults[2]?.count || 0;
      const rangeCerts = rangeResults[3]?.count || 0;
      const rangeMessages = rangeResults[4]?.count || 0;

      const roleCounts: Record<string, number> = {};
      (roleDistribution || []).forEach((r: any) => { roleCounts[r.role] = (roleCounts[r.role] || 0) + 1; });
      const roleData = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));

      const statusCounts: Record<string, number> = {};
      (competitionsByStatus || []).forEach((c: any) => { statusCounts[c.status || "unknown"] = (statusCounts[c.status || "unknown"] || 0) + 1; });
      const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

      const buildMonthlyTrend = (dates: any[]): DataPoint[] => {
        const months: Record<string, number> = {};
        (dates || []).forEach((p: any) => { const m = p.created_at?.substring(0, 7); if (m) months[m] = (months[m] || 0) + 1; });
        return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([date, value]) => ({ date, value }));
      };

      const buildSparkline = (dates: any[]): { v: number }[] => {
        const days: Record<string, number> = {};
        (dates || []).forEach((p: any) => { const d = p.created_at?.substring(0, 10); if (d) days[d] = (days[d] || 0) + 1; });
        return Object.entries(days).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([_, value]) => ({ v: value }));
      };

      return {
        totalUsers: totalUsers || 0, totalCompetitions: totalCompetitions || 0,
        totalArticles: totalArticles || 0, totalMasterclasses: totalMasterclasses || 0,
        totalCertificates: totalCertificates || 0, totalMessages: totalMessages || 0,
        rangeUsers, rangeCompetitions, rangeArticles, rangeCerts, rangeMessages,
        roleData, statusData,
        userTrend: buildMonthlyTrend(profileDates || []),
        compTrend: buildMonthlyTrend(competitionDates || []),
        userSparkline: buildSparkline(profileDates || []),
      };
    },
    staleTime: 1000 * 60,
  });

  const cards = [
    { label: isAr ? "المستخدمين" : "Users", value: stats?.totalUsers || 0, rangeValue: stats?.rangeUsers, icon: Users, color: "primary", border: "border-s-primary" },
    { label: isAr ? "المسابقات" : "Competitions", value: stats?.totalCompetitions || 0, rangeValue: stats?.rangeCompetitions, icon: Trophy, color: "chart-2", border: "border-s-chart-2" },
    { label: isAr ? "المقالات" : "Articles", value: stats?.totalArticles || 0, rangeValue: stats?.rangeArticles, icon: Newspaper, color: "chart-3", border: "border-s-chart-3" },
    { label: isAr ? "الدورات" : "Masterclasses", value: stats?.totalMasterclasses || 0, icon: GraduationCap, color: "chart-4", border: "border-s-chart-4" },
    { label: isAr ? "الشهادات" : "Certificates", value: stats?.totalCertificates || 0, rangeValue: stats?.rangeCerts, icon: Award, color: "chart-5", border: "border-s-chart-5" },
    { label: isAr ? "الرسائل" : "Messages", value: stats?.totalMessages || 0, rangeValue: stats?.rangeMessages, icon: MessageSquare, color: "primary", border: "border-s-primary" },
  ];

  return (
    <div className="space-y-5 mt-4">
      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <SparklineCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={isLoading ? "..." : card.value}
            trend={card.rangeValue !== undefined && card.value > 0 ? Math.round((card.rangeValue / card.value) * 100) : undefined}
            sparkData={card.label.includes("User") || card.label.includes("المستخدم") ? stats?.userSparkline : undefined}
            color={card.color}
            borderColor={card.border}
          />
        ))}
      </div>

      {/* Distribution Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{isAr ? "توزيع الأدوار" : "Role Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.roleData && stats.roleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT.md}>
                <PieChart>
                  <Pie data={stats.roleData} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" paddingAngle={3} strokeWidth={0}
                    label={({ name, value }) => `${name} (${value})`} labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}>
                    {stats.roleData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-muted-foreground text-sm">{getNoDataText(isAr)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{isAr ? "حالة المسابقات" : "Competition Status"}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.statusData && stats.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT.md}>
                <BarChart data={stats.statusData}>
                  <CartesianGrid {...GRID_PROPS} />
                  <XAxis dataKey="name" {...X_AXIS_PROPS} />
                  <YAxis {...Y_AXIS_PROPS} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="value" fill={CHART_COLORS[0]} radius={BAR_RADIUS} name={isAr ? "العدد" : "Count"} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-muted-foreground text-sm">{getNoDataText(isAr)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Predictive Forecasts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TrendForecastChart
          title={isAr ? "تنبؤ نمو المستخدمين" : "User Signup Forecast"}
          data={stats?.userTrend || []}
          isLoading={isLoading}
          icon={Users}
          color="primary"
        />
        <TrendForecastChart
          title={isAr ? "تنبؤ المسابقات" : "Competition Creation Forecast"}
          data={stats?.compTrend || []}
          isLoading={isLoading}
          icon={Trophy}
          color="chart-2"
        />
      </div>

      {/* Country Breakdowns */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CountryBreakdownChart metric="users" />
        <CountryBreakdownChart metric="competitions" />
      </div>
    </div>
  );
});

export default PlatformOverview;
