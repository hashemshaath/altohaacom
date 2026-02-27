import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileBarChart, Download, Loader2, Printer, Globe, Calendar } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export function AdminPDFReportGenerator() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [reportType, setReportType] = useState("weekly");
  const [reportLang, setReportLang] = useState<string>(language);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pdf-report", {
        body: { reportType, language: reportLang },
      });

      if (error) throw error;
      if (data?.content) {
        setReportContent(data.content);
        setShowReport(true);
        toast.success(isAr ? "تم إنشاء التقرير بنجاح" : "Report generated successfully");
      }
    } catch (err: any) {
      toast.error(isAr ? "فشل في إنشاء التقرير" : "Failed to generate report");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && reportContent) {
      printWindow.document.write(`
        <html dir="${reportLang === "ar" ? "rtl" : "ltr"}">
        <head>
          <title>Altoha Analytics Report</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #333; }
            h1 { color: #1a1a2e; border-bottom: 2px solid #e94560; padding-bottom: 10px; }
            h2 { color: #16213e; margin-top: 24px; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: ${reportLang === "ar" ? "right" : "left"}; }
            th { background: #f8f9fa; font-weight: 600; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>${reportContent.replace(/\n/g, "<br>")}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileBarChart className="h-4 w-4 text-chart-5" />
            {isAr ? "إنشاء تقرير PDF" : "Generate PDF Report"}
            <Badge variant="outline" className="text-[9px] ms-2">AI</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <Calendar className="h-3 w-3 me-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">{isAr ? "أسبوعي" : "Weekly"}</SelectItem>
                <SelectItem value="monthly">{isAr ? "شهري" : "Monthly"}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={reportLang} onValueChange={setReportLang}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <Globe className="h-3 w-3 me-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <><Loader2 className="h-3 w-3 animate-spin" />{isAr ? "جاري الإنشاء..." : "Generating..."}</>
              ) : (
                <><FileBarChart className="h-3 w-3" />{isAr ? "إنشاء التقرير" : "Generate Report"}</>
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {isAr ? "يتم إنشاء التقرير بالذكاء الاصطناعي مع إحصائيات المنصة الحية" : "AI-generated report with live platform metrics"}
          </p>
        </CardContent>
      </Card>

      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-chart-5" />
              {isAr ? "تقرير التحليلات" : "Analytics Report"}
            </DialogTitle>
            <DialogDescription>
              {isAr ? "تقرير مُنشأ بالذكاء الاصطناعي" : "AI-generated analytics report"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[55vh]">
            <div className="prose prose-sm dark:prose-invert max-w-none px-1" dir={reportLang === "ar" ? "rtl" : "ltr"}>
              <ReactMarkdown>{reportContent || ""}</ReactMarkdown>
            </div>
          </ScrollArea>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="h-3.5 w-3.5" />
              {isAr ? "طباعة" : "Print"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                if (reportContent) {
                  const blob = new Blob([reportContent], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `altoha-report-${reportType}-${new Date().toISOString().slice(0, 10)}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
            >
              <Download className="h-3.5 w-3.5" />
              {isAr ? "تحميل" : "Download"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
