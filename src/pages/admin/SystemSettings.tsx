import { useIsAr } from "@/hooks/useIsAr";
import { useState, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStaggeredReveal } from "@/hooks/useStaggeredAnimation";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Link } from "react-router-dom";
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
  Search,
  ArrowRight,
  LayoutGrid,
  Activity,
  Database,
  Clock,
  Palette,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { SettingsQuickNav } from "@/components/admin/SettingsQuickNav";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { BrandingSettings } from "@/components/admin/settings/BrandingSettings";
import { BrandIdentityPanel } from "@/components/admin/settings/BrandIdentityPanel";
import { HeaderFooterSettings } from "@/components/admin/settings/HeaderFooterSettings";
import { LayoutSEOSettings } from "@/components/admin/settings/LayoutSEOSettings";
import { SecurityContentSettings } from "@/components/admin/settings/SecurityContentSettings";
import { RegistrationSettings } from "@/components/admin/settings/RegistrationSettings";
import { ThemePresetsPanel } from "@/components/admin/settings/ThemePresetsPanel";
import { TypographySettings } from "@/components/admin/settings/TypographySettings";
import { CoverSettings } from "@/components/admin/settings/CoverSettings";
import { GoogleIntegrationPanel } from "@/components/ads/GoogleIntegrationPanel";
import { MetaPixelPanel } from "@/components/ads/MetaPixelPanel";
import { TikTokPixelPanel } from "@/components/ads/TikTokPixelPanel";
import { SnapPixelPanel } from "@/components/ads/SnapPixelPanel";
import { SettingsImportExport } from "@/components/admin/settings/SettingsImportExport";
import { SettingsChangeLog } from "@/components/admin/settings/SettingsChangeLog";
import { GenericSettingsEditor } from "@/components/admin/settings/GenericSettingsEditor";
import { IntegrationsSecretsPanel } from "@/components/admin/settings/IntegrationsSecretsPanel";
import { SEOAnalyticsSettings } from "@/components/admin/settings/SEOAnalyticsSettings";
import { DatabaseOverviewWidget } from "@/components/admin/DatabaseOverviewWidget";
import { RecentAdminActions } from "@/components/admin/RecentAdminActions";

const ALL_TRACKING_TYPES = [
  "google_analytics", "google_tag_manager", "google_ads", "google_adsense",
  "google_search_console", "google_places",
  "facebook_pixel", "meta_capi", "facebook_catalog", "instagram_shopping",
  "tiktok_pixel", "tiktok_events_api",
  "snapchat_pixel", "snapchat_capi",
];

const TRACKING_DISPLAY = [
  { type: "google_analytics", name: "Google Analytics 4" },
  { type: "google_tag_manager", name: "Google Tag Manager" },
  { type: "google_ads", name: "Google Ads" },
  { type: "google_adsense", name: "Google AdSense" },
  { type: "google_search_console", name: "Search Console" },
  { type: "facebook_pixel", name: "Meta Pixel" },
  { type: "tiktok_pixel", name: "TikTok Pixel" },
  { type: "snapchat_pixel", name: "Snapchat Pixel" },
];

