import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Palette,
  Globe,
  PanelTop,
  Home,
  Layout,
  Layers,
  ArrowRight,
  LayoutGrid,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { BrandingSettings } from "@/components/admin/settings/BrandingSettings";
import { BrandIdentityPanel } from "@/components/admin/settings/BrandIdentityPanel";
import { HeaderFooterSettings } from "@/components/admin/settings/HeaderFooterSettings";
import { ThemePresetsPanel } from "@/components/admin/settings/ThemePresetsPanel";
import { TypographySettings } from "@/components/admin/settings/TypographySettings";
import { CoverSettings } from "@/components/admin/settings/CoverSettings";
import { HomepageSectionsManager } from "@/components/admin/settings/HomepageSectionsManager";
import { HomepageTemplateSwitcher } from "@/components/admin/settings/HomepageTemplateSwitcher";
import { HomepageLivePreview } from "@/components/admin/settings/homepage/HomepageLivePreview";
import { SectionPresets } from "@/components/admin/settings/homepage/SectionPresets";
import { useHomepageSections, useUpdateHomepageSection } from "@/hooks/useHomepageSections";

const tabs = [
  { value: "brand-identity", icon: Palette, en: "Brand Identity", ar: "الهوية البصرية", descEn: "Logos, colors & seasonal", descAr: "الشعارات والألوان والمناسبات" },
  { value: "branding", icon: Globe, en: "Branding", ar: "العلامة التجارية", descEn: "Site name & registration", descAr: "اسم الموقع والتسجيل" },
  { value: "header-footer", icon: PanelTop, en: "Header & Footer", ar: "الرأس والتذييل", descEn: "Navigation & social links", descAr: "التنقل وروابط التواصل" },
  { value: "homepage", icon: Home, en: "Homepage", ar: "الصفحة الرئيسية", descEn: "Sections, covers & layout", descAr: "الأقسام والأغلفة والتخطيط" },
  { value: "cover", icon: Layout, en: "Covers & Themes", ar: "الأغلفة والمظهر", descEn: "Cover height, gradient & pages", descAr: "ارتفاع الغطاء والتدرج والصفحات" },
];

export default function DesignIdentityAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("brand-identity");
  const { settings, isLoading, saveSetting } = useSiteSettings();
  const { data: homepageSections = [] } = useHomepageSections();
  const updateSection = useUpdateHomepageSection();

  const handleSave = (key: string, value: Record<string, any>, category?: string) => {
    saveSetting.mutate({ key, value, category });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Palette}
        title={isAr ? "التصميم والهوية" : "Design & Identity"}
        description={isAr ? "إدارة الهوية البصرية والعلامة التجارية والمظهر العام للمنصة" : "Manage visual identity, branding, and overall platform appearance"}
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
          <Card className="rounded-2xl border-border/40 bg-muted/30 backdrop-blur overflow-hidden">
            <CardContent className="p-1.5 sm:p-2 relative">
              <TabsList className="flex sm:grid h-auto w-auto sm:w-full gap-1.5 overflow-x-auto scrollbar-none sm:overflow-visible sm:grid-cols-5 bg-transparent p-0 justify-start sm:justify-center">
                {tabs.map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex sm:flex-col items-center sm:items-start gap-1.5 sm:gap-0.5 rounded-xl px-3 py-2 sm:py-2.5 whitespace-nowrap sm:whitespace-normal sm:text-start transition-all duration-300 shrink-0 sm:shrink data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:shadow-primary/5 data-[state=active]:border data-[state=active]:border-primary/20 data-[state=active]:scale-[1.02] h-auto relative hover:bg-background/50"
                  >
                    <div className="flex items-center gap-1.5">
                      <tab.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-xs font-medium">{isAr ? tab.ar : tab.en}</span>
                    </div>
                    <span className="hidden sm:block text-[10px] text-muted-foreground leading-tight">
                      {isAr ? tab.descAr : tab.descEn}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-muted/30 to-transparent sm:hidden" />
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
            <HomepageTemplateSwitcher />
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
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
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
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
            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <HomepageSectionsManager />
              <div className="space-y-4">
                <HomepageLivePreview sections={homepageSections} isAr={isAr} />
                <SectionPresets
                  isAr={isAr}
                  isPending={updateSection.isPending}
                  onApply={(config) => {
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
        </Tabs>
      )}
    </div>
  );
}
