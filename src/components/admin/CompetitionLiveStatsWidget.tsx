import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Trophy, Users, Gavel, MapPin, TrendingUp, Calendar } from "lucide-react";
import { format, subDays } from "date-fns";

export function CompetitionLiveStatsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["comp-live-stats"],
    queryFn: async () => {
      const [compsRes, regsRes, scoresRes, roundsRes] = await Promise.all([
        supabase.from("competitions").select("id, status, country_code, competition_start, max_participants, city"),
        supabase.from("competition_registrations").select("competition_id, status, registered_at"),
        supabase.from("competition_scores").select("id, judge_id"),
        supabase.from("competition_rounds").select("id, competition_id, status"),
      ]);

      const comps = compsRes.data || [];
      const regs = regsRes.data || [];
      const scores = scoresRes.data || [];
      const rounds = roundsRes.data || [];

      // Status distribution
      const statusDist: Record<string, number> = {};
      comps.forEach(c => { statusDist[c.status] = (statusDist[c.status] || 0) + 1; });
      const statusData = Object.entries(statusDist).map(([name, value]) => ({ name, value }));

      // Registration trend (14 days)
      const regTrend: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "MM/dd");
        regTrend[d] = 0;
      }
      regs.forEach(r => {
        const d = format(new Date(r.registered_at), "MM/dd");
        if (d in regTrend) regTrend[d]++;
      });
      const trendData = Object.entries(regTrend).map(([date, count]) => ({ date, count }));

      // Top countries
      const countryCount: Record<string, number> = {};
      comps.forEach(c => {
        if (c.country_code) countryCount[c.country_code] = (countryCount[c.country_code] || 0) + 1;
      });
      const topCountries = Object.entries(countryCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      // Judging progress
      const activeComps = comps.filter(c => ["in_progress", "judging"].includes(c.status));
      const totalJudges = new Set(scores.map(s => s.judge_id)).size;
      const totalScored = scores.length;

      // Capacity utilization
      const openComps = comps.filter(c => c.status === "registration_open");
      const totalCapacity = openComps.reduce((s, c) => s + (c.max_participants || 0), 0);
      const totalRegs = regs.filter(r => r.status === "approved").length;
      const utilization = totalCapacity > 0 ? Math.round((totalRegs / totalCapacity) * 100) : 0;

      return {
        total: comps.length,
        active: activeComps.length,
        totalRegs: regs.length,
        approvedRegs: regs.filter(r => r.status === "approved").length,
        pendingRegs: regs.filter(r => r.status === "pending").length,
        totalJudges,
        totalScored,
        totalRounds: rounds.length,
        completedRounds: rounds.filter(r => r.status === "completed").length,
        statusData,
        trendData,
        topCountries,
        utilization,
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  if (!data) return null;

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--muted-foreground))"];

  const kpis = [
    { icon: Trophy, label: isAr ? "المسابقات النشطة" : "Active Competitions", value: data.active, sub: `/ ${data.total}` },
    { icon: Users, label: isAr ? "إجمالي التسجيلات" : "Total Registrations", value: data.totalRegs, sub: `${data.pendingRegs} ${isAr ? "معلق" : "pending"}` },
    { icon: Gavel, label: isAr ? "الحكام" : "Active Judges", value: data.totalJudges, sub: `${data.totalScored} ${isAr ? "تقييم" : "scores"}` },
    { icon: Calendar, label: isAr ? "الجولات" : "Rounds", value: `${data.completedRounds}/${data.totalRounds}`, sub: isAr ? "مكتملة" : "completed" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi, i) => (
        <Card key={i} className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <kpi.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold">{kpi.value} <span className="text-xs font-normal text-muted-foreground">{kpi.sub}</span></p>
          </CardContent>
        </Card>
      ))}

      {/* Registration Trend */}
      <Card className="md:col-span-2 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-chart-2" />
            {isAr ? "اتجاه التسجيلات (14 يوم)" : "Registration Trend (14d)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution + Capacity */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "توزيع الحالات" : "Status Distribution"}</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                  {data.statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {data.statusData.slice(0, 4).map((s, i) => (
              <Badge key={s.name} variant="outline" className="text-[9px] gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {s.name}: {s.value}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Countries + Utilization */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-chart-4" />
            {isAr ? "أعلى الدول" : "Top Countries"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3 space-y-3">
          {data.topCountries.map(([code, count]) => (
            <div key={code} className="flex items-center justify-between text-xs">
              <span className="font-medium">{code}</span>
              <Badge variant="secondary" className="text-[10px]">{count}</Badge>
            </div>
          ))}
          <div className="pt-2 border-t border-border/40">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>{isAr ? "نسبة الامتلاء" : "Capacity Utilization"}</span>
              <span>{data.utilization}%</span>
            </div>
            <Progress value={data.utilization} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
