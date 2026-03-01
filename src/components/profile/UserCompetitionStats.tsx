import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Target, TrendingUp, Calendar, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { StaggeredList } from "@/components/ui/staggered-list";

interface UserCompetitionStatsProps {
  userId: string;
}

export function UserCompetitionStats({ userId }: UserCompetitionStatsProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["user-competition-stats", userId],
    queryFn: async () => {
      const regRes = await (supabase as any).from("competition_registrations").select("id, status, registered_at").eq("participant_id", userId);
      const scoreRes = await (supabase as any).from("competition_scores").select("score, registration_id");
      const certRes = await (supabase as any).from("certificates").select("id, type, achievement, event_name, issued_at").eq("recipient_id", userId).eq("status", "issued");
      
      const registrations = regRes.data as any[] | null;
      const scores = scoreRes.data as any[] | null;
      const certificates = certRes.data as any[] | null;

      const totalRegistrations = registrations?.length || 0;
      const approved = registrations?.filter(r => r.status === "approved").length || 0;
      
      // Calculate avg score from competition_scores
      const allScores = (scores || []).map(s => Number(s.score) || 0).filter(s => s > 0);
      const totalScoreCount = allScores.length;
      const avgScore = totalScoreCount > 0
        ? allScores.reduce((s, v) => s + v, 0) / totalScoreCount
        : 0;
      const topRanks = 0; // Rank not available in schema
      const totalCerts = certificates?.length || 0;

      // Competition history by year
      const yearMap: Record<string, number> = {};
      (registrations || []).forEach(r => {
        const year = r.registered_at?.substring(0, 4) || "unknown";
        yearMap[year] = (yearMap[year] || 0) + 1;
      });
      const yearlyData = Object.entries(yearMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([year, count]) => ({ year, count }));

      // Performance radar
      const maxScore = 100;
      const radarData = [
        { metric: isAr ? "المشاركات" : "Participations", value: Math.min(totalRegistrations * 10, 100), fullMark: maxScore },
        { metric: isAr ? "متوسط النقاط" : "Avg Score", value: Math.min(avgScore, 100), fullMark: maxScore },
        { metric: isAr ? "المراكز الأولى" : "Top Finishes", value: Math.min(topRanks * 25, 100), fullMark: maxScore },
        { metric: isAr ? "الشهادات" : "Certificates", value: Math.min(totalCerts * 20, 100), fullMark: maxScore },
        { metric: isAr ? "معدل القبول" : "Accept Rate", value: totalRegistrations > 0 ? (approved / totalRegistrations) * 100 : 0, fullMark: maxScore },
      ];

      return {
        totalRegistrations,
        approved,
        avgScore: Math.round(avgScore * 10) / 10,
        topRanks,
        totalCerts,
        yearlyData,
        radarData,
        recentScores: allScores.slice(0, 5).map((s, i) => ({ score: s, index: i })),
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}><CardContent className="p-4"><div className="h-16 animate-pulse bg-muted rounded" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (!data || data.totalRegistrations === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title={isAr ? "لا توجد مشاركات بعد" : "No competitions yet"}
        description={isAr ? "سجل في مسابقة لبدء تتبع أدائك" : "Register for a competition to start tracking your performance"}
      />
    );
  }

  const statCards = [
    { icon: Trophy, label: isAr ? "المشاركات" : "Competitions", value: data.totalRegistrations, color: "text-primary", bg: "bg-primary/10" },
    { icon: Target, label: isAr ? "متوسط النقاط" : "Avg Score", value: data.avgScore, color: "text-chart-2", bg: "bg-chart-2/10" },
    { icon: Medal, label: isAr ? "أعلى نقطة" : "Top Score", value: data.topRanks, color: "text-chart-5", bg: "bg-chart-5/10" },
    { icon: Award, label: isAr ? "الشهادات" : "Certificates", value: data.totalCerts, color: "text-chart-3", bg: "bg-chart-3/10" },
  ];

  return (
    <StaggeredList className="space-y-6" stagger={80}>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <AnimatedCounter value={typeof s.value === "number" ? s.value : parseInt(String(s.value)) || 0} className="text-2xl" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              {isAr ? "ملف الأداء" : "Performance Profile"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data.radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis tick={false} domain={[0, 100]} />
                  <Radar
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Yearly Participation */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {isAr ? "المشاركات السنوية" : "Yearly Participation"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Scores */}
      {data.recentScores.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {isAr ? "أحدث النتائج" : "Recent Scores"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentScores.map((score: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-xl border p-3">
                  <span className="text-sm font-medium">
                    {isAr ? "النتيجة" : "Score"} #{i + 1}
                  </span>
                  <Badge variant="outline" className="font-mono">
                    {Number(score.score).toFixed(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </StaggeredList>
  );
}
