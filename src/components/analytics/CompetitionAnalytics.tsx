import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Star, ClipboardList } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function CompetitionAnalytics() {
  const { language } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ["competitionAnalytics"],
    queryFn: async () => {
      const [
        { count: totalRegistrations },
        { count: totalJudges },
        { count: totalScores },
        { data: competitions },
        { data: scores },
      ] = await Promise.all([
        supabase.from("competition_registrations").select("*", { count: "exact", head: true }),
        supabase.from("competition_judges").select("*", { count: "exact", head: true }),
        supabase.from("competition_scores").select("*", { count: "exact", head: true }),
        supabase.from("competitions").select("id, title, status, competition_start"),
        supabase.from("competition_scores").select("score"),
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

      return {
        totalRegistrations: totalRegistrations || 0,
        totalJudges: totalJudges || 0,
        totalScores: totalScores || 0,
        totalCompetitions: (competitions || []).length,
        scoreDistribution,
        monthlyData,
      };
    },
    staleTime: 1000 * 60,
  });

  const cards = [
    { label: language === "ar" ? "المسابقات" : "Total Competitions", value: data?.totalCompetitions, icon: Trophy },
    { label: language === "ar" ? "التسجيلات" : "Registrations", value: data?.totalRegistrations, icon: ClipboardList },
    { label: language === "ar" ? "الحكام" : "Judges Assigned", value: data?.totalJudges, icon: Users },
    { label: language === "ar" ? "التقييمات" : "Scores Submitted", value: data?.totalScores, icon: Star },
  ];

  return (
    <div className="space-y-6 mt-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : (card.value || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "المسابقات حسب الشهر" : "Competitions by Month"}</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.monthlyData && data.monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-muted-foreground">{language === "ar" ? "لا توجد بيانات" : "No data available"}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "توزيع الدرجات" : "Score Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.scoreDistribution && data.scoreDistribution.some((s) => s.count > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-muted-foreground">{language === "ar" ? "لا توجد بيانات" : "No data available"}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
