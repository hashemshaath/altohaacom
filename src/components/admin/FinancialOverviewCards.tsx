import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, FileText, CreditCard, AlertTriangle } from "lucide-react";
import { subDays, format } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export function FinancialOverviewCards() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-financial-overview"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      const [invoicesRes, ordersRes, transactionsRes] = await Promise.all([
        supabase.from("invoices").select("status, amount, currency, created_at"),
        supabase.from("company_orders").select("status, total_amount, currency, created_at").gte("created_at", thirtyDaysAgo),
        supabase.from("company_transactions").select("type, amount, currency, created_at").gte("created_at", thirtyDaysAgo),
      ]);

      const invoices = invoicesRes.data || [];
      const orders = ordersRes.data || [];
      const transactions = transactionsRes.data || [];

      const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount || 0), 0);
      const paidInvoices = invoices.filter(i => i.status === "paid");
      const totalPaid = paidInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
      const pendingInvoices = invoices.filter(i => i.status === "sent" || i.status === "pending");
      const totalPending = pendingInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
      const overdueInvoices = invoices.filter(i => i.status === "overdue");

      const totalOrderRevenue = orders.filter(o => o.status === "completed").reduce((s, o) => s + Number(o.total_amount || 0), 0);

      const totalCredits = transactions.filter(t => t.type === "payment" || t.type === "credit").reduce((s, t) => s + Number(t.amount || 0), 0);
      const totalDebits = transactions.filter(t => t.type === "invoice" || t.type === "debit").reduce((s, t) => s + Number(t.amount || 0), 0);

      return {
        totalInvoiced,
        totalPaid,
        totalPending,
        overdueCount: overdueInvoices.length,
        paidCount: paidInvoices.length,
        pendingCount: pendingInvoices.length,
        totalInvoiceCount: invoices.length,
        collectionRate: totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0,
        totalOrderRevenue,
        totalCredits,
        totalDebits,
        netFlow: totalCredits - totalDebits,
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  if (isLoading) {
    return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  }

  if (!data) return null;

  // fmt removed - using AnimatedCounter instead

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-chart-3" />
              <span className="text-xs text-muted-foreground">{isAr ? "إجمالي الفواتير" : "Total Invoiced"}</span>
            </div>
            <p className="text-lg font-bold"><AnimatedCounter value={data.totalInvoiced} /> SAR</p>
            <p className="text-[10px] text-muted-foreground">{data.totalInvoiceCount} {isAr ? "فاتورة" : "invoices"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-chart-5" />
              <span className="text-xs text-muted-foreground">{isAr ? "المدفوع" : "Collected"}</span>
            </div>
            <p className="text-lg font-bold"><AnimatedCounter value={data.totalPaid} /> SAR</p>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={data.collectionRate} className="h-1.5 flex-1" />
              <span className="text-[10px] text-muted-foreground">{data.collectionRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-chart-4" />
              <span className="text-xs text-muted-foreground">{isAr ? "قيد الانتظار" : "Pending"}</span>
            </div>
            <p className="text-lg font-bold"><AnimatedCounter value={data.totalPending} /> SAR</p>
            <p className="text-[10px] text-muted-foreground">{data.pendingCount} {isAr ? "فاتورة" : "invoices"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{isAr ? "صافي التدفق (30 يوم)" : "Net Flow (30d)"}</span>
            </div>
            <p className={`text-lg font-bold ${data.netFlow >= 0 ? "text-chart-5" : "text-destructive"}`}>
              {data.netFlow >= 0 ? "+" : ""}<AnimatedCounter value={data.netFlow} /> SAR
            </p>
            {data.overdueCount > 0 && (
              <Badge variant="destructive" className="text-[10px] mt-1">
                <AlertTriangle className="h-3 w-3 me-1" />
                {data.overdueCount} {isAr ? "متأخرة" : "overdue"}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
