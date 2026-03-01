import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { Activity, UserPlus, FileText, MessageSquare, Trophy, Ticket, TrendingUp, Zap } from "lucide-react";
import { format, subHours } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ResultReveal } from "@/components/ui/result-reveal";
import { DataFreshness } from "@/components/ui/data-freshness";

export function DashboardLiveMetricsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-live-metrics"],
    queryFn: async () => {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayISO = yesterdayStart.toISOString();

      const [
        todayUsers, yesterdayUsers,
        todayPosts, yesterdayPosts,
        todayArticles,
        todayTickets,
        todayNotifs,
        hourlyUsers,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", yesterdayISO).lt("created_at", todayISO),
        supabase.from("posts").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("posts").select("*", { count: "exact", head: true }).gte("created_at", yesterdayISO).lt("created_at", todayISO),
        supabase.from("articles").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("notifications").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("profiles").select("created_at").gte("created_at", subHours(now, 12).toISOString()),
      ]);

      // Hourly chart (last 12 hours)
      const hourlyData: { hour: string; count: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const h = subHours(now, i);
        const hStr = format(h, "HH:00");
        const hStart = new Date(h); hStart.setMinutes(0, 0, 0);
        const hEnd = new Date(h); hEnd.setMinutes(59, 59, 999);
        const count = (hourlyUsers.data || []).filter(u => {
          const d = new Date(u.created_at);
          return d >= hStart && d <= hEnd;
        }).length;
        hourlyData.push({ hour: hStr, count });
      }

      const tUsers = todayUsers.count || 0;
      const yUsers = yesterdayUsers.count || 0;
      const tPosts = todayPosts.count || 0;
      const yPosts = yesterdayPosts.count || 0;

      return {
        todayUsers: tUsers,
        usersDelta: yUsers > 0 ? Math.round(((tUsers - yUsers) / yUsers) * 100) : tUsers > 0 ? 100 : 0,
        todayPosts: tPosts,
        postsDelta: yPosts > 0 ? Math.round(((tPosts - yPosts) / yPosts) * 100) : tPosts > 0 ? 100 : 0,
        todayArticles: todayArticles.count || 0,
        todayTickets: todayTickets.count || 0,
        todayNotifs: todayNotifs.count || 0,
        hourlyData,
      };
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (!data) return null;

  const metrics = [
    { label: isAr ? "مستخدمين جدد" : "New Users", value: data.todayUsers, delta: data.usersDelta, icon: UserPlus, color: "text-primary", bg: "bg-primary/10" },
    { label: isAr ? "منشورات" : "Posts", value: data.todayPosts, delta: data.postsDelta, icon: MessageSquare, color: "text-chart-2", bg: "bg-chart-2/10" },
    { label: isAr ? "مقالات" : "Articles", value: data.todayArticles, delta: 0, icon: FileText, color: "text-chart-3", bg: "bg-chart-3/10" },
    { label: isAr ? "تذاكر دعم" : "Tickets", value: data.todayTickets, delta: 0, icon: Ticket, color: "text-chart-4", bg: "bg-chart-4/10" },
    { label: isAr ? "إشعارات" : "Notifications", value: data.todayNotifs, delta: 0, icon: Zap, color: "text-chart-5", bg: "bg-chart-5/10" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
          {isAr ? "نبض المنصة اليوم" : "Today's Platform Pulse"}
          <Badge variant="outline" className="text-[9px] ms-auto">{isAr ? "تحديث تلقائي" : "Auto-refresh"}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-3 mb-3">
          {metrics.map((m, i) => (
            <ResultReveal key={m.label} delay={i * 60} variant="scale">
              <div className="text-center space-y-1">
                <div className={`mx-auto w-8 h-8 rounded-xl ${m.bg} flex items-center justify-center`}>
                  <m.icon className={`h-4 w-4 ${m.color}`} />
                </div>
                <AnimatedCounter value={m.value} className="text-lg" />
                <p className="text-[9px] text-muted-foreground">{m.label}</p>
                {m.delta !== 0 && (
                  <Badge variant="outline" className={`text-[8px] px-1 ${m.delta > 0 ? "text-chart-2" : "text-destructive"}`}>
                    {m.delta > 0 ? "+" : ""}{m.delta}%
                  </Badge>
                )}
              </div>
            </ResultReveal>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-muted-foreground">{isAr ? "التسجيلات (آخر 12 ساعة)" : "Registrations (last 12h)"}</p>
            <DataFreshness lastUpdated={new Date()} />
          </div>
          <ResponsiveContainer width="100%" height={60}>
            <AreaChart data={data.hourlyData}>
              <XAxis dataKey="hour" tick={{ fontSize: 8 }} interval={2} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.15)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
