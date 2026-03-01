import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, FileText, Users, CreditCard, Clock, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Link } from "react-router-dom";

interface ActivityItem {
  id: string;
  type: "order" | "invoice" | "transaction" | "team";
  title: string;
  subtitle: string;
  time: string;
  status?: string;
}

export function CompanyActivityFeed({ companyId }: { companyId: string | null }) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["company-activity-feed", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const items: ActivityItem[] = [];

      const [ordersRes, invoicesRes, transactionsRes] = await Promise.all([
        supabase.from("company_orders").select("id, order_number, status, created_at")
          .eq("company_id", companyId).order("created_at", { ascending: false }).limit(5),
        supabase.from("invoices").select("id, invoice_number, status, amount, created_at")
          .eq("company_id", companyId).order("created_at", { ascending: false }).limit(5),
        supabase.from("company_transactions").select("id, transaction_number, type, amount, created_at")
          .eq("company_id", companyId).order("created_at", { ascending: false }).limit(5),
      ]);

      ordersRes.data?.forEach(o => items.push({
        id: o.id, type: "order",
        title: isAr ? `طلب ${o.order_number}` : `Order ${o.order_number}`,
        subtitle: o.status || "pending", time: o.created_at, status: o.status,
      }));

      invoicesRes.data?.forEach(i => items.push({
        id: i.id, type: "invoice",
        title: isAr ? `فاتورة ${i.invoice_number}` : `Invoice ${i.invoice_number}`,
        subtitle: `SAR ${(i.amount || 0).toLocaleString()}`, time: i.created_at, status: i.status,
      }));

      transactionsRes.data?.forEach(t => items.push({
        id: t.id, type: "transaction",
        title: isAr ? `معاملة ${t.transaction_number}` : `Txn ${t.transaction_number}`,
        subtitle: `SAR ${(t.amount || 0).toLocaleString()}`, time: t.created_at, status: t.type,
      }));

      return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 2,
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "order": return <ShoppingCart className="h-3.5 w-3.5" />;
      case "invoice": return <FileText className="h-3.5 w-3.5" />;
      case "transaction": return <CreditCard className="h-3.5 w-3.5" />;
      default: return <Users className="h-3.5 w-3.5" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "order": return "bg-primary/10 text-primary";
      case "invoice": return "bg-chart-4/10 text-chart-4";
      case "transaction": return "bg-chart-5/10 text-chart-5";
      default: return "bg-chart-3/10 text-chart-3";
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "completed": case "paid": return "bg-chart-3/10 text-chart-3 border-chart-3/20";
      case "pending": case "draft": return "bg-chart-4/10 text-chart-4 border-chart-4/20";
      case "cancelled": case "overdue": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b bg-gradient-to-r from-primary/5 to-transparent px-5 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Clock className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? "النشاط الأخير" : "Recent Activity"}
        </h3>
      </div>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {isAr ? "لا يوجد نشاط حديث" : "No recent activity"}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[360px]">
            <div className="divide-y divide-border">
              {activities.map((activity) => (
                <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${getIconColor(activity.type)}`}>
                    {getIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: isAr ? ar : enUS })}
                      </span>
                    </div>
                  </div>
                  {activity.status && (
                    <Badge variant="outline" className={`text-[9px] ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
