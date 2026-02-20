import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { FileText, Calculator, Download, Building2, Landmark, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/currencyFormatter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const KSA_VAT_RATE = 15; // 15% VAT
const KSA_ZAKAT_RATE = 2.5; // 2.5% Zakat on capital

export default function TaxReportGenerator() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [reportType, setReportType] = useState<string>("vat");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["tax-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tax_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const reportTypes = [
    { id: "vat", label: isAr ? "ضريبة القيمة المضافة (VAT)" : "Value Added Tax (VAT)", icon: Receipt, rate: `${KSA_VAT_RATE}%` },
    { id: "zakat", label: isAr ? "الزكاة" : "Zakat", icon: Landmark, rate: `${KSA_ZAKAT_RATE}%` },
    { id: "income_tax", label: isAr ? "ضريبة الدخل" : "Income Tax", icon: Building2, rate: isAr ? "متغير" : "Variable" },
    { id: "comprehensive", label: isAr ? "تقرير شامل" : "Comprehensive Report", icon: FileText, rate: "—" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "final": return <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">{isAr ? "نهائي" : "Final"}</Badge>;
      case "submitted": return <Badge className="bg-primary/10 text-primary border-primary/20">{isAr ? "مقدم" : "Submitted"}</Badge>;
      case "archived": return <Badge variant="secondary">{isAr ? "مؤرشف" : "Archived"}</Badge>;
      default: return <Badge variant="outline">{isAr ? "مسودة" : "Draft"}</Badge>;
    }
  };

  const getReportTypeLabel = (type: string) => {
    const found = reportTypes.find(r => r.id === type);
    return found ? found.label : type;
  };

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* Report Type Selection */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reportTypes.map(rt => (
          <Card
            key={rt.id}
            className={`cursor-pointer transition-all hover:shadow-md ${reportType === rt.id ? "ring-2 ring-primary bg-primary/5" : ""}`}
            onClick={() => setReportType(rt.id)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <rt.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{rt.label}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "المعدل:" : "Rate:"} {rt.rate}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KSA Tax Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            {isAr ? "معلومات ضريبية - المملكة العربية السعودية" : "Tax Information - Kingdom of Saudi Arabia"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• {isAr ? "ضريبة القيمة المضافة (VAT): 15% على جميع المبيعات والخدمات الخاضعة" : "VAT: 15% on all taxable sales and services"}</p>
          <p>• {isAr ? "الزكاة: 2.5% على رأس المال العامل للشركات السعودية" : "Zakat: 2.5% on working capital for Saudi-owned businesses"}</p>
          <p>• {isAr ? "ضريبة الدخل: 20% على الشركات الأجنبية (قد تختلف حسب الاتفاقيات)" : "Income Tax: 20% on foreign-owned companies (may vary per agreements)"}</p>
          <p>• {isAr ? "الفترة الضريبية: ربع سنوية لضريبة القيمة المضافة" : "Tax period: Quarterly for VAT returns"}</p>
        </CardContent>
      </Card>

      {/* Period Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{isAr ? "إنشاء تقرير جديد" : "Generate New Report"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>{isAr ? "نوع التقرير" : "Report Type"}</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {reportTypes.map(rt => (
                    <SelectItem key={rt.id} value={rt.id}>{rt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? "بداية الفترة" : "Period Start"}</Label>
              <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
            </div>
            <div>
              <Label>{isAr ? "نهاية الفترة" : "Period End"}</Label>
              <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
            </div>
          </div>
          <Button className="gap-2" disabled={!periodStart || !periodEnd}>
            <Calculator className="h-4 w-4" />
            {isAr ? "إنشاء التقرير" : "Generate Report"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isAr ? "التقارير السابقة" : "Previous Reports"}</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                    <TableHead>{isAr ? "الفترة" : "Period"}</TableHead>
                    <TableHead className="text-end">{isAr ? "الإيرادات" : "Revenue"}</TableHead>
                    <TableHead className="text-end">{isAr ? "الضريبة" : "Tax"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report: any) => (
                    <TableRow key={report.id}>
                      <TableCell className="text-sm font-medium">{getReportTypeLabel(report.report_type)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {report.period_start} → {report.period_end}
                      </TableCell>
                      <TableCell className="text-end font-medium">
                        {formatCurrency(Number(report.total_revenue), language as "en" | "ar")}
                      </TableCell>
                      <TableCell className="text-end font-medium text-primary">
                        {formatCurrency(Number(report.tax_amount) + Number(report.zakat_amount || 0), language as "en" | "ar")}
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(report.created_at), "dd/MM/yyyy", { locale: isAr ? ar : undefined })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">{isAr ? "لا توجد تقارير بعد" : "No reports yet"}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
