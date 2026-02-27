import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  Activity,
  Database,
  Clock,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { BrandingSettings } from "@/components/admin/settings/BrandingSettings";
import { HeaderFooterSettings } from "@/components/admin/settings/HeaderFooterSettings";
import { LayoutSEOSettings } from "@/components/admin/settings/LayoutSEOSettings";
import { SecurityContentSettings } from "@/components/admin/settings/SecurityContentSettings";
import { RegistrationSettings } from "@/components/admin/settings/RegistrationSettings";
import { ThemePresetsPanel } from "@/components/admin/settings/ThemePresetsPanel";
import { TypographySettings } from "@/components/admin/settings/TypographySettings";
import { CoverSettings } from "@/components/admin/settings/CoverSettings";
import { HomepageSectionsManager } from "@/components/admin/settings/HomepageSectionsManager";
import { HomepageTemplateSwitcher } from "@/components/admin/settings/HomepageTemplateSwitcher";
import { GoogleIntegrationPanel } from "@/components/ads/GoogleIntegrationPanel";
import { HomepageLivePreview } from "@/components/admin/settings/homepage/HomepageLivePreview";
import { SectionPresets } from "@/components/admin/settings/homepage/SectionPresets";
import { SettingsImportExport } from "@/components/admin/settings/SettingsImportExport";
import { SettingsChangeLog } from "@/components/admin/settings/SettingsChangeLog";
import { DatabaseOverviewWidget } from "@/components/admin/DatabaseOverviewWidget";
import { RecentAdminActions } from "@/components/admin/RecentAdminActions";
import { useHomepageSections, useUpdateHomepageSection } from "@/hooks/useHomepageSections";

const tabs = [
  { value: "branding", icon: Globe, en: "Branding", ar: "العلامة التجارية", descEn: "Logo, name & identity", descAr: "الشعار والاسم والهوية" },
  { value: "header-footer", icon: PanelTop, en: "Header & Footer", ar: "الرأس والتذييل", descEn: "Navigation & social links", descAr: "التنقل وروابط التواصل" },
  { value: "homepage", icon: Home, en: "Homepage", ar: "الصفحة الرئيسية", descEn: "Sections, covers & layout", descAr: "الأقسام والأغلفة والتخطيط" },
  { value: "cover", icon: Layout, en: "Cover & Themes", ar: "الأغلفة والمظهر", descEn: "Cover height, gradient & pages", descAr: "ارتفاع الغطاء والتدرج والصفحات" },
  { value: "layout-seo", icon: Layout, en: "Layout & SEO", ar: "التخطيط و SEO", descEn: "Container, animations & meta", descAr: "الحاوية والرسوم والبيانات الوصفية" },
  { value: "security", icon: Shield, en: "Security & Content", ar: "الأمان والمحتوى", descEn: "Passwords, moderation & alerts", descAr: "كلمات المرور والإشراف والتنبيهات" },
  { value: "tracking", icon: BarChart3, en: "Tracking & Analytics", ar: "التتبع والتحليلات", descEn: "Google, Meta, TikTok & more", descAr: "جوجل وميتا وتيك توك والمزيد" },
];

// Settings completion calculator
function getCompletionInfo(settings: Record<string, any>) {
  const categories = ["branding", "header", "footer", "seo", "layout", "security", "notifications", "content", "cover", "homepage"];
  const configured = categories.filter(k => settings[k] && Object.keys(settings[k]).length > 0).length;
  return { configured, total: categories.length, percent: Math.round((configured / categories.length) * 100) };
}

