import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  TrendingUp, TrendingDown, DollarSign, Target, Wallet,
  ArrowUpRight, ArrowDownRight, Scale, PiggyBank, BarChart3,
} from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, Legend, ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/currencyFormatter";
import { format, subMonths, eachMonthOfInterval, startOfMonth } from "date-fns";
import { ar } from "date-fns/locale";

export function FinancialForecasting() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [forecastMonths, setForecastMonths] = useState("6");

  const { data, isLoading } = useQuery({
    queryKey: ["financial-forecasting"],
    queryFn: async () => {
      const [
        { data: invoices },
        { data: transactions },
        { data: orders },
        { data: shopOrders },
      ] = await Promise.all([
        supabase.from("invoices").select("amount, status, created_at, paid_at").order("created_at"),
        supabase.from("company_transactions").select("amount, type, created_at").order("created_at"),
        supabase.from("company_orders").select("total_amount, status, created_at, category"),
        supabase.from("shop_orders").select("total_amount, status, created_at"),
      ]);

      // Monthly revenue from paid invoices
      const monthlyRevenue: Record<string, number> = {};
      const monthlyExpenses: Record<string, number> = {};

      (invoices || []).filter(i => i.status === "paid").forEach(inv => {
        const month = (inv.paid_at || inv.created_at)?.substring(0, 7) || "";
        if (month) monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (Number(inv.amount) || 0);
      });

      // Shop order revenue
      (shopOrders || []).filter(o => o.status === "confirmed" || o.status === "shipped").forEach(o => {
        const month = o.created_at?.substring(0, 7) || "";
        if (month) monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (Number(o.total_amount) || 0);
      });

      // Transactions as expenses (debits)
      (transactions || []).forEach(t => {
        const month = t.created_at?.substring(0, 7) || "";
        if (month) {
          if (["invoice", "debit"].includes(t.type || "")) {
            monthlyExpenses[month] = (monthlyExpenses[month] || 0) + (Number(t.amount) || 0);
          }
        }
      });

      // Build historical data
      const allMonths = new Set([...Object.keys(monthlyRevenue), ...Object.keys(monthlyExpenses)]);
      const sortedMonths = Array.from(allMonths).sort().slice(-12);

      const historicalData = sortedMonths.map(month => ({
        month,
        label: month.slice(5),
        revenue: Math.round(monthlyRevenue[month] || 0),
        expenses: Math.round(monthlyExpenses[month] || 0),
        profit: Math.round((monthlyRevenue[month] || 0) - (monthlyExpenses[month] || 0)),
      }));

      // Simple linear forecast
      const revenueValues = historicalData.map(d => d.revenue);
      const expenseValues = historicalData.map(d => d.expenses);

      const avgRevGrowth = revenueValues.length > 1
        ? revenueValues.slice(1).reduce((sum, v, i) => sum + (v - revenueValues[i]), 0) / (revenueValues.length - 1)
        : 0;
      const avgExpGrowth = expenseValues.length > 1
        ? expenseValues.slice(1).reduce((sum, v, i) => sum + (v - expenseValues[i]), 0) / (expenseValues.length - 1)
        : 0;

      const lastRev = revenueValues[revenueValues.length - 1] || 0;
      const lastExp = expenseValues[expenseValues.length - 1] || 0;

      // Budget categories from orders
      const categoryBudgets: Record<string, { spent: number; budget: number }> = {};
      (orders || []).forEach(o => {
        const cat = o.category || "other";
        if (!categoryBudgets[cat]) categoryBudgets[cat] = { spent: 0, budget: 0 };
        categoryBudgets[cat].spent += Number(o.total_amount) || 0;
      });

      // Set budgets as 120% of spent (simulated targets)
      Object.keys(categoryBudgets).forEach(cat => {
        categoryBudgets[cat].budget = Math.round(categoryBudgets[cat].spent * 1.2);
        categoryBudgets[cat].spent = Math.round(categoryBudgets[cat].spent);
      });

      const totalRevenue = revenueValues.reduce((a, b) => a + b, 0);
      const totalExpenses = expenseValues.reduce((a, b) => a + b, 0);

      return {
        historicalData,
        avgRevGrowth: Math.round(avgRevGrowth),
        avgExpGrowth: Math.round(avgExpGrowth),
        lastRev,
        lastExp,
        categoryBudgets,
        totalRevenue: Math.round(totalRevenue),
        totalExpenses: Math.round(totalExpenses),
        netProfit: Math.round(totalRevenue - totalExpenses),
        profitMargin: totalRevenue > 0 ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100) : 0,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  // Generate forecast data
  const forecastData = useMemo(() => {
    if (!data) return [];
    const months = parseInt(forecastMonths);
    const forecast = [];
    for (let i = 1; i <= months; i++) {
      const nextDate = format(subMonths(new Date(), -i), "yyyy-MM");
      const rev = Math.max(0, Math.round(data.lastRev + data.avgRevGrowth * i));
      const exp = Math.max(0, Math.round(data.lastExp + data.avgExpGrowth * i));
      forecast.push({
        month: nextDate,
        label: nextDate.slice(5),
        forecastRevenue: rev,
        forecastExpenses: exp,
        forecastProfit: rev - exp,
      });
    }
    return forecast;
  }, [data, forecastMonths]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return [
      ...data.historicalData.map(d => ({ ...d, forecastRevenue: null as number | null, forecastExpenses: null as number | null })),
      // Bridge point
      ...(data.historicalData.length > 0 ? [{
        month: data.historicalData[data.historicalData.length - 1].month,
        label: data.historicalData[data.historicalData.length - 1].label,
        revenue: data.historicalData[data.historicalData.length - 1].revenue,
        expenses: data.historicalData[data.historicalData.length - 1].expenses,
        profit: data.historicalData[data.historicalData.length - 1].profit,
        forecastRevenue: data.historicalData[data.historicalData.length - 1].revenue,
        forecastExpenses: data.historicalData[data.historicalData.length - 1].expenses,
      }] : []),
      ...forecastData.map(d => ({
        month: d.month,
        label: d.label,
        revenue: null as number | null,
        expenses: null as number | null,
        profit: null as number | null,
        forecastRevenue: d.forecastRevenue,
        forecastExpenses: d.forecastExpenses,
      })),
    ];
  }, [data, forecastData]);

  const kpis = [
    { label: isAr ? "إجمالي الإيرادات" : "Total Revenue", value: formatCurrency(data?.totalRevenue || 0, language as "en" | "ar"), icon: DollarSign, trend: "up" as const },
    { label: isAr ? "إجمالي المصروفات" : "Total Expenses", value: formatCurrency(data?.totalExpenses || 0, language as "en" | "ar"), icon: Wallet, trend: "neutral" as const },
    { label: isAr ? "صافي الربح" : "Net Profit", value: formatCurrency(data?.netProfit || 0, language as "en" | "ar"), icon: PiggyBank, trend: (data?.netProfit || 0) >= 0 ? "up" as const : "down" as const },
    { label: isAr ? "هامش الربح" : "Profit Margin", value: `${data?.profitMargin || 0}%`, icon: Target, trend: (data?.profitMargin || 0) >= 20 ? "up" as const : "down" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{isAr ? "التنبؤ المالي" : "Financial Forecasting"}</h3>
          <p className="text-sm text-muted-foreground">
            {isAr ? "تتبع الميزانية مع تنبؤات الإيرادات والمصروفات" : "Budget tracking with revenue & expense projections"}
          </p>
        </div>
        <Select value={forecastMonths} onValueChange={setForecastMonths}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">{isAr ? "٣ أشهر" : "3 months"}</SelectItem>
            <SelectItem value="6">{isAr ? "٦ أشهر" : "6 months"}</SelectItem>
            <SelectItem value="12">{isAr ? "١٢ شهر" : "12 months"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{typeof kpi.value === "number" ? <AnimatedCounter value={kpi.value} /> : kpi.value}</p>
                <div className={`flex items-center gap-1 mt-1 text-xs ${kpi.trend === "up" ? "text-chart-5" : kpi.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                  {kpi.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : kpi.trend === "down" ? <ArrowDownRight className="h-3 w-3" /> : <Scale className="h-3 w-3" />}
                  {isAr ? "آخر 12 شهر" : "Last 12 months"}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue vs Expenses + Forecast */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {isAr ? "الإيرادات مقابل المصروفات (مع التنبؤ)" : "Revenue vs Expenses (with Forecast)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                  formatter={(v: number, name: string) => [formatCurrency(v, language as "en" | "ar"), name]}
                />
                <Legend />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Bar dataKey="revenue" fill="hsl(var(--chart-2))" fillOpacity={0.8} radius={[4, 4, 0, 0]} name={isAr ? "إيرادات" : "Revenue"} />
                <Bar dataKey="expenses" fill="hsl(var(--destructive))" fillOpacity={0.5} radius={[4, 4, 0, 0]} name={isAr ? "مصروفات" : "Expenses"} />
                <Line type="monotone" dataKey="forecastRevenue" stroke="hsl(var(--chart-4))" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} name={isAr ? "تنبؤ الإيرادات" : "Rev Forecast"} connectNulls={false} />
                <Line type="monotone" dataKey="forecastExpenses" stroke="hsl(var(--chart-3))" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} name={isAr ? "تنبؤ المصروفات" : "Exp Forecast"} connectNulls={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Budget Tracking by Category */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            {isAr ? "تتبع الميزانية حسب الفئة" : "Budget Tracking by Category"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data && Object.keys(data.categoryBudgets).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                  <TableHead className="text-end">{isAr ? "المنفق" : "Spent"}</TableHead>
                  <TableHead className="text-end">{isAr ? "الميزانية" : "Budget"}</TableHead>
                  <TableHead>{isAr ? "التقدم" : "Progress"}</TableHead>
                  <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(data.categoryBudgets).map(([cat, { spent, budget }]) => {
                  const pct = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
                  const overBudget = spent > budget;
                  return (
                    <TableRow key={cat}>
                      <TableCell className="font-medium capitalize">{cat}</TableCell>
                      <TableCell className="text-end">{formatCurrency(spent, language as "en" | "ar")}</TableCell>
                      <TableCell className="text-end text-muted-foreground">{formatCurrency(budget, language as "en" | "ar")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-10">{pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {overBudget ? (
                          <Badge className="bg-destructive/10 text-destructive border-destructive/20">{isAr ? "تجاوز" : "Over"}</Badge>
                        ) : pct >= 80 ? (
                          <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20">{isAr ? "تحذير" : "Warning"}</Badge>
                        ) : (
                          <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">{isAr ? "طبيعي" : "On Track"}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
              <Target className="h-8 w-8 text-muted-foreground/30 mb-2" />
              {isAr ? "لا توجد بيانات ميزانية" : "No budget data available"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forecast Summary Table */}
      {forecastData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-chart-4" />
              {isAr ? "ملخص التنبؤ" : "Forecast Summary"}
              <Badge variant="outline" className="text-[10px]">
                {isAr ? `${forecastMonths} أشهر` : `${forecastMonths} months`}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? "الشهر" : "Month"}</TableHead>
                  <TableHead className="text-end">{isAr ? "إيرادات متوقعة" : "Projected Revenue"}</TableHead>
                  <TableHead className="text-end">{isAr ? "مصروفات متوقعة" : "Projected Expenses"}</TableHead>
                  <TableHead className="text-end">{isAr ? "ربح متوقع" : "Projected Profit"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecastData.map(f => (
                  <TableRow key={f.month}>
                    <TableCell className="font-medium">{f.month}</TableCell>
                    <TableCell className="text-end">{formatCurrency(f.forecastRevenue, language as "en" | "ar")}</TableCell>
                    <TableCell className="text-end">{formatCurrency(f.forecastExpenses, language as "en" | "ar")}</TableCell>
                    <TableCell className={`text-end font-medium ${f.forecastProfit >= 0 ? "text-chart-5" : "text-destructive"}`}>
                      {formatCurrency(f.forecastProfit, language as "en" | "ar")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
