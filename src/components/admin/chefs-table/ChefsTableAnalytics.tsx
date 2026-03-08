import { useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from "recharts";
import { TrendingUp, TrendingDown, Activity, Target } from "lucide-react";
import type { ChefsTableRequest, ChefsTableSession } from "@/hooks/useChefsTable";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface Props {
  requests: ChefsTableRequest[];
  sessions: ChefsTableSession[];
}

export function ChefsTableAnalytics({ requests, sessions }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    requests.forEach(r => {
      map[r.product_category] = (map[r.product_category] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [requests]);

  const monthlyData = useMemo(() => {
    const map: Record<string, { requests: number; sessions: number }> = {};
    requests.forEach(r => {
      const m = r.created_at.slice(0, 7);
      if (!map[m]) map[m] = { requests: 0, sessions: 0 };
      map[m].requests++;
    });
    sessions.forEach(s => {
      const m = s.created_at.slice(0, 7);
      if (!map[m]) map[m] = { requests: 0, sessions: 0 };
      map[m].sessions++;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({ month: month.slice(5), ...data }));
  }, [requests, sessions]);

  const approvalRate = useMemo(() => {
    const reviewed = requests.filter(r => r.status === "approved" || r.status === "rejected");
    if (!reviewed.length) return 0;
    return Math.round((reviewed.filter(r => r.status === "approved").length / reviewed.length) * 100);
  }, [requests]);

  const completionRate = useMemo(() => {
    if (!sessions.length) return 0;
    return Math.round((sessions.filter(s => s.status === "completed").length / sessions.length) * 100);
  }, [sessions]);

  const avgBudget = useMemo(() => {
    if (!requests.length) return 0;
    return Math.round(requests.reduce((sum, r) => sum + (r.budget || 0), 0) / requests.length);
  }, [requests]);

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {isAr ? "معدل الموافقة" : "Approval Rate"}
              </span>
              <TrendingUp className="h-3.5 w-3.5 text-chart-5 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <AnimatedCounter value={approvalRate} className="text-3xl font-black tabular-nums" suffix="%" />
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-chart-5 transition-all" style={{ width: `${approvalRate}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {isAr ? "معدل الإنجاز" : "Completion Rate"}
              </span>
              <Target className="h-3.5 w-3.5 text-primary transition-transform duration-300 group-hover:scale-110" />
            </div>
            <AnimatedCounter value={completionRate} className="text-3xl font-black tabular-nums" suffix="%" />
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completionRate}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {isAr ? "متوسط الميزانية" : "Avg Budget"}
              </span>
              <Activity className="h-3.5 w-3.5 text-chart-4 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <AnimatedCounter value={avgBudget} className="text-3xl font-black tabular-nums" />
            <p className="text-[10px] text-muted-foreground mt-1">{isAr ? "لكل طلب" : "per request"}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {isAr ? "إجمالي الطهاة" : "Total Chefs"}
              </span>
              <TrendingUp className="h-3.5 w-3.5 text-chart-2 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <AnimatedCounter value={sessions.reduce((sum, s) => sum + (s.max_chefs || 0), 0)} className="text-3xl font-black tabular-nums" />
            <p className="text-[10px] text-muted-foreground mt-1">{isAr ? "عبر جميع الجلسات" : "across all sessions"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">
              {isAr ? "النشاط الشهري" : "Monthly Activity"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="month" className="text-[10px]" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-[10px]" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="requests" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" name={isAr ? "الطلبات" : "Requests"} />
                  <Area type="monotone" dataKey="sessions" stackId="1" stroke="hsl(var(--chart-5))" fill="hsl(var(--chart-5)/0.2)" name={isAr ? "الجلسات" : "Sessions"} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">
              {isAr ? "توزيع الفئات" : "Category Distribution"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-52 flex items-center">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={55} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} name={isAr ? "الطلبات" : "Requests"}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center w-full">{isAr ? "لا توجد بيانات" : "No data yet"}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
