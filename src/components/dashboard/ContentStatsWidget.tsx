import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText, Trophy, Users, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface DailyCount {
  day: string;
  count: number;
}

interface StatRow {
  label: string;
  value: number;
  previousValue: number;
  sparkline: DailyCount[];
  icon: typeof FileText;
  color: string;
  chartColor: string;
}

function buildDailyCounts(rows: { created_at: string }[] | null, days: number): DailyCount[] {
  const now = new Date();
  const result: DailyCount[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    const count = (rows || []).filter(r => r.created_at?.startsWith(key)).length;
    result.push({ day: key.slice(5), count });
  }
  return result;
}

export const ContentStatsWidget = memo(function ContentStatsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["content-stats-dashboard-v2"],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

      const [
        articlesRecent, articlesPrev,
        compsRecent, compsPrev,
        profilesRecent, profilesPrev,
      ] = await Promise.all([
        supabase.from("articles").select("id, created_at").gte("created_at", thirtyDaysAgo),
        supabase.from("articles").select("id").gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
        supabase.from("competitions").select("id, created_at").gte("created_at", thirtyDaysAgo),
        supabase.from("competitions").select("id").gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
        supabase.from("profiles").select("id, created_at").gte("created_at", thirtyDaysAgo),
        supabase.from("profiles").select("id").gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
      ]);

      return {
        articles: {
          recent: articlesRecent.data?.length || 0,
          prev: articlesPrev.data?.length || 0,
          sparkline: buildDailyCounts(articlesRecent.data as any, 14),
        },
        competitions: {
          recent: compsRecent.data?.length || 0,
          prev: compsPrev.data?.length || 0,
          sparkline: buildDailyCounts(compsRecent.data as any, 14),
        },
        profiles: {
          recent: profilesRecent.data?.length || 0,
          prev: profilesPrev.data?.length || 0,
          sparkline: buildDailyCounts(profilesRecent.data as any, 14),
        },
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  if (!data) return null;

  const stats: StatRow[] = [
    { label: isAr ? "المقالات" : "Articles", value: data.articles.recent, previousValue: data.articles.prev, sparkline: data.articles.sparkline, icon: FileText, color: "text-chart-1", chartColor: "hsl(var(--chart-1))" },
    { label: isAr ? "المسابقات" : "Competitions", value: data.competitions.recent, previousValue: data.competitions.prev, sparkline: data.competitions.sparkline, icon: Trophy, color: "text-chart-2", chartColor: "hsl(var(--chart-2))" },
    { label: isAr ? "أعضاء جدد" : "New Members", value: data.profiles.recent, previousValue: data.profiles.prev, sparkline: data.profiles.sparkline, icon: Users, color: "text-chart-3", chartColor: "hsl(var(--chart-3))" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-primary" />
          {isAr ? "نظرة عامة (30 يوم)" : "Overview (30 days)"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stats.map((stat) => {
          const change = stat.previousValue > 0
            ? Math.round(((stat.value - stat.previousValue) / stat.previousValue) * 100)
            : stat.value > 0 ? 100 : 0;
          const TrendIcon = change === 0 ? Minus : change > 0 ? TrendingUp : TrendingDown;
          const trendColor = change === 0 ? "text-muted-foreground" : change > 0 ? "text-chart-2" : "text-destructive";

          return (
            <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-border/40 p-3 transition-all hover:border-border/60 hover:bg-muted/30">
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted", stat.color)}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <div className="flex items-center gap-2">
                  <AnimatedCounter value={stat.value} className="text-lg font-bold tabular-nums" />
                  {change !== 0 && (
                    <div className={cn("flex items-center gap-0.5 text-[10px] font-medium", trendColor)}>
                      <TrendIcon className="h-3 w-3" />
                      <span>{Math.abs(change)}%</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Mini sparkline */}
              <div className="h-8 w-20 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stat.sparkline}>
                    <defs>
                      <linearGradient id={`fill-${stat.label}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stat.chartColor} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={stat.chartColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={stat.chartColor}
                      strokeWidth={1.5}
                      fill={`url(#fill-${stat.label})`}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
});
