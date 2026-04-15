import { useIsAr } from "@/hooks/useIsAr";
import { useState, lazy, Suspense, useCallback, memo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AnalyticsDateRange, getPresetRange, type DateRange } from "@/components/analytics/AnalyticsDateRange";
import {
  BarChart3, Trophy, Users, DollarSign, Brain, Activity, UserMinus, TrendingUp, Megaphone,
  Wifi, Cpu, FileText, Flame, Globe, MessageSquareText, Filter, AlertTriangle, FlaskConical,
  FileBarChart, Landmark, PiggyBank, Layers, Bookmark, Download, Printer, Route, Gauge, Zap,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Lazy load all panels
const PlatformOverview = lazy(() => import("@/components/analytics/PlatformOverview"));
const CompetitionAnalytics = lazy(() => import("@/components/analytics/CompetitionAnalytics"));
const UserGrowthAnalytics = lazy(() => import("@/components/analytics/UserGrowthAnalytics"));
const FinancialReports = lazy(() => import("@/components/analytics/FinancialReports"));
const AIInsightsPanel = lazy(() => import("@/components/analytics/AIInsightsPanel"));
const EngagementMetrics = lazy(() => import("@/components/analytics/EngagementMetrics"));
const CohortRetentionChart = lazy(() => import("@/components/analytics/CohortRetentionChart").then(m => ({ default: m.CohortRetentionChart })));
const RevenueAnalytics = lazy(() => import("@/components/analytics/RevenueAnalytics").then(m => ({ default: m.RevenueAnalytics })));
const MarketingAnalytics = lazy(() => import("@/components/analytics/MarketingAnalytics").then(m => ({ default: m.MarketingAnalytics })));
const RealTimeDashboard = lazy(() => import("@/components/analytics/RealTimeDashboard").then(m => ({ default: m.RealTimeDashboard })));
const MLPredictionsPanel = lazy(() => import("@/components/analytics/MLPredictionsPanel").then(m => ({ default: m.MLPredictionsPanel })));
const CustomReportBuilder = lazy(() => import("@/components/analytics/CustomReportBuilder").then(m => ({ default: m.CustomReportBuilder })));
const ActivityHeatmap = lazy(() => import("@/components/analytics/ActivityHeatmap").then(m => ({ default: m.ActivityHeatmap })));
const GeographicDistribution = lazy(() => import("@/components/analytics/GeographicDistribution").then(m => ({ default: m.GeographicDistribution })));
const AIAnalyticsChat = lazy(() => import("@/components/analytics/AIAnalyticsChat").then(m => ({ default: m.AIAnalyticsChat })));
const FunnelAnalysis = lazy(() => import("@/components/analytics/FunnelAnalysis").then(m => ({ default: m.FunnelAnalysis })));
const UserJourneyMapping = lazy(() => import("@/components/analytics/UserJourneyMapping").then(m => ({ default: m.UserJourneyMapping })));
const AnomalyDetection = lazy(() => import("@/components/analytics/AnomalyDetection").then(m => ({ default: m.AnomalyDetection })));
const ABTestingDashboard = lazy(() => import("@/components/analytics/ABTestingDashboard").then(m => ({ default: m.ABTestingDashboard })));
const ExecutiveSummary = lazy(() => import("@/components/analytics/ExecutiveSummary").then(m => ({ default: m.ExecutiveSummary })));
const FinancialForecasting = lazy(() => import("@/components/analytics/FinancialForecasting").then(m => ({ default: m.FinancialForecasting })));
const TaxComplianceAnalytics = lazy(() => import("@/components/analytics/TaxComplianceAnalytics").then(m => ({ default: m.TaxComplianceAnalytics })));
const PredictiveChurnDashboard = lazy(() => import("@/components/analytics/PredictiveChurnDashboard").then(m => ({ default: m.PredictiveChurnDashboard })));
const MultiMetricComparison = lazy(() => import("@/components/analytics/MultiMetricComparison").then(m => ({ default: m.MultiMetricComparison })));
const WebVitalsWidget = lazy(() => import("@/components/admin/WebVitalsWidget").then(m => ({ default: m.WebVitalsWidget })));
const AdvancedKPIDashboard = lazy(() => import("@/components/admin/AdvancedKPIDashboard").then(m => ({ default: m.AdvancedKPIDashboard })));
const AdvancedExportWidget = lazy(() => import("@/components/admin/AdvancedExportWidget").then(m => ({ default: m.AdvancedExportWidget })));
const EventsMonitoring = lazy(() => import("@/components/analytics/EventsMonitoring").then(m => ({ default: m.EventsMonitoring })));

interface SavedReport {
  id: string;
  name: string;
  tab: string;
  createdAt: string;
}

const TAB_GROUPS = [
  {
    labelEn: "Core",
    labelAr: "أساسي",
    tabs: [
      { id: "overview", icon: BarChart3, labelEn: "Overview", labelAr: "نظرة عامة" },
      { id: "realtime", icon: Wifi, labelEn: "Real-time", labelAr: "مباشر" },
      { id: "executive", icon: FileBarChart, labelEn: "Executive", labelAr: "ملخص تنفيذي" },
    ],
  },
  {
    labelEn: "Users",
    labelAr: "المستخدمين",
    tabs: [
      { id: "users", icon: Users, labelEn: "Growth", labelAr: "النمو" },
      { id: "engagement", icon: Activity, labelEn: "Engagement", labelAr: "التفاعل" },
      { id: "retention", icon: UserMinus, labelEn: "Retention", labelAr: "الاحتفاظ" },
      { id: "churn", icon: UserMinus, labelEn: "Churn", labelAr: "المغادرة" },
      { id: "funnel", icon: Filter, labelEn: "Funnel", labelAr: "التحويل" },
      { id: "journey", icon: Route, labelEn: "Journey", labelAr: "الرحلة" },
    ],
  },
  {
    labelEn: "Revenue",
    labelAr: "الإيرادات",
    tabs: [
      { id: "revenue", icon: TrendingUp, labelEn: "Revenue", labelAr: "الإيرادات" },
      { id: "financial", icon: DollarSign, labelEn: "Financial", labelAr: "المالية" },
      { id: "forecasting", icon: PiggyBank, labelEn: "Forecast", labelAr: "التنبؤ" },
      { id: "tax", icon: Landmark, labelEn: "Tax", labelAr: "الضرائب" },
    ],
  },
  {
    labelEn: "Intelligence",
    labelAr: "الذكاء",
    tabs: [
      { id: "predictions", icon: Cpu, labelEn: "AI Predict", labelAr: "تنبؤات" },
      { id: "ai-insights", icon: Brain, labelEn: "Insights", labelAr: "رؤى" },
      { id: "ai-chat", icon: MessageSquareText, labelEn: "AI Chat", labelAr: "محادثة" },
      { id: "anomaly", icon: AlertTriangle, labelEn: "Anomaly", labelAr: "شذوذ" },
      { id: "ab-testing", icon: FlaskConical, labelEn: "A/B Test", labelAr: "اختبار" },
    ],
  },
  {
    labelEn: "Explore",
    labelAr: "استكشاف",
    tabs: [
      { id: "competitions", icon: Trophy, labelEn: "Comps", labelAr: "مسابقات" },
      { id: "marketing", icon: Megaphone, labelEn: "Marketing", labelAr: "تسويق" },
      { id: "comparison", icon: Layers, labelEn: "Compare", labelAr: "مقارنة" },
      { id: "heatmap", icon: Flame, labelEn: "Heatmap", labelAr: "حرارية" },
      { id: "geographic", icon: Globe, labelEn: "Geo", labelAr: "جغرافي" },
      { id: "web-vitals", icon: Gauge, labelEn: "Vitals", labelAr: "أداء" },
      { id: "events", icon: Zap, labelEn: "Events", labelAr: "أحداث" },
      { id: "reports", icon: FileText, labelEn: "Reports", labelAr: "تقارير" },
    ],
  },
];

function TabSkeleton() {
  const isAr = useIsAr();
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

export default memo(function AnalyticsDashboard() {
  const isAr = useIsAr();
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetRange("30d"));
  const [activeTab, setActiveTab] = useState("overview");
  const [saveReportOpen, setSaveReportOpen] = useState(false);
  const [reportName, setReportName] = useState("");

  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => {
    try { return JSON.parse(localStorage.getItem("altoha_saved_reports") || "[]"); } catch { return []; }
  });

  const handleTabChange = useCallback((id: string) => setActiveTab(id), []);

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
    try { localStorage.setItem("altoha_saved_reports", JSON.stringify(updated)); } catch {}
    setSaveReportOpen(false);
    setReportName("");
    toast({ title: isAr ? "تم حفظ التقرير" : "Report saved" });
  };

  const handleDeleteReport = (id: string) => {
    const updated = savedReports.filter(r => r.id !== id);
    setSavedReports(updated);
    try { localStorage.setItem("altoha_saved_reports", JSON.stringify(updated)); } catch {}
  };

  const allTabs = TAB_GROUPS.flatMap(g => g.tabs);

  const TAB_CONTENT: Record<string, React.ReactNode> = {
    overview: (
      <div className="space-y-5">
        <AdvancedKPIDashboard />
        <AdvancedExportWidget />
        <PlatformOverview dateRange={dateRange} />
      </div>
    ),
    realtime: <RealTimeDashboard />,
    executive: <ExecutiveSummary />,
    users: <UserGrowthAnalytics />,
    engagement: <EngagementMetrics />,
    retention: <CohortRetentionChart />,
    churn: <PredictiveChurnDashboard />,
    funnel: <FunnelAnalysis />,
    journey: <UserJourneyMapping />,
    revenue: <RevenueAnalytics />,
    financial: <FinancialReports />,
    forecasting: <FinancialForecasting />,
    tax: <TaxComplianceAnalytics />,
    predictions: <MLPredictionsPanel />,
    "ai-insights": <AIInsightsPanel />,
    "ai-chat": <AIAnalyticsChat />,
    anomaly: <AnomalyDetection />,
    "ab-testing": <ABTestingDashboard />,
    competitions: <CompetitionAnalytics />,
    marketing: <MarketingAnalytics />,
    comparison: <MultiMetricComparison />,
    heatmap: <ActivityHeatmap />,
    geographic: <GeographicDistribution />,
    "web-vitals": <WebVitalsWidget />,
    events: <EventsMonitoring />,
    reports: <CustomReportBuilder />,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <AdminPageHeader
        icon={BarChart3}
        title={isAr ? "التحليلات المتقدمة" : "Advanced Analytics"}
        description={isAr ? "إحصائيات شاملة مع تحليلات ذكية وتنبؤات" : "Comprehensive insights with AI-powered analysis"}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <AnalyticsDateRange value={dateRange} onChange={setDateRange} onExport={() => handleExport()} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" />{isAr ? "تصدير" : "Export"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("csv")}><FileText className="me-2 h-4 w-4" />CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")}><FileBarChart className="me-2 h-4 w-4" />PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("print")}><Printer className="me-2 h-4 w-4" />{isAr ? "طباعة" : "Print"}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setSaveReportOpen(true)}>
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

      {/* Save Report Dialog */}
      <Dialog open={saveReportOpen} onOpenChange={setSaveReportOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isAr ? "حفظ التقرير" : "Save Report"}</DialogTitle>
            <DialogDescription>{isAr ? "احفظ العرض الحالي للوصول السريع" : "Save current view for quick access"}</DialogDescription>
          </DialogHeader>
          <Input placeholder={isAr ? "اسم التقرير" : "Report name"} value={reportName} onChange={(e) => setReportName(e.target.value)} />
          <p className="text-xs text-muted-foreground">{isAr ? "العرض:" : "View:"} {allTabs.find(t => t.id === activeTab)?.[isAr ? "labelAr" : "labelEn"]}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveReportOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleSaveReport} disabled={!reportName.trim()}><Bookmark className="me-2 h-4 w-4" />{isAr ? "حفظ" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grouped Tab Navigation */}
      <div className="sticky top-0 z-20 rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm print:hidden">
        <ScrollArea className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-stretch sm:divide-x sm:divide-border/40 sm:rtl:divide-x-reverse min-w-max">
            {TAB_GROUPS.map((group) => (
              <div key={group.labelEn} className="flex flex-col">
                <div className="px-3 py-1 bg-muted/40 border-b border-border/40">
                  <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr ? group.labelAr : group.labelEn}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 px-1 py-1 flex-wrap sm:flex-nowrap">
                  {group.tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`
                          flex items-center gap-1 rounded-lg px-2 py-1.5 text-[0.6875rem] font-medium transition-all active:scale-95
                          ${isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }
                        `}
                      >
                        <Icon className="h-3 w-3 shrink-0" />
                        <span className="whitespace-nowrap">{isAr ? tab.labelAr : tab.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        <Suspense fallback={<TabSkeleton />}>
          {TAB_CONTENT[activeTab] || null}
        </Suspense>
      </div>
    </div>
  );
});
