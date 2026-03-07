import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Users, Scale, ClipboardList } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface ScoringAnalyticsProps {
  competitionId: string;
}

export function ScoringAnalytics({ competitionId }: ScoringAnalyticsProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["scoring-analytics", competitionId],
    queryFn: async () => {
      const { data: criteria } = await supabase
        .from("judging_criteria")
        .select("id, name, name_ar, max_score, sort_order")
        .eq("competition_id", competitionId)
        .order("sort_order");

      const { data: registrations } = await supabase
        .from("competition_registrations")
        .select("id")
        .eq("competition_id", competitionId)
        .eq("status", "approved");

      const regIds = registrations?.map(r => r.id) || [];
      if (regIds.length === 0) return null;

      const { data: scores } = await supabase
        .from("competition_scores")
        .select("id, registration_id, criteria_id, judge_id, score")
        .in("registration_id", regIds);

      if (!criteria || !scores) return null;

      const criteriaBreakdown = criteria.map(crit => {
        const critScores = scores.filter(s => s.criteria_id === crit.id);
        const avg = critScores.length > 0
          ? critScores.reduce((sum, s) => sum + Number(s.score), 0) / critScores.length
          : 0;
        return {
          name: isAr && crit.name_ar ? crit.name_ar : crit.name,
          avg: Math.round(avg * 10) / 10,
          max: crit.max_score,
          pct: crit.max_score > 0 ? Math.round((avg / crit.max_score) * 100) : 0,
        };
      });

      const judgeIds = [...new Set(scores.map(s => s.judge_id))];
      const agreement = criteria.map(crit => {
        const critScores = scores.filter(s => s.criteria_id === crit.id);
        const byReg: Record<string, number[]> = {};
        critScores.forEach(s => {
          if (!byReg[s.registration_id]) byReg[s.registration_id] = [];
          byReg[s.registration_id].push(Number(s.score));
        });

        const stdDevs = Object.values(byReg)
          .filter(arr => arr.length > 1)
          .map(arr => {
            const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
            const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
            return Math.sqrt(variance);
          });

        const avgStdDev = stdDevs.length > 0
          ? stdDevs.reduce((a, b) => a + b, 0) / stdDevs.length
          : 0;

        const maxPossibleStdDev = crit.max_score / 2;
        const agreementPct = maxPossibleStdDev > 0
          ? Math.round((1 - avgStdDev / maxPossibleStdDev) * 100)
          : 100;

        return {
          name: isAr && crit.name_ar ? crit.name_ar : crit.name,
          agreement: Math.max(0, agreementPct),
        };
      });

      return {
        criteriaBreakdown,
        agreement,
        totalScores: scores.length,
        totalJudges: judgeIds.length,
        totalEntries: regIds.length,
      };
    },
    enabled: !!competitionId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BarChart3 className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">
            {isAr ? "لا توجد بيانات تحليلية" : "No analytics data available"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const summaryStats = [
    { icon: ClipboardList, label: isAr ? "إجمالي التقييمات" : "Total Scores", value: data.totalScores, bg: "bg-primary/10", color: "text-primary", accent: "border-primary/30" },
    { icon: Scale, label: isAr ? "عدد الحكام" : "Judges", value: data.totalJudges, bg: "bg-chart-4/10", color: "text-chart-4", accent: "border-chart-4/30" },
    { icon: Users, label: isAr ? "عدد المشاركين" : "Entries", value: data.totalEntries, bg: "bg-chart-5/10", color: "text-chart-5", accent: "border-chart-5/30" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-3 grid-cols-3">
        {summaryStats.map((stat, i) => (
          <Card key={i} className={`border-s-[3px] ${stat.accent} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
            <CardContent className="flex items-center gap-3.5 p-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none tracking-tight">{stat.value}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Criteria Breakdown Chart */}
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "متوسط الدرجات لكل معيار" : "Average Scores by Criterion"}
          </h3>
        </div>
        <CardContent className="p-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.criteriaBreakdown}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value}`,
                    name === "avg" ? (isAr ? "المتوسط" : "Average") : name,
                  ]}
                />
                <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="max" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Judge Agreement Radar */}
      {data.agreement.length > 2 && (
        <Card className="overflow-hidden">
          <div className="border-b bg-muted/30 px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-4/10">
                <Scale className="h-3.5 w-3.5 text-chart-4" />
              </div>
              {isAr ? "اتفاق الحكام" : "Judge Agreement"}
            </h3>
          </div>
          <CardContent className="p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data.agreement}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name={isAr ? "نسبة الاتفاق" : "Agreement %"}
                    dataKey="agreement"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {isAr
                ? "نسبة أعلى = اتفاق أكبر بين الحكام"
                : "Higher % = stronger agreement between judges"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
