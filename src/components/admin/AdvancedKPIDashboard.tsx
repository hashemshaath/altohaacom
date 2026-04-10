import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { Activity, Users, Trophy, FileText, DollarSign, TrendingUp, Ticket } from "lucide-react";
import { subDays, format } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK, X_AXIS_PROPS, Y_AXIS_PROPS, GRID_PROPS, getNoDataText,
} from "@/lib/chartConfig";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";

export const AdvancedKPIDashboard = memo(function AdvancedKPIDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const visibleInterval = useVisibleRefetchInterval(120000);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-advanced-kpi"],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30).toISOString();
      const prevThirtyStart = subDays(now, 60).toISOString();

      const [
        usersNow, usersPrev,
        competitionsNow, competitionsPrev,
        articlesNow, articlesPrev,
        ticketsNow, ticketsPrev,
        ordersNow,
        recentUsers,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", prevThirtyStart).lt("created_at", thirtyDaysAgo),
        supabase.from("competitions").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("competitions").select("id", { count: "exact", head: true }).gte("created_at", prevThirtyStart).lt("created_at", thirtyDaysAgo),
        supabase.from("articles").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("articles").select("id", { count: "exact", head: true }).gte("created_at", prevThirtyStart).lt("created_at", thirtyDaysAgo),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).gte("created_at", prevThirtyStart).lt("created_at", thirtyDaysAgo),
        supabase.from("company_orders").select("total_amount").gte("created_at", thirtyDaysAgo).limit(5000),
        supabase.from("profiles").select("created_at").gte("created_at", thirtyDaysAgo).order("created_at").limit(5000),
      ]);

      const calcGrowth = (current: number, prev: number) => {
        if (prev === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - prev) / prev) * 100);
      };

      const kpis = [
        {
          icon: Users, label: isAr ? "مستخدمين جدد" : "New Users",
          value: usersNow.count || 0,
          growth: calcGrowth(usersNow.count || 0, usersPrev.count || 0),
          color: "text-primary", bg: "bg-primary/10",
        },
        {
          icon: Trophy, label: isAr ? "مسابقات" : "Competitions",
          value: competitionsNow.count || 0,
          growth: calcGrowth(competitionsNow.count || 0, competitionsPrev.count || 0),
          color: "text-chart-4", bg: "bg-chart-4/10",
        },
        {
          icon: FileText, label: isAr ? "مقالات" : "Articles",
          value: articlesNow.count || 0,
          growth: calcGrowth(articlesNow.count || 0, articlesPrev.count || 0),
          color: "text-chart-3", bg: "bg-chart-3/10",
        },
        {
          icon: Ticket, label: isAr ? "تذاكر" : "Tickets",
          value: ticketsNow.count || 0,
          growth: calcGrowth(ticketsNow.count || 0, ticketsPrev.count || 0),
          color: "text-chart-5", bg: "bg-chart-5/10",
        },
        {
          icon: DollarSign, label: isAr ? "الإيرادات" : "Revenue",
          value: `${((ordersNow.data?.reduce((s: number, o: { total_amount: number | null }) => s + (o.total_amount || 0), 0) || 0) / 1000).toFixed(1)}K`,
          growth: 0,
          color: "text-chart-4", bg: "bg-chart-4/10",
        },
      ];

      // User registration trend (daily for 30 days)
      const dailyMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        dailyMap[format(subDays(now, i), "dd")] = 0;
      }
      recentUsers.data?.forEach((u: { created_at: string }) => {
        const d = format(new Date(u.created_at), "dd");
        if (dailyMap[d] !== undefined) dailyMap[d]++;
      });
      const trend = Object.entries(dailyMap).map(([day, users]) => ({ day, users }));

      // Radar data for platform health
      const radarData = [
        { metric: isAr ? "المستخدمين" : "Users", score: Math.min((usersNow.count || 0) * 5, 100) },
        { metric: isAr ? "المسابقات" : "Competitions", score: Math.min((competitionsNow.count || 0) * 20, 100) },
        { metric: isAr ? "المحتوى" : "Content", score: Math.min((articlesNow.count || 0) * 10, 100) },
        { metric: isAr ? "الدعم" : "Support", score: ticketsNow.count ? Math.max(100 - (ticketsNow.count || 0) * 2, 20) : 100 },
        { metric: isAr ? "الإيرادات" : "Revenue", score: Math.min(((ordersNow.data?.length || 0) * 15), 100) },
      ];

      return { kpis, trend, radarData };
    },
    refetchInterval: visibleInterval,
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {data.kpis.map(kpi => (
          <Card key={kpi.label} className="transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 group/kpi">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className={`rounded-xl p-2 ${kpi.bg} transition-transform duration-200 group-hover/kpi:scale-110`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] text-muted-foreground font-medium truncate">{kpi.label}</p>
                <div className="flex items-baseline gap-1.5">
                  <AnimatedCounter value={typeof kpi.value === "number" ? kpi.value : 0} className="text-lg font-bold tabular-nums" />
                  {kpi.growth !== 0 && (
                    <Badge variant={kpi.growth > 0 ? "default" : "destructive"} className="text-[12px] h-4 px-1 font-semibold">
                      {kpi.growth > 0 ? "+" : ""}{kpi.growth}%
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Registration Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {isAr ? "اتجاه التسجيل (30 يوم)" : "Registration Trend (30 Days)"}
              </CardTitle>
              <Badge variant="outline" className="text-[12px]">
                {isAr ? "آخر 30 يوم" : "Last 30 days"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.trend}>
                <XAxis
                  dataKey="day"
                  {...X_AXIS_PROPS}
                  interval={4}
                />
                <YAxis {...Y_AXIS_PROPS} width={28} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}
                  formatter={(value: number) => [value, isAr ? "المستخدمين" : "Users"]}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform Health Radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-chart-3" />
              {isAr ? "صحة المنصة" : "Platform Health"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={data.radarData}>
                <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.6} />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ ...AXIS_TICK, fontSize: 10 }}
                />
                <PolarRadiusAxis tick={false} domain={[0, 100]} />
                <Radar
                  dataKey="score"
                  fill={CHART_COLORS[0]}
                  fillOpacity={0.2}
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