const TrackingStatusCard = memo(function TrackingStatusCard() {
  const isAr = useIsAr();

  const { data: activeTypes = [] } = useQuery({
    queryKey: ["integration-settings-tracking-status"],
    queryFn: async () => {
      const { data } = await supabase
        .from("integration_settings")
        .select("integration_type, is_active")
        .in("integration_type", ALL_TRACKING_TYPES);
      return (data || [])
        .filter((r) => r.is_active)
        .map((r) => r.integration_type);
    },
    ...CACHE.realtime,
  });

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <h4 className="text-sm font-semibold mb-1">
          {isAr ? "حالة منصات التتبع" : "Tracking Platform Status"}
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          {isAr
            ? "الحالة الحية لجميع أكواد التتبع والتحليلات المُكوّنة."
            : "Live status of all configured tracking and analytics codes."}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TRACKING_DISPLAY.map(p => {
            const isActive = activeTypes.includes(p.type);
            return (
              <div key={p.type} className="flex items-center gap-1.5 rounded-xl border border-border/40 p-2.5 transition-colors hover:bg-muted/50">
                <div className={`h-2 w-2 rounded-full shrink-0 ${isActive ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                <span className="text-xs font-medium">{p.name}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});


const tabs = [
  { value: "brand-identity", icon: Palette, en: "Brand Identity", ar: "الهوية البصرية", descEn: "Logos, colors & seasonal", descAr: "الشعارات والألوان والمناسبات" },
  { value: "branding", icon: Globe, en: "Branding", ar: "العلامة التجارية", descEn: "Site name & registration", descAr: "اسم الموقع والتسجيل" },
  { value: "header-footer", icon: PanelTop, en: "Header & Footer", ar: "الرأس والتذييل", descEn: "Navigation & social links", descAr: "التنقل وروابط التواصل" },
  { value: "homepage", icon: Home, en: "Homepage", ar: "الصفحة الرئيسية", descEn: "Sections, covers & layout", descAr: "الأقسام والأغلفة والتخطيط" },
  { value: "cover", icon: Layout, en: "Cover & Themes", ar: "الأغلفة والمظهر", descEn: "Cover height, gradient & pages", descAr: "ارتفاع الغطاء والتدرج والصفحات" },
  { value: "layout-seo", icon: Layout, en: "Layout & SEO", ar: "التخطيط و SEO", descEn: "Container, animations & meta", descAr: "الحاوية والرسوم والبيانات الوصفية" },
  { value: "security", icon: Shield, en: "Security & Content", ar: "الأمان والمحتوى", descEn: "Passwords, moderation & alerts", descAr: "كلمات المرور والإشراف والتنبيهات" },
  { value: "tracking", icon: BarChart3, en: "Tracking & Integrations", ar: "التتبع والتكاملات", descEn: "All tracking pixels & analytics", descAr: "جميع بكسلات التتبع والتحليلات" },
  { value: "seo-analytics", icon: Search, en: "SEO & Sitemap", ar: "SEO وخريطة الموقع", descEn: "Meta tags, keywords & sitemap", descAr: "العلامات الوصفية والكلمات وخريطة الموقع" },
  { value: "custom-entries", icon: Database, en: "Custom Entries", ar: "إدخالات مخصصة", descEn: "Generic key-value settings", descAr: "إعدادات مفتاح-قيمة عامة" },
  { value: "integrations", icon: Shield, en: "API Keys", ar: "مفاتيح API", descEn: "Backend secrets setup", descAr: "إعدادات الأسرار" },
];

// Settings completion calculator
function getCompletionInfo(settings: Record<string, any>) {
  const isAr = useIsAr();
  const categories = ["branding", "header", "footer", "seo", "layout", "security", "notifications", "content", "cover", "homepage"];
  const configured = categories.filter(k => settings[k] && Object.keys(settings[k]).length > 0).length;
  return { configured, total: categories.length, percent: Math.round((configured / categories.length) * 100) };
}

function QuickStatsCards({ settings, completion }: { settings: Record<string, any>; completion: { percent: number } }) {
  const isAr = useIsAr();
  const { getStyle } = useStaggeredReveal(4, 80);
  const items = [
    { icon: Database, value: Object.keys(settings).length.toString(), label: isAr ? "مجموعات الإعدادات" : "Config Groups" },
    { icon: Activity, value: `${completion.percent}%`, label: isAr ? "اكتمال التهيئة" : "Setup Complete" },
    { icon: LayoutGrid, value: "7", label: isAr ? "أقسام الإعدادات" : "Setting Sections" },
    { icon: Clock, value: isAr ? "نشط" : "Active", label: isAr ? "حالة النظام" : "System Status", isText: true },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item, i) => (
        <Card key={i} className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5" style={getStyle(i)}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
              <item.icon className="h-5 w-5 text-primary transition-transform duration-300 group-hover:rotate-6" />
            </div>
            <div className="min-w-0">
              <p className={item.isText ? "text-sm font-semibold" : "text-2xl font-bold tabular-nums"}>{item.isText ? item.value : <AnimatedCounter value={typeof item.value === "number" ? item.value : 0} />}</p>
              <p className="text-xs text-muted-foreground truncate">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function SystemSettings() {
  const isAr = useIsAr();
  const [activeTab, setActiveTab] = useState("branding");
  const { settings, isLoading, saveSetting } = useSiteSettings();

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

      <SettingsQuickNav />

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
          <QuickStatsCards settings={settings} completion={completion} />

          {/* Data & Actions Overview - lazy loaded */}
          {activeTab === "branding" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <DatabaseOverviewWidget />
              <RecentAdminActions />
            </div>
          )}

          {/* Configuration Progress */}
          <Card className="rounded-2xl border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium">{isAr ? "اكتمال التهيئة" : "Configuration Progress"}</p>
                <span className="text-xs text-muted-foreground">{completion.configured}/{completion.total} {isAr ? "فئة" : "categories"}</span>
              </div>
              <Progress value={completion.percent} className="h-2" />
              {completion.percent < 100 && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  {isAr
                    ? "أكمل جميع الأقسام للحصول على أفضل تجربة"
                    : "Complete all sections for the best experience"}
                </p>
              )}
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Tab Navigation */}
            <Card className="rounded-2xl border-border/40 bg-muted/30 backdrop-blur overflow-hidden">
              <CardContent className="p-1.5 sm:p-2 relative">
                <TabsList className="flex sm:grid h-auto w-auto sm:w-full gap-1.5 overflow-x-auto scrollbar-none sm:overflow-visible sm:grid-cols-4 lg:grid-cols-8 bg-transparent p-0 justify-start sm:justify-center">
                  {tabs.map(tab => {
                    const isConfigured = (() => {
                      if (tab.value === "branding") return !!settings.branding;
                      if (tab.value === "header-footer") return !!(settings.header || settings.footer);
                      if (tab.value === "homepage") return !!settings.homepage;
                      if (tab.value === "cover") return !!settings.cover;
                      if (tab.value === "layout-seo") return !!(settings.layout || settings.seo);
                      if (tab.value === "security") return !!(settings.security || settings.notifications);
                      if (tab.value === "tracking") return true;
                      if (tab.value === "seo-analytics") return !!settings.seo_analytics;
                      return false;
                    })();
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex sm:flex-col items-center sm:items-start gap-1.5 sm:gap-0.5 rounded-xl px-3 py-2 sm:py-2.5 whitespace-nowrap sm:whitespace-normal sm:text-start transition-all duration-300 shrink-0 sm:shrink data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:shadow-primary/5 data-[state=active]:border data-[state=active]:border-primary/20 data-[state=active]:scale-[1.02] h-auto relative hover:bg-background/50"
                      >
                        <div className="flex items-center gap-1.5">
                          <tab.icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-xs font-medium">{isAr ? tab.ar : tab.en}</span>
                          {isConfigured && (
                            <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <span className="hidden sm:block text-xs text-muted-foreground leading-tight">
                          {isAr ? tab.descAr : tab.descEn}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                <div className="pointer-events-none absolute inset-y-0 end-0 w-8 bg-gradient-to-l from-muted/30 to-transparent sm:hidden" />
              </CardContent>
            </Card>

            <TabsContent value="brand-identity" className="mt-0">
              <BrandIdentityPanel settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
            </TabsContent>

            <TabsContent value="branding" className="mt-0">
              <BrandingSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
            </TabsContent>

            <TabsContent value="header-footer" className="mt-0">
              <HeaderFooterSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
            </TabsContent>

            <TabsContent value="homepage" className="mt-0 space-y-3">
              {/* Redirect to dedicated homepage design page */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Home className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">{isAr ? "إدارة الصفحة الرئيسية" : "Homepage Management"}</p>
                    <p className="text-sm text-muted-foreground mt-1">{isAr ? "تم نقل إدارة أقسام الصفحة الرئيسية إلى صفحة مخصصة للتحكم الكامل" : "Homepage section management has moved to a dedicated page for full control"}</p>
                  </div>
                  <Button className="gap-2" asChild>
                    <Link to="/admin/design/homepage">
                      {isAr ? "فتح إدارة الصفحة الرئيسية" : "Open Homepage Manager"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
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
                <MetaPixelPanel />
                <TikTokPixelPanel />
                <SnapPixelPanel />
                <TrackingStatusCard />
              </div>
            </TabsContent>

            <TabsContent value="seo-analytics" className="mt-0">
              <SEOAnalyticsSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
            </TabsContent>

            <TabsContent value="custom-entries" className="mt-0">
              <GenericSettingsEditor settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
            </TabsContent>

            <TabsContent value="integrations" className="mt-0">
              <IntegrationsSecretsPanel />
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
