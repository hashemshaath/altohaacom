import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Trophy, Users, DollarSign, Brain, Activity, UserMinus, TrendingUp } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import PlatformOverview from "@/components/analytics/PlatformOverview";
import CompetitionAnalytics from "@/components/analytics/CompetitionAnalytics";
import UserGrowthAnalytics from "@/components/analytics/UserGrowthAnalytics";
import FinancialReports from "@/components/analytics/FinancialReports";
import AIInsightsPanel from "@/components/analytics/AIInsightsPanel";
import EngagementMetrics from "@/components/analytics/EngagementMetrics";
import { CohortRetentionChart } from "@/components/analytics/CohortRetentionChart";
import { RevenueAnalytics } from "@/components/analytics/RevenueAnalytics";

export default function AnalyticsDashboard() {
  const { language } = useLanguage();

  const tabs = [
    { value: "overview", icon: BarChart3, label: language === "ar" ? "نظرة عامة" : "Overview" },
    { value: "engagement", icon: Activity, label: language === "ar" ? "التفاعل" : "Engagement" },
    { value: "retention", icon: UserMinus, label: language === "ar" ? "الاحتفاظ" : "Retention" },
    { value: "competitions", icon: Trophy, label: language === "ar" ? "المسابقات" : "Competitions" },
    { value: "users", icon: Users, label: language === "ar" ? "المستخدمين" : "Users" },
    { value: "revenue", icon: TrendingUp, label: language === "ar" ? "الإيرادات" : "Revenue" },
    { value: "financial", icon: DollarSign, label: language === "ar" ? "المالية" : "Financial" },
    { value: "ai-insights", icon: Brain, label: language === "ar" ? "ذكاء اصطناعي" : "AI Insights" },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={BarChart3}
        title={language === "ar" ? "التحليلات المتقدمة" : "Advanced Analytics"}
        description={language === "ar" ? "إحصائيات شاملة مع تحليلات ذكية وتنبؤات" : "Comprehensive insights with AI-powered analysis and predictions"}
      />

      <Tabs defaultValue="overview">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full md:grid md:grid-cols-8">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 min-w-max">
                <tab.icon className="h-4 w-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview"><PlatformOverview /></TabsContent>
        <TabsContent value="engagement"><EngagementMetrics /></TabsContent>
        <TabsContent value="retention"><CohortRetentionChart /></TabsContent>
        <TabsContent value="competitions"><CompetitionAnalytics /></TabsContent>
        <TabsContent value="users"><UserGrowthAnalytics /></TabsContent>
        <TabsContent value="revenue"><RevenueAnalytics /></TabsContent>
        <TabsContent value="financial"><FinancialReports /></TabsContent>
        <TabsContent value="ai-insights"><AIInsightsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
