import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Receipt, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export const RevenueAnalyticsWidget = memo(function RevenueAnalyticsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["revenue-analytics-30d"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      const [invoices, transactions] = await Promise.all([
        supabase.from("invoices")
          .select("id, amount, currency, status, created_at")
          .gte("created_at", thirtyDaysAgo)
          .order("created_at", { ascending: true }),
        supabase.from("company_transactions")
          .select("id, amount, type, created_at")
          .gte("created_at", thirtyDaysAgo)
          .order("created_at", { ascending: true }),
      ]);

      const invData = invoices.data || [];
      const txnData = transactions.data || [];

      // Daily revenue
      const dailyMap: Record<string, { revenue: number; expenses: number; day: string }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const key = format(d, "yyyy-MM-dd");
        dailyMap[key] = { revenue: 0, expenses: 0, day: format(d, "MMM dd") };
      }

      txnData.forEach(t => {
        const key = format(new Date(t.created_at), "yyyy-MM-dd");
        if (dailyMap[key]) {
          if (t.type === "payment" || t.type === "credit") {
            dailyMap[key].revenue += Number(t.amount) || 0;
          } else {
            dailyMap[key].expenses += Number(t.amount) || 0;
          }
        }
      });

      const chartData = Object.values(dailyMap);

      // KPIs
      const totalRevenue = txnData
        .filter(t => t.type === "payment" || t.type === "credit")
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);

      const totalExpenses = txnData
        .filter(t => t.type !== "payment" && t.type !== "credit")
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);

      const paidInvoices = invData.filter(i => i.status === "paid").length;
      const totalInvoices = invData.length;
      const overdueInvoices = invData.filter(i => i.status === "overdue").length;

      // Invoice status distribution
      const statusDist = invData.reduce((acc, inv) => {
        acc[inv.status || "draft"] = (acc[inv.status || "draft"] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusChartData = Object.entries(statusDist).map(([name, value]) => ({ name, value }));

      return {
        chartData,
        totalRevenue,
        totalExpenses,
        netFlow: totalRevenue - totalExpenses,
        paidInvoices,
        totalInvoices,
        overdueInvoices,
        collectionRate: totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0,
        statusChartData,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return <Skeleton className="h-72 w-full rounded-xl" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          {isAr ? "التحليلات المالية" : "Revenue Analytics"}
          <Badge variant="outline" className="text-[10px] ms-auto">30 {isAr ? "يوم" : "days"}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2.5 rounded-xl bg-muted/50 text-center group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
            <TrendingUp className="h-3.5 w-3.5 mx-auto mb-1 text-chart-2 transition-transform duration-300 group-hover:scale-110" />
            <p className="text-sm font-bold"><AnimatedCounter value={data?.totalRevenue || 0} /> SAR</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "الإيرادات" : "Revenue"}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/50 text-center group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
            <ArrowDownRight className="h-3.5 w-3.5 mx-auto mb-1 text-destructive transition-transform duration-300 group-hover:scale-110" />
            <p className="text-sm font-bold"><AnimatedCounter value={data?.totalExpenses || 0} /> SAR</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "المصروفات" : "Expenses"}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/50 text-center group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
            {(data?.netFlow || 0) >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5 mx-auto mb-1 text-chart-2" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 mx-auto mb-1 text-destructive" />
            )}
            <p className={cn("text-sm font-bold", (data?.netFlow || 0) >= 0 ? "text-chart-2" : "text-destructive")}>
              <AnimatedCounter value={data?.netFlow || 0} /> SAR
            </p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "صافي التدفق" : "Net Flow"}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/50 text-center group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
            <Receipt className="h-3.5 w-3.5 mx-auto mb-1 text-chart-4 transition-transform duration-300 group-hover:scale-110" />
            <p className="text-sm font-bold"><AnimatedCounter value={data?.collectionRate || 0} suffix="%" /></p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "التحصيل" : "Collection"}</p>
          </div>
        </div>

        <Tabs defaultValue="revenue">
          <TabsList className="w-full h-8">
            <TabsTrigger value="revenue" className="text-xs flex-1">{isAr ? "الإيرادات" : "Revenue"}</TabsTrigger>
            <TabsTrigger value="invoices" className="text-xs flex-1">{isAr ? "الفواتير" : "Invoices"}</TabsTrigger>
          </TabsList>
          <TabsContent value="revenue" className="mt-3">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.chartData || []}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={6} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" fill="url(#revGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="invoices" className="mt-3">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.statusChartData || []}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>

        {/* Alerts */}
        {(data?.overdueInvoices || 0) > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-destructive/10 text-destructive text-xs">
            <CreditCard className="h-3.5 w-3.5" />
            {data?.overdueInvoices} {isAr ? "فاتورة متأخرة تحتاج متابعة" : "overdue invoices need attention"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
