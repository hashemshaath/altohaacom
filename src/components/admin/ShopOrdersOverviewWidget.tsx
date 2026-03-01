import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ShoppingBag, Package, DollarSign, Clock, CheckCircle, Truck, AlertCircle, Tag } from "lucide-react";

export function ShopOrdersOverviewWidget() {
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

  const fmt = (n: number) => n.toLocaleString("en");

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-chart-1" />
            {isAr ? "المتجر والطلبات" : "Shop & Orders"}
          </CardTitle>
          {data.outOfStock > 0 && (
            <Badge variant="destructive" className="text-[9px]">{data.outOfStock} {isAr ? "نفذ" : "out of stock"}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: ShoppingBag, label: isAr ? "الطلبات" : "Orders", value: fmt(data.totalOrders), sub: `${data.pendingOrders} ${isAr ? "معلق" : "pending"}`, color: "text-chart-1" },
            { icon: DollarSign, label: isAr ? "الإيرادات" : "Revenue", value: fmt(data.totalRevenue), sub: "SAR", color: "text-chart-2" },
            { icon: Package, label: isAr ? "المنتجات" : "Products", value: fmt(data.totalProducts), sub: `${data.activeProducts} ${isAr ? "نشط" : "active"}`, color: "text-chart-3" },
            { icon: Truck, label: isAr ? "مكتمل" : "Fulfilled", value: fmt(data.completedOrders), color: "text-primary" },
          ].map((m, i) => (
            <div key={i} className="p-2 rounded-xl bg-muted/30 border border-border/40 group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className={`h-3 w-3 ${m.color} transition-transform duration-300 group-hover:scale-110`} />
                <span className="text-[9px] text-muted-foreground">{m.label}</span>
              </div>
              <p className="text-sm font-bold">{m.value}</p>
              {m.sub && <p className="text-[8px] text-muted-foreground">{m.sub}</p>}
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">{isAr ? "معدل التنفيذ" : "Fulfillment Rate"}</span>
            <span className="text-[10px] font-medium">{data.fulfillmentRate}%</span>
          </div>
          <Progress value={data.fulfillmentRate} className="h-1.5" />
        </div>

        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="flex items-center gap-1 text-chart-4"><Clock className="h-3 w-3" /> {data.processingOrders} {isAr ? "قيد المعالجة" : "processing"}</span>
          {data.lowStock > 0 && (
            <span className="flex items-center gap-1 text-warning"><AlertCircle className="h-3 w-3" /> {data.lowStock} {isAr ? "مخزون منخفض" : "low stock"}</span>
          )}
        </div>

        {Object.keys(data.categoryCounts).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(data.categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, count]) => (
              <Badge key={cat} variant="outline" className="text-[8px] gap-0.5">
                <Tag className="h-2.5 w-2.5" /> {cat}: {count}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
