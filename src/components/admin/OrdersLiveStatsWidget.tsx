import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, DollarSign, Clock, CheckCircle, TrendingUp, FileText, ShoppingBag, ArrowUpDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { format, subDays } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export const OrdersLiveStatsWidget = memo(function OrdersLiveStatsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["ordersLiveStats"],
    queryFn: async () => {
      const [ordersRes, shopRes, invoicesRes] = await Promise.all([
        supabase.from("company_orders").select("id, status, total_amount, currency, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("shop_orders").select("id, status, total_amount, currency, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("invoices").select("id, status, amount, currency, created_at").order("created_at", { ascending: false }).limit(500),
      ]);

      const orders = ordersRes.data || [];
      const shopOrders = shopRes.data || [];
      const invoices = invoicesRes.data || [];

      const totalOrders = orders.length + shopOrders.length;
      const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "draft").length + shopOrders.filter(o => o.status === "pending").length;
      const completedOrders = orders.filter(o => o.status === "approved").length + shopOrders.filter(o => o.status === "delivered").length;

      // Revenue
      const orderRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
      const shopRevenue = shopOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
      const totalRevenue = orderRevenue + shopRevenue;

      // Invoice stats
      const paidInvoices = invoices.filter(i => i.status === "paid").length;
      const unpaidInvoices = invoices.filter(i => i.status === "sent" || i.status === "overdue").length;
      const invoiceTotal = invoices.reduce((s, i) => s + (i.amount || 0), 0);

      // 14-day trend
      const trend: Record<string, { orders: number; revenue: number }> = {};
      for (let i = 13; i >= 0; i--) {
        trend[format(subDays(new Date(), i), "MM/dd")] = { orders: 0, revenue: 0 };
      }
      [...orders, ...shopOrders].forEach(o => {
        const d = format(new Date(o.created_at), "MM/dd");
        if (d in trend) {
          trend[d].orders++;
          trend[d].revenue += (o.total_amount || 0);
        }
      });
      const trendData = Object.entries(trend).map(([date, v]) => ({ date, ...v }));

      // Status breakdown
      const statusMap: Record<string, number> = {};
      [...orders, ...shopOrders].forEach(o => {
        statusMap[o.status || "unknown"] = (statusMap[o.status || "unknown"] || 0) + 1;
      });
      const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

      return {
        totalOrders, pendingOrders, completedOrders,
        totalRevenue, invoiceTotal,
        paidInvoices, unpaidInvoices,
        totalInvoices: invoices.length,
        trendData, statusData,
        avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      };
    },
    refetchInterval: useVisibleRefetchInterval(60000),
  });

  if (!data) return null;

  const stats = [
    { label: isAr ? "الطلبات" : "Orders", value: data.totalOrders, icon: Package, color: "text-primary" },
    { label: isAr ? "معلقة" : "Pending", value: data.pendingOrders, icon: Clock, color: "text-destructive" },
    { label: isAr ? "الإيرادات" : "Revenue", value: `${(data.totalRevenue / 1000).toFixed(1)}K`, icon: DollarSign, color: "text-chart-2" },
    { label: isAr ? "الفواتير" : "Invoices", value: data.totalInvoices, icon: FileText, color: "text-chart-3" },
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          {isAr ? "إحصائيات الطلبات والفواتير المباشرة" : "Orders & Invoices Live Stats"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-3 text-center group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color} transition-transform duration-300 group-hover:scale-110`} />
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "حركة الطلبات - 14 يوم" : "Order Activity - 14 Days"}
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={data.trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="orders" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} name={isAr ? "طلبات" : "Orders"} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "حالة الطلبات" : "Order Status"}
            </p>
            {data.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={data.statusData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 9 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={55} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                    {data.statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-xs text-muted-foreground">
                {isAr ? "لا توجد بيانات" : "No data"}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-muted/50 rounded-xl p-2 text-center">
            <CheckCircle className="h-3 w-3 mx-auto mb-1 text-chart-2" />
            <div className="text-sm font-bold">{data.paidInvoices}</div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "فواتير مدفوعة" : "Paid Invoices"}</div>
          </div>
          <div className="bg-muted/50 rounded-xl p-2 text-center">
            <ArrowUpDown className="h-3 w-3 mx-auto mb-1 text-chart-3" />
            <div className="text-sm font-bold">{data.avgOrderValue}</div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "متوسط الطلب" : "Avg Order"}</div>
          </div>
          <div className="bg-muted/50 rounded-xl p-2 text-center">
            <TrendingUp className="h-3 w-3 mx-auto mb-1 text-destructive" />
            <div className="text-sm font-bold">{data.unpaidInvoices}</div>
            <div className="text-[9px] text-muted-foreground">{isAr ? "غير مدفوعة" : "Unpaid"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
