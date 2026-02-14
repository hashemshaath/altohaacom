import { useState, useMemo } from "react";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  BarChart3, TrendingUp, TrendingDown, ShoppingCart, FileText,
  CreditCard, Users, Download, Calendar, Activity, Receipt, PieChart as PieIcon,
  ArrowUpRight, ArrowDownRight, Package,
} from "lucide-react";
import { format, subMonths, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay, eachMonthOfInterval, eachWeekOfInterval, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { formatCurrency } from "@/lib/currencyFormatter";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
];

const PERIODS = [
  { value: "7d", en: "Last 7 Days", ar: "آخر 7 أيام" },
  { value: "30d", en: "Last 30 Days", ar: "آخر 30 يوم" },
  { value: "90d", en: "Last 90 Days", ar: "آخر 90 يوم" },
  { value: "6m", en: "Last 6 Months", ar: "آخر 6 أشهر" },
  { value: "12m", en: "Last 12 Months", ar: "آخر 12 شهر" },
  { value: "all", en: "All Time", ar: "كل الأوقات" },
];

function getDateRange(period: string) {
  const now = new Date();
  switch (period) {
    case "7d": return { start: subDays(now, 7), end: now };
    case "30d": return { start: subDays(now, 30), end: now };
    case "90d": return { start: subDays(now, 90), end: now };
    case "6m": return { start: subMonths(now, 6), end: now };
    case "12m": return { start: subMonths(now, 12), end: now };
    default: return { start: new Date("2020-01-01"), end: now };
  }
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const bom = "\uFEFF";
  const csv = bom + [headers.join(","), ...rows.map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CompanyAnalytics() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const isAr = language === "ar";
  const [period, setPeriod] = useState("6m");
  const [activeTab, setActiveTab] = useState("overview");

  const { start, end } = useMemo(() => getDateRange(period), [period]);
  const startISO = start.toISOString();
  const endISO = end.toISOString();

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["analytics-orders", companyId, period],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("company_orders")
        .select("id, status, total_amount, currency, created_at, category, direction")
        .eq("company_id", companyId)
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .order("created_at");
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 3,
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: txnLoading } = useQuery({
    queryKey: ["analytics-txns", companyId, period],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("company_transactions")
        .select("id, type, amount, currency, transaction_date, created_at")
        .eq("company_id", companyId)
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .order("created_at");
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 3,
  });

  // Fetch invoices
  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ["analytics-invoices", companyId, period],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("invoices")
        .select("id, status, amount, currency, created_at, due_date")
        .eq("company_id", companyId)
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .order("created_at");
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 3,
  });

  const isLoading = ordersLoading || txnLoading || invLoading;

  // KPIs
  const totalOrderValue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const completedOrders = orders.filter(o => o.status === "completed").length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const totalInvoiced = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const paidInvoices = invoices.filter(i => i.status === "paid");
  const totalPaid = paidInvoices.reduce((s, i) => s + (i.amount || 0), 0);
  const outstanding = totalInvoiced - totalPaid;
  const totalPayments = transactions.filter(t => t.type === "payment").reduce((s, t) => s + (t.amount || 0), 0);

  // Monthly order trends
  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({ start, end });
    return months.map(m => {
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const monthOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= mStart && d <= mEnd;
      });
      const monthTxns = transactions.filter(t => {
        const d = new Date(t.created_at);
        return d >= mStart && d <= mEnd;
      });
      return {
        label: format(m, "MMM yy", { locale: isAr ? ar : enUS }),
        orders: monthOrders.length,
        completed: monthOrders.filter(o => o.status === "completed").length,
        revenue: monthTxns.filter(t => t.type === "payment").reduce((s, t) => s + (t.amount || 0), 0),
        volume: monthOrders.reduce((s, o) => s + (o.total_amount || 0), 0),
      };
    });
  }, [orders, transactions, start, end, isAr]);

  // Order status distribution
  const orderStatusData = useMemo(() => {
    const grouped: Record<string, number> = {};
    orders.forEach(o => {
      const s = o.status || "unknown";
      grouped[s] = (grouped[s] || 0) + 1;
    });
    return Object.entries(grouped).map(([status, count]) => ({
      name: formatStatus(status, isAr),
      value: count,
      status,
    }));
  }, [orders, isAr]);

  // Transaction type breakdown
  const txnTypeData = useMemo(() => {
    const grouped: Record<string, number> = {};
    transactions.forEach(t => {
      const key = t.type || "other";
      grouped[key] = (grouped[key] || 0) + (t.amount || 0);
    });
    return Object.entries(grouped).map(([type, amount]) => ({
      name: formatTxnType(type, isAr),
      value: Math.abs(amount),
    }));
  }, [transactions, isAr]);

  // Invoice status summary
  const invoiceStatusData = useMemo(() => {
    const grouped: Record<string, { count: number; total: number }> = {};
    invoices.forEach(inv => {
      const s = inv.status || "draft";
      if (!grouped[s]) grouped[s] = { count: 0, total: 0 };
      grouped[s].count++;
      grouped[s].total += inv.amount || 0;
    });
    return Object.entries(grouped).map(([status, val]) => ({
      name: formatInvStatus(status, isAr),
      count: val.count,
      total: val.total,
      status,
    }));
  }, [invoices, isAr]);

  // Revenue trend (area chart)
  const revenueTrend = useMemo(() => {
    let cumulative = 0;
    return monthlyData.map(m => {
      cumulative += m.revenue;
      return { ...m, cumulative };
    });
  }, [monthlyData]);

  // Export
  const handleExport = () => {
    const headers = [
      isAr ? "الشهر" : "Month",
      isAr ? "الطلبات" : "Orders",
      isAr ? "مكتملة" : "Completed",
      isAr ? "حجم الطلبات" : "Order Volume",
      isAr ? "الإيرادات" : "Revenue",
    ];
    const rows = monthlyData.map(m => [
      m.label,
      String(m.orders),
      String(m.completed),
      String(m.volume),
      String(m.revenue),
    ]);
    downloadCSV(`analytics-${period}.csv`, headers, rows);
  };

  const tooltipStyle = {
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--popover-foreground))",
    fontSize: 12,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{isAr ? "التحليلات" : "Analytics"}</h1>
            <p className="text-sm text-muted-foreground">
              {isAr ? "رؤى شاملة لأداء شركتك" : "Comprehensive insights into your company performance"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="me-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map(p => (
                <SelectItem key={p.value} value={p.value}>
                  {isAr ? p.ar : p.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoading}>
            <Download className="me-1.5 h-4 w-4" />
            {isAr ? "تصدير" : "Export"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard
          icon={ShoppingCart}
          label={isAr ? "إجمالي الطلبات" : "Total Orders"}
          value={orders.length}
          sub={`${completedOrders} ${isAr ? "مكتمل" : "completed"}, ${pendingOrders} ${isAr ? "قيد الانتظار" : "pending"}`}
          accent="text-primary"
          isLoading={isLoading}
        />
        <KPICard
          icon={CreditCard}
          label={isAr ? "حجم الطلبات" : "Order Volume"}
          value={formatCurrency(totalOrderValue, language as "en" | "ar")}
          accent="text-chart-3"
          isLoading={isLoading}
        />
        <KPICard
          icon={Receipt}
          label={isAr ? "إجمالي الفواتير" : "Total Invoiced"}
          value={formatCurrency(totalInvoiced, language as "en" | "ar")}
          sub={`${invoices.length} ${isAr ? "فاتورة" : "invoices"}`}
          accent="text-chart-4"
          isLoading={isLoading}
        />
        <KPICard
          icon={TrendingUp}
          label={isAr ? "المدفوعات" : "Payments"}
          value={formatCurrency(totalPaid, language as "en" | "ar")}
          sub={outstanding > 0 ? `${formatCurrency(outstanding, language as "en" | "ar")} ${isAr ? "مستحق" : "outstanding"}` : undefined}
          accent="text-chart-5"
          isLoading={isLoading}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{isAr ? "نظرة عامة" : "Overview"}</TabsTrigger>
          <TabsTrigger value="orders">{isAr ? "الطلبات" : "Orders"}</TabsTrigger>
          <TabsTrigger value="financial">{isAr ? "المالية" : "Financial"}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Order Trends */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                  <BarChart3 className="h-3.5 w-3.5 text-primary" />
                </div>
                {isAr ? "اتجاه الطلبات" : "Order Trends"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[240px] w-full" /> : monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="orders" name={isAr ? "الطلبات" : "Orders"} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name={isAr ? "مكتملة" : "Completed"} fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart isAr={isAr} />}
            </CardContent>
          </Card>

          {/* Revenue Area Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-5/10">
                  <TrendingUp className="h-3.5 w-3.5 text-chart-5" />
                </div>
                {isAr ? "الإيرادات التراكمية" : "Cumulative Revenue"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[240px] w-full" /> : revenueTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`SAR ${v.toLocaleString()}`, ""]} />
                    <Area type="monotone" dataKey="cumulative" stroke="hsl(var(--chart-5))" fill="url(#revenueGradient)" strokeWidth={2} name={isAr ? "تراكمي" : "Cumulative"} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <EmptyChart isAr={isAr} />}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Order Status Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-4/10">
                  <PieIcon className="h-3.5 w-3.5 text-chart-4" />
                </div>
                {isAr ? "توزيع حالات الطلبات" : "Order Status Distribution"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[260px] w-full" /> : orderStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name">
                      {orderStatusData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart isAr={isAr} />}
            </CardContent>
          </Card>

          {/* Monthly Order Volume */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                  <Package className="h-3.5 w-3.5 text-primary" />
                </div>
                {isAr ? "حجم الطلبات الشهري" : "Monthly Order Volume"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[260px] w-full" /> : monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`SAR ${v.toLocaleString()}`, ""]} />
                    <Line type="monotone" dataKey="volume" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} name={isAr ? "حجم الطلبات" : "Volume"} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyChart isAr={isAr} />}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === "financial" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Transaction Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-3/10">
                  <PieIcon className="h-3.5 w-3.5 text-chart-3" />
                </div>
                {isAr ? "توزيع المعاملات" : "Transaction Breakdown"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[260px] w-full" /> : txnTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={txnTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name">
                      {txnTypeData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`SAR ${v.toLocaleString()}`, ""]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart isAr={isAr} />}
            </CardContent>
          </Card>

          {/* Invoice Status Bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-4/10">
                  <Receipt className="h-3.5 w-3.5 text-chart-4" />
                </div>
                {isAr ? "ملخص الفواتير" : "Invoice Summary"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[260px] w-full" /> : invoiceStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={invoiceStatusData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" name={isAr ? "العدد" : "Count"} fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total" name={isAr ? "المبلغ" : "Amount"} fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart isAr={isAr} />}
            </CardContent>
          </Card>

          {/* Monthly Revenue Bar */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-5/10">
                  <BarChart3 className="h-3.5 w-3.5 text-chart-5" />
                </div>
                {isAr ? "الإيرادات الشهرية" : "Monthly Revenue"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[220px] w-full" /> : monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`SAR ${v.toLocaleString()}`, ""]} />
                    <Bar dataKey="revenue" name={isAr ? "الإيرادات" : "Revenue"} fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="volume" name={isAr ? "حجم الطلبات" : "Order Volume"} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart isAr={isAr} />}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, accent, isLoading }: {
  icon: any; label: string; value: string | number; sub?: string; accent: string; isLoading: boolean;
}) {
  return (
    <Card className="animate-fade-in transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-7 w-20" />
            ) : (
              <>
                <p className="mt-1 text-lg font-bold truncate">{value}</p>
                {sub && <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{sub}</p>}
              </>
            )}
          </div>
          <div className="rounded-xl bg-muted p-2 shrink-0">
            <Icon className={`h-4 w-4 ${accent}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ isAr }: { isAr: boolean }) {
  return (
    <div className="flex h-[200px] items-center justify-center">
      <p className="text-sm text-muted-foreground">
        {isAr ? "لا توجد بيانات متاحة بعد" : "No data available yet"}
      </p>
    </div>
  );
}

function formatStatus(s: string, isAr: boolean) {
  const m: Record<string, [string, string]> = {
    pending: ["Pending", "قيد الانتظار"],
    approved: ["Approved", "معتمد"],
    processing: ["Processing", "قيد المعالجة"],
    completed: ["Completed", "مكتمل"],
    cancelled: ["Cancelled", "ملغي"],
    rejected: ["Rejected", "مرفوض"],
  };
  return (m[s] || [s, s])[isAr ? 1 : 0];
}

function formatTxnType(t: string, isAr: boolean) {
  const m: Record<string, [string, string]> = {
    payment: ["Payment", "دفع"],
    invoice: ["Invoice", "فاتورة"],
    credit: ["Credit", "رصيد"],
    debit: ["Debit", "خصم"],
    refund: ["Refund", "استرداد"],
    adjustment: ["Adjustment", "تسوية"],
    other: ["Other", "أخرى"],
  };
  return (m[t] || m.other)[isAr ? 1 : 0];
}

function formatInvStatus(s: string, isAr: boolean) {
  const m: Record<string, [string, string]> = {
    draft: ["Draft", "مسودة"],
    sent: ["Sent", "مرسلة"],
    paid: ["Paid", "مدفوعة"],
    overdue: ["Overdue", "متأخرة"],
    cancelled: ["Cancelled", "ملغية"],
  };
  return (m[s] || [s, s])[isAr ? 1 : 0];
}
