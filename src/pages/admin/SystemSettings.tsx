import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings,
  Globe,
  PanelTop,
  Layout,
  Shield,
  BarChart3,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { BrandingSettings } from "@/components/admin/settings/BrandingSettings";
import { HeaderFooterSettings } from "@/components/admin/settings/HeaderFooterSettings";
import { LayoutSEOSettings } from "@/components/admin/settings/LayoutSEOSettings";
import { SecurityContentSettings } from "@/components/admin/settings/SecurityContentSettings";
import { GoogleIntegrationPanel } from "@/components/ads/GoogleIntegrationPanel";

const tabs = [
  { value: "branding", icon: Globe, en: "Branding", ar: "العلامة التجارية" },
  { value: "header-footer", icon: PanelTop, en: "Header & Footer", ar: "الرأس والتذييل" },
  { value: "layout-seo", icon: Layout, en: "Layout & SEO", ar: "التخطيط و SEO" },
  { value: "security", icon: Shield, en: "Security & Content", ar: "الأمان والمحتوى" },
  { value: "tracking", icon: BarChart3, en: "Tracking & Analytics", ar: "التتبع والتحليلات" },
];

export default function SystemSettings() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("branding");
  const { settings, isLoading, saveSetting } = useSiteSettings();

  const handleSave = (key: string, value: Record<string, any>, category?: string) => {
    saveSetting.mutate({ key, value, category });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Settings}
        title={isAr ? "إعدادات النظام" : "System Settings"}
        description={isAr ? "إدارة شاملة لإعدادات المنصة والمظهر والتكاملات" : "Comprehensive platform settings, appearance, and integrations management"}
        actions={
          <Badge variant="secondary" className="gap-1 text-xs">
            <Settings className="h-3 w-3" />
            {Object.keys(settings).length} {isAr ? "مجموعات" : "groups"}
          </Badge>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/50 p-1">
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <tab.icon className="h-3.5 w-3.5" />
                {isAr ? tab.ar : tab.en}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="branding">
            <BrandingSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
          </TabsContent>

          <TabsContent value="header-footer">
            <HeaderFooterSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
          </TabsContent>

          <TabsContent value="layout-seo">
            <LayoutSEOSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
          </TabsContent>

          <TabsContent value="security">
            <SecurityContentSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
          </TabsContent>

          <TabsContent value="tracking">
            <div className="space-y-6">
              <GoogleIntegrationPanel />
              <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                <h4 className="text-sm font-semibold mb-1">
                  {isAr ? "منصات التتبع المدعومة" : "Supported Tracking Platforms"}
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  {isAr
                    ? "جميع أكواد التتبع والتحليلات تُدار من صفحة الإعلانات والتكاملات. الإعدادات أدناه توضح الحالة الحالية."
                    : "All tracking codes and analytics are managed from the Advertising & Integrations page. The settings below show current status."}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { name: "Google Analytics 4", status: true },
                    { name: "Google Tag Manager", status: true },
                    { name: "Google Ads", status: true },
                    { name: "Google AdSense", status: true },
                    { name: "Meta Pixel", status: true },
                    { name: "TikTok Pixel", status: true },
                    { name: "Snapchat Pixel", status: true },
                    { name: "Microsoft Clarity", status: false },
                  ].map(p => (
                    <div key={p.name} className="flex items-center gap-1.5 rounded-md border border-border/40 p-2">
                      <div className={`h-2 w-2 rounded-full ${p.status ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                      <span className="text-[11px] font-medium">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
