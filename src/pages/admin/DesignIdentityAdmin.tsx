import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Palette, Sparkles, Globe, PanelTop, Home, Layers, Type,
  ArrowRight, CheckCircle2, Circle, Image, LayoutGrid,
  AlertTriangle, Eye, Moon, Sun, Download, Shield, Ruler, Code2,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { useFadeIn, useStaggeredReveal } from "@/hooks/useStaggeredAnimation";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";

const designSections = [
  {
    to: "/admin/design/brand-identity", icon: Sparkles,
    enTitle: "Brand Identity", arTitle: "الهوية البصرية",
    enDesc: "Logos, color palette, contrast checker, status colors & seasonal identities",
    arDesc: "الشعارات، لوحة الألوان، فحص التباين، ألوان الحالات والهويات الموسمية",
    settingsKey: "brand_identity", accent: "from-amber-500/20 to-orange-500/20",
  },
  {
    to: "/admin/design/branding", icon: Globe,
    enTitle: "Branding", arTitle: "العلامة التجارية",
    enDesc: "Site name, description, contact info, favicon & registration settings",
    arDesc: "اسم الموقع، الوصف، معلومات الاتصال، الأيقونة وإعدادات التسجيل",
    settingsKey: "branding", accent: "from-blue-500/20 to-indigo-500/20",
  },
  {
    to: "/admin/design/header-footer", icon: PanelTop,
    enTitle: "Header & Footer", arTitle: "الرأس والتذييل",
    enDesc: "Navigation visibility, social links, copyright text & sticky behavior",
    arDesc: "عناصر التنقل، روابط التواصل، نص حقوق النشر والسلوك الثابت",
    settingsKey: "header", accent: "from-emerald-500/20 to-teal-500/20",
  },
  {
    to: "/admin/design/homepage", icon: Home,
    enTitle: "Homepage", arTitle: "الصفحة الرئيسية",
    enDesc: "Section management, template switching, hero slides & live preview",
    arDesc: "إدارة الأقسام، تبديل القوالب، شرائح البطل والمعاينة المباشرة",
    settingsKey: "homepage", accent: "from-violet-500/20 to-purple-500/20",
  },
  {
    to: "/admin/design/covers", icon: Layers,
    enTitle: "Covers & Themes", arTitle: "الأغلفة والمظهر",
    enDesc: "Cover gradients, per-page modes, theme presets & color schemes",
    arDesc: "تدرجات الأغلفة، أوضاع لكل صفحة، قوالب المظهر وأنظمة الألوان",
    settingsKey: "cover", accent: "from-rose-500/20 to-pink-500/20",
  },
  {
    to: "/admin/design/typography", icon: Type,
    enTitle: "Typography", arTitle: "الخطوط",
    enDesc: "Body and heading fonts, live preview & global font configuration",
    arDesc: "خطوط النص والعناوين، معاينة مباشرة وإعدادات الخطوط العامة",
    settingsKey: "typography", accent: "from-cyan-500/20 to-sky-500/20",
  },
  {
    to: "/admin/design/layout", icon: Ruler,
    enTitle: "Layout & Spacing", arTitle: "التخطيط والتباعد",
    enDesc: "Container width, border radius, spacing scale & shadow presets",
    arDesc: "عرض الحاوية، الزوايا المستديرة، مقاييس التباعد وظلال العناصر",
    settingsKey: "layout", accent: "from-lime-500/20 to-green-500/20",
  },
  {
    to: "/admin/design/custom-css", icon: Code2,
    enTitle: "Custom CSS", arTitle: "CSS مخصص",
    enDesc: "Inject custom styles, override CSS variables & advanced theming",
    arDesc: "حقن أنماط مخصصة، تجاوز متغيرات CSS والتخصيص المتقدم",
    settingsKey: "custom_css", accent: "from-fuchsia-500/20 to-pink-500/20",
  },
];

