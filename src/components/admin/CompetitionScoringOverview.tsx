import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gavel, Trophy, Users, Target, Medal, Star, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export const CompetitionScoringOverview = memo(function CompetitionScoringOverview() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["competitionScoringOverview"],
    queryFn: async () => {
      const [scoresRes, judgesRes, regsRes, compsRes] = await Promise.all([
        supabase.from("competition_scores").select("id, score, judge_id, registration_id").limit(1000),
        supabase.from("competition_roles").select("id, user_id, competition_id, role, status").eq("role", "judge").eq("status", "active"),
        supabase.from("competition_registrations").select("id, competition_id, status").limit(1000),
        supabase.from("competitions").select("id, title, title_ar, status").in("status", ["in_progress", "judging", "registration_closed", "completed"]).limit(50),
      ]);

      const scores = scoresRes.data || [];
      const judges = judgesRes.data || [];
      const regs = regsRes.data || [];
      const comps = compsRes.data || [];

      const totalScores = scores.length;
      const totalJudges = new Set(judges.map(j => j.user_id)).size;
      const activeComps = comps.filter(c => c.status === "in_progress" || c.status === "judging").length;

      // Score distribution
      const scoreRanges = [
        { range: "0-20", count: 0 },
        { range: "21-40", count: 0 },
        { range: "41-60", count: 0 },
        { range: "61-80", count: 0 },
        { range: "81-100", count: 0 },
      ];
      scores.forEach(s => {
        const v = Number(s.score) || 0;
        if (v <= 20) scoreRanges[0].count++;
        else if (v <= 40) scoreRanges[1].count++;
        else if (v <= 60) scoreRanges[2].count++;
        else if (v <= 80) scoreRanges[3].count++;
        else scoreRanges[4].count++;
      });

      // Per-competition judging progress
      const compProgress = comps.slice(0, 5).map(c => {
        const compRegs = regs.filter(r => r.competition_id === c.id && r.status === "approved");
        const compRegIds = new Set(compRegs.map(r => r.id));
        const compScores = scores.filter(s => compRegIds.has(s.registration_id));
        const compJudges = judges.filter(j => j.competition_id === c.id);
        const expectedScores = compRegs.length * compJudges.length;
        const progress = expectedScores > 0 ? Math.round((compScores.length / expectedScores) * 100) : 0;
        return {
          id: c.id,
          title: isAr ? (c.title_ar || c.title) : c.title,
          status: c.status,
          participants: compRegs.length,
          judges: compJudges.length,
          scored: compScores.length,
          expected: expectedScores,
          progress: Math.min(progress, 100),
        };
      });

      const avgScore = totalScores > 0 ? Math.round(scores.reduce((s, sc) => s + (Number(sc.score) || 0), 0) / totalScores) : 0;

      return { totalScores, totalJudges, activeComps, avgScore, scoreRanges, compProgress };
    },
    refetchInterval: useVisibleRefetchInterval(60000),
  });

  if (!data) return null;

  const stats = [
    { icon: Gavel, label: isAr ? "إجمالي التقييمات" : "Total Scores", value: data.totalScores, color: "text-primary" },
    { icon: Users, label: isAr ? "الحكام النشطون" : "Active Judges", value: data.totalJudges, color: "text-chart-2" },
    { icon: Trophy, label: isAr ? "مسابقات نشطة" : "Active Competitions", value: data.activeComps, color: "text-chart-3" },
    { icon: Star, label: isAr ? "متوسط الدرجات" : "Avg Score", value: `${data.avgScore}%`, color: "text-chart-4" },
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Medal className="h-4 w-4 text-primary" />
          {isAr ? "نظرة عامة على التحكيم والتقييم" : "Judging & Scoring Overview"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-3 text-center">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Score Distribution */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "توزيع الدرجات" : "Score Distribution"}
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data.scoreRanges}>
                <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.scoreRanges.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Judging Progress per Competition */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "تقدم التحكيم" : "Judging Progress"}
            </p>
            <div className="space-y-2.5">
              {data.compProgress.map((c) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium truncate max-w-[60%]">{c.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {c.scored}/{c.expected} ({c.progress}%)
                    </span>
                  </div>
                  <Progress value={c.progress} className="h-1.5" />
                </div>
              ))}
              {data.compProgress.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  {isAr ? "لا توجد مسابقات نشطة" : "No active competitions"}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
