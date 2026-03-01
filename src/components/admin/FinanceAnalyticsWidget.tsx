import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, Cell } from "recharts";
import { DollarSign, TrendingUp, FileText, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export function FinanceAnalyticsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: financeData } = useQuery({
    queryKey: ["finance-analytics-overview"],
    queryFn: async () => {
      const [invoicesRes, ordersRes, transactionsRes] = await Promise.all([
        supabase.from("invoices").select("id, status, amount, currency, created_at, paid_at, due_date"),
        supabase.from("company_orders").select("id, status, total_amount, currency, created_at"),
        supabase.from("company_transactions").select("id, type, amount, created_at"),
      ]);

      const invoices = invoicesRes.data || [];
      const orders = ordersRes.data || [];
      const transactions = transactionsRes.data || [];

      // Invoice summary
      const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount || 0), 0);
      const pendingAmount = invoices.filter(i => ["sent", "pending"].includes(i.status || "")).reduce((s, i) => s + Number(i.amount || 0), 0);
      const overdueCount = invoices.filter(i => i.due_date && new Date(i.due_date) < new Date() && !["paid", "cancelled"].includes(i.status || "")).length;
      const collectionRate = invoices.length > 0 ? Math.round((invoices.filter(i => i.status === "paid").length / invoices.length) * 100) : 0;

      // Monthly revenue (last 6 months)
      const monthlyRevenue: { month: string; revenue: number; invoices: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const start = startOfMonth(d).toISOString();
        const end = endOfMonth(d).toISOString();
        const monthInvoices = invoices.filter(inv =>
          inv.paid_at && inv.paid_at >= start && inv.paid_at <= end
        );
        monthlyRevenue.push({
          month: format(d, "MMM"),
          revenue: monthInvoices.reduce((s, inv) => s + Number(inv.amount || 0), 0),
          invoices: monthInvoices.length,
        });
      }

      // Invoice status distribution
      const statusDist: Record<string, number> = {};
      invoices.forEach(i => {
        const s = i.status || "draft";
        statusDist[s] = (statusDist[s] || 0) + 1;
      });

      // Order stats
      const totalOrderValue = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
      const activeOrders = orders.filter(o => !["completed", "cancelled"].includes(o.status || "")).length;

      return {
        totalRevenue, pendingAmount, overdueCount, collectionRate,
        monthlyRevenue, statusDist, totalOrderValue, activeOrders,
        totalInvoices: invoices.length, totalOrders: orders.length,
        totalTransactions: transactions.length,
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  const statusColors: Record<string, string> = {
    paid: "hsl(var(--chart-2))",
    sent: "hsl(var(--primary))",
    pending: "hsl(var(--chart-4))",
    draft: "hsl(var(--muted-foreground))",
    overdue: "hsl(var(--destructive))",
    cancelled: "hsl(var(--muted-foreground))",
  };

  if (!financeData) return null;

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: isAr ? "إجمالي الإيرادات" : "Total Revenue", value: `${toEnglishDigits(financeData.totalRevenue.toLocaleString())} SAR`, icon: DollarSign, color: "text-chart-2", bg: "bg-chart-2/10" },
          { label: isAr ? "مبالغ معلقة" : "Pending Amount", value: `${toEnglishDigits(financeData.pendingAmount.toLocaleString())} SAR`, icon: Clock, color: "text-chart-4", bg: "bg-chart-4/10" },
          { label: isAr ? "معدل التحصيل" : "Collection Rate", value: `${financeData.collectionRate}%`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
          { label: isAr ? "فواتير متأخرة" : "Overdue Invoices", value: financeData.overdueCount.toString(), icon: AlertCircle, color: financeData.overdueCount > 0 ? "text-destructive" : "text-chart-2", bg: financeData.overdueCount > 0 ? "bg-destructive/10" : "bg-chart-2/10" },
        ].map((kpi, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="flex items-center gap-3 py-4">
              <div className={cn("rounded-xl p-2.5", kpi.bg)}>
                <kpi.icon className={cn("h-4 w-4", kpi.color)} />
              </div>
              <div>
                <AnimatedCounter value={typeof kpi.value === "number" ? kpi.value : Number(kpi.value) || 0} className={cn("text-lg font-bold", kpi.color)} />
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-chart-2" />
              {isAr ? "اتجاه الإيرادات (6 أشهر)" : "Revenue Trend (6 months)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={financeData.monthlyRevenue}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString()} SAR`} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Invoice Status Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {isAr ? "توزيع حالة الفواتير" : "Invoice Status Distribution"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(financeData.statusDist).map(([status, count]) => {
                const pct = financeData.totalInvoices > 0 ? Math.round((count / financeData.totalInvoices) * 100) : 0;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColors[status] || "hsl(var(--muted))" }} />
                        <span className="capitalize">{status}</span>
                      </div>
                      <span className="font-medium">{count} ({pct}%)</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3">
              <div className="text-center">
                <AnimatedCounter value={financeData.totalOrders} className="text-lg font-bold text-primary" />
                <p className="text-[10px] text-muted-foreground">{isAr ? "إجمالي الطلبات" : "Total Orders"}</p>
              </div>
              <div className="text-center">
                <AnimatedCounter value={financeData.activeOrders} className="text-lg font-bold text-chart-4" />
                <p className="text-[10px] text-muted-foreground">{isAr ? "طلبات نشطة" : "Active Orders"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
