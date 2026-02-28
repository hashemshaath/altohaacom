import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Trophy, FileText, MessageSquare, DollarSign, ShieldCheck, Activity, BarChart3 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function AdminDashboardWidgets() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Fetch key metrics
  const { data: userCount } = useQuery({
    queryKey: ["admin-metric-users"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      return count || 0;
    },
    staleTime: 300000,
  });

  const { data: competitionCount } = useQuery({
    queryKey: ["admin-metric-competitions"],
    queryFn: async () => {
      const { count } = await supabase.from("competitions").select("*", { count: "exact", head: true });
      return count || 0;
    },
    staleTime: 300000,
  });

  const { data: articleCount } = useQuery({
    queryKey: ["admin-metric-articles"],
    queryFn: async () => {
      const { count } = await supabase.from("articles").select("*", { count: "exact", head: true });
      return count || 0;
    },
    staleTime: 300000,
  });

  const { data: bookingCount } = useQuery({
    queryKey: ["admin-metric-bookings"],
    queryFn: async () => {
      const { count } = await supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending");
      return count || 0;
    },
    staleTime: 300000,
  });

  const { data: reviewCount } = useQuery({
    queryKey: ["admin-metric-reviews"],
    queryFn: async () => {
      const { count } = await supabase.from("establishment_reviews").select("*", { count: "exact", head: true });
      return count || 0;
    },
    staleTime: 300000,
  });

  // 7-day user trend
  const { data: userTrend = [] } = useQuery({
    queryKey: ["admin-user-trend"],
    queryFn: async () => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const start = d.toISOString().split("T")[0];
        const end = new Date(d.getTime() + 86400000).toISOString().split("T")[0];
        const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", start).lt("created_at", end);
        days.push({ day: d.toLocaleDateString(isAr ? "ar" : "en", { weekday: "short" }), count: count || 0 });
      }
      return days;
    },
    staleTime: 300000,
  });

  // Competition status distribution
  const { data: compStatusDist = [] } = useQuery({
    queryKey: ["admin-comp-status-dist"],
    queryFn: async () => {
      const { data } = await supabase.from("competitions").select("status");
      if (!data) return [];
      const map: Record<string, number> = {};
      data.forEach(c => { map[c.status || "draft"] = (map[c.status || "draft"] || 0) + 1; });
      return Object.entries(map).map(([name, value]) => ({ name, value }));
    },
    staleTime: 300000,
  });

  const kpis = [
    { icon: Users, label: isAr ? "المستخدمون" : "Users", value: userCount || 0, color: "text-primary", trend: "+12%" },
    { icon: Trophy, label: isAr ? "المسابقات" : "Competitions", value: competitionCount || 0, color: "text-amber-500" },
    { icon: FileText, label: isAr ? "المقالات" : "Articles", value: articleCount || 0, color: "text-blue-500" },
    { icon: MessageSquare, label: isAr ? "التقييمات" : "Reviews", value: reviewCount || 0, color: "text-green-500" },
    { icon: Activity, label: isAr ? "حجوزات معلقة" : "Pending Bookings", value: bookingCount || 0, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                {kpi.trend && (
                  <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 bg-green-50">
                    <TrendingUp className="h-3 w-3 me-0.5" />{kpi.trend}
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold mt-2">{kpi.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {isAr ? "المستخدمون الجدد (7 أيام)" : "New Users (7 Days)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={userTrend}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#userGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              {isAr ? "توزيع حالات المسابقات" : "Competition Status"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={compStatusDist} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {compStatusDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
