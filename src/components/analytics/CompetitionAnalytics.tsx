import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { AnalyticsKPICards } from "./AnalyticsKPICards";
import {
  RegistrationTrendChart,
  MonthlyCompetitionsChart,
  ScoreDistributionChart,
  StatusBreakdownChart,
  TopCountriesChart,
} from "./AnalyticsCharts";

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

      const scoreBuckets: Record<string, number> = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
      (scores || []).forEach((s: any) => {
        const v = Number(s.score);
        if (v <= 20) scoreBuckets["0-20"]++;
        else if (v <= 40) scoreBuckets["21-40"]++;
        else if (v <= 60) scoreBuckets["41-60"]++;
        else if (v <= 80) scoreBuckets["61-80"]++;
        else scoreBuckets["81-100"]++;
      });

      const monthCounts: Record<string, number> = {};
      (competitions || []).forEach((c: any) => {
        const month = c.competition_start?.substring(0, 7) || "unknown";
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      });

      const statusCounts: Record<string, number> = {};
      (competitions || []).forEach((c: any) => {
        const s = c.status || "unknown";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });

      const countryCounts: Record<string, number> = {};
      (competitions || []).forEach((c: any) => {
        if (c.country_code) countryCounts[c.country_code] = (countryCounts[c.country_code] || 0) + 1;
      });

      const regMonths: Record<string, number> = {};
      (registrations || []).forEach((r: any) => {
        const m = r.created_at?.substring(0, 7);
        if (m) regMonths[m] = (regMonths[m] || 0) + 1;
      });

      const uniqueCountries = new Set((competitions || []).map((c: any) => c.country_code).filter(Boolean));
      const activeCount = (competitions || []).filter((c: any) => c.status === "active" || c.status === "in_progress").length;

      return {
        totalRegistrations: totalRegistrations || 0,
        totalJudges: totalJudges || 0,
        totalScores: totalScores || 0,
        totalCompetitions: (competitions || []).length,
        totalCountries: uniqueCountries.size,
        activeCompetitions: activeCount,
        scoreDistribution: Object.entries(scoreBuckets).map(([range, count]) => ({ range, count })),
        monthlyData: Object.entries(monthCounts).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([month, count]) => ({ month, count })),
        statusData: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
        countryData: Object.entries(countryCounts).sort(([, a], [, b]) => b - a).slice(0, 8).map(([country, count]) => ({ country, count })),
        regTrend: Object.entries(regMonths).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, count]) => ({ month, count })),
      };
    },
    staleTime: 1000 * 60,
  });

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
      <AnalyticsKPICards data={data || null} isLoading={isLoading} />

      {avgScore > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-black text-primary"><AnimatedCounter value={avgScore} className="text-3xl font-black text-primary" /><span className="text-lg font-bold text-primary/60">/100</span></p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{isAr ? "متوسط الدرجات" : "Average Score"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <RegistrationTrendChart data={data?.regTrend} />
        <MonthlyCompetitionsChart data={data?.monthlyData} />
        <ScoreDistributionChart data={data?.scoreDistribution} />
        <StatusBreakdownChart data={data?.statusData} />
        <TopCountriesChart data={data?.countryData} />
      </div>
    </div>
  );
}
