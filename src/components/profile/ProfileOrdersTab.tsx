import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { ShoppingBag, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-chart-4/15 text-chart-4",
  processing: "bg-primary/15 text-primary",
  shipped: "bg-chart-3/15 text-chart-3",
  delivered: "bg-chart-5/15 text-chart-5",
  cancelled: "bg-destructive/15 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

const STATUS_AR: Record<string, string> = {
  pending: "قيد الانتظار",
  processing: "قيد المعالجة",
  shipped: "مشحون",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  refunded: "مسترد",
};

export function ProfileOrdersTab({ userId, isAr }: { userId: string; isAr: boolean }) {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["profile-shop-orders", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("shop_orders")
        .select("id, order_number, total_amount, currency, status, created_at")
        .eq("buyer_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) return <PageSkeleton variant="list" count={3} />;

  if (!orders.length) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title={isAr ? "لا توجد طلبات بعد" : "No orders yet"}
        description={isAr ? "تصفح المتجر واطلب المنتجات" : "Browse the shop and place your first order"}
        action={
          <Link to="/shop">
            <Button size="sm">{isAr ? "تسوق الآن" : "Shop Now"}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{isAr ? `${orders.length} طلبات` : `${orders.length} Orders`}</h3>
        <Link to="/shop/orders">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ExternalLink className="h-3 w-3" />
            {isAr ? "عرض الكل" : "View All"}
          </Button>
        </Link>
      </div>
      {orders.map((order: any) => (
        <Card key={order.id} className="border-border/50 hover:shadow-sm transition-shadow">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ShoppingBag className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" dir="ltr">{order.order_number || order.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">
                {order.created_at ? format(new Date(order.created_at), "dd MMM yyyy") : "—"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className={`text-[10px] h-5 capitalize ${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"}`}>
                {isAr ? STATUS_AR[order.status] || order.status : order.status}
              </Badge>
              <p className="text-sm font-bold text-primary">
                {(order.total_amount || 0).toLocaleString()} <span className="text-xs text-muted-foreground">{order.currency || "SAR"}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default ProfileOrdersTab;
