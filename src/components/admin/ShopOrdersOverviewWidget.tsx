import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ShoppingBag, Package, DollarSign, Clock, Truck, AlertCircle, Tag } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";

export const ShopOrdersOverviewWidget = memo(function ShopOrdersOverviewWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["shop-orders-overview-widget"],
    queryFn: async () => {
      const [{ data: orders }, { data: products }] = await Promise.all([
        supabase.from("shop_orders").select("status, total_amount, currency, payment_status, created_at").limit(500),
        supabase.from("shop_products").select("is_active, price, stock_quantity, category").limit(500),
      ]);

      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter(o => o.status === "pending").length || 0;
      const processingOrders = orders?.filter(o => o.status === "processing").length || 0;
      const completedOrders = orders?.filter(o => o.status === "delivered").length || 0;
      const totalRevenue = orders?.filter(o => o.payment_status === "paid").reduce((s, o) => s + (o.total_amount || 0), 0) || 0;

      const totalProducts = products?.length || 0;
      const activeProducts = products?.filter(p => p.is_active).length || 0;
      const outOfStock = products?.filter(p => (p.stock_quantity || 0) <= 0 && p.is_active).length || 0;
      const lowStock = products?.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 5).length || 0;

      const categoryCounts: Record<string, number> = {};
      products?.forEach(p => {
        if (p.category) categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      });

      const fulfillmentRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

      return {
        totalOrders, pendingOrders, processingOrders, completedOrders, totalRevenue,
        totalProducts, activeProducts, outOfStock, lowStock,
        categoryCounts, fulfillmentRate,
      };
    },
    staleTime: 60000,
  });

  if (!data) return null;

  const kpiItems = [
    { icon: ShoppingBag, label: isAr ? "الطلبات" : "Orders", value: data.totalOrders, sub: `${data.pendingOrders} ${isAr ? "معلق" : "pending"}`, color: "text-chart-1", bg: "bg-chart-1/10" },
    { icon: DollarSign, label: isAr ? "الإيرادات" : "Revenue", value: data.totalRevenue, sub: "SAR", color: "text-chart-2", bg: "bg-chart-2/10" },
    { icon: Package, label: isAr ? "المنتجات" : "Products", value: data.totalProducts, sub: `${data.activeProducts} ${isAr ? "نشط" : "active"}`, color: "text-chart-3", bg: "bg-chart-3/10" },
    { icon: Truck, label: isAr ? "مكتمل" : "Fulfilled", value: data.completedOrders, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-1/10">
              <ShoppingBag className="h-4 w-4 text-chart-1" />
            </div>
            {isAr ? "المتجر والطلبات" : "Shop & Orders"}
          </CardTitle>
          {data.outOfStock > 0 && (
            <Badge variant="destructive" className="text-[9px] font-medium">
              {data.outOfStock} {isAr ? "نفذ" : "out of stock"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {kpiItems.map((m, i) => (
            <div key={i} className="p-2.5 rounded-xl border border-border/30 group transition-all duration-200 hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={cn("flex h-6 w-6 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110", m.bg)}>
                  <m.icon className={cn("h-3 w-3", m.color)} />
                </div>
                <span className="text-[9px] text-muted-foreground font-medium">{m.label}</span>
              </div>
              <p className="text-sm font-bold tabular-nums"><AnimatedCounter value={m.value} /></p>
              {m.sub && <p className="text-[9px] text-muted-foreground mt-0.5">{m.sub}</p>}
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">{isAr ? "معدل التنفيذ" : "Fulfillment Rate"}</span>
            <span className="text-[10px] font-semibold tabular-nums">{data.fulfillmentRate}%</span>
          </div>
          <Progress value={data.fulfillmentRate} className="h-1.5" />
        </div>

        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="flex items-center gap-1 text-chart-4 font-medium">
            <Clock className="h-3 w-3" /> {data.processingOrders} {isAr ? "قيد المعالجة" : "processing"}
          </span>
          {data.lowStock > 0 && (
            <span className="flex items-center gap-1 text-chart-4 font-medium">
              <AlertCircle className="h-3 w-3" /> {data.lowStock} {isAr ? "مخزون منخفض" : "low stock"}
            </span>
          )}
        </div>

        {Object.keys(data.categoryCounts).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(data.categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, count]) => (
              <Badge key={cat} variant="outline" className="text-[9px] gap-1 font-medium">
                <Tag className="h-2.5 w-2.5" /> {cat}: {count}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
