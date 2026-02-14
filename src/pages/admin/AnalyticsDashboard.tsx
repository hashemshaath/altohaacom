import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Trophy, Users, DollarSign, Brain, Activity } from "lucide-react";
import PlatformOverview from "@/components/analytics/PlatformOverview";
import CompetitionAnalytics from "@/components/analytics/CompetitionAnalytics";
import UserGrowthAnalytics from "@/components/analytics/UserGrowthAnalytics";
import FinancialReports from "@/components/analytics/FinancialReports";
import AIInsightsPanel from "@/components/analytics/AIInsightsPanel";
import EngagementMetrics from "@/components/analytics/EngagementMetrics";

export default function AnalyticsDashboard() {
  const { language } = useLanguage();

  const tabs = [
    { value: "overview", icon: BarChart3, label: language === "ar" ? "نظرة عامة" : "Overview" },
    { value: "engagement", icon: Activity, label: language === "ar" ? "التفاعل" : "Engagement" },
    { value: "competitions", icon: Trophy, label: language === "ar" ? "المسابقات" : "Competitions" },
    { value: "users", icon: Users, label: language === "ar" ? "المستخدمين" : "Users" },
    { value: "financial", icon: DollarSign, label: language === "ar" ? "المالية" : "Financial" },
    { value: "ai-insights", icon: Brain, label: language === "ar" ? "ذكاء اصطناعي" : "AI Insights" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="flex items-center gap-4 p-5 md:p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold">
              {language === "ar" ? "التحليلات المتقدمة" : "Advanced Analytics"}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {language === "ar" ? "إحصائيات شاملة مع تحليلات ذكية وتنبؤات" : "Comprehensive insights with AI-powered analysis and predictions"}
            </p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-6">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              <tab.icon className="h-4 w-4" />
              <span className="hidden md:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview"><PlatformOverview /></TabsContent>
        <TabsContent value="engagement"><EngagementMetrics /></TabsContent>
        <TabsContent value="competitions"><CompetitionAnalytics /></TabsContent>
        <TabsContent value="users"><UserGrowthAnalytics /></TabsContent>
        <TabsContent value="financial"><FinancialReports /></TabsContent>
        <TabsContent value="ai-insights"><AIInsightsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
