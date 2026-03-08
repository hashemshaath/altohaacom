import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Receipt, Package, Wallet, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react";

export const FinancialSummaryWidget = memo(function FinancialSummaryWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["financial-summary-widget"],
    queryFn: async () => {
      const [
        { data: invoices },
        { data: orders },
        { data: wallets },
        { data: transactions },
      ] = await Promise.all([
        supabase.from("invoices").select("status, amount, currency").limit(500),
        supabase.from("company_orders").select("status, total_amount, currency").limit(500),
        supabase.from("user_wallets").select("balance, points_balance").limit(500),
        supabase.from("wallet_transactions").select("type, amount, created_at").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()).limit(500),
      ]);

      // Invoices
      const totalInvoiceAmount = invoices?.reduce((s, i) => s + (i.amount || 0), 0) || 0;
      const paidInvoices = invoices?.filter(i => i.status === "paid").length || 0;
      const pendingInvoices = invoices?.filter(i => i.status === "pending" || i.status === "sent").length || 0;
      const overdueInvoices = invoices?.filter(i => i.status === "overdue").length || 0;
      const paidAmount = invoices?.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0) || 0;

      // Orders
      const totalOrderAmount = orders?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0;
      const pendingOrders = orders?.filter(o => o.status === "pending").length || 0;
      const completedOrders = orders?.filter(o => o.status === "completed").length || 0;

      // Wallets
      const totalWalletBalance = wallets?.reduce((s, w) => s + (w.balance || 0), 0) || 0;
      const totalPoints = wallets?.reduce((s, w) => s + (w.points_balance || 0), 0) || 0;

      // Transactions (30 days)
      const credits = transactions?.filter(t => t.type === "credit").reduce((s, t) => s + (t.amount || 0), 0) || 0;
      const debits = transactions?.filter(t => t.type === "debit").reduce((s, t) => s + (t.amount || 0), 0) || 0;

      const collectionRate = totalInvoiceAmount > 0 ? Math.round((paidAmount / totalInvoiceAmount) * 100) : 0;

      return {
        totalInvoiceAmount, paidInvoices, pendingInvoices, overdueInvoices, paidAmount,
        totalOrderAmount, pendingOrders, completedOrders,
        totalWalletBalance, totalPoints,
        credits, debits, netFlow: credits - debits,
        collectionRate,
        totalInvoices: invoices?.length || 0,
        totalOrders: orders?.length || 0,
      };
    },
    staleTime: 60000,
  });

  if (!data) return null;

  const fmt = (n: number) => n.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-chart-2" />
            {isAr ? "الملخص المالي" : "Financial Summary"}
          </CardTitle>
          <Badge variant="outline" className="text-[9px]">SAR</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        {/* Main financial cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: Receipt, label: isAr ? "الفواتير" : "Invoices", value: fmt(data.totalInvoiceAmount), sub: `${data.totalInvoices} ${isAr ? "فاتورة" : "total"}`, color: "text-chart-1" },
            { icon: Package, label: isAr ? "الطلبات" : "Orders", value: fmt(data.totalOrderAmount), sub: `${data.totalOrders} ${isAr ? "طلب" : "total"}`, color: "text-chart-3" },
            { icon: Wallet, label: isAr ? "المحافظ" : "Wallets", value: fmt(data.totalWalletBalance), sub: `${fmt(data.totalPoints)} ${isAr ? "نقطة" : "pts"}`, color: "text-primary" },
            { icon: TrendingUp, label: isAr ? "صافي التدفق (30ي)" : "Net Flow (30d)", value: fmt(data.netFlow), sub: `+${fmt(data.credits)} / -${fmt(data.debits)}`, color: data.netFlow >= 0 ? "text-chart-2" : "text-destructive" },
          ].map((m, i) => (
            <div key={i} className="p-2 rounded-xl bg-muted/30 border border-border/40 group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className={`h-3 w-3 ${m.color} transition-transform duration-300 group-hover:scale-110`} />
                <span className="text-[9px] text-muted-foreground">{m.label}</span>
              </div>
              <p className="text-sm font-bold">{m.value}</p>
              <p className="text-[8px] text-muted-foreground">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Collection rate */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">{isAr ? "معدل التحصيل" : "Collection Rate"}</span>
            <span className="text-[10px] font-medium">{data.collectionRate}%</span>
          </div>
          <Progress value={data.collectionRate} className="h-1.5" />
        </div>

        {/* Status indicators */}
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="flex items-center gap-1 text-chart-2"><CheckCircle className="h-3 w-3" /> {data.paidInvoices} {isAr ? "مدفوعة" : "paid"}</span>
          <span className="flex items-center gap-1 text-chart-4"><Clock className="h-3 w-3" /> {data.pendingInvoices} {isAr ? "معلقة" : "pending"}</span>
          {data.overdueInvoices > 0 && (
            <span className="flex items-center gap-1 text-destructive"><AlertCircle className="h-3 w-3" /> {data.overdueInvoices} {isAr ? "متأخرة" : "overdue"}</span>
          )}
          <span className="flex items-center gap-1 text-chart-3"><Package className="h-3 w-3" /> {data.pendingOrders} {isAr ? "طلب معلق" : "orders pending"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
