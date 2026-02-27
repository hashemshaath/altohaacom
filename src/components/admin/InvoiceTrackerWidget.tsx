import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, Clock, CheckCircle, AlertTriangle, Send, XCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  draft: "hsl(var(--muted-foreground))",
  sent: "hsl(var(--chart-3))",
  paid: "hsl(var(--chart-5))",
  overdue: "hsl(var(--destructive))",
  cancelled: "hsl(var(--muted))",
  partial: "hsl(var(--chart-4))",
};

export function InvoiceTrackerWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["invoiceTracker"],
    queryFn: async () => {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("id, status, amount, currency, due_date, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;

      const all = invoices || [];
      const totalAmount = all.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const paidAmount = all.filter(i => i.status === "paid").reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const pendingAmount = all.filter(i => i.status === "sent" || i.status === "partial").reduce((s, i) => s + (Number(i.amount) || 0), 0);

      // Mark overdue
      const now = new Date();
      const overdueCount = all.filter(i =>
        i.status === "sent" && i.due_date && new Date(i.due_date) < now
      ).length;

      // Status distribution
      const statusMap: Record<string, number> = {};
      all.forEach(i => { statusMap[i.status || "draft"] = (statusMap[i.status || "draft"] || 0) + 1; });
      const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      const collectionRate = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

      return {
        total: all.length,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueCount,
        collectionRate,
        statusData,
        currency: all[0]?.currency || "SAR",
      };
    },
    refetchInterval: 60000,
  });

  if (!data) return null;

  const formatAmount = (n: number) => new Intl.NumberFormat(isAr ? "ar-SA" : "en-SA", { maximumFractionDigits: 0 }).format(n);

  const stats = [
    { icon: FileText, label: isAr ? "إجمالي الفواتير" : "Total Invoices", value: data.total, color: "text-primary" },
    { icon: DollarSign, label: isAr ? "المحصّل" : "Collected", value: `${formatAmount(data.paidAmount)} ${data.currency}`, color: "text-chart-5" },
    { icon: Clock, label: isAr ? "معلّقة" : "Pending", value: `${formatAmount(data.pendingAmount)} ${data.currency}`, color: "text-chart-4" },
    { icon: AlertTriangle, label: isAr ? "متأخرة" : "Overdue", value: data.overdueCount, color: "text-destructive" },
  ];

  const statusLabels: Record<string, { en: string; ar: string }> = {
    draft: { en: "Draft", ar: "مسودة" },
    sent: { en: "Sent", ar: "مرسلة" },
    paid: { en: "Paid", ar: "مدفوعة" },
    overdue: { en: "Overdue", ar: "متأخرة" },
    cancelled: { en: "Cancelled", ar: "ملغاة" },
    partial: { en: "Partial", ar: "جزئية" },
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          {isAr ? "تتبع الفواتير والمدفوعات" : "Invoice & Payment Tracker"}
          <Badge variant="secondary" className="ms-auto text-[10px]">
            {data.collectionRate}% {isAr ? "نسبة التحصيل" : "collection rate"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-3 text-center">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
              <div className="text-sm font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "توزيع حالة الفواتير" : "Invoice Status Distribution"}
            </p>
            {data.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={data.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.statusData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] || "hsl(var(--muted))"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value,
                      isAr ? statusLabels[name]?.ar || name : statusLabels[name]?.en || name,
                    ]}
                    contentStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[160px] flex items-center justify-center text-xs text-muted-foreground">
                {isAr ? "لا توجد فواتير" : "No invoices"}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "ملخص مالي" : "Financial Summary"}
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-chart-5" />
                  <span className="text-xs">{isAr ? "إجمالي الفواتير" : "Total Invoiced"}</span>
                </div>
                <span className="text-sm font-bold">{formatAmount(data.totalAmount)} {data.currency}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-chart-5" />
                  <span className="text-xs">{isAr ? "المحصّل" : "Collected"}</span>
                </div>
                <span className="text-sm font-bold text-chart-5">{formatAmount(data.paidAmount)} {data.currency}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-chart-4" />
                  <span className="text-xs">{isAr ? "المعلّق" : "Outstanding"}</span>
                </div>
                <span className="text-sm font-bold text-chart-4">{formatAmount(data.pendingAmount)} {data.currency}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
