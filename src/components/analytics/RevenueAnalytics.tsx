import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, AlertTriangle, TrendingUp, Receipt, CalendarClock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
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
    queryKey: ["admin-revenue-analytics"],
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
      const totalWalletBalance = (wallets || []).reduce((s, w) => s + (Number(w.balance) || 0), 0);
      const collectionRate = (invoices || []).length > 0
        ? (paidInvoices.length / (invoices || []).length) * 100
        : 0;

      return {
        totalRevenue: Math.round(totalRevenue),
        totalOutstanding: Math.round(totalOutstanding),
        totalWalletBalance: Math.round(totalWalletBalance),
        collectionRate: Math.round(collectionRate),
        agingData,
        revenueTrend,
        statusPie,
        invoiceCount: (invoices || []).length,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}><CardContent className="p-4"><div className="h-20 animate-pulse bg-muted rounded" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const kpis = [
    { icon: DollarSign, label: isAr ? "إجمالي الإيرادات" : "Total Revenue", value: formatCurrency(data.totalRevenue, language as "en" | "ar"), color: "text-chart-2", bg: "bg-chart-2/10", border: "border-s-chart-2" },
    { icon: AlertTriangle, label: isAr ? "مستحقات معلقة" : "Outstanding", value: formatCurrency(data.totalOutstanding, language as "en" | "ar"), color: "text-chart-5", bg: "bg-chart-5/10", border: "border-s-chart-5" },
    { icon: Receipt, label: isAr ? "معدل التحصيل" : "Collection Rate", value: `${data.collectionRate}%`, color: "text-primary", bg: "bg-primary/10", border: "border-s-primary" },
    { icon: CalendarClock, label: isAr ? "إجمالي الفواتير" : "Total Invoices", value: data.invoiceCount, color: "text-chart-4", bg: "bg-chart-4/10", border: "border-s-chart-4" },
  ];

  return (
    <StaggeredList className="space-y-6" stagger={80}>
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(k => (
          <Card key={k.label} className={`border-s-[3px] ${k.border}`}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-xl ${k.bg} p-2.5`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-xl font-bold">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Forecast */}
      <TrendForecastChart
        title={isAr ? "تنبؤ الإيرادات" : "Revenue Forecast"}
        data={data.revenueTrend}
        isLoading={false}
        icon={TrendingUp}
        color="chart-2"
      />

      <div className="grid gap-6 md:grid-cols-2">
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

        {/* Invoice Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              {isAr ? "حالات الفواتير" : "Invoice Status"}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </StaggeredList>
  );
}
