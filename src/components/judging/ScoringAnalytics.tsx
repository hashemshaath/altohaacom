import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface ScoringAnalyticsProps {
  competitionId: string;
}

export function ScoringAnalytics({ competitionId }: ScoringAnalyticsProps) {
  const { language } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ["scoring-analytics", competitionId],
    queryFn: async () => {
      // Get criteria
      const { data: criteria } = await supabase
        .from("judging_criteria")
        .select("*")
        .eq("competition_id", competitionId)
        .order("sort_order");

      // Get all scores
      const { data: registrations } = await supabase
        .from("competition_registrations")
        .select("id")
        .eq("competition_id", competitionId)
        .eq("status", "approved");

      const regIds = registrations?.map(r => r.id) || [];
      if (regIds.length === 0) return null;

      const { data: scores } = await supabase
        .from("competition_scores")
        .select("*")
        .in("registration_id", regIds);

      if (!criteria || !scores) return null;

      // Criteria breakdown: avg score per criterion
      const criteriaBreakdown = criteria.map(crit => {
        const critScores = scores.filter(s => s.criteria_id === crit.id);
        const avg = critScores.length > 0
          ? critScores.reduce((sum, s) => sum + Number(s.score), 0) / critScores.length
          : 0;
        return {
          name: language === "ar" && crit.name_ar ? crit.name_ar : crit.name,
          avg: Math.round(avg * 10) / 10,
          max: crit.max_score,
          pct: crit.max_score > 0 ? Math.round((avg / crit.max_score) * 100) : 0,
        };
      });

      // Judge agreement: standard deviation per criterion across judges
      const judgeIds = [...new Set(scores.map(s => s.judge_id))];
      const agreement = criteria.map(crit => {
        const critScores = scores.filter(s => s.criteria_id === crit.id);
        // Group by registration, calculate std dev of judge scores
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

        // Convert to agreement score (lower std dev = higher agreement)
        const maxPossibleStdDev = crit.max_score / 2;
        const agreementPct = maxPossibleStdDev > 0
          ? Math.round((1 - avgStdDev / maxPossibleStdDev) * 100)
          : 100;

        return {
          name: language === "ar" && crit.name_ar ? crit.name_ar : crit.name,
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
    return <Skeleton className="h-64 w-full" />;
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {language === "ar" ? "لا توجد بيانات تحليلية" : "No analytics data available"}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{data.totalScores}</p>
            <p className="text-sm text-muted-foreground">{language === "ar" ? "إجمالي التقييمات" : "Total Scores"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{data.totalJudges}</p>
            <p className="text-sm text-muted-foreground">{language === "ar" ? "عدد الحكام" : "Judges"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{data.totalEntries}</p>
            <p className="text-sm text-muted-foreground">{language === "ar" ? "عدد المشاركين" : "Entries"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Criteria Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            {language === "ar" ? "متوسط الدرجات لكل معيار" : "Average Scores by Criterion"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.criteriaBreakdown}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value}`,
                    name === "avg" ? (language === "ar" ? "المتوسط" : "Average") : name,
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {language === "ar" ? "اتفاق الحكام" : "Judge Agreement"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data.agreement}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name={language === "ar" ? "نسبة الاتفاق" : "Agreement %"}
                    dataKey="agreement"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {language === "ar"
                ? "نسبة أعلى = اتفاق أكبر بين الحكام"
                : "Higher % = stronger agreement between judges"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
