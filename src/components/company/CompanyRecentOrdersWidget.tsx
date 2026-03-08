import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShoppingCart, ArrowUpRight, Package, Clock } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/currencyFormatter";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  approved: "bg-chart-3/10 text-chart-3 border-chart-3/30",
  in_progress: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-chart-5/10 text-chart-5 border-chart-5/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground",
};

export const CompanyRecentOrdersWidget = memo(function CompanyRecentOrdersWidget({ companyId, language }: { companyId: string | null; language: string }) {
  const isAr = language === "ar";

  const { data: orders = [] } = useQuery({
    queryKey: ["company-dash-recent-orders", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("company_orders")
        .select("id, order_number, title, title_ar, status, total_amount, currency, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 2,
  });

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b bg-gradient-to-r from-primary/5 to-transparent px-5 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <ShoppingCart className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? "أحدث الطلبيات" : "Recent Orders"}
        </h3>
        <Button variant="ghost" size="sm" asChild className="text-xs">
          <Link to="/company/orders">
            {isAr ? "عرض الكل" : "View All"}
            <ArrowUpRight className="ms-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
      <CardContent className="p-5">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Package className="mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {isAr ? "لا توجد طلبيات بعد" : "No orders yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => {
              const title = isAr && order.title_ar ? order.title_ar : order.title;
              return (
                <Link
                  key={order.id}
                  to={`/company/orders`}
                  className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{title || order.order_number}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {order.created_at ? format(new Date(order.created_at), "MMM d") : ""}
                      </span>
                      {order.total_amount != null && (
                        <span className="font-semibold text-foreground">
                          {formatCurrency(order.total_amount, language as "en" | "ar")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${statusStyles[order.status] || ""}`}
                  >
                    {order.status}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
