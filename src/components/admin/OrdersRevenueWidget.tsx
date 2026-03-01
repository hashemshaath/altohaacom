import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, ShoppingBag, TrendingUp, Package, CreditCard, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { format, subDays } from "date-fns";

export function OrdersRevenueWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["orders-revenue-widget"],
    queryFn: async () => {
      const [ordersRes, shopRes, txRes, invoicesRes] = await Promise.all([
        supabase.from("company_orders").select("id, status, total_amount, currency, direction, category, created_at, order_date"),
        supabase.from("shop_orders").select("id, status, total_amount, currency, created_at"),
        supabase.from("company_transactions").select("id, type, amount, created_at"),
        supabase.from("invoices").select("id, status, amount, created_at"),
      ]);

      const orders = ordersRes.data || [];
      const shop = shopRes.data || [];
      const txs = txRes.data || [];
      const invoices = invoicesRes.data || [];

      // Revenue trend (14 days)
      const revTrend: Record<string, { company: number; shop: number }> = {};
      for (let i = 13; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "MM/dd");
        revTrend[d] = { company: 0, shop: 0 };
      }
      orders.forEach(o => {
        if (o.status === "completed" || o.status === "approved") {
          const d = format(new Date(o.created_at), "MM/dd");
          if (d in revTrend) revTrend[d].company += Number(o.total_amount) || 0;
        }
      });
      shop.forEach(s => {
        if (s.status === "shipped" || s.status === "confirmed") {
          const d = format(new Date(s.created_at), "MM/dd");
          if (d in revTrend) revTrend[d].shop += Number(s.total_amount) || 0;
        }
      });
      const trendData = Object.entries(revTrend).map(([date, vals]) => ({ date, ...vals }));

      // Order status distribution
      const statusDist: Record<string, number> = {};
      orders.forEach(o => { statusDist[o.status] = (statusDist[o.status] || 0) + 1; });
      const statusData = Object.entries(statusDist).map(([name, value]) => ({ name, value }));

      // Category distribution
      const catDist: Record<string, number> = {};
      orders.forEach(o => {
        if (o.category) catDist[o.category] = (catDist[o.category] || 0) + 1;
      });

      // Totals
      const totalCompanyRev = orders.filter(o => ["completed", "approved"].includes(o.status)).reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
      const totalShopRev = shop.filter(s => ["shipped", "confirmed"].includes(s.status)).reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
      const pendingOrders = orders.filter(o => o.status === "pending").length;
      const pendingShop = shop.filter(s => s.status === "pending").length;

      // Invoice collection
      const paidInvoices = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const totalInvoiced = invoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const collectionRate = totalInvoiced > 0 ? Math.round((paidInvoices / totalInvoiced) * 100) : 0;

      // Direction split
      const outgoing = orders.filter(o => o.direction === "outgoing").length;
      const incoming = orders.filter(o => o.direction === "incoming").length;

      return {
        totalCompanyRev, totalShopRev, pendingOrders, pendingShop,
        totalOrders: orders.length, totalShopOrders: shop.length,
        statusData, trendData, catDist, collectionRate,
        outgoing, incoming, paidInvoices, totalInvoiced,
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  if (!data) return null;

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--primary))"];

  const kpis = [
    { icon: DollarSign, label: isAr ? "إيرادات الشركات" : "Company Revenue", value: `${(data.totalCompanyRev / 1000).toFixed(1)}K`, color: "text-chart-2" },
    { icon: ShoppingBag, label: isAr ? "إيرادات المتجر" : "Shop Revenue", value: `${(data.totalShopRev / 1000).toFixed(1)}K`, color: "text-primary" },
    { icon: Package, label: isAr ? "طلبات معلقة" : "Pending Orders", value: data.pendingOrders + data.pendingShop, color: "text-chart-4" },
    { icon: CreditCard, label: isAr ? "نسبة التحصيل" : "Collection Rate", value: `${data.collectionRate}%`, color: "text-chart-5" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi, i) => (
        <Card key={i} className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold">{typeof kpi.value === "number" ? <><AnimatedCounter value={kpi.value} className="text-2xl font-bold" /> <span className="text-[10px] font-normal text-muted-foreground">SAR</span></> : <>{kpi.value} <span className="text-[10px] font-normal text-muted-foreground">SAR</span></>}</p>
          </CardContent>
        </Card>
      ))}

      {/* Revenue Trend */}
      <Card className="md:col-span-2 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-chart-2" />
            {isAr ? "اتجاه الإيرادات (14 يوم)" : "Revenue Trend (14d)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="company" stackId="1" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.3} />
                <Area type="monotone" dataKey="shop" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Status Pie */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "حالة الطلبات" : "Order Status"}</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                  {data.statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-chart-2" />{data.outgoing} {isAr ? "صادر" : "Out"}</span>
            <span className="flex items-center gap-1"><ArrowDownLeft className="h-3 w-3 text-chart-4" />{data.incoming} {isAr ? "وارد" : "In"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "التصنيفات" : "Categories"}</CardTitle>
        </CardHeader>
        <CardContent className="pb-3 space-y-2">
          {Object.entries(data.catDist).sort(([, a], [, b]) => b - a).slice(0, 5).map(([cat, count], i) => (
            <div key={cat} className="flex items-center justify-between text-xs">
              <span className="capitalize">{cat}</span>
              <Badge variant="secondary" className="text-[10px]">{count}</Badge>
            </div>
          ))}
          <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground flex justify-between">
            <span>{isAr ? "إجمالي الفواتير" : "Total Invoiced"}</span>
            <span>{(data.totalInvoiced / 1000).toFixed(1)}K SAR</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
