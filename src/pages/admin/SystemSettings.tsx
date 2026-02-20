import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Settings,
  Globe,
  PanelTop,
  Layout,
  Shield,
  BarChart3,
  CheckCircle2,
  Loader2,
  Home,
  Layers,
  ArrowRight,
  LayoutGrid,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { BrandingSettings } from "@/components/admin/settings/BrandingSettings";
import { HeaderFooterSettings } from "@/components/admin/settings/HeaderFooterSettings";
import { LayoutSEOSettings } from "@/components/admin/settings/LayoutSEOSettings";
import { SecurityContentSettings } from "@/components/admin/settings/SecurityContentSettings";
import { CoverSettings } from "@/components/admin/settings/CoverSettings";
import { HomepageSectionsManager } from "@/components/admin/settings/HomepageSectionsManager";
import { GoogleIntegrationPanel } from "@/components/ads/GoogleIntegrationPanel";

const tabs = [
  { value: "branding", icon: Globe, en: "Branding", ar: "العلامة التجارية", descEn: "Logo, name & identity", descAr: "الشعار والاسم والهوية" },
  { value: "header-footer", icon: PanelTop, en: "Header & Footer", ar: "الرأس والتذييل", descEn: "Navigation & social links", descAr: "التنقل وروابط التواصل" },
  { value: "homepage", icon: Home, en: "Homepage", ar: "الصفحة الرئيسية", descEn: "Sections, covers & layout", descAr: "الأقسام والأغلفة والتخطيط" },
  { value: "cover", icon: Layout, en: "Cover & Themes", ar: "الأغلفة والمظهر", descEn: "Cover height, gradient & pages", descAr: "ارتفاع الغطاء والتدرج والصفحات" },
  { value: "layout-seo", icon: Layout, en: "Layout & SEO", ar: "التخطيط و SEO", descEn: "Container, animations & meta", descAr: "الحاوية والرسوم والبيانات الوصفية" },
  { value: "security", icon: Shield, en: "Security & Content", ar: "الأمان والمحتوى", descEn: "Passwords, moderation & alerts", descAr: "كلمات المرور والإشراف والتنبيهات" },
  { value: "tracking", icon: BarChart3, en: "Tracking & Analytics", ar: "التتبع والتحليلات", descEn: "Google, Meta, TikTok & more", descAr: "جوجل وميتا وتيك توك والمزيد" },
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
          <div className="flex items-center gap-2">
            {saveSetting.isPending && (
              <Badge variant="outline" className="gap-1 text-xs animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                {isAr ? "جارٍ الحفظ..." : "Saving..."}
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1 text-xs">
              <CheckCircle2 className="h-3 w-3" />
              {Object.keys(settings).length} {isAr ? "مجموعات محفوظة" : "saved groups"}
            </Badge>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation - Card-style grid */}
          <Card className="border-border/50 bg-muted/30">
            <CardContent className="p-2">
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1.5 bg-transparent p-0 sm:grid-cols-4 lg:grid-cols-7">
                {tabs.map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-start transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/60 h-auto"
                  >
                    <div className="flex items-center gap-1.5">
                      <tab.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-xs font-medium">{isAr ? tab.ar : tab.en}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {isAr ? tab.descAr : tab.descEn}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </CardContent>
          </Card>

          <TabsContent value="branding" className="mt-0">
            <BrandingSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
          </TabsContent>

          <TabsContent value="header-footer" className="mt-0">
            <HeaderFooterSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
          </TabsContent>

          <TabsContent value="homepage" className="mt-0 space-y-3">
            {/* Quick links */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Layers className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{isAr ? "شرائح القسم الرئيسي" : "Hero Slides"}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? "5 قوالب احترافية" : "5 professional templates"}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="default" className="gap-1.5 shrink-0" asChild>
                    <Link to="/admin/hero-slides">
                      {isAr ? "إدارة" : "Manage"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-muted/20">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{isAr ? "أقسام الصفحة الرئيسية" : "Homepage Sections"}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? "ترتيب وإظهار الأقسام" : "Order, visibility & design"}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5 shrink-0" asChild>
                    <Link to="/admin/homepage-sections">
                      {isAr ? "إدارة" : "Manage"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
            <HomepageSectionsManager />
          </TabsContent>

          <TabsContent value="cover" className="mt-0">
            <CoverSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
          </TabsContent>

          <TabsContent value="layout-seo" className="mt-0">
            <LayoutSEOSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <SecurityContentSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
          </TabsContent>

          <TabsContent value="tracking" className="mt-0">
            <div className="space-y-6">
              <GoogleIntegrationPanel />
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold mb-1">
                    {isAr ? "منصات التتبع المدعومة" : "Supported Tracking Platforms"}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    {isAr
                      ? "جميع أكواد التتبع والتحليلات تُدار من صفحة الإعلانات والتكاملات. الحالة أدناه توضح ما تم تكوينه."
                      : "All tracking codes and analytics are managed from the Advertising & Integrations page. Status below reflects what's configured."}
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
                      <div key={p.name} className="flex items-center gap-1.5 rounded-lg border border-border/40 p-2.5 transition-colors hover:bg-muted/50">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${p.status ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                        <span className="text-[11px] font-medium">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
