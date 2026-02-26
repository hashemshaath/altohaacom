import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Star, ClipboardList, Globe, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { toEnglishDigits } from "@/lib/formatNumber";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function CompetitionAnalytics() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["competitionAnalytics"],
    queryFn: async () => {
      const [
        { count: totalRegistrations },
        { count: totalJudges },
        { count: totalScores },
        { data: competitions },
        { data: scores },
        { data: registrations },
      ] = await Promise.all([
        supabase.from("competition_registrations").select("*", { count: "exact", head: true }),
        supabase.from("competition_judges").select("*", { count: "exact", head: true }),
        supabase.from("competition_scores").select("*", { count: "exact", head: true }),
        supabase.from("competitions").select("id, title, status, competition_start, country_code"),
        supabase.from("competition_scores").select("score"),
        supabase.from("competition_registrations").select("created_at"),
      ]);

      // Score distribution
      const scoreBuckets: Record<string, number> = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
      (scores || []).forEach((s: any) => {
        const v = Number(s.score);
        if (v <= 20) scoreBuckets["0-20"]++;
        else if (v <= 40) scoreBuckets["21-40"]++;
        else if (v <= 60) scoreBuckets["41-60"]++;
        else if (v <= 80) scoreBuckets["61-80"]++;
        else scoreBuckets["81-100"]++;
      });
      const scoreDistribution = Object.entries(scoreBuckets).map(([range, count]) => ({ range, count }));

      // Competitions by month
      const monthCounts: Record<string, number> = {};
      (competitions || []).forEach((c: any) => {
        const month = c.competition_start?.substring(0, 7) || "unknown";
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      });
      const monthlyData = Object.entries(monthCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, count]) => ({ month, count }));

      // Status breakdown
      const statusCounts: Record<string, number> = {};
      (competitions || []).forEach((c: any) => {
        const s = c.status || "unknown";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

      // Country breakdown
      const countryCounts: Record<string, number> = {};
      (competitions || []).forEach((c: any) => {
        if (c.country_code) countryCounts[c.country_code] = (countryCounts[c.country_code] || 0) + 1;
      });
      const countryData = Object.entries(countryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([country, count]) => ({ country, count }));

      // Registration trend (last 6 months)
      const regMonths: Record<string, number> = {};
      (registrations || []).forEach((r: any) => {
        const m = r.created_at?.substring(0, 7);
        if (m) regMonths[m] = (regMonths[m] || 0) + 1;
      });
      const regTrend = Object.entries(regMonths)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, count]) => ({ month, count }));

      const uniqueCountries = new Set((competitions || []).map((c: any) => c.country_code).filter(Boolean));

      return {
        totalRegistrations: totalRegistrations || 0,
        totalJudges: totalJudges || 0,
        totalScores: totalScores || 0,
        totalCompetitions: (competitions || []).length,
        totalCountries: uniqueCountries.size,
        scoreDistribution,
        monthlyData,
        statusData,
        countryData,
        regTrend,
      };
    },
    staleTime: 1000 * 60,
  });

  const cards = [
    { label: isAr ? "المسابقات" : "Competitions", value: data?.totalCompetitions, icon: Trophy, color: "text-primary" },
    { label: isAr ? "التسجيلات" : "Registrations", value: data?.totalRegistrations, icon: ClipboardList, color: "text-chart-2" },
    { label: isAr ? "الحكام" : "Judges", value: data?.totalJudges, icon: Users, color: "text-chart-3" },
    { label: isAr ? "التقييمات" : "Scores", value: data?.totalScores, icon: Star, color: "text-chart-4" },
    { label: isAr ? "الدول" : "Countries", value: data?.totalCountries, icon: Globe, color: "text-chart-5" },
  ];

  const avgScore = useMemo(() => {
    if (!data?.scoreDistribution) return 0;
    const total = data.scoreDistribution.reduce((a, b) => a + b.count, 0);
    if (!total) return 0;
    const weightedSum = data.scoreDistribution.reduce((acc, b) => {
      const mid = { "0-20": 10, "21-40": 30, "41-60": 50, "61-80": 70, "81-100": 90 }[b.range] || 50;
      return acc + mid * b.count;
    }, 0);
    return Math.round(weightedSum / total);
  }, [data?.scoreDistribution]);

  return (
    <div className="space-y-6 mt-4">
      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label} className="border-border/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black leading-none">{isLoading ? "..." : toEnglishDigits((card.value || 0).toLocaleString())}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5 truncate">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Avg Score Highlight */}
      {avgScore > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-black text-primary">{toEnglishDigits(avgScore)}<span className="text-lg font-bold text-primary/60">/100</span></p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{isAr ? "متوسط الدرجات" : "Average Score"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Registration Trend */}
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">{isAr ? "اتجاه التسجيلات" : "Registration Trend"}</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.regTrend && data.regTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.regTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-muted-foreground text-sm">{isAr ? "لا توجد بيانات" : "No data available"}</p>
            )}
          </CardContent>
        </Card>

        {/* Competitions by Month */}
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">{isAr ? "المسابقات حسب الشهر" : "Competitions by Month"}</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.monthlyData && data.monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-3))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--chart-3))" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-muted-foreground text-sm">{isAr ? "لا توجد بيانات" : "No data available"}</p>
            )}
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">{isAr ? "توزيع الدرجات" : "Score Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.scoreDistribution && data.scoreDistribution.some((s) => s.count > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-muted-foreground text-sm">{isAr ? "لا توجد بيانات" : "No data available"}</p>
            )}
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">{isAr ? "حالات المسابقات" : "Competition Status"}</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.statusData && data.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={data.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3} strokeWidth={0}>
                    {data.statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-muted-foreground text-sm">{isAr ? "لا توجد بيانات" : "No data available"}</p>
            )}
          </CardContent>
        </Card>

        {/* Top Countries */}
        {data?.countryData && data.countryData.length > 0 && (
          <Card className="border-border/30 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">{isAr ? "أكثر الدول مسابقات" : "Top Countries"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.countryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="country" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={50} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
