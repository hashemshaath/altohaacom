import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Building2, DollarSign, FileText, TrendingUp, CreditCard, Receipt } from "lucide-react";
import { subDays, format } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--destructive))"];

export const CompanyFinanceWidget = memo(function CompanyFinanceWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-company-finance-widget"],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30).toISOString();

      const [companies, invoices, transactions, orders] = await Promise.all([
        supabase.from("companies").select("id, status, type").limit(1000),
        supabase.from("invoices").select("id, status, amount, currency, created_at").gte("created_at", thirtyDaysAgo),
        supabase.from("company_transactions").select("id, type, amount, created_at").gte("created_at", thirtyDaysAgo),
        supabase.from("company_orders").select("id, status, total_amount, created_at").gte("created_at", thirtyDaysAgo),
      ]);

      const allCompanies = companies.data || [];
      const allInvoices = invoices.data || [];
      const allTxns = transactions.data || [];
      const allOrders = orders.data || [];

      // Company status distribution
      const statusMap: Record<string, number> = {};
      allCompanies.forEach(c => { statusMap[c.status] = (statusMap[c.status] || 0) + 1; });
      const statusDist = Object.entries(statusMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

      // Company type distribution
      const typeMap: Record<string, number> = {};
      allCompanies.forEach(c => { typeMap[c.type] = (typeMap[c.type] || 0) + 1; });
      const typeDist = Object.entries(typeMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

      // Revenue from invoices
      const totalInvoiced = allInvoices.reduce((s, inv) => s + (inv.amount || 0), 0);
      const paidInvoices = allInvoices.filter(inv => inv.status === "paid");
      const totalPaid = paidInvoices.reduce((s, inv) => s + (inv.amount || 0), 0);
      const pendingAmount = allInvoices.filter(inv => inv.status === "pending" || inv.status === "sent").reduce((s, inv) => s + (inv.amount || 0), 0);

      // Daily transaction volume (7 days)
      const dailyMap: Record<string, { credits: number; debits: number }> = {};
      for (let i = 6; i >= 0; i--) {
        dailyMap[format(subDays(now, i), "EEE")] = { credits: 0, debits: 0 };
      }
      allTxns.forEach(t => {
        const d = format(new Date(t.created_at), "EEE");
        if (!dailyMap[d]) return;
        if (["payment", "credit"].includes(t.type)) dailyMap[d].credits += t.amount || 0;
        else dailyMap[d].debits += t.amount || 0;
      });
      const dailyVolume = Object.entries(dailyMap).map(([day, v]) => ({ day, ...v }));

      // Order stats
      const orderRevenue = allOrders.reduce((s, o) => s + (o.total_amount || 0), 0);

      return {
        totalCompanies: allCompanies.length,
        activeCompanies: allCompanies.filter(c => c.status === "active").length,
        totalInvoiced,
        totalPaid,
        pendingAmount,
        orderRevenue,
        invoiceCount: allInvoices.length,
        transactionCount: allTxns.length,
        statusDist,
        typeDist,
        dailyVolume,
      };
    },
    refetchInterval: useVisibleRefetchInterval(60000),
  });

  if (isLoading) return <Skeleton className="h-52 w-full rounded-xl" />;
  if (!data) return null;

  const collectionRate = data.totalInvoiced > 0 ? Math.round((data.totalPaid / data.totalInvoiced) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { icon: Building2, label: isAr ? "شركات نشطة" : "Active", value: data.activeCompanies, color: "text-primary", bg: "bg-primary/10" },
          { icon: Receipt, label: isAr ? "فواتير" : "Invoices", value: data.invoiceCount, color: "text-chart-3", bg: "bg-chart-3/10" },
          { icon: DollarSign, label: isAr ? "محصّل" : "Collected", value: `${(data.totalPaid / 1000).toFixed(1)}K`, color: "text-chart-5", bg: "bg-chart-5/10" },
          { icon: FileText, label: isAr ? "معلّق" : "Pending", value: `${(data.pendingAmount / 1000).toFixed(1)}K`, color: "text-chart-4", bg: "bg-chart-4/10" },
          { icon: CreditCard, label: isAr ? "معاملات" : "Transactions", value: data.transactionCount, color: "text-primary", bg: "bg-primary/10" },
          { icon: TrendingUp, label: isAr ? "تحصيل" : "Collection", value: `${collectionRate}%`, color: collectionRate >= 70 ? "text-chart-5" : "text-destructive", bg: collectionRate >= 70 ? "bg-chart-5/10" : "bg-destructive/10" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-3 flex items-center gap-2">
              <div className={`rounded-full p-1.5 ${kpi.bg}`}><kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} /></div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground truncate">{kpi.label}</p>
                <p className="text-base font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "حركة المعاملات (7 أيام)" : "Transaction Flow (7 Days)"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.dailyVolume}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={32} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="credits" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name={isAr ? "إيرادات" : "Credits"} />
                <Bar dataKey="debits" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name={isAr ? "مصروفات" : "Debits"} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">{isAr ? "أنواع الشركات" : "Company Types"}</p>
              <div className="flex items-center gap-3">
                <PieChart width={60} height={60}>
                  <Pie data={data.typeDist} dataKey="value" cx={28} cy={28} innerRadius={16} outerRadius={28} strokeWidth={0}>
                    {data.typeDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
                <div className="text-[10px] space-y-1">
                  {data.typeDist.map((t, i) => (
                    <div key={t.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="capitalize">{t.name}</span>: <strong>{t.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">{isAr ? "حالات الشركات" : "Company Status"}</p>
              <div className="space-y-1.5">
                {data.statusDist.map(s => (
                  <div key={s.name} className="space-y-0.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="capitalize">{s.name}</span>
                      <span className="text-muted-foreground">{s.value}</span>
                    </div>
                    <Progress value={(s.value / data.totalCompanies) * 100} className="h-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
