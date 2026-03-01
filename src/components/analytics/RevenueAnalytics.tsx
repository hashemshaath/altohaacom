import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Clock, AlertTriangle, TrendingUp, TrendingDown, Receipt, CalendarClock, Target, Banknote } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart, Area, Line,
} from "recharts";
import { formatCurrency } from "@/lib/currencyFormatter";
import { StaggeredList } from "@/components/ui/staggered-list";
import { linearRegression, forecast, type DataPoint } from "@/lib/trendPrediction";
import { TrendForecastChart } from "./TrendForecastChart";

const COLORS = ["hsl(var(--chart-2))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--destructive))", "hsl(var(--primary))"];

export function RevenueAnalytics() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-revenue-analytics-v2"],
    queryFn: async () => {
      const [
        { data: invoices },
        { data: transactions },
        { data: wallets },
      ] = await Promise.all([
        supabase.from("invoices").select("id, amount, currency, status, created_at, due_date, paid_at").order("created_at", { ascending: true }),
        supabase.from("company_transactions").select("amount, type, created_at"),
        supabase.from("user_wallets").select("balance, points_balance"),
      ]);

      // Invoice aging buckets
      const now = new Date();
      const aging = { current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
      const unpaidInvoices = (invoices || []).filter(i => ["pending", "sent", "overdue"].includes(i.status || ""));

      unpaidInvoices.forEach(inv => {
        const dueDate = inv.due_date ? new Date(inv.due_date) : new Date(inv.created_at);
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const amt = Number(inv.amount) || 0;
        if (daysOverdue <= 0) aging.current += amt;
        else if (daysOverdue <= 30) aging["1-30"] += amt;
        else if (daysOverdue <= 60) aging["31-60"] += amt;
        else if (daysOverdue <= 90) aging["61-90"] += amt;
        else aging["90+"] += amt;
      });

      const agingData = [
        { bucket: isAr ? "حالي" : "Current", amount: Math.round(aging.current), color: "hsl(var(--chart-2))" },
        { bucket: "1-30", amount: Math.round(aging["1-30"]), color: "hsl(var(--chart-4))" },
        { bucket: "31-60", amount: Math.round(aging["31-60"]), color: "hsl(var(--chart-5))" },
        { bucket: "61-90", amount: Math.round(aging["61-90"]), color: "hsl(var(--chart-3))" },
        { bucket: "90+", amount: Math.round(aging["90+"]), color: "hsl(var(--destructive))" },
      ];

      // Revenue by month (paid invoices)
      const paidInvoices = (invoices || []).filter(i => i.status === "paid");
      const monthlyRevenue: Record<string, number> = {};
      paidInvoices.forEach(inv => {
        const month = (inv.paid_at || inv.created_at)?.substring(0, 7) || "unknown";
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (Number(inv.amount) || 0);
      });
      const revenueTrend: DataPoint[] = Object.entries(monthlyRevenue)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([date, value]) => ({ date, value: Math.round(value) }));

      // MRR / ARR calculation
      const recentMonths = revenueTrend.slice(-3);
      const mrr = recentMonths.length > 0
        ? Math.round(recentMonths.reduce((s, m) => s + m.value, 0) / recentMonths.length)
        : 0;
      const arr = mrr * 12;

      // Revenue forecast
      const revRegression = linearRegression(revenueTrend);
      const revForecast = forecast(revenueTrend, 6);

      // Combined chart data for revenue + forecast
      const revenueChartData = [
        ...revenueTrend.map(d => ({ month: d.date, revenue: d.value, forecast: null as number | null })),
        ...(revenueTrend.length > 0 ? [{
          month: revenueTrend[revenueTrend.length - 1].date,
          revenue: revenueTrend[revenueTrend.length - 1].value,
          forecast: revenueTrend[revenueTrend.length - 1].value,
        }] : []),
        ...revForecast.map(d => ({ month: d.date, revenue: null as number | null, forecast: d.value })),
      ].filter((d, i, arr) => i === 0 || d.month !== arr[i - 1].month || d.forecast !== arr[i - 1].forecast);

      // MRR growth trend
      const mrrGrowth: { month: string; mrr: number; change: number }[] = [];
      for (let i = 0; i < revenueTrend.length; i++) {
        const prevMrr = i > 0 ? revenueTrend[i - 1].value : 0;
        const change = prevMrr > 0 ? Math.round(((revenueTrend[i].value - prevMrr) / prevMrr) * 100) : 0;
        mrrGrowth.push({ month: revenueTrend[i].date, mrr: revenueTrend[i].value, change });
      }

      // Invoice status distribution
      const statusCounts: Record<string, number> = {};
      (invoices || []).forEach(inv => {
        const s = inv.status || "draft";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      const statusPie = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

      // KPIs
      const totalRevenue = paidInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const totalOutstanding = unpaidInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const collectionRate = (invoices || []).length > 0
        ? (paidInvoices.length / (invoices || []).length) * 100
        : 0;

      return {
        totalRevenue: Math.round(totalRevenue),
        totalOutstanding: Math.round(totalOutstanding),
        collectionRate: Math.round(collectionRate),
        mrr, arr,
        revenueDirection: revRegression.direction,
        revConfidence: Math.round(revRegression.r2 * 100),
        agingData,
        revenueTrend,
        revenueChartData,
        mrrGrowth,
        statusPie,
        invoiceCount: (invoices || []).length,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-4"><Skeleton className="h-72 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">{isAr ? "لا توجد بيانات إيرادات" : "No revenue data yet"}</p>
          <p className="text-xs text-muted-foreground mt-1">{isAr ? "ستظهر البيانات عند إنشاء فواتير" : "Data will appear when invoices are created"}</p>
        </CardContent>
      </Card>
    );
  }

  const kpis = [
    { icon: DollarSign, label: isAr ? "إجمالي الإيرادات" : "Total Revenue", value: formatCurrency(data.totalRevenue, language as "en" | "ar"), color: "chart-2", border: "border-s-chart-2" },
    { icon: Banknote, label: "MRR", value: formatCurrency(data.mrr, language as "en" | "ar"), color: "primary", border: "border-s-primary" },
    { icon: TrendingUp, label: "ARR", value: formatCurrency(data.arr, language as "en" | "ar"), color: "chart-4", border: "border-s-chart-4" },
    { icon: AlertTriangle, label: isAr ? "مستحقات معلقة" : "Outstanding", value: formatCurrency(data.totalOutstanding, language as "en" | "ar"), color: "chart-5", border: "border-s-chart-5" },
    { icon: Receipt, label: isAr ? "معدل التحصيل" : "Collection Rate", value: `${data.collectionRate}%`, color: "chart-3", border: "border-s-chart-3" },
  ];

  return (
    <StaggeredList className="space-y-6 mt-4" stagger={80}>
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map(k => (
          <Card key={k.label} className={`border-s-[3px] ${k.border}`}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-xl bg-${k.color}/10 p-2.5`}>
                <k.icon className={`h-5 w-5 text-${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-xl font-bold">{typeof k.value === "number" ? <AnimatedCounter value={k.value} /> : k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue + Forecast Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-chart-2" />
              {isAr ? "الإيرادات والتنبؤ" : "Revenue & Forecast"}
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-[10px] gap-1">
                {data.revenueDirection === "up" ? <TrendingUp className="h-3 w-3 text-chart-2" /> : data.revenueDirection === "down" ? <TrendingDown className="h-3 w-3 text-destructive" /> : <Target className="h-3 w-3" />}
                {isAr ? "ثقة" : "Confidence"}: {data.revConfidence}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.revenueChartData.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <DollarSign className="h-10 w-10 text-muted-foreground/20 mb-2" />
              <p className="text-sm text-muted-foreground">{isAr ? "بيانات غير كافية للتنبؤ" : "Not enough data for forecast"}</p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.revenueChartData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                    formatter={(val: number, name: string) => [formatCurrency(val, language as "en" | "ar"), name === "revenue" ? (isAr ? "إيرادات" : "Revenue") : (isAr ? "تنبؤ" : "Forecast")]}
                  />
                  <Legend formatter={v => v === "revenue" ? (isAr ? "إيرادات" : "Revenue") : (isAr ? "تنبؤ" : "Forecast")} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" fill="url(#revGrad)" strokeWidth={2} connectNulls={false} />
                  <Line type="monotone" dataKey="forecast" stroke="hsl(var(--chart-4))" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 4, fill: "hsl(var(--chart-4))" }} connectNulls={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MRR Growth + Invoice Aging */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Banknote className="h-4 w-4 text-primary" />
              {isAr ? "نمو MRR الشهري" : "MRR Growth"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.mrrGrowth.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Banknote className="h-8 w-8 text-muted-foreground/20 mb-2" />
                <p className="text-xs text-muted-foreground">{isAr ? "بيانات غير كافية" : "Not enough data"}</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.mrrGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="mrr" fill="hsl(var(--primary))" fillOpacity={0.7} radius={[4, 4, 0, 0]} name="MRR" />
                    <Line yAxisId="right" type="monotone" dataKey="change" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 3 }} name={isAr ? "تغيير %" : "Change %"} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Aging */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {isAr ? "أعمار الفواتير المعلقة" : "Invoice Aging"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.agingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(value: number) => [formatCurrency(value, language as "en" | "ar"), isAr ? "المبلغ" : "Amount"]}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {data.agingData.map((entry: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Status Pie */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            {isAr ? "توزيع حالات الفواتير" : "Invoice Status Distribution"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.statusPie.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-8 w-8 text-muted-foreground/20 mb-2" />
              <p className="text-xs text-muted-foreground">{isAr ? "لا توجد فواتير" : "No invoices yet"}</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.statusPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}>
                    {data.statusPie.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </StaggeredList>
  );
}
