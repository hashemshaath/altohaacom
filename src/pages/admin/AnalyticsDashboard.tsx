import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Trophy, Users, DollarSign } from "lucide-react";
import PlatformOverview from "@/components/analytics/PlatformOverview";
import CompetitionAnalytics from "@/components/analytics/CompetitionAnalytics";
import UserGrowthAnalytics from "@/components/analytics/UserGrowthAnalytics";
import FinancialReports from "@/components/analytics/FinancialReports";

export default function AnalyticsDashboard() {
  const { language } = useLanguage();

  const tabs = [
    { value: "overview", icon: BarChart3, label: language === "ar" ? "نظرة عامة" : "Platform Overview" },
    { value: "competitions", icon: Trophy, label: language === "ar" ? "المسابقات" : "Competitions" },
    { value: "users", icon: Users, label: language === "ar" ? "المستخدمين" : "User Growth" },
    { value: "financial", icon: DollarSign, label: language === "ar" ? "التقارير المالية" : "Financial Reports" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">
          {language === "ar" ? "التحليلات والتقارير" : "Analytics & Reporting"}
        </h1>
        <p className="text-muted-foreground">
          {language === "ar" ? "إحصائيات شاملة عن المنصة" : "Comprehensive platform insights and metrics"}
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview"><PlatformOverview /></TabsContent>
        <TabsContent value="competitions"><CompetitionAnalytics /></TabsContent>
        <TabsContent value="users"><UserGrowthAnalytics /></TabsContent>
        <TabsContent value="financial"><FinancialReports /></TabsContent>
      </Tabs>
    </div>
  );
}
