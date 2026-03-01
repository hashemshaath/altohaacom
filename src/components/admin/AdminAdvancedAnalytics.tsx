import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart,
} from "recharts";
import { TrendingUp, Users, Trophy, FileText, Globe, Activity } from "lucide-react";
import { format, subDays } from "date-fns";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--destructive))",
];

export function AdminAdvancedAnalytics() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-advanced-analytics"],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30).toISOString();

      const [
        usersRes,
        usersByTypeRes,
        usersByCountryRes,
        competitionsRes,
        articlesRes,
        ordersRes,
      ] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", thirtyDaysAgo).order("created_at"),
        supabase.from("profiles").select("account_type"),
        supabase.from("profiles").select("country_code").not("country_code", "is", null),
        supabase.from("competitions").select("created_at, status").gte("created_at", thirtyDaysAgo),
        supabase.from("articles").select("created_at, type, view_count").gte("created_at", thirtyDaysAgo),
        supabase.from("company_orders").select("created_at, total_amount, currency").gte("created_at", thirtyDaysAgo),
      ]);

      // Daily user growth
      const dailyGrowth: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(now, i), "MM/dd");
        dailyGrowth[d] = 0;
      }
      (usersRes.data || []).forEach((u) => {
        const d = format(new Date(u.created_at), "MM/dd");
        if (dailyGrowth[d] !== undefined) dailyGrowth[d]++;
      });

      // Users by type
      const typeCounts: Record<string, number> = {};
      (usersByTypeRes.data || []).forEach((u) => {
        const t = u.account_type || "professional";
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      });

      // Users by country (top 8)
      const countryCounts: Record<string, number> = {};
      (usersByCountryRes.data || []).forEach((u) => {
        const c = u.country_code || "Other";
        countryCounts[c] = (countryCounts[c] || 0) + 1;
      });
      const topCountries = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([country, count]) => ({ country, count }));

      // Revenue trend
      const dailyRevenue: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(now, i), "MM/dd");
        dailyRevenue[d] = 0;
      }
      (ordersRes.data || []).forEach((o) => {
        const d = format(new Date(o.created_at), "MM/dd");
        if (dailyRevenue[d] !== undefined) dailyRevenue[d] += Number(o.total_amount || 0);
      });

      return {
        dailyGrowth: Object.entries(dailyGrowth).map(([day, count]) => ({ day, count })),
        typePie: Object.entries(typeCounts).map(([name, value]) => ({ name, value })),
        topCountries,
        revenueTrend: Object.entries(dailyRevenue).map(([day, revenue]) => ({ day, revenue })),
        totalNewUsers: usersRes.data?.length || 0,
        totalCompetitions: competitionsRes.data?.length || 0,
        totalArticles: articlesRes.data?.length || 0,
        totalRevenue: (ordersRes.data || []).reduce((s, o) => s + Number(o.total_amount || 0), 0),
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" /></div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isAr ? "مستخدمين جدد (30 يوم)" : "New Users (30d)", value: data.totalNewUsers, icon: Users, color: "text-primary" },
          { label: isAr ? "المسابقات (30 يوم)" : "Competitions (30d)", value: data.totalCompetitions, icon: Trophy, color: "text-chart-2" },
          { label: isAr ? "المقالات (30 يوم)" : "Articles (30d)", value: data.totalArticles, icon: FileText, color: "text-chart-5" },
          { label: isAr ? "الإيرادات (30 يوم)" : "Revenue (30d)", value: data.totalRevenue, icon: TrendingUp, color: "text-chart-3" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-xl font-bold mt-1">{typeof kpi.value === "number" ? <><AnimatedCounter value={kpi.value} />{kpi.label.includes("Revenue") ? " SAR" : ""}</> : kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="growth">
        <TabsList>
          <TabsTrigger value="growth"><Activity className="me-1 h-3.5 w-3.5" />{isAr ? "النمو" : "Growth"}</TabsTrigger>
          <TabsTrigger value="distribution"><Users className="me-1 h-3.5 w-3.5" />{isAr ? "التوزيع" : "Distribution"}</TabsTrigger>
          <TabsTrigger value="revenue"><TrendingUp className="me-1 h-3.5 w-3.5" />{isAr ? "الإيرادات" : "Revenue"}</TabsTrigger>
          <TabsTrigger value="geography"><Globe className="me-1 h-3.5 w-3.5" />{isAr ? "الجغرافيا" : "Geography"}</TabsTrigger>
        </TabsList>

        <TabsContent value="growth">
          <Card>
            <CardHeader><CardTitle className="text-sm">{isAr ? "نمو المستخدمين - 30 يوم" : "User Growth - 30 Days"}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.dailyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader><CardTitle className="text-sm">{isAr ? "توزيع أنواع الحسابات" : "Account Type Distribution"}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={data.typePie} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {data.typePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader><CardTitle className="text-sm">{isAr ? "اتجاه الإيرادات - 30 يوم" : "Revenue Trend - 30 Days"}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => `${v.toLocaleString()} SAR`} />
                  <Bar dataKey="revenue" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography">
          <Card>
            <CardHeader><CardTitle className="text-sm">{isAr ? "المستخدمون حسب الدولة" : "Users by Country"}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topCountries} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="country" type="category" tick={{ fontSize: 11 }} width={40} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
