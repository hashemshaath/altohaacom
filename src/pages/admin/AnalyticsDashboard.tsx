import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Trophy, Users, DollarSign, Brain, Activity, UserMinus, TrendingUp, Megaphone, Wifi, Cpu, FileText, Flame, Globe, MessageSquareText } from "lucide-react";
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
import { AnalyticsDateRange, getPresetRange, type DateRange } from "@/components/analytics/AnalyticsDateRange";
import { toast } from "@/hooks/use-toast";

export default function AnalyticsDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetRange("30d"));
  const [activeTab, setActiveTab] = useState("overview");

  const handleExport = () => {
    toast({ title: isAr ? "جاري التصدير..." : "Exporting..." });
    // The active tab component handles export logic
    const event = new CustomEvent("analytics-export", { detail: { tab: activeTab, dateRange } });
    window.dispatchEvent(event);
  };

  const tabs = [
    { value: "overview", icon: BarChart3, label: isAr ? "نظرة عامة" : "Overview" },
    { value: "realtime", icon: Wifi, label: isAr ? "مباشر" : "Real-time" },
    { value: "marketing", icon: Megaphone, label: isAr ? "التسويق" : "Marketing" },
    { value: "engagement", icon: Activity, label: isAr ? "التفاعل" : "Engagement" },
    { value: "retention", icon: UserMinus, label: isAr ? "الاحتفاظ" : "Retention" },
    { value: "competitions", icon: Trophy, label: isAr ? "المسابقات" : "Competitions" },
    { value: "users", icon: Users, label: isAr ? "المستخدمين" : "Users" },
    { value: "revenue", icon: TrendingUp, label: isAr ? "الإيرادات" : "Revenue" },
    { value: "financial", icon: DollarSign, label: isAr ? "المالية" : "Financial" },
    { value: "predictions", icon: Cpu, label: isAr ? "تنبؤات" : "Predictions" },
    { value: "heatmap", icon: Flame, label: isAr ? "خريطة حرارية" : "Heatmap" },
    { value: "geographic", icon: Globe, label: isAr ? "جغرافي" : "Geographic" },
    { value: "reports", icon: FileText, label: isAr ? "تقارير" : "Reports" },
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
          <AnalyticsDateRange value={dateRange} onChange={setDateRange} onExport={handleExport} />
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full md:grid md:grid-cols-15">
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
        <TabsContent value="competitions"><CompetitionAnalytics /></TabsContent>
        <TabsContent value="users"><UserGrowthAnalytics /></TabsContent>
        <TabsContent value="revenue"><RevenueAnalytics /></TabsContent>
        <TabsContent value="financial"><FinancialReports /></TabsContent>
        <TabsContent value="predictions"><MLPredictionsPanel /></TabsContent>
        <TabsContent value="heatmap"><ActivityHeatmap /></TabsContent>
        <TabsContent value="geographic"><GeographicDistribution /></TabsContent>
        <TabsContent value="reports"><CustomReportBuilder /></TabsContent>
        <TabsContent value="ai-insights"><AIInsightsPanel /></TabsContent>
        <TabsContent value="ai-chat"><AIAnalyticsChat /></TabsContent>
      </Tabs>
    </div>
  );
}
