import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Newspaper, GraduationCap, MessageSquare, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { CountryBreakdownChart } from "./CountryBreakdownChart";
import { TrendForecastChart } from "./TrendForecastChart";
import { SparklineCard } from "./SparklineCard";
import type { DataPoint } from "@/lib/trendPrediction";
import type { DateRange } from "./AnalyticsDateRange";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

interface Props {
  dateRange?: DateRange;
}

export default function PlatformOverview({ dateRange }: Props) {
  const { language } = useLanguage();

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

      // Date-filtered counts for the selected range
      const rangeQueries = fromISO && toISO ? [
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", fromISO).lte("created_at", toISO),
        supabase.from("competitions").select("*", { count: "exact", head: true }).gte("created_at", fromISO).lte("created_at", toISO),
        supabase.from("articles").select("*", { count: "exact", head: true }).gte("created_at", fromISO).lte("created_at", toISO),
        supabase.from("certificates").select("*", { count: "exact", head: true }).gte("created_at", fromISO).lte("created_at", toISO),
        supabase.from("messages").select("*", { count: "exact", head: true }).gte("created_at", fromISO).lte("created_at", toISO),
      ] : [];

      const [
        { count: totalUsers },
        { count: totalCompetitions },
        { count: totalArticles },
        { count: totalMasterclasses },
        { count: totalCertificates },
        { count: totalMessages },
        { data: roleDistribution },
        { data: competitionsByStatus },
        { data: profileDates },
        { data: competitionDates },
        ...rangeResults
      ] = await Promise.all([...baseQueries, ...rangeQueries]);

      const rangeUsers = rangeResults[0]?.count || 0;
      const rangeCompetitions = rangeResults[1]?.count || 0;
      const rangeArticles = rangeResults[2]?.count || 0;
      const rangeCerts = rangeResults[3]?.count || 0;
      const rangeMessages = rangeResults[4]?.count || 0;

      // Role distribution
      const roleCounts: Record<string, number> = {};
      (roleDistribution || []).forEach((r: any) => {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
      });
      const roleData = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));

      // Competition status
      const statusCounts: Record<string, number> = {};
      (competitionsByStatus || []).forEach((c: any) => {
        const label = c.status || "unknown";
        statusCounts[label] = (statusCounts[label] || 0) + 1;
      });
      const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

      // Build monthly trend data
      const buildMonthlyTrend = (dates: any[]): DataPoint[] => {
        const months: Record<string, number> = {};
        (dates || []).forEach((p: any) => {
          const m = p.created_at?.substring(0, 7);
          if (m) months[m] = (months[m] || 0) + 1;
        });
        return Object.entries(months)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-12)
          .map(([date, value]) => ({ date, value }));
      };

      const userTrend = buildMonthlyTrend(profileDates || []);
      const compTrend = buildMonthlyTrend(competitionDates || []);

      // Build daily sparkline data (last 7 points from trend)
      const buildSparkline = (dates: any[]): { v: number }[] => {
        const days: Record<string, number> = {};
        (dates || []).forEach((p: any) => {
          const d = p.created_at?.substring(0, 10);
          if (d) days[d] = (days[d] || 0) + 1;
        });
        return Object.entries(days)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-14)
          .map(([_, value]) => ({ v: value }));
      };

      const userSparkline = buildSparkline(profileDates || []);

      return {
        totalUsers: totalUsers || 0,
        totalCompetitions: totalCompetitions || 0,
        totalArticles: totalArticles || 0,
        totalMasterclasses: totalMasterclasses || 0,
        totalCertificates: totalCertificates || 0,
        totalMessages: totalMessages || 0,
        rangeUsers, rangeCompetitions, rangeArticles, rangeCerts, rangeMessages,
        roleData, statusData, userTrend, compTrend, userSparkline,
      };
    },
    staleTime: 1000 * 60,
  });

  const cards = [
    { label: language === "ar" ? "المستخدمين" : "Users", value: stats?.totalUsers || 0, rangeValue: stats?.rangeUsers, icon: Users, color: "primary", border: "border-s-primary" },
    { label: language === "ar" ? "المسابقات" : "Competitions", value: stats?.totalCompetitions || 0, rangeValue: stats?.rangeCompetitions, icon: Trophy, color: "chart-2", border: "border-s-chart-2" },
    { label: language === "ar" ? "المقالات" : "Articles", value: stats?.totalArticles || 0, rangeValue: stats?.rangeArticles, icon: Newspaper, color: "chart-3", border: "border-s-chart-3" },
    { label: language === "ar" ? "الدورات" : "Masterclasses", value: stats?.totalMasterclasses || 0, icon: GraduationCap, color: "chart-4", border: "border-s-chart-4" },
    { label: language === "ar" ? "الشهادات" : "Certificates", value: stats?.totalCertificates || 0, rangeValue: stats?.rangeCerts, icon: Award, color: "chart-5", border: "border-s-chart-5" },
    { label: language === "ar" ? "الرسائل" : "Messages", value: stats?.totalMessages || 0, rangeValue: stats?.rangeMessages, icon: MessageSquare, color: "primary", border: "border-s-primary" },
  ];

  return (
    <div className="space-y-6 mt-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <SparklineCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={isLoading ? "..." : card.value.toLocaleString()}
            trend={card.rangeValue !== undefined && card.value > 0 ? Math.round((card.rangeValue / card.value) * 100) : undefined}
            sparkData={card.label.includes("User") || card.label.includes("المستخدم") ? stats?.userSparkline : undefined}
            color={card.color}
            borderColor={card.border}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "توزيع الأدوار" : "Role Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.roleData && stats.roleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={stats.roleData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {stats.roleData.map((_, i) => (
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

        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "حالة المسابقات" : "Competition Status"}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.statusData && stats.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-muted-foreground">{language === "ar" ? "لا توجد بيانات" : "No data available"}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Predictive Forecasts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TrendForecastChart
          title={language === "ar" ? "تنبؤ نمو المستخدمين" : "User Signup Forecast"}
          data={stats?.userTrend || []}
          isLoading={isLoading}
          icon={Users}
          color="primary"
        />
        <TrendForecastChart
          title={language === "ar" ? "تنبؤ المسابقات" : "Competition Creation Forecast"}
          data={stats?.compTrend || []}
          isLoading={isLoading}
          icon={Trophy}
          color="chart-2"
        />
      </div>

      {/* Country Breakdowns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CountryBreakdownChart metric="users" />
        <CountryBreakdownChart metric="competitions" />
      </div>
    </div>
  );
}
