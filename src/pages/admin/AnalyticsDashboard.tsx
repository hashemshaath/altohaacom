import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Trophy, Users, DollarSign, Brain, Activity, UserMinus, TrendingUp, Megaphone, Wifi, Cpu, FileText, Flame, Globe, MessageSquareText, Filter, AlertTriangle, FlaskConical, FileBarChart, Landmark, PiggyBank, Layers, Bookmark, Download, Printer } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import PlatformOverview from "@/components/analytics/PlatformOverview";
import CompetitionAnalytics from "@/components/analytics/CompetitionAnalytics";
import UserGrowthAnalytics from "@/components/analytics/UserGrowthAnalytics";
import FinancialReports from "@/components/analytics/FinancialReports";
import AIInsightsPanel from "@/components/analytics/AIInsightsPanel";
import EngagementMetrics from "@/components/analytics/EngagementMetrics";
import { CohortRetentionChart } from "@/components/analytics/CohortRetentionChart";
import { RevenueAnalytics } from "@/components/analytics/RevenueAnalytics";
import { MarketingAnalytics } from "@/components/analytics/MarketingAnalytics";
import { RealTimeDashboard } from "@/components/analytics/RealTimeDashboard";
import { MLPredictionsPanel } from "@/components/analytics/MLPredictionsPanel";
import { CustomReportBuilder } from "@/components/analytics/CustomReportBuilder";
import { ActivityHeatmap } from "@/components/analytics/ActivityHeatmap";
import { GeographicDistribution } from "@/components/analytics/GeographicDistribution";
import { AIAnalyticsChat } from "@/components/analytics/AIAnalyticsChat";
import { FunnelAnalysis } from "@/components/analytics/FunnelAnalysis";
import { AnomalyDetection } from "@/components/analytics/AnomalyDetection";
import { ABTestingDashboard } from "@/components/analytics/ABTestingDashboard";
import { ExecutiveSummary } from "@/components/analytics/ExecutiveSummary";
import { FinancialForecasting } from "@/components/analytics/FinancialForecasting";
import { TaxComplianceAnalytics } from "@/components/analytics/TaxComplianceAnalytics";
import { PredictiveChurnDashboard } from "@/components/analytics/PredictiveChurnDashboard";
import { MultiMetricComparison } from "@/components/analytics/MultiMetricComparison";
import { AnalyticsDateRange, getPresetRange, type DateRange } from "@/components/analytics/AnalyticsDateRange";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SavedReport {
  id: string;
  name: string;
  tab: string;
  createdAt: string;
}