/* ── Design Audit Checks ── */
function getAuditChecks(settings: Record<string, any>, homepageSections: any[], isAr: boolean) {
  const bi = settings.brand_identity || {};
  const br = settings.branding || {};
  const hd = settings.header || {};
  const ft = settings.footer || {};
  const ty = settings.typography || {};
  const th = settings.theme || {};
  const cv = settings.cover || {};

  return [
    { id: "logo", pass: !!bi.logos?.natural, en: "Primary logo uploaded", ar: "تم رفع الشعار الأساسي" },
    { id: "logo-white", pass: !!bi.logos?.white, en: "White logo version uploaded", ar: "تم رفع النسخة البيضاء من الشعار" },
    { id: "logo-black", pass: !!bi.logos?.black, en: "Black logo version uploaded", ar: "تم رفع النسخة السوداء من الشعار" },
    { id: "colors", pass: !!bi.primaryColors?.primary, en: "Brand colors defined", ar: "تم تحديد ألوان العلامة" },
    { id: "site-name", pass: !!br.siteName && !!br.siteNameAr, en: "Site name (EN & AR)", ar: "اسم الموقع (إنجليزي وعربي)" },
    { id: "favicon", pass: !!br.faviconUrl, en: "Favicon configured", ar: "تم تهيئة الأيقونة المفضلة" },
    { id: "theme", pass: !!th.preset, en: "Theme preset selected", ar: "تم اختيار قالب المظهر" },
    { id: "typo", pass: !!ty.bodyFont && !!ty.headingFont, en: "Typography configured", ar: "تم تهيئة الخطوط" },
    { id: "social", pass: !!ft.instagramUrl || !!ft.xUrl, en: "Social links added", ar: "تمت إضافة روابط التواصل" },
    { id: "cover", pass: !!cv.gradientColor, en: "Cover gradient configured", ar: "تم تهيئة تدرج الغلاف" },
    { id: "homepage", pass: homepageSections.filter((s: any) => s.is_visible).length >= 3, en: "3+ homepage sections visible", ar: "3+ أقسام مرئية بالصفحة الرئيسية" },
    { id: "contact", pass: !!br.contactEmail, en: "Contact email set", ar: "تم تعيين بريد التواصل" },
  ];
}

