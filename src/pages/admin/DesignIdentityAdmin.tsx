import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Palette,
  Sparkles,
  Globe,
  PanelTop,
  Home,
  Layers,
  Type,
  ArrowRight,
  CheckCircle2,
  Circle,
  Image,
  LayoutGrid,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { useFadeIn, useStaggeredReveal } from "@/hooks/useStaggeredAnimation";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const designSections = [
  {
    to: "/admin/design/brand-identity",
    icon: Sparkles,
    enTitle: "Brand Identity",
    arTitle: "الهوية البصرية",
    enDesc: "Logos, color palette, contrast checker, status colors & seasonal identities",
    arDesc: "الشعارات، لوحة الألوان، فحص التباين، ألوان الحالات والهويات الموسمية",
    settingsKey: "brand_identity",
    accent: "from-amber-500/20 to-orange-500/20",
  },
  {
    to: "/admin/design/branding",
    icon: Globe,
    enTitle: "Branding",
    arTitle: "العلامة التجارية",
    enDesc: "Site name, description, contact info, favicon & registration settings",
    arDesc: "اسم الموقع، الوصف، معلومات الاتصال، الأيقونة وإعدادات التسجيل",
    settingsKey: "branding",
    accent: "from-blue-500/20 to-indigo-500/20",
  },
  {
    to: "/admin/design/header-footer",
    icon: PanelTop,
    enTitle: "Header & Footer",
    arTitle: "الرأس والتذييل",
    enDesc: "Navigation visibility, social links, copyright text & sticky behavior",
    arDesc: "عناصر التنقل، روابط التواصل، نص حقوق النشر والسلوك الثابت",
    settingsKey: "header",
    accent: "from-emerald-500/20 to-teal-500/20",
  },
  {
    to: "/admin/design/homepage",
    icon: Home,
    enTitle: "Homepage",
    arTitle: "الصفحة الرئيسية",
    enDesc: "Section management, template switching, hero slides & live preview",
    arDesc: "إدارة الأقسام، تبديل القوالب، شرائح البطل والمعاينة المباشرة",
    settingsKey: "homepage",
    accent: "from-violet-500/20 to-purple-500/20",
  },
  {
    to: "/admin/design/covers",
    icon: Layers,
    enTitle: "Covers & Themes",
    arTitle: "الأغلفة والمظهر",
    enDesc: "Cover gradients, per-page modes, theme presets & color schemes",
    arDesc: "تدرجات الأغلفة، أوضاع لكل صفحة، قوالب المظهر وأنظمة الألوان",
    settingsKey: "cover",
    accent: "from-rose-500/20 to-pink-500/20",
  },
  {
    to: "/admin/design/typography",
    icon: Type,
    enTitle: "Typography",
    arTitle: "الخطوط",
    enDesc: "Body and heading fonts, live preview & global font configuration",
    arDesc: "خطوط النص والعناوين، معاينة مباشرة وإعدادات الخطوط العامة",
    settingsKey: "typography",
    accent: "from-cyan-500/20 to-sky-500/20",
  },
];

export default function DesignIdentityAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { settings } = useSiteSettings();
  const { data: homepageSections = [] } = useHomepageSections();
  const { getStyle } = useStaggeredReveal(designSections.length, 60);

  // Calculate completion
  const configuredCount = designSections.filter(s => {
    const val = settings[s.settingsKey];
    return val && Object.keys(val).length > 0;
  }).length;
  const completionPercent = Math.round((configuredCount / designSections.length) * 100);

  const visibleSections = homepageSections.filter((s: any) => s.is_visible).length;
  const totalSections = homepageSections.length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Palette}
        title={isAr ? "التصميم والهوية" : "Design & Identity"}
        description={isAr ? "مركز التحكم الشامل بالهوية البصرية والمظهر العام للمنصة" : "Comprehensive control center for visual identity and platform appearance"}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Palette, value: configuredCount, label: isAr ? "أقسام مهيأة" : "Configured", suffix: `/${designSections.length}` },
          { icon: Image, value: Object.keys(settings.brand_identity?.logos || {}).filter(k => settings.brand_identity?.logos?.[k]).length, label: isAr ? "شعارات مرفوعة" : "Logos Uploaded" },
          { icon: LayoutGrid, value: visibleSections, label: isAr ? "أقسام مرئية" : "Visible Sections", suffix: `/${totalSections}` },
          { icon: CheckCircle2, value: completionPercent, label: isAr ? "اكتمال التهيئة" : "Setup Complete", suffix: "%" },
        ].map((item, i) => (
          <Card key={i} className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5" style={getStyle(i)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold tabular-nums">
                  <AnimatedCounter value={item.value} />{item.suffix}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Bar */}
      <Card className="rounded-2xl border-border/40">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium">{isAr ? "اكتمال التصميم والهوية" : "Design & Identity Completion"}</p>
            <span className="text-xs text-muted-foreground">{configuredCount}/{designSections.length} {isAr ? "أقسام" : "sections"}</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Section Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {designSections.map((section, i) => {
          const isConfigured = !!settings[section.settingsKey] && Object.keys(settings[section.settingsKey]).length > 0;
          return (
            <Link key={section.to} to={section.to} className="group" style={getStyle(i)}>
              <Card className="h-full rounded-2xl border-border/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30 overflow-hidden">
                <div className={`h-1.5 bg-gradient-to-r ${section.accent}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                        <section.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{isAr ? section.arTitle : section.enTitle}</CardTitle>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isConfigured ? (
                            <Badge variant="secondary" className="text-[9px] gap-1 py-0">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              {isAr ? "مهيأ" : "Configured"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] gap-1 py-0 text-muted-foreground">
                              <Circle className="h-2.5 w-2.5" />
                              {isAr ? "غير مهيأ" : "Not Configured"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-xs leading-relaxed">
                    {isAr ? section.arDesc : section.enDesc}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "إجراءات سريعة" : "Quick Actions"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="justify-start gap-2 h-auto py-3" asChild>
              <Link to="/admin/hero-slides">
                <Layers className="h-4 w-4 text-primary" />
                <div className="text-start">
                  <p className="text-xs font-medium">{isAr ? "شرائح البطل" : "Hero Slides"}</p>
                  <p className="text-[10px] text-muted-foreground">{isAr ? "إدارة شرائح الصفحة الرئيسية" : "Manage homepage hero slides"}</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="justify-start gap-2 h-auto py-3" asChild>
              <Link to="/admin/homepage-sections">
                <LayoutGrid className="h-4 w-4 text-primary" />
                <div className="text-start">
                  <p className="text-xs font-medium">{isAr ? "أقسام الصفحة الرئيسية" : "Homepage Sections"}</p>
                  <p className="text-[10px] text-muted-foreground">{isAr ? "ترتيب وتخصيص الأقسام" : "Order & customize sections"}</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="justify-start gap-2 h-auto py-3" asChild>
              <Link to="/admin/design/covers">
                <Palette className="h-4 w-4 text-primary" />
                <div className="text-start">
                  <p className="text-xs font-medium">{isAr ? "قوالب المظهر" : "Theme Presets"}</p>
                  <p className="text-[10px] text-muted-foreground">{isAr ? "تغيير نظام الألوان" : "Change color scheme"}</p>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