export default function SystemSettings() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("branding");
  const { settings, isLoading, saveSetting } = useSiteSettings();
  const { data: homepageSections = [] } = useHomepageSections();
  const updateSection = useUpdateHomepageSection();

  const handleSave = (key: string, value: Record<string, any>, category?: string) => {
    saveSetting.mutate({ key, value, category });
  };

  const completion = getCompletionInfo(settings);

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
        <>
          {/* Quick Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tabular-nums">{Object.keys(settings).length}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{isAr ? "مجموعات الإعدادات" : "Config Groups"}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tabular-nums">{completion.percent}%</p>
                  <p className="text-[10px] text-muted-foreground truncate">{isAr ? "اكتمال التهيئة" : "Setup Complete"}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tabular-nums">7</p>
                  <p className="text-[10px] text-muted-foreground truncate">{isAr ? "أقسام الإعدادات" : "Setting Sections"}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{isAr ? "نشط" : "Active"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{isAr ? "حالة النظام" : "System Status"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data & Actions Overview */}
          <div className="grid gap-4 sm:grid-cols-2">
            <DatabaseOverviewWidget />
            <RecentAdminActions />
          </div>

          {/* Configuration Progress */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium">{isAr ? "اكتمال التهيئة" : "Configuration Progress"}</p>
                <span className="text-xs text-muted-foreground">{completion.configured}/{completion.total} {isAr ? "فئة" : "categories"}</span>
              </div>
              <Progress value={completion.percent} className="h-2" />
              {completion.percent < 100 && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {isAr
                    ? "أكمل جميع الأقسام للحصول على أفضل تجربة"
                    : "Complete all sections for the best experience"}
                </p>
              )}
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Tab Navigation */}
            <Card className="border-border/50 bg-muted/30 overflow-hidden">
              <CardContent className="p-1.5 sm:p-2 relative">
                <TabsList className="flex sm:grid h-auto w-auto sm:w-full gap-1.5 overflow-x-auto scrollbar-none sm:overflow-visible sm:grid-cols-4 lg:grid-cols-7 bg-transparent p-0 justify-start sm:justify-center">
                  {tabs.map(tab => {
                    const isConfigured = (() => {
                      if (tab.value === "branding") return !!settings.branding;
                      if (tab.value === "header-footer") return !!(settings.header || settings.footer);
                      if (tab.value === "homepage") return !!settings.homepage;
                      if (tab.value === "cover") return !!settings.cover;
                      if (tab.value === "layout-seo") return !!(settings.layout || settings.seo);
                      if (tab.value === "security") return !!(settings.security || settings.notifications);
                      if (tab.value === "tracking") return true;
                      return false;
                    })();
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex sm:flex-col items-center sm:items-start gap-1.5 sm:gap-0.5 rounded-lg px-3 py-2 sm:py-2.5 whitespace-nowrap sm:whitespace-normal sm:text-start transition-all shrink-0 sm:shrink data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/60 h-auto relative"
                      >
                        <div className="flex items-center gap-1.5">
                          <tab.icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-xs font-medium">{isAr ? tab.ar : tab.en}</span>
                          {isConfigured && (
                            <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <span className="hidden sm:block text-[10px] text-muted-foreground leading-tight">
                          {isAr ? tab.descAr : tab.descEn}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-muted/30 to-transparent sm:hidden" />
              </CardContent>
            </Card>

            <TabsContent value="branding" className="mt-0">
              <BrandingSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
            </TabsContent>

            <TabsContent value="header-footer" className="mt-0">
              <HeaderFooterSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
            </TabsContent>

            <TabsContent value="homepage" className="mt-0 space-y-3">
              {/* Template Switcher */}
              <HomepageTemplateSwitcher />
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

              {/* Main content + sidebar */}
              <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                <HomepageSectionsManager />
                <div className="space-y-4">
                  <HomepageLivePreview sections={homepageSections} isAr={isAr} />
                  <SectionPresets
                    isAr={isAr}
                    isPending={updateSection.isPending}
                    onApply={(config) => {
                      // Apply preset to all visible sections
                      homepageSections.filter(s => s.is_visible).forEach(s => {
                        updateSection.mutate({ id: s.id, ...config });
                      });
                    }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cover" className="mt-0 space-y-6">
              <ThemePresetsPanel settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
              <TypographySettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
              <CoverSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
            </TabsContent>

            <TabsContent value="layout-seo" className="mt-0">
              <LayoutSEOSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
            </TabsContent>

            <TabsContent value="security" className="mt-0 space-y-6">
              <RegistrationSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
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

          {/* Import/Export & Reset */}
          <div className="grid gap-4 sm:grid-cols-3">
            <SettingsImportExport />
            <SettingsChangeLog />
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold">{isAr ? "إعادة ضبط الإعدادات" : "Reset Settings"}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr ? "إعادة جميع الإعدادات إلى القيم الافتراضية" : "Reset all settings to their default values"}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    if (window.confirm(isAr ? "هل أنت متأكد؟ سيتم حذف جميع الإعدادات المخصصة." : "Are you sure? All custom settings will be removed.")) {
                      handleSave("theme", { preset: "gold" }, "appearance");
                      handleSave("typography", { bodyFont: "dm-sans", headingFont: "dm-serif" }, "appearance");
                      localStorage.removeItem("altoha_theme_preset");
                      localStorage.removeItem("altoha_body_font");
                      localStorage.removeItem("altoha_heading_font");
                    }
                  }}
                >
                  {isAr ? "إعادة ضبط" : "Reset to Defaults"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}