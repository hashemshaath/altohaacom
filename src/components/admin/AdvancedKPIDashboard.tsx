import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { Activity, Users, Trophy, FileText, MessageSquare, DollarSign, TrendingUp, Ticket } from "lucide-react";
import { subDays, format } from "date-fns";

export function AdvancedKPIDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";

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
        supabase.from("company_orders").select("total_amount").gte("created_at", thirtyDaysAgo),
        supabase.from("profiles").select("created_at").gte("created_at", thirtyDaysAgo).order("created_at"),
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
          value: `${((ordersNow.data?.reduce((s: number, o: any) => s + (o.total_amount || 0), 0) || 0) / 1000).toFixed(1)}K`,
          growth: 0,
          color: "text-chart-4", bg: "bg-chart-4/10",
        },
      ];

      // User registration trend (daily for 30 days)
      const dailyMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        dailyMap[format(subDays(now, i), "dd")] = 0;
      }
      recentUsers.data?.forEach((u: any) => {
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
    refetchInterval: 120000,
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {data.kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className={`rounded-full p-2 ${kpi.bg}`}><kpi.icon className={`h-4 w-4 ${kpi.color}`} /></div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground truncate">{kpi.label}</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-lg font-bold">{kpi.value}</p>
                  {kpi.growth !== 0 && (
                    <Badge variant={kpi.growth > 0 ? "default" : "destructive"} className="text-[8px] h-4 px-1">
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
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {isAr ? "اتجاه التسجيل (30 يوم)" : "Registration Trend (30 Days)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={data.trend}>
                <XAxis dataKey="day" tick={{ fontSize: 9 }} interval={4} />
                <YAxis tick={{ fontSize: 9 }} width={24} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
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
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={data.radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis tick={false} domain={[0, 100]} />
                <Radar dataKey="score" fill="hsl(var(--primary))" fillOpacity={0.3} stroke="hsl(var(--primary))" strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
