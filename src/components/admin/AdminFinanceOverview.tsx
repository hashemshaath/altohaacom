import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Wallet, ArrowRight, TrendingUp, CreditCard, Receipt } from "lucide-react";
import { toEnglishDigits } from "@/lib/formatNumber";

export function AdminFinanceOverview() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["admin-finance-overview"],
    queryFn: async () => {
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const monthISO = thisMonth.toISOString();

      const [invoices, paidInvoices, pendingInvoices, monthlyOrders] = await Promise.all([
        supabase.from("invoices").select("amount", { count: "exact" }),
        supabase.from("invoices").select("amount").eq("status", "paid"),
        supabase.from("invoices").select("amount").eq("status", "pending"),
        supabase.from("company_orders").select("total_amount").gte("created_at", monthISO),
      ]);

      const totalRevenue = (paidInvoices.data || []).reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
      const pendingAmount = (pendingInvoices.data || []).reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
      const monthlyRevenue = (monthlyOrders.data || []).reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

      return {
        totalRevenue,
        pendingAmount,
        monthlyRevenue,
        totalInvoices: invoices.count || 0,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  const stats = [
    { label: isAr ? "إجمالي الإيرادات" : "Total Revenue", value: data?.totalRevenue || 0, icon: TrendingUp, color: "text-chart-2", suffix: " SAR" },
    { label: isAr ? "معلق التحصيل" : "Pending", value: data?.pendingAmount || 0, icon: Receipt, color: "text-chart-4", suffix: " SAR" },
    { label: isAr ? "إيرادات الشهر" : "This Month", value: data?.monthlyRevenue || 0, icon: CreditCard, color: "text-primary", suffix: " SAR" },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-2/10">
            <Wallet className="h-3.5 w-3.5 text-chart-2" />
          </div>
          {isAr ? "نظرة مالية" : "Finance Overview"}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/finance">
            {isAr ? "التفاصيل" : "Details"} <ArrowRight className="ms-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="rounded-xl border border-border/40 p-3 text-center">
              <s.icon className={`h-4 w-4 mx-auto ${s.color}`} />
              <p className={`text-sm font-black mt-1.5 ${s.color}`}>
                {toEnglishDigits(s.value.toLocaleString())}{s.suffix}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
          <span className="text-xs text-muted-foreground">{isAr ? "إجمالي الفواتير" : "Total Invoices"}</span>
          <Badge variant="secondary" className="text-xs">{toEnglishDigits((data?.totalInvoices || 0).toString())}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
