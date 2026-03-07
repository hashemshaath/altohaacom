import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Trophy, Users, Gavel, Medal, TrendingUp, MapPin } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--destructive))"];

export function CompetitionAnalyticsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-competition-analytics-widget"],
    queryFn: async () => {
      const [competitions, registrations, scores, judges] = await Promise.all([
        supabase.from("competitions").select("id, status, country_code, created_at"),
        supabase.from("competition_registrations").select("id, competition_id, status, registered_at"),
        supabase.from("competition_scores").select("id, score"),
        supabase.from("competition_roles").select("id, role, status").eq("role", "judge").eq("status", "active"),
      ]);

      const allComps = competitions.data || [];
      const allRegs = registrations.data || [];
      const allScores = scores.data || [];

      // Status distribution
      const statusMap: Record<string, number> = {};
      allComps.forEach(c => { statusMap[c.status] = (statusMap[c.status] || 0) + 1; });
      const statusDist = Object.entries(statusMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));

      // Country distribution
      const countryMap: Record<string, number> = {};
      allComps.forEach(c => { if (c.country_code) countryMap[c.country_code] = (countryMap[c.country_code] || 0) + 1; });
      const topCountries = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

      // Registration status breakdown
      const regStatusMap: Record<string, number> = {};
      allRegs.forEach(r => { regStatusMap[r.status] = (regStatusMap[r.status] || 0) + 1; });
      const regStatusDist = Object.entries(regStatusMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

      // Average score
      const avgScore = allScores.length > 0
        ? (allScores.reduce((s, sc) => s + (sc.score || 0), 0) / allScores.length).toFixed(1)
        : "0";

      // Judging progress - competitions in judging status
      const judgingComps = allComps.filter(c => c.status === "judging").length;
      const completedComps = allComps.filter(c => c.status === "completed").length;

      return {
        totalCompetitions: allComps.length,
        activeComps: allComps.filter(c => ["in_progress", "registration_open", "judging"].includes(c.status)).length,
        totalRegistrations: allRegs.length,
        totalJudges: judges.data?.length || 0,
        totalScores: allScores.length,
        avgScore,
        judgingComps,
        completedComps,
        statusDist,
        topCountries,
        regStatusDist,
      };
    },
    refetchInterval: useVisibleRefetchInterval(60000),
  });

  if (isLoading) return <Skeleton className="h-52 w-full rounded-xl" />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { icon: Trophy, label: isAr ? "إجمالي" : "Total", value: data.totalCompetitions, color: "text-primary", bg: "bg-primary/10" },
          { icon: TrendingUp, label: isAr ? "نشطة" : "Active", value: data.activeComps, color: "text-chart-3", bg: "bg-chart-3/10" },
          { icon: Users, label: isAr ? "تسجيلات" : "Registrations", value: data.totalRegistrations, color: "text-chart-4", bg: "bg-chart-4/10" },
          { icon: Gavel, label: isAr ? "محكّمين" : "Judges", value: data.totalJudges, color: "text-chart-5", bg: "bg-chart-5/10" },
          { icon: Medal, label: isAr ? "تقييمات" : "Scores", value: data.totalScores, color: "text-primary", bg: "bg-primary/10" },
          { icon: Medal, label: isAr ? "متوسط" : "Avg Score", value: data.avgScore, color: "text-chart-3", bg: "bg-chart-3/10" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-3 flex items-center gap-2">
              <div className={`rounded-full p-1.5 ${kpi.bg}`}><kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} /></div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground truncate">{kpi.label}</p>
                <p className="text-base font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Status Distribution Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "توزيع حالات المسابقات" : "Competition Status Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.statusDist} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right side */}
        <div className="space-y-4">
          {/* Registration Status */}
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">{isAr ? "حالة التسجيلات" : "Registration Status"}</p>
              <div className="flex items-center gap-3">
                <PieChart width={60} height={60}>
                  <Pie data={data.regStatusDist} dataKey="value" cx={28} cy={28} innerRadius={16} outerRadius={28} strokeWidth={0}>
                    {data.regStatusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
                <div className="text-[10px] space-y-1">
                  {data.regStatusDist.slice(0, 4).map((s, i) => (
                    <div key={s.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="capitalize">{s.name}</span>: <strong>{s.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Countries */}
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {isAr ? "أعلى الدول" : "Top Countries"}
              </p>
              <div className="space-y-1">
                {data.topCountries.map(([code, count]) => (
                  <div key={code} className="flex items-center justify-between text-[10px]">
                    <span>{code}</span>
                    <Badge variant="outline" className="text-[9px] h-4">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
