import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Package, Truck, CheckCircle2, Clock, ArrowRight, ShoppingBag } from "lucide-react";

const STATUS_CONFIG: Record<string, { icon: typeof Package; color: string; en: string; ar: string }> = {
  pending: { icon: Clock, color: "text-chart-4", en: "Pending", ar: "قيد الانتظار" },
  processing: { icon: Package, color: "text-primary", en: "Processing", ar: "قيد التجهيز" },
  shipped: { icon: Truck, color: "text-chart-2", en: "Shipped", ar: "تم الشحن" },
  delivered: { icon: CheckCircle2, color: "text-chart-3", en: "Delivered", ar: "تم التوصيل" },
};

export const RecentOrdersWidget = memo(function RecentOrdersWidget() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  const { data: orders } = useQuery({
    queryKey: ["recent-orders-widget", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data }: any = await (supabase as any)
        .from("shop_orders")
        .select("id, order_number, total_amount, currency, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  if (!orders || orders.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-primary" />
          {isAr ? "أحدث الطلبات" : "Recent Orders"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {orders.map((order) => {
          const cfg = STATUS_CONFIG[order.status || "pending"] || STATUS_CONFIG.pending;
          const Icon = cfg.icon;

          return (
            <Link key={order.id} to={`/shop/orders`} className="block">
              <div className="flex items-center gap-3 rounded-lg border border-border/40 p-2.5 hover:bg-muted/50 transition-colors group">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 ${cfg.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold truncate">{order.order_number}</span>
                    <Badge variant="secondary" className={`text-[8px] px-1.5 py-0 ${cfg.color}`}>
                      {isAr ? cfg.ar : cfg.en}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {order.currency || "SAR"} {(order.total_amount || 0).toFixed(0)}
                  </div>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0 rtl:rotate-180" />
              </div>
            </Link>
          );
        })}
        <Link to="/shop/orders">
          <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-1.5 h-7">
            {isAr ? "عرض الكل" : "View All Orders"}
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
});
