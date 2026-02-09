import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Receipt, Handshake, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function FinancialReports() {
  const { language } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ["financialReports"],
    queryFn: async () => {
      const [
        { data: orders },
        { data: transactions },
        { data: sponsors },
      ] = await Promise.all([
        supabase.from("company_orders").select("total_amount, status, created_at, category"),
        supabase.from("company_transactions").select("amount, type, created_at"),
        supabase.from("competition_sponsors").select("amount_paid, tier, status"),
      ]);

      // Total order revenue
      const totalOrderRevenue = (orders || []).reduce((sum, o: any) => sum + (Number(o.total_amount) || 0), 0);
      const totalTransactions = (transactions || []).reduce((sum, t: any) => sum + (Number(t.amount) || 0), 0);
      const totalSponsorship = (sponsors || []).filter((s: any) => s.status === "active").reduce((sum, s: any) => sum + (Number(s.amount_paid) || 0), 0);

      // Orders by category
      const categoryCounts: Record<string, number> = {};
      (orders || []).forEach((o: any) => {
        categoryCounts[o.category] = (categoryCounts[o.category] || 0) + (Number(o.total_amount) || 0);
      });
      const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value: Math.round(value) }));

      // Sponsorship by tier
      const tierCounts: Record<string, number> = {};
      (sponsors || []).forEach((s: any) => {
        tierCounts[s.tier] = (tierCounts[s.tier] || 0) + (Number(s.amount_paid) || 0);
      });
      const tierData = Object.entries(tierCounts).map(([name, value]) => ({ name, value: Math.round(value) }));

      // Monthly transaction volume
      const monthVolume: Record<string, number> = {};
      (transactions || []).forEach((t: any) => {
        const month = t.created_at?.substring(0, 7) || "unknown";
        monthVolume[month] = (monthVolume[month] || 0) + (Number(t.amount) || 0);
      });
      const monthlyData = Object.entries(monthVolume)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, amount]) => ({ month, amount: Math.round(amount) }));

      return {
        totalOrderRevenue: Math.round(totalOrderRevenue),
        totalTransactions: Math.round(totalTransactions),
        totalSponsorship: Math.round(totalSponsorship),
        orderCount: (orders || []).length,
        categoryData,
        tierData,
        monthlyData,
      };
    },
    staleTime: 1000 * 60,
  });

  const cards = [
    { label: language === "ar" ? "إيرادات الطلبات" : "Order Revenue", value: `${(data?.totalOrderRevenue || 0).toLocaleString()} SAR`, icon: DollarSign },
    { label: language === "ar" ? "عدد الطلبات" : "Total Orders", value: data?.orderCount || 0, icon: Receipt },
    { label: language === "ar" ? "إيرادات الرعاية" : "Sponsorship Revenue", value: `${(data?.totalSponsorship || 0).toLocaleString()} SAR`, icon: Handshake },
    { label: language === "ar" ? "حجم المعاملات" : "Transaction Volume", value: `${(data?.totalTransactions || 0).toLocaleString()} SAR`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 mt-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "حجم المعاملات الشهري" : "Monthly Transaction Volume"}</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.monthlyData && data.monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} SAR`} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-muted-foreground">{language === "ar" ? "لا توجد بيانات" : "No data available"}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "الرعاية حسب المستوى" : "Sponsorship by Tier"}</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.tierData && data.tierData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={data.tierData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {data.tierData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} SAR`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-muted-foreground">{language === "ar" ? "لا توجد بيانات" : "No data available"}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
