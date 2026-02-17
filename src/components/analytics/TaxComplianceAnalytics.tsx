import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Landmark, Receipt, Building2, ShieldCheck, AlertTriangle,
  CheckCircle2, Clock, Calculator,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { formatCurrency } from "@/lib/currencyFormatter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const KSA_VAT_RATE = 15;
const KSA_ZAKAT_RATE = 2.5;
const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function TaxComplianceAnalytics() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const { data, isLoading } = useQuery({
    queryKey: ["tax-compliance", year],
    queryFn: async () => {
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;

      const [
        { data: invoices },
        { data: taxReports },
        { data: shopOrders },
      ] = await Promise.all([
        supabase.from("invoices").select("amount, status, created_at, paid_at, tax_amount").gte("created_at", yearStart).lte("created_at", yearEnd),
        supabase.from("tax_reports").select("*").gte("period_start", yearStart).lte("period_end", yearEnd).order("period_start"),
        supabase.from("shop_orders").select("total_amount, status, created_at").gte("created_at", yearStart).lte("created_at", yearEnd),
      ]);

      // Calculate taxable revenue
      const paidInvoices = (invoices || []).filter(i => i.status === "paid");
      const totalTaxableRevenue = paidInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const totalVATCollected = paidInvoices.reduce((s, i) => s + (Number(i.tax_amount) || 0), 0);
      const estimatedVAT = Math.round(totalTaxableRevenue * (KSA_VAT_RATE / 100));
      const estimatedZakat = Math.round(totalTaxableRevenue * (KSA_ZAKAT_RATE / 100));

      // Shop revenue
      const shopRevenue = (shopOrders || [])
        .filter(o => o.status === "confirmed" || o.status === "shipped")
        .reduce((s, o) => s + (Number(o.total_amount) || 0), 0);

      // Quarterly breakdown
      const quarters = [
        { q: "Q1", start: `${year}-01-01`, end: `${year}-03-31` },
        { q: "Q2", start: `${year}-04-01`, end: `${year}-06-30` },
        { q: "Q3", start: `${year}-07-01`, end: `${year}-09-30` },
        { q: "Q4", start: `${year}-10-01`, end: `${year}-12-31` },
      ];

      const quarterlyData = quarters.map(q => {
        const qInvoices = paidInvoices.filter(i => {
          const d = (i.paid_at || i.created_at) || "";
          return d >= q.start && d <= q.end;
        });
        const revenue = qInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const vat = Math.round(revenue * (KSA_VAT_RATE / 100));
        return { quarter: q.q, revenue: Math.round(revenue), vat, zakat: Math.round(revenue * (KSA_ZAKAT_RATE / 100)) };
      });

      // Tax report status
      const filedReports = (taxReports || []).filter(r => r.status === "final" || r.status === "submitted").length;
      const totalExpectedReports = 4; // Quarterly VAT returns
      const complianceScore = Math.round((filedReports / Math.max(totalExpectedReports, 1)) * 100);

      // Tax composition
      const taxComposition = [
        { name: isAr ? "ضريبة القيمة المضافة" : "VAT (15%)", value: estimatedVAT },
        { name: isAr ? "الزكاة" : "Zakat (2.5%)", value: estimatedZakat },
      ];

      return {
        totalTaxableRevenue: Math.round(totalTaxableRevenue),
        totalVATCollected: Math.round(totalVATCollected),
        estimatedVAT,
        estimatedZakat,
        totalTaxLiability: estimatedVAT + estimatedZakat,
        shopRevenue: Math.round(shopRevenue),
        quarterlyData,
        taxComposition,
        complianceScore,
        filedReports,
        totalExpectedReports,
        taxReports: taxReports || [],
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "final": return <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">{isAr ? "نهائي" : "Final"}</Badge>;
      case "submitted": return <Badge className="bg-primary/10 text-primary border-primary/20">{isAr ? "مقدم" : "Submitted"}</Badge>;
      default: return <Badge variant="outline">{isAr ? "مسودة" : "Draft"}</Badge>;
    }
  };

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{isAr ? "الضرائب والامتثال" : "Tax & Compliance"}</h3>
          <p className="text-sm text-muted-foreground">
            {isAr ? "تحليل الالتزامات الضريبية وفقاً لأنظمة المملكة العربية السعودية" : "Tax liability analysis per KSA regulations"}
          </p>
        </div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2026, 2025, 2024].map(y => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Compliance Score & KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-s-[3px] border-s-chart-5">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="rounded-xl bg-chart-5/10 p-2.5">
              <ShieldCheck className="h-5 w-5 text-chart-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "درجة الامتثال" : "Compliance Score"}</p>
              <p className="text-2xl font-bold">{data?.complianceScore || 0}%</p>
              <p className="text-[10px] text-muted-foreground">{data?.filedReports || 0}/{data?.totalExpectedReports || 4} {isAr ? "تقارير مقدمة" : "reports filed"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "الإيرادات الخاضعة" : "Taxable Revenue"}</p>
              <p className="text-xl font-bold">{formatCurrency(data?.totalTaxableRevenue || 0, language as "en" | "ar")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="rounded-xl bg-chart-3/10 p-2.5">
              <Calculator className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي الالتزام الضريبي" : "Total Tax Liability"}</p>
              <p className="text-xl font-bold text-chart-3">{formatCurrency(data?.totalTaxLiability || 0, language as "en" | "ar")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="rounded-xl bg-chart-4/10 p-2.5">
              <Landmark className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "الزكاة المقدرة" : "Estimated Zakat"}</p>
              <p className="text-xl font-bold">{formatCurrency(data?.estimatedZakat || 0, language as "en" | "ar")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quarterly Chart + Tax Composition */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "الإيرادات والضرائب الربع سنوية" : "Quarterly Revenue & Tax"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.quarterlyData || []}>
                  <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                    formatter={(v: number) => formatCurrency(v, language as "en" | "ar")}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" fillOpacity={0.8} radius={[4, 4, 0, 0]} name={isAr ? "إيرادات" : "Revenue"} />
                  <Bar dataKey="vat" fill="hsl(var(--chart-3))" fillOpacity={0.7} radius={[4, 4, 0, 0]} name="VAT" />
                  <Bar dataKey="zakat" fill="hsl(var(--chart-4))" fillOpacity={0.7} radius={[4, 4, 0, 0]} name={isAr ? "زكاة" : "Zakat"} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "تركيبة الالتزامات الضريبية" : "Tax Liability Composition"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.taxComposition || []} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value"
                    label={({ name, value }) => `${name}: ${formatCurrency(value, language as "en" | "ar")}`}>
                    {(data?.taxComposition || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v, language as "en" | "ar")} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filed Tax Reports */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            {isAr ? "التقارير الضريبية المقدمة" : "Filed Tax Reports"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(data?.taxReports?.length || 0) > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                  <TableHead>{isAr ? "الفترة" : "Period"}</TableHead>
                  <TableHead className="text-right">{isAr ? "الإيرادات" : "Revenue"}</TableHead>
                  <TableHead className="text-right">{isAr ? "الضريبة" : "Tax"}</TableHead>
                  <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.taxReports.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.report_type}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.period_start} → {r.period_end}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(r.total_revenue), language as "en" | "ar")}</TableCell>
                    <TableCell className="text-right font-medium text-primary">{formatCurrency(Number(r.tax_amount) + Number(r.zakat_amount || 0), language as "en" | "ar")}</TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
              <Building2 className="h-8 w-8 text-muted-foreground/30 mb-2" />
              {isAr ? "لا توجد تقارير ضريبية لهذا العام" : "No tax reports for this year"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* KSA Compliance Notes */}
      <Card className="bg-chart-5/5 border-chart-5/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-chart-5 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium">{isAr ? "ملاحظات الامتثال - المملكة العربية السعودية" : "Compliance Notes - KSA"}</p>
              <p className="text-muted-foreground text-xs">• {isAr ? "يجب تقديم إقرارات ضريبة القيمة المضافة كل ربع سنة" : "VAT returns must be filed quarterly"}</p>
              <p className="text-muted-foreground text-xs">• {isAr ? "الزكاة مستحقة سنوياً على رأس المال العامل" : "Zakat is due annually on working capital"}</p>
              <p className="text-muted-foreground text-xs">• {isAr ? "جميع الأرقام تقديرية — راجع محاسبك المعتمد" : "All figures are estimates — consult your certified accountant"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
