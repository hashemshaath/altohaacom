import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreditCard, AlertTriangle, Clock, TrendingUp, Receipt } from "lucide-react";
import { differenceInDays } from "date-fns";

export function PaymentTrackerWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payment-tracker"],
    queryFn: async () => {
      const [invoicesRes, txnRes] = await Promise.all([
        supabase.from("invoices")
          .select("id, invoice_number, amount, currency, status, due_date, company_id")
          .order("due_date", { ascending: true })
          .limit(200),
        supabase.from("company_transactions")
          .select("id, type, amount, created_at")
          .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
          .order("created_at", { ascending: false }),
      ]);

      const invoices = (invoicesRes.data || []) as any[];
      const txns = txnRes.data || [];

      const now = new Date();
      const overdue = invoices.filter((i: any) => i.status !== "paid" && i.status !== "cancelled" && i.due_date && new Date(i.due_date) < now);
      const pending = invoices.filter((i: any) => i.status === "sent" || i.status === "pending");
      const paid = invoices.filter((i: any) => i.status === "paid");

      const totalRevenue30d = txns.filter(t => t.type === "payment" || t.type === "credit")
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);

      const totalInvoiced = invoices.filter((i: any) => i.status !== "cancelled")
        .reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
      const totalPaid = paid.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
      const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

      return {
        overdue,
        pending,
        overdueAmount: overdue.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0),
        pendingAmount: pending.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0),
        totalRevenue30d,
        collectionRate,
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
      </Card>
    );
  }

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(isAr ? "ar-SA" : "en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(amount);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-chart-1" />
          {isAr ? "تتبع المدفوعات" : "Payment Tracker"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-chart-2/10 group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-chart-2 transition-transform duration-300 group-hover:scale-110" />
              <span className="text-[10px] text-muted-foreground">{isAr ? "إيرادات 30 يوم" : "30d Revenue"}</span>
            </div>
            <p className="text-sm font-bold">{formatAmount(data?.totalRevenue30d || 0)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-primary/10 group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Receipt className="h-3.5 w-3.5 text-primary transition-transform duration-300 group-hover:scale-110" />
              <span className="text-[10px] text-muted-foreground">{isAr ? "نسبة التحصيل" : "Collection Rate"}</span>
            </div>
            <p className="text-sm font-bold">{data?.collectionRate || 0}%</p>
          </div>
          <div className="p-2.5 rounded-xl bg-destructive/10 group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive transition-transform duration-300 group-hover:scale-110" />
              <span className="text-[10px] text-muted-foreground">{isAr ? "متأخرة" : "Overdue"}</span>
            </div>
            <p className="text-sm font-bold">{formatAmount(data?.overdueAmount || 0)}</p>
            <p className="text-[10px] text-muted-foreground">{data?.overdue?.length || 0} {isAr ? "فاتورة" : "invoices"}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-chart-4/10 group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3.5 w-3.5 text-chart-4 transition-transform duration-300 group-hover:scale-110" />
              <span className="text-[10px] text-muted-foreground">{isAr ? "قيد الانتظار" : "Pending"}</span>
            </div>
            <p className="text-sm font-bold">{formatAmount(data?.pendingAmount || 0)}</p>
            <p className="text-[10px] text-muted-foreground">{data?.pending?.length || 0} {isAr ? "فاتورة" : "invoices"}</p>
          </div>
        </div>

        {/* Overdue Invoices */}
        {data?.overdue && data.overdue.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2 text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {isAr ? "فواتير متأخرة" : "Overdue Invoices"}
            </p>
            <ScrollArea className="max-h-32">
              <div className="space-y-1.5">
                {data.overdue.slice(0, 5).map((inv: any) => {
                  const daysOverdue = differenceInDays(new Date(), new Date(inv.due_date));
                  return (
                    <div key={inv.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50">
                      <span className="font-medium">{inv.invoice_number}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="destructive" className="text-[10px] px-1 py-0">
                          {daysOverdue}d
                        </Badge>
                        <span className="font-semibold">{formatAmount(Number(inv.amount))}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
