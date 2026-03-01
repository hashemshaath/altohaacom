import { useState, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText, Download, Calendar, BarChart3, Users, Building2, Trophy,
  Settings, Loader2, CheckCircle, FileBarChart, Clock, Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ReportTemplate {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: any;
  category: string;
  tables: string[];
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "users", nameEn: "Users Report", nameAr: "تقرير المستخدمين",
    descriptionEn: "Complete user analytics with demographics", descriptionAr: "تحليل شامل للمستخدمين مع البيانات الديموغرافية",
    icon: Users, category: "users", tables: ["profiles"]
  },
  {
    id: "companies", nameEn: "Companies Report", nameAr: "تقرير الشركات",
    descriptionEn: "Company directory and financial overview", descriptionAr: "دليل الشركات والنظرة المالية",
    icon: Building2, category: "business", tables: ["companies"]
  },
  {
    id: "competitions", nameEn: "Competitions Report", nameAr: "تقرير المسابقات",
    descriptionEn: "Competition results and participation stats", descriptionAr: "نتائج المسابقات وإحصائيات المشاركة",
    icon: Trophy, category: "events", tables: ["competitions"]
  },
  {
    id: "financial", nameEn: "Financial Summary", nameAr: "ملخص مالي",
    descriptionEn: "Revenue, orders, and transaction summary", descriptionAr: "ملخص الإيرادات والطلبات والمعاملات",
    icon: BarChart3, category: "finance", tables: ["company_orders", "company_transactions"]
  },
  {
    id: "activity", nameEn: "Platform Activity", nameAr: "نشاط المنصة",
    descriptionEn: "User engagement and platform activity metrics", descriptionAr: "مقاييس تفاعل المستخدمين ونشاط المنصة",
    icon: FileBarChart, category: "analytics", tables: ["admin_actions"]
  },
];

interface ReportConfig {
  template: string;
  title: string;
  dateFrom: string;
  dateTo: string;
  includeCharts: boolean;
  includeSummary: boolean;
  language: "en" | "ar" | "both";
  format: "pdf" | "csv" | "json";
}