export default function AnalyticsDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetRange("30d"));
  const [activeTab, setActiveTab] = useState("overview");
  const [saveReportOpen, setSaveReportOpen] = useState(false);
  const [reportName, setReportName] = useState("");

  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => {
    try { return JSON.parse(localStorage.getItem("altoha_saved_reports") || "[]"); } catch { return []; }
  });

  const handleExport = (format: "csv" | "pdf" | "print" = "csv") => {
    if (format === "print") { window.print(); return; }
    toast({ title: isAr ? `جاري التصدير كـ ${format.toUpperCase()}...` : `Exporting as ${format.toUpperCase()}...` });
    window.dispatchEvent(new CustomEvent("analytics-export", { detail: { tab: activeTab, dateRange, format } }));
  };

  const handleSaveReport = () => {
    if (!reportName.trim()) return;
    const report: SavedReport = { id: crypto.randomUUID(), name: reportName, tab: activeTab, createdAt: new Date().toISOString() };
    const updated = [...savedReports, report];
    setSavedReports(updated);
    localStorage.setItem("altoha_saved_reports", JSON.stringify(updated));
    setSaveReportOpen(false);
    setReportName("");
    toast({ title: isAr ? "تم حفظ التقرير" : "Report saved" });
  };

  const handleDeleteReport = (id: string) => {
    const updated = savedReports.filter(r => r.id !== id);
    setSavedReports(updated);
    localStorage.setItem("altoha_saved_reports", JSON.stringify(updated));
  };

  const tabs = [
    { value: "overview", icon: BarChart3, label: isAr ? "نظرة عامة" : "Overview" },
    { value: "realtime", icon: Wifi, label: isAr ? "مباشر" : "Real-time" },
    { value: "marketing", icon: Megaphone, label: isAr ? "التسويق" : "Marketing" },
    { value: "engagement", icon: Activity, label: isAr ? "التفاعل" : "Engagement" },
    { value: "retention", icon: UserMinus, label: isAr ? "الاحتفاظ" : "Retention" },
    { value: "churn", icon: UserMinus, label: isAr ? "تنبؤ المغادرة" : "Churn" },
    { value: "competitions", icon: Trophy, label: isAr ? "المسابقات" : "Competitions" },
    { value: "users", icon: Users, label: isAr ? "المستخدمين" : "Users" },
    { value: "comparison", icon: Layers, label: isAr ? "مقارنة" : "Compare" },
    { value: "revenue", icon: TrendingUp, label: isAr ? "الإيرادات" : "Revenue" },
    { value: "financial", icon: DollarSign, label: isAr ? "المالية" : "Financial" },
    { value: "forecasting", icon: PiggyBank, label: isAr ? "التنبؤ المالي" : "Forecasting" },
    { value: "tax", icon: Landmark, label: isAr ? "الضرائب" : "Tax" },
    { value: "predictions", icon: Cpu, label: isAr ? "تنبؤات AI" : "AI Predictions" },
    { value: "heatmap", icon: Flame, label: isAr ? "خريطة حرارية" : "Heatmap" },
    { value: "geographic", icon: Globe, label: isAr ? "جغرافي" : "Geographic" },
    { value: "funnel", icon: Filter, label: isAr ? "مسار التحويل" : "Funnel" },
    { value: "anomaly", icon: AlertTriangle, label: isAr ? "كشف الشذوذ" : "Anomaly" },
    { value: "ab-testing", icon: FlaskConical, label: isAr ? "اختبار A/B" : "A/B Testing" },
    { value: "reports", icon: FileText, label: isAr ? "تقارير" : "Reports" },
    { value: "executive", icon: FileBarChart, label: isAr ? "ملخص تنفيذي" : "Executive" },
    { value: "ai-insights", icon: Brain, label: isAr ? "ذكاء اصطناعي" : "AI Insights" },
    { value: "ai-chat", icon: MessageSquareText, label: isAr ? "محادثة ذكية" : "AI Chat" },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={BarChart3}
        title={isAr ? "التحليلات المتقدمة" : "Advanced Analytics"}
        description={isAr ? "إحصائيات شاملة مع تحليلات ذكية وتنبؤات" : "Comprehensive insights with AI-powered analysis and predictions"}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <AnalyticsDateRange value={dateRange} onChange={setDateRange} onExport={() => handleExport()} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />{isAr ? "تصدير" : "Export"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("csv")}><FileText className="me-2 h-4 w-4" />CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")}><FileBarChart className="me-2 h-4 w-4" />PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("print")}><Printer className="me-2 h-4 w-4" />{isAr ? "طباعة" : "Print"}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSaveReportOpen(true)}>
              <Bookmark className="h-3.5 w-3.5" />{isAr ? "حفظ" : "Save"}
            </Button>
          </div>
        }
      />

      {/* Saved Reports Bar */}
      {savedReports.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            <Bookmark className="inline h-3 w-3 me-1" />{isAr ? "المحفوظة:" : "Saved:"}
          </span>
          {savedReports.map(report => (
            <Badge key={report.id} variant="secondary" className="cursor-pointer hover:bg-primary/10 transition-colors gap-1 whitespace-nowrap" onClick={() => { setActiveTab(report.tab); toast({ title: `Loaded: ${report.name}` }); }}>
              {report.name}
              <button onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }} className="ms-1 text-muted-foreground hover:text-destructive">×</button>
            </Badge>
          ))}
        </div>
      )}

      <Dialog open={saveReportOpen} onOpenChange={setSaveReportOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isAr ? "حفظ التقرير" : "Save Report"}</DialogTitle>
            <DialogDescription>{isAr ? "احفظ العرض الحالي للوصول السريع" : "Save current view for quick access"}</DialogDescription>
          </DialogHeader>
          <Input placeholder={isAr ? "اسم التقرير" : "Report name"} value={reportName} onChange={(e) => setReportName(e.target.value)} />
          <p className="text-xs text-muted-foreground">{isAr ? "العرض:" : "View:"} {tabs.find(t => t.value === activeTab)?.label}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveReportOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleSaveReport} disabled={!reportName.trim()}><Bookmark className="me-2 h-4 w-4" />{isAr ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full flex-wrap gap-1">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 min-w-max">
                <tab.icon className="h-4 w-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview"><PlatformOverview dateRange={dateRange} /></TabsContent>
        <TabsContent value="realtime"><RealTimeDashboard /></TabsContent>
        <TabsContent value="marketing"><MarketingAnalytics /></TabsContent>
        <TabsContent value="engagement"><EngagementMetrics /></TabsContent>
        <TabsContent value="retention"><CohortRetentionChart /></TabsContent>
        <TabsContent value="churn"><PredictiveChurnDashboard /></TabsContent>
        <TabsContent value="competitions"><CompetitionAnalytics /></TabsContent>
        <TabsContent value="users"><UserGrowthAnalytics /></TabsContent>
        <TabsContent value="comparison"><MultiMetricComparison /></TabsContent>
        <TabsContent value="revenue"><RevenueAnalytics /></TabsContent>
        <TabsContent value="financial"><FinancialReports /></TabsContent>
        <TabsContent value="forecasting"><FinancialForecasting /></TabsContent>
        <TabsContent value="tax"><TaxComplianceAnalytics /></TabsContent>
        <TabsContent value="predictions"><MLPredictionsPanel /></TabsContent>
        <TabsContent value="heatmap"><ActivityHeatmap /></TabsContent>
        <TabsContent value="geographic"><GeographicDistribution /></TabsContent>
        <TabsContent value="funnel"><FunnelAnalysis /></TabsContent>
        <TabsContent value="anomaly"><AnomalyDetection /></TabsContent>
        <TabsContent value="ab-testing"><ABTestingDashboard /></TabsContent>
        <TabsContent value="reports"><CustomReportBuilder /></TabsContent>
        <TabsContent value="executive"><ExecutiveSummary /></TabsContent>
        <TabsContent value="ai-insights"><AIInsightsPanel /></TabsContent>
        <TabsContent value="ai-chat"><AIAnalyticsChat /></TabsContent>
      </Tabs>
    </div>
  );
}
