import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText, Trophy, Users, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatRow {
  label: string;
  value: number;
  previousValue?: number;
  icon: typeof FileText;
  color: string;
}

export function ContentStatsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["content-stats-dashboard"],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

      const [
        articlesTotal,
        articlesRecent,
        articlesPrev,
        compsTotal,
        compsRecent,
        compsPrev,
        profilesTotal,
        profilesRecent,
        profilesPrev,
      ] = await Promise.all([
        supabase.from("articles").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("articles").select("id", { count: "exact", head: true }).gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
        supabase.from("competitions").select("id", { count: "exact", head: true }),
        supabase.from("competitions").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("competitions").select("id", { count: "exact", head: true }).gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sixtyDaysAgo).lt("created_at", thirtyDaysAgo),
      ]);

      return {
        articles: { total: articlesTotal.count || 0, recent: articlesRecent.count || 0, prev: articlesPrev.count || 0 },
        competitions: { total: compsTotal.count || 0, recent: compsRecent.count || 0, prev: compsPrev.count || 0 },
        profiles: { total: profilesTotal.count || 0, recent: profilesRecent.count || 0, prev: profilesPrev.count || 0 },
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  if (!data) return null;

  const stats: StatRow[] = [
    { label: isAr ? "المقالات" : "Articles", value: data.articles.total, previousValue: data.articles.prev, icon: FileText, color: "text-chart-1" },
    { label: isAr ? "المسابقات" : "Competitions", value: data.competitions.total, previousValue: data.competitions.prev, icon: Trophy, color: "text-chart-2" },
    { label: isAr ? "الأعضاء" : "Members", value: data.profiles.total, previousValue: data.profiles.prev, icon: Users, color: "text-chart-3" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-primary" />
          {isAr ? "نظرة عامة على المحتوى" : "Content Overview"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stats.map((stat) => {
          const change = stat.previousValue != null && stat.previousValue > 0
            ? Math.round(((stat.value - stat.previousValue) / stat.previousValue) * 100)
            : null;
          const TrendIcon = change === null || change === 0 ? Minus : change > 0 ? TrendingUp : TrendingDown;
          const trendColor = change === null || change === 0 ? "text-muted-foreground" : change > 0 ? "text-chart-2" : "text-destructive";

          return (
            <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-border/40 p-3 transition-all hover:border-border/60 hover:bg-muted/30">
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted", stat.color)}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold tabular-nums">{stat.value.toLocaleString()}</p>
              </div>
              {change !== null && (
                <div className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor)}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{Math.abs(change)}%</span>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
