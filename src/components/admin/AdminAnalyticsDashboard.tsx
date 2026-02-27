import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, FileText, Trophy, MessageSquare, TrendingUp, Eye, ShieldCheck,
  ArrowUp, ArrowDown, Activity, BarChart3, Globe,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, subDays } from "date-fns";

export function AdminAnalyticsDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["admin-platform-analytics"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const fourteenDaysAgo = subDays(new Date(), 14).toISOString();

      const [
        totalUsersRes, recentUsersRes, lastWeekUsersRes,
        recipesRes, postsRes, competitionsRes,
        articlesRes, commentsRes, flaggedRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("created_at").gte("created_at", thirtyDaysAgo),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("recipes").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("competitions").select("id, status"),
        supabase.from("articles").select("id", { count: "exact", head: true }),
        supabase.from("post_comments").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("event_comments").select("id", { count: "exact", head: true }).eq("is_flagged", true),
      ]);

      // User growth chart
      const growthMap: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        growthMap[format(subDays(new Date(), 29 - i), "MMM dd")] = 0;
      }
      (recentUsersRes.data || []).forEach((u: any) => {
        const key = format(new Date(u.created_at), "MMM dd");
        if (growthMap[key] !== undefined) growthMap[key]++;
      });
      const userGrowthData = Object.entries(growthMap).map(([date, signups]) => ({ date, signups }));

      // Competition status breakdown
      const comps = competitionsRes.data || [];
      const statusCounts: Record<string, number> = {};
      comps.forEach((c: any) => {
        statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
      });
      const statusPieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

      // Previous week users for delta
      const prevWeekCount = (await supabase.from("profiles").select("id", { count: "exact", head: true })
        .gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo)).count || 0;
      const thisWeekCount = recentUsersRes.data?.filter((u: any) => new Date(u.created_at) >= new Date(sevenDaysAgo)).length || 0;

      return {
        totalUsers: totalUsersRes.count || 0,
        newUsersThisWeek: lastWeekUsersRes.count || 0,
        userDelta: thisWeekCount - prevWeekCount,
        totalRecipes: recipesRes.count || 0,
        totalPosts: postsRes.count || 0,
        totalCompetitions: comps.length,
        totalArticles: articlesRes.count || 0,
        weeklyComments: commentsRes.count || 0,
        flaggedComments: flaggedRes.count || 0,
        userGrowthData,
        statusPieData,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (!analytics) return null;

  const kpis = [
    { icon: Users, label: isAr ? "إجمالي المستخدمين" : "Total Users", value: analytics.totalUsers, delta: analytics.userDelta, color: "text-primary" },
    { icon: Trophy, label: isAr ? "المسابقات" : "Competitions", value: analytics.totalCompetitions, color: "text-chart-4" },
    { icon: FileText, label: isAr ? "الوصفات" : "Recipes", value: analytics.totalRecipes, color: "text-chart-2" },
    { icon: MessageSquare, label: isAr ? "المنشورات" : "Posts", value: analytics.totalPosts, color: "text-chart-3" },
    { icon: FileText, label: isAr ? "المقالات" : "Articles", value: analytics.totalArticles, color: "text-chart-5" },
    { icon: Activity, label: isAr ? "تعليقات الأسبوع" : "Weekly Comments", value: analytics.weeklyComments, color: "text-chart-2" },
    { icon: Users, label: isAr ? "مستخدمون جدد" : "New This Week", value: analytics.newUsersThisWeek, delta: analytics.userDelta, color: "text-primary" },
    { icon: ShieldCheck, label: isAr ? "تعليقات مُبلّغ عنها" : "Flagged Comments", value: analytics.flaggedComments, color: "text-destructive" },
  ];

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--muted-foreground))"];

  return (
    <div className="space-y-5">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-xl font-bold tabular-nums">{kpi.value}</p>
                {kpi.delta !== undefined && (
                  <Badge variant="outline" className={`text-[9px] ${kpi.delta >= 0 ? "text-chart-2" : "text-destructive"}`}>
                    {kpi.delta >= 0 ? <ArrowUp className="h-2.5 w-2.5 me-0.5" /> : <ArrowDown className="h-2.5 w-2.5 me-0.5" />}
                    {Math.abs(kpi.delta)}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* User Growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {isAr ? "نمو المستخدمين (30 يوم)" : "User Growth (30 days)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analytics.userGrowthData}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="signups" stroke="hsl(var(--primary))" fill="url(#userGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Competition Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-chart-4" />
              {isAr ? "حالات المسابقات" : "Competition Status"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.statusPieData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">{isAr ? "لا توجد بيانات" : "No data"}</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={analytics.statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {analytics.statusPieData.map((_: any, idx: number) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
