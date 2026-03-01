import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Users, Trophy, Building2, FileText, TrendingUp, TrendingDown,
  Eye, Activity, DollarSign, BarChart3, PieChart, ArrowUpRight,
  ArrowDownRight, Minus, RefreshCw, Loader2, Globe, Star
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))"
];

interface KPIData {
  label: string;
  labelAr: string;
  value: number;
  change: number;
  icon: any;
  format?: "number" | "currency";
}

export default function InteractiveDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const [period, setPeriod] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");

  const getPeriodDays = () => {
    switch (period) {
      case "7d": return 7;
      case "30d": return 30;
      case "90d": return 90;
      case "1y": return 365;
      default: return 30;
    }
  };

  const periodStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - getPeriodDays());
    return d.toISOString();
  }, [period]);

  // KPI queries
  const { data: kpis, isLoading } = useQuery({
    queryKey: ["dashboard-kpis", period],
    queryFn: async () => {
      const prevStart = new Date();
      prevStart.setDate(prevStart.getDate() - getPeriodDays() * 2);
      const prevEnd = new Date();
      prevEnd.setDate(prevEnd.getDate() - getPeriodDays());

      const [users, prevUsers, companies, competitions, articles, orders] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", periodStart),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", prevStart.toISOString()).lte("created_at", prevEnd.toISOString()),
        supabase.from("companies").select("*", { count: "exact", head: true }).gte("created_at", periodStart),
        supabase.from("competitions").select("*", { count: "exact", head: true }).gte("created_at", periodStart),
        supabase.from("articles").select("*", { count: "exact", head: true }).gte("created_at", periodStart),
        supabase.from("company_orders").select("*", { count: "exact", head: true }).gte("created_at", periodStart),
      ]);

      const usersCount = users.count || 0;
      const prevUsersCount = prevUsers.count || 0;
      const usersChange = prevUsersCount > 0 ? ((usersCount - prevUsersCount) / prevUsersCount) * 100 : 0;

      return [
        { label: "New Users", labelAr: "مستخدمون جدد", value: usersCount, change: Math.round(usersChange), icon: Users },
        { label: "Companies", labelAr: "شركات", value: companies.count || 0, change: 0, icon: Building2 },
        { label: "Competitions", labelAr: "مسابقات", value: competitions.count || 0, change: 0, icon: Trophy },
        { label: "Articles", labelAr: "مقالات", value: articles.count || 0, change: 0, icon: FileText },
      ] as KPIData[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Growth chart data
  const { data: growthData } = useQuery({
    queryKey: ["dashboard-growth", period],
    queryFn: async () => {
      const days = getPeriodDays();
      const data: { date: string; users: number; activity: number }[] = [];
      const bucketSize = days <= 7 ? 1 : days <= 30 ? 1 : days <= 90 ? 7 : 30;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", periodStart)
        .order("created_at");

      const grouped: Record<string, number> = {};
      profiles?.forEach(p => {
        const d = p.created_at.slice(0, 10);
        grouped[d] = (grouped[d] || 0) + 1;
      });

      let cumulative = 0;
      const sortedDates = Object.keys(grouped).sort();
      sortedDates.forEach(d => {
        cumulative += grouped[d];
        data.push({ date: d, users: cumulative, activity: grouped[d] });
      });

      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Geographic distribution
  const { data: geoData } = useQuery({
    queryKey: ["dashboard-geo"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("country_code")
        .not("country_code", "is", null);

      const counts: Record<string, number> = {};
      data?.forEach(p => {
        if (p.country_code) counts[p.country_code] = (counts[p.country_code] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
    },
    staleTime: 1000 * 60 * 10,
  });

  const renderChangeIndicator = (change: number) => {
    if (change > 0) return <span className="text-success flex items-center gap-0.5 text-xs"><ArrowUpRight className="h-3 w-3" />+{change}%</span>;
    if (change < 0) return <span className="text-destructive flex items-center gap-0.5 text-xs"><ArrowDownRight className="h-3 w-3" />{change}%</span>;
    return <span className="text-muted-foreground flex items-center gap-0.5 text-xs"><Minus className="h-3 w-3" />0%</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">{isAr ? "لوحة التحكم التفاعلية" : "Interactive Dashboard"}</h2>
          <p className="text-sm text-muted-foreground">{isAr ? "نظرة شاملة على أداء المنصة" : "Platform performance overview"}</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">{isAr ? "7 أيام" : "7 days"}</SelectItem>
            <SelectItem value="30d">{isAr ? "30 يوم" : "30 days"}</SelectItem>
            <SelectItem value="90d">{isAr ? "90 يوم" : "90 days"}</SelectItem>
            <SelectItem value="1y">{isAr ? "سنة" : "1 year"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))
        ) : (
          kpis?.map((kpi, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{isAr ? kpi.labelAr : kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold">{kpi.value.toLocaleString()}</span>
                  {renderChangeIndicator(kpi.change)}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Growth Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {isAr ? "نمو المستخدمين" : "User Growth"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={growthData || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {isAr ? "التوزيع الجغرافي" : "Geographic Distribution"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={geoData || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={60} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {isAr ? "النشاط اليومي" : "Daily Activity"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={growthData || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="activity" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
