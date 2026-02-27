import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Users, ClipboardCheck, Award, TrendingUp, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { format, subDays } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function CompetitionInsightsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-competition-insights"],
    queryFn: async () => {
      const fourteenDaysAgo = subDays(new Date(), 14).toISOString();

      const [
        competitionsRes,
        registrationsRes,
        recentRegsRes,
        judgesRes,
        scoresRes,
        roundsRes,
      ] = await Promise.all([
        supabase.from("competitions").select("id, status, country_code, created_at"),
        supabase.from("competition_registrations").select("id", { count: "exact", head: true }),
        supabase.from("competition_registrations").select("registered_at").gte("registered_at", fourteenDaysAgo),
        supabase.from("competition_roles").select("id", { count: "exact", head: true }).eq("role", "judge"),
        supabase.from("competition_scores").select("id", { count: "exact", head: true }),
        supabase.from("competition_rounds").select("id, status"),
      ]);

      const comps = competitionsRes.data || [];
      const statusMap: Record<string, number> = {};
      comps.forEach((c: any) => { statusMap[c.status] = (statusMap[c.status] || 0) + 1; });
      const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      // Registration trend (14 days)
      const regTrend: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        regTrend[format(subDays(new Date(), i), "MM/dd")] = 0;
      }
      (recentRegsRes.data || []).forEach((r: any) => {
        const key = format(new Date(r.registered_at), "MM/dd");
        if (regTrend[key] !== undefined) regTrend[key]++;
      });
      const regTrendData = Object.entries(regTrend).map(([date, count]) => ({ date, count }));

      const rounds = roundsRes.data || [];
      const activeRounds = rounds.filter((r: any) => r.status === "active").length;

      // Country distribution
      const countryMap: Record<string, number> = {};
      comps.forEach((c: any) => {
        if (c.country_code) countryMap[c.country_code] = (countryMap[c.country_code] || 0) + 1;
      });
      const topCountries = Object.entries(countryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([code, count]) => ({ code, count }));

      return {
        totalCompetitions: comps.length,
        totalRegistrations: registrationsRes.count || 0,
        totalJudges: judgesRes.count || 0,
        totalScores: scoresRes.count || 0,
        activeRounds,
        totalRounds: rounds.length,
        statusData,
        regTrendData,
        topCountries,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;
  }

  if (!data) return null;

  const kpis = [
    { icon: Trophy, label: isAr ? "المسابقات" : "Competitions", value: data.totalCompetitions, color: "text-chart-2" },
    { icon: Users, label: isAr ? "التسجيلات" : "Registrations", value: data.totalRegistrations, color: "text-primary" },
    { icon: ClipboardCheck, label: isAr ? "الحكام" : "Judges", value: data.totalJudges, color: "text-chart-4" },
    { icon: Award, label: isAr ? "التقييمات" : "Scores", value: data.totalScores, color: "text-chart-5" },
    { icon: Calendar, label: isAr ? "جولات نشطة" : "Active Rounds", value: `${data.activeRounds}/${data.totalRounds}`, color: "text-chart-3" },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-chart-2" />
          {isAr ? "تحليلات المسابقات والتقييم" : "Competitions & Evaluation Insights"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI Row */}
        <div className="grid grid-cols-5 gap-2">
          {kpis.map((kpi, i) => (
            <div key={i} className="text-center p-2 rounded-lg bg-muted/40">
              <kpi.icon className={`h-4 w-4 mx-auto mb-1 ${kpi.color}`} />
              <p className="text-lg font-bold">{kpi.value}</p>
              <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Registration Trend */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {isAr ? "التسجيلات (14 يوم)" : "Registrations (14 days)"}
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.regTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="date" tick={{ fontSize: 8 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 8 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "حالات المسابقات" : "Competition Status"}
            </p>
            {data.statusData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">{isAr ? "لا توجد بيانات" : "No data"}</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={data.statusData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={2}>
                    {data.statusData.map((_: any, idx: number) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-wrap gap-1 mt-1">
              {data.statusData.map((s: any, i: number) => (
                <Badge key={i} variant="outline" className="text-[9px]">
                  {s.name}: {s.value}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Top Countries */}
        {data.topCountries.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "أكثر الدول مسابقات" : "Top Countries"}
            </p>
            <div className="flex gap-2">
              {data.topCountries.map((c: any, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {c.code} ({c.count})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