export default function PDFReportGenerator() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [config, setConfig] = useState<ReportConfig>({
    template: "", title: "",
    dateFrom: format(new Date(Date.now() - 30 * 86400000), "yyyy-MM-dd"),
    dateTo: format(new Date(), "yyyy-MM-dd"),
    includeCharts: true, includeSummary: true, language: "both", format: "csv"
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<{ name: string; date: string; format: string }[]>([]);

  const selectedTemplate = REPORT_TEMPLATES.find(t => t.id === config.template);

  const generateReport = useCallback(async () => {
    if (!config.template) return;
    setIsGenerating(true);

    try {
      const template = REPORT_TEMPLATES.find(t => t.id === config.template);
      if (!template) throw new Error("Template not found");

      let data: any[] = [];

      // Fetch data based on template
      for (const table of template.tables) {
        const { data: tableData, error } = await supabase
          .from(table as any)
          .select("*")
          .gte("created_at", config.dateFrom)
          .lte("created_at", config.dateTo + "T23:59:59")
          .limit(1000);

        if (!error && tableData) {
          data = [...data, ...tableData];
        }
      }

      const reportName = `${config.title || (isAr ? template.nameAr : template.nameEn)}_${format(new Date(), "yyyyMMdd_HHmm")}`;

      if (config.format === "csv") {
        exportCSV(data, reportName);
      } else if (config.format === "json") {
        exportJSON(data, reportName);
      } else {
        // For PDF, generate HTML and print
        exportPrintable(data, reportName, template);
      }

      setGeneratedReports(prev => [
        { name: reportName, date: format(new Date(), "yyyy-MM-dd HH:mm"), format: config.format },
        ...prev
      ]);
    } catch (err) {
      console.error("Report generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [config, isAr]);

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const bom = "\uFEFF";
    const csv = bom + [
      headers.join(","),
      ...data.map(row => headers.map(h => {
        const val = row[h];
        const str = val === null ? "" : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = (data: any[], filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPrintable = (data: any[], title: string, template: ReportTemplate) => {
    const win = window.open("", "_blank");
    if (!win) return;

    const summary = config.includeSummary ? `
      <div style="background:#f8f9fa;padding:16px;border-radius:8px;margin-bottom:24px">
        <h3 style="margin:0 0 8px">${isAr ? "ملخص" : "Summary"}</h3>
        <p>${isAr ? "إجمالي السجلات" : "Total Records"}: <strong>${data.length}</strong></p>
        <p>${isAr ? "الفترة" : "Period"}: ${config.dateFrom} → ${config.dateTo}</p>
      </div>
    ` : "";

    const headers = data.length ? Object.keys(data[0]) : [];
    const tableHtml = data.length ? `
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead><tr>${headers.map(h => `<th style="border:1px solid #ddd;padding:6px;background:#f0f0f0;text-align:${isAr ? "right" : "left"}">${h}</th>`).join("")}</tr></thead>
        <tbody>${data.slice(0, 100).map(row => `<tr>${headers.map(h => `<td style="border:1px solid #ddd;padding:4px">${row[h] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
      ${data.length > 100 ? `<p style="color:#666;font-size:12px;margin-top:8px">${isAr ? `يعرض أول 100 من ${data.length} سجل` : `Showing first 100 of ${data.length} records`}</p>` : ""}
    ` : `<p>${isAr ? "لا توجد بيانات" : "No data"}</p>`;

    win.document.write(`<!DOCTYPE html><html dir="${isAr ? "rtl" : "ltr"}"><head><title>${title}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:1200px;margin:0 auto}
      @media print{body{padding:20px}button{display:none!important}}</style></head>
      <body>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
          <h1 style="margin:0;font-size:24px">${title}</h1>
          <button onclick="window.print()" style="padding:8px 16px;background:#2563eb;color:white;border:none;border-radius:6px;cursor:pointer">
            ${isAr ? "طباعة / حفظ PDF" : "Print / Save PDF"}
          </button>
        </div>
        <p style="color:#666;font-size:12px">${isAr ? "تم إنشاؤه في" : "Generated on"}: ${format(new Date(), "yyyy-MM-dd HH:mm")}</p>
        ${summary}${tableHtml}
      </body></html>`);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{isAr ? "مولد التقارير" : "Report Generator"}</h2>
          <p className="text-sm text-muted-foreground">{isAr ? "إنشاء تقارير احترافية وتصديرها" : "Create and export professional reports"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Templates */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isAr ? "اختر قالب التقرير" : "Choose Report Template"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {REPORT_TEMPLATES.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setConfig(p => ({ ...p, template: t.id, title: isAr ? t.nameAr : t.nameEn }))}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      config.template === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <t.icon className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{isAr ? t.nameAr : t.nameEn}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{isAr ? t.descriptionAr : t.descriptionEn}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          {config.template && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {isAr ? "إعدادات التقرير" : "Report Settings"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{isAr ? "عنوان التقرير" : "Report Title"}</Label>
                  <Input value={config.title} onChange={e => setConfig(p => ({ ...p, title: e.target.value }))} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>{isAr ? "من تاريخ" : "From Date"}</Label>
                    <Input type="date" value={config.dateFrom} onChange={e => setConfig(p => ({ ...p, dateFrom: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{isAr ? "إلى تاريخ" : "To Date"}</Label>
                    <Input type="date" value={config.dateTo} onChange={e => setConfig(p => ({ ...p, dateTo: e.target.value }))} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>{isAr ? "صيغة التصدير" : "Export Format"}</Label>
                    <Select value={config.format} onValueChange={(v: any) => setConfig(p => ({ ...p, format: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{isAr ? "لغة التقرير" : "Report Language"}</Label>
                    <Select value={config.language} onValueChange={(v: any) => setConfig(p => ({ ...p, language: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="both">{isAr ? "كلاهما" : "Both"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label>{isAr ? "تضمين ملخص" : "Include Summary"}</Label>
                  <Switch checked={config.includeSummary} onCheckedChange={v => setConfig(p => ({ ...p, includeSummary: v }))} />
                </div>

                <Button onClick={generateReport} disabled={isGenerating} className="w-full">
                  {isGenerating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isAr ? "جاري الإنشاء..." : "Generating..."}</>
                  ) : (
                    <><Download className="h-4 w-4 mr-2" />{isAr ? "إنشاء وتحميل التقرير" : "Generate & Download Report"}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent reports */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {isAr ? "التقارير الأخيرة" : "Recent Reports"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatedReports.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>{isAr ? "لا توجد تقارير" : "No reports yet"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {generatedReports.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground">{r.date}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{r.format.toUpperCase()}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
