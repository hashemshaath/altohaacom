import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { BarChart3, PieChart as PieIcon, TrendingUp, Receipt } from "lucide-react";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
];

interface CompanyAnalyticsChartsProps {
  companyId: string | null;
  language: string;
}

export function CompanyAnalyticsCharts({ companyId, language }: CompanyAnalyticsChartsProps) {
  const isAr = language === "ar";

  const { data: monthlyOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["company-monthly-orders", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const months: { month: string; label: string; orders: number; completed: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date).toISOString();
        const end = endOfMonth(date).toISOString();
        const { data } = await supabase
          .from("company_orders")
          .select("id, status")
          .eq("company_id", companyId)
          .gte("created_at", start)
          .lte("created_at", end);
        months.push({
          month: format(date, "yyyy-MM"),
          label: format(date, "MMM"),
          orders: data?.length || 0,
          completed: data?.filter(o => o.status === "completed").length || 0,
        });
      }
      return months;
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["company-revenue-breakdown", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("company_transactions")
        .select("type, amount")
        .eq("company_id", companyId);
      if (!data) return [];
      const grouped: Record<string, number> = {};
      data.forEach(t => {
        const key = t.type || "other";
        grouped[key] = (grouped[key] || 0) + (t.amount || 0);
      });
      return Object.entries(grouped).map(([type, amount]) => ({
        name: formatType(type, isAr),
        value: Math.abs(amount),
        type,
      }));
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });

  const { data: invoiceStats, isLoading: invoiceLoading } = useQuery({
    queryKey: ["company-invoice-stats", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("invoices")
        .select("status, amount")
        .eq("company_id", companyId);
      if (!data) return [];
      const grouped: Record<string, { count: number; total: number }> = {};
      data.forEach(inv => {
        const s = inv.status || "draft";
        if (!grouped[s]) grouped[s] = { count: 0, total: 0 };
        grouped[s].count++;
        grouped[s].total += inv.amount || 0;
      });
      return Object.entries(grouped).map(([status, val]) => ({
        name: formatInvoiceStatus(status, isAr),
        count: val.count,
        total: val.total,
        status,
      }));
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Order Trends */}
      <Card className="animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "اتجاه الطلبات (6 أشهر)" : "Order Trends (6 Months)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : monthlyOrders && monthlyOrders.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyOrders} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--popover-foreground))",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="orders" name={isAr ? "الطلبات" : "Orders"} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name={isAr ? "مكتملة" : "Completed"} fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart isAr={isAr} />
          )}
        </CardContent>
      </Card>

      {/* Transaction Breakdown */}
      <Card className="animate-fade-in" style={{ animationDelay: "0.05s" }}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-4/10">
              <PieIcon className="h-3.5 w-3.5 text-chart-4" />
            </div>
            {isAr ? "توزيع المعاملات" : "Transaction Breakdown"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenueLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : revenueData && revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {revenueData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--popover-foreground))",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`SAR ${value.toLocaleString()}`, ""]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart isAr={isAr} />
          )}
        </CardContent>
      </Card>

      {/* Invoice Status */}
      <Card className="animate-fade-in lg:col-span-2" style={{ animationDelay: "0.1s" }}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-5/10">
              <Receipt className="h-3.5 w-3.5 text-chart-5" />
            </div>
            {isAr ? "ملخص الفواتير" : "Invoice Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoiceLoading ? (
            <Skeleton className="h-[180px] w-full" />
          ) : invoiceStats && invoiceStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={invoiceStats} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} className="fill-muted-foreground" width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--popover-foreground))",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" name={isAr ? "العدد" : "Count"} fill="hsl(var(--chart-5))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart isAr={isAr} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart({ isAr }: { isAr: boolean }) {
  return (
    <div className="flex h-[180px] items-center justify-center">
      <p className="text-sm text-muted-foreground">
        {isAr ? "لا توجد بيانات متاحة بعد" : "No data available yet"}
      </p>
    </div>
  );
}

function formatType(type: string, isAr: boolean): string {
  const map: Record<string, [string, string]> = {
    payment: ["Payment", "دفع"],
    invoice: ["Invoice", "فاتورة"],
    credit: ["Credit", "رصيد"],
    debit: ["Debit", "خصم"],
    refund: ["Refund", "استرداد"],
    adjustment: ["Adjustment", "تسوية"],
    other: ["Other", "أخرى"],
  };
  return (map[type] || map.other)[isAr ? 1 : 0];
}

function formatInvoiceStatus(status: string, isAr: boolean): string {
  const map: Record<string, [string, string]> = {
    draft: ["Draft", "مسودة"],
    sent: ["Sent", "مرسلة"],
    paid: ["Paid", "مدفوعة"],
    overdue: ["Overdue", "متأخرة"],
    cancelled: ["Cancelled", "ملغية"],
  };
  return (map[status] || [status, status])[isAr ? 1 : 0];
}