export default function DesignIdentityAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { settings } = useSiteSettings();
  const { data: homepageSections = [] } = useHomepageSections();
  const { getStyle } = useStaggeredReveal(designSections.length + 4, 50);

  const configuredCount = designSections.filter(s => {
    const val = settings[s.settingsKey];
    return val && Object.keys(val).length > 0;
  }).length;
  const completionPercent = Math.round((configuredCount / designSections.length) * 100);
  const visibleSections = homepageSections.filter((s: any) => s.is_visible).length;
  const totalSections = homepageSections.length;

  const auditChecks = getAuditChecks(settings, homepageSections, isAr);
  const auditScore = Math.round((auditChecks.filter(c => c.pass).length / auditChecks.length) * 100);

  // Export design tokens
  const exportDesignTokens = () => {
    const tokens = {
      brand_identity: settings.brand_identity || {},
      branding: settings.branding || {},
      theme: settings.theme || {},
      typography: settings.typography || {},
      cover: settings.cover || {},
      layout: settings.layout || {},
      custom_css: settings.custom_css || {},
      header: settings.header || {},
      footer: settings.footer || {},
    };
    const blob = new Blob([JSON.stringify(tokens, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `design-tokens-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <AdminPageHeader
          icon={Palette}
          title={isAr ? "التصميم والهوية" : "Design & Identity"}
          description={isAr ? "مركز التحكم الشامل بالهوية البصرية والمظهر العام للمنصة" : "Comprehensive control center for visual identity and platform appearance"}
        />
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={exportDesignTokens}>
          <Download className="h-3.5 w-3.5" />
          {isAr ? "تصدير الرموز" : "Export Tokens"}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Palette, value: configuredCount, label: isAr ? "أقسام مهيأة" : "Configured", suffix: `/${designSections.length}` },
          { icon: Image, value: Object.keys(settings.brand_identity?.logos || {}).filter(k => settings.brand_identity?.logos?.[k]).length, label: isAr ? "شعارات مرفوعة" : "Logos Uploaded" },
          { icon: LayoutGrid, value: visibleSections, label: isAr ? "أقسام مرئية" : "Visible Sections", suffix: `/${totalSections}` },
          { icon: Shield, value: auditScore, label: isAr ? "صحة التصميم" : "Design Health", suffix: "%" },
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

      {/* Progress + Audit side-by-side */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* Progress */}
        <Card className="rounded-2xl border-border/40">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">{isAr ? "اكتمال التهيئة" : "Setup Completion"}</p>
              <span className="text-xs text-muted-foreground">{configuredCount}/{designSections.length}</span>
            </div>
            <Progress value={completionPercent} className="h-2" />
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">{isAr ? "صحة التصميم" : "Design Health"}</p>
              <Badge variant={auditScore >= 80 ? "secondary" : auditScore >= 50 ? "outline" : "destructive"} className="text-[10px]">
                {auditScore}%
              </Badge>
            </div>
            <Progress value={auditScore} className="h-2" />
          </CardContent>
        </Card>

        {/* Design Audit */}
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              {isAr ? "تدقيق التصميم" : "Design Audit"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 max-h-[160px] overflow-y-auto scrollbar-none">
              {auditChecks.map(check => (
                <div key={check.id} className="flex items-center gap-1.5 py-0.5">
                  {check.pass ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                  )}
                  <span className={cn("text-[10px] truncate", check.pass ? "text-muted-foreground" : "text-foreground font-medium")}>
                    {isAr ? check.ar : check.en}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dark/Light Preview */}
      <Card className="rounded-2xl border-border/40 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            {isAr ? "معاينة المظهر" : "Theme Preview"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Light Preview */}
            <div className="rounded-xl border border-border/40 overflow-hidden bg-[hsl(0_0%_100%)]">
              <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/20 bg-[hsl(0_0%_98%)]">
                <Sun className="h-3 w-3 text-amber-500" />
                <span className="text-[9px] font-medium text-[hsl(0_0%_10%)]">{isAr ? "فاتح" : "Light"}</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="h-3 w-3/4 rounded bg-[hsl(0_0%_90%)]" />
                <div className="h-2 w-full rounded bg-[hsl(0_0%_94%)]" />
                <div className="h-2 w-5/6 rounded bg-[hsl(0_0%_94%)]" />
                <div className="flex gap-1.5 pt-1">
                  <div className="h-5 w-12 rounded-md" style={{ backgroundColor: settings.brand_identity?.primaryColors?.primary ? `hsl(${settings.brand_identity.primaryColors.primary})` : "hsl(var(--primary))" }} />
                  <div className="h-5 w-12 rounded-md border border-[hsl(0_0%_85%)] bg-[hsl(0_0%_100%)]" />
                </div>
              </div>
            </div>
            {/* Dark Preview */}
            <div className="rounded-xl border border-border/40 overflow-hidden bg-[hsl(0_0%_8%)]">
              <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[hsl(0_0%_15%)] bg-[hsl(0_0%_6%)]">
                <Moon className="h-3 w-3 text-blue-400" />
                <span className="text-[9px] font-medium text-[hsl(0_0%_90%)]">{isAr ? "داكن" : "Dark"}</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="h-3 w-3/4 rounded bg-[hsl(0_0%_18%)]" />
                <div className="h-2 w-full rounded bg-[hsl(0_0%_14%)]" />
                <div className="h-2 w-5/6 rounded bg-[hsl(0_0%_14%)]" />
                <div className="flex gap-1.5 pt-1">
                  <div className="h-5 w-12 rounded-md" style={{ backgroundColor: settings.brand_identity?.primaryColors?.primary ? `hsl(${settings.brand_identity.primaryColors.primary})` : "hsl(var(--primary))" }} />
                  <div className="h-5 w-12 rounded-md border border-[hsl(0_0%_20%)] bg-[hsl(0_0%_12%)]" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {designSections.map((section, i) => {
          const isConfigured = !!settings[section.settingsKey] && Object.keys(settings[section.settingsKey]).length > 0;
          return (
            <Link key={section.to} to={section.to} className="group" style={getStyle(i + 4)}>
              <Card className="h-full rounded-2xl border-border/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30 overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${section.accent}`} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                      <section.icon className="h-4 w-4 text-primary" />
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </div>
                  <p className="text-sm font-semibold mb-0.5">{isAr ? section.arTitle : section.enTitle}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mb-2">
                    {isAr ? section.arDesc : section.enDesc}
                  </p>
                  {isConfigured ? (
                    <Badge variant="secondary" className="text-[9px] gap-1 py-0">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      {isAr ? "مهيأ" : "Configured"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] gap-1 py-0 text-muted-foreground">
                      <Circle className="h-2.5 w-2.5" />
                      {isAr ? "غير مهيأ" : "Not Set"}
                    </Badge>
                  )}
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
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: "/admin/hero-slides", icon: Layers, en: "Hero Slides", ar: "شرائح البطل", descEn: "Manage hero slides", descAr: "إدارة شرائح البطل" },
              { to: "/admin/homepage-sections", icon: LayoutGrid, en: "Homepage Sections", ar: "أقسام الصفحة", descEn: "Order & customize", descAr: "ترتيب وتخصيص" },
              { to: "/admin/design/covers", icon: Palette, en: "Theme Presets", ar: "قوالب المظهر", descEn: "Change color scheme", descAr: "تغيير نظام الألوان" },
              { to: "/admin/design/custom-css", icon: Code2, en: "Custom CSS", ar: "CSS مخصص", descEn: "Advanced styling", descAr: "تخصيص متقدم" },
            ].map(action => (
              <Button key={action.to} variant="outline" className="justify-start gap-2 h-auto py-3" asChild>
                <Link to={action.to}>
                  <action.icon className="h-4 w-4 text-primary" />
                  <div className="text-start">
                    <p className="text-xs font-medium">{isAr ? action.ar : action.en}</p>
                    <p className="text-[10px] text-muted-foreground">{isAr ? action.descAr : action.descEn}</p>
                  </div>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
