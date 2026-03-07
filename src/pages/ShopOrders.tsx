import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Package, Clock } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-chart-4/15 text-chart-4",
  confirmed: "bg-primary/15 text-primary",
  processing: "bg-accent/15 text-accent-foreground",
  shipped: "bg-chart-3/15 text-chart-3",
  delivered: "bg-chart-5/15 text-chart-5",
  cancelled: "bg-destructive/15 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

export default function ShopOrders() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["shop-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("shop_orders")
        .select("*, shop_order_items(*, shop_products(title, title_ar, image_url))")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      pending: { en: "Pending", ar: "قيد الانتظار" },
      confirmed: { en: "Confirmed", ar: "مؤكد" },
      processing: { en: "Processing", ar: "قيد المعالجة" },
      shipped: { en: "Shipped", ar: "تم الشحن" },
      delivered: { en: "Delivered", ar: "تم التوصيل" },
      cancelled: { en: "Cancelled", ar: "ملغى" },
      refunded: { en: "Refunded", ar: "مسترد" },
    };
    return isAr ? labels[status]?.ar : labels[status]?.en || status;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead title="My Orders" description="View your shop orders on Altoha." />
      <Header />

      <main className="container flex-1 py-8 md:py-12">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ms-2">
          <Link to="/shop">
            <ArrowLeft className="me-1.5 h-4 w-4" />
            {isAr ? "المتجر" : "Shop"}
          </Link>
        </Button>

        <div className="mb-8">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <h1 className="font-serif text-2xl font-bold md:text-3xl">
              {isAr ? "طلباتي" : "My Orders"}
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-2xl bg-muted/60 p-5">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">
              {isAr ? "لا توجد طلبات" : "No orders yet"}
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              {isAr ? "تصفح المتجر واطلب منتجاتك الأولى" : "Browse the shop and place your first order"}
            </p>
            <Button asChild className="mt-4">
              <Link to="/shop">{isAr ? "تصفح المتجر" : "Browse Shop"}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium">{order.order_number}</span>
                      <Badge className={statusColors[order.status] || "bg-muted text-muted-foreground"}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(order.created_at), "MMM d, yyyy")}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {order.shop_order_items?.map((item: any) => {
                      const itemTitle = isAr && item.product_snapshot?.title_ar
                        ? item.product_snapshot.title_ar
                        : item.product_snapshot?.title || item.shop_products?.title;
                      const imgUrl = item.product_snapshot?.image_url || item.shop_products?.image_url;
                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                            {imgUrl ? (
                              <img src={imgUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <ShoppingBag className="h-4 w-4 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{itemTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × {order.currency} {Number(item.unit_price).toFixed(2)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold">
                            {order.currency} {Number(item.total_price).toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center justify-end border-t pt-3">
                    <span className="text-sm text-muted-foreground me-2">{isAr ? "المجموع:" : "Total:"}</span>
                    <span className="text-lg font-bold text-primary">
                      {order.currency} {Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
