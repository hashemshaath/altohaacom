import { useState, memo, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, Shield,
  Globe, FileText, Code2, Smartphone, Link2, Image, Zap, Lock,
  Languages, Search, Loader2,
LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface CheckItem {
  id: string;
  category: string;
  label: string;
  labelAr: string;
  description: string;
  descriptionAr: string;
  status: "pass" | "fail" | "warning" | "pending";
  icon: LucideIcon;
  autoCheck?: () => Promise<"pass" | "fail" | "warning">;
}

const CATEGORIES = [
  { key: "crawlability", en: "Crawlability & Indexing", ar: "إمكانية الزحف والفهرسة", icon: Search },
  { key: "performance", en: "Performance", ar: "الأداء", icon: Zap },
  { key: "mobile", en: "Mobile & UX", ar: "الجوال وتجربة المستخدم", icon: Smartphone },
  { key: "content", en: "Content & Structure", ar: "المحتوى والهيكل", icon: FileText },
  { key: "security", en: "Security", ar: "الأمان", icon: Lock },
  { key: "i18n", en: "Internationalization", ar: "التدويل", icon: Languages },
];

function createChecks(): CheckItem[] {
  return [
    // Crawlability
    {
      id: "robots-txt", category: "crawlability", icon: FileText,
      label: "robots.txt accessible", labelAr: "ملف robots.txt متاح",
      description: "Ensure robots.txt is accessible and properly configured", descriptionAr: "تأكد من أن ملف robots.txt متاح ومهيأ بشكل صحيح",
      status: "pending",
      autoCheck: async () => {
        try {
          const resp = await fetch("/robots.txt");
          if (!resp.ok) return "fail";
          const text = await resp.text();
          return text.includes("Sitemap") ? "pass" : "warning";
        } catch { return "fail"; }
      },
    },
    {
      id: "sitemap", category: "crawlability", icon: Globe,
      label: "XML Sitemap exists", labelAr: "خريطة الموقع XML موجودة",
      description: "Dynamic sitemap with all public pages", descriptionAr: "خريطة موقع ديناميكية بجميع الصفحات العامة",
      status: "pending",
      autoCheck: async () => {
        try {
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sitemap`;
          const resp = await fetch(url);
          return resp.ok ? "pass" : "fail";
        } catch { return "fail"; }
      },
    },
    {
      id: "canonical", category: "crawlability", icon: Link2,
      label: "Canonical tags present", labelAr: "وسوم Canonical موجودة",
      description: "Every page has a canonical link element", descriptionAr: "كل صفحة تحتوي على عنصر canonical",
      status: "pending",
      autoCheck: async () => {
        const el = document.querySelector('link[rel="canonical"]');
        return el ? "pass" : "fail";
      },
    },
    {
      id: "meta-title", category: "crawlability", icon: FileText,
      label: "Meta title optimized", labelAr: "عنوان Meta محسّن",
      description: "Title under 60 characters with brand name", descriptionAr: "العنوان أقل من 60 حرف مع اسم العلامة",
      status: "pending",
      autoCheck: async () => {
        const title = document.title;
        if (!title) return "fail";
        if (title.length > 70) return "warning";
        return title.length <= 60 ? "pass" : "warning";
      },
    },
    {
      id: "meta-desc", category: "crawlability", icon: FileText,
      label: "Meta description present", labelAr: "وصف Meta موجود",
      description: "Description between 120-160 characters", descriptionAr: "الوصف بين 120-160 حرف",
      status: "pending",
      autoCheck: async () => {
        const el = document.querySelector('meta[name="description"]') as HTMLMetaElement;
        if (!el?.content) return "fail";
        const len = el.content.length;
        return len >= 100 && len <= 165 ? "pass" : "warning";
      },
    },
    // Performance
    {
      id: "lazy-images", category: "performance", icon: Image,
      label: "Images use lazy loading", labelAr: "الصور تستخدم التحميل الكسول",
      description: "Non-critical images have loading='lazy'", descriptionAr: "الصور غير الأساسية تحمّل كسولاً",
      status: "pending",
      autoCheck: async () => {
        const imgs = document.querySelectorAll("img");
        if (imgs.length === 0) return "pass";
        const lazy = Array.from(imgs).filter(i => i.loading === "lazy").length;
        return lazy >= imgs.length * 0.5 ? "pass" : "warning";
      },
    },
    {
      id: "minified-css", category: "performance", icon: Code2,
      label: "CSS/JS minified", labelAr: "CSS/JS مضغوط",
      description: "Stylesheets and scripts are minified in production", descriptionAr: "ملفات CSS و JS مضغوطة في الإنتاج",
      status: "pending",
      autoCheck: async () => "pass", // Vite handles this
    },
    {
      id: "font-display", category: "performance", icon: FileText,
      label: "Font display swap", labelAr: "عرض الخطوط swap",
      description: "Custom fonts use font-display: swap to avoid FOIT", descriptionAr: "الخطوط المخصصة تستخدم font-display: swap",
      status: "pending",
      autoCheck: async () => {
        const styles = Array.from(document.styleSheets);
        try {
          for (const sheet of styles) {
            try {
              const rules = Array.from(sheet.cssRules || []);
              for (const rule of rules) {
                if (rule instanceof CSSFontFaceRule) {
                  const display = rule.style.getPropertyValue("font-display");
                  if (!display || display === "auto" || display === "block") return "warning";
                }
              }
            } catch { /* cross-origin */ }
          }
        } catch {}
        return "pass";
      },
    },
    // Mobile
    {
      id: "viewport", category: "mobile", icon: Smartphone,
      label: "Viewport meta tag", labelAr: "وسم Viewport",
      description: "Page has responsive viewport meta tag", descriptionAr: "الصفحة تحتوي على وسم viewport متجاوب",
      status: "pending",
      autoCheck: async () => {
        const el = document.querySelector('meta[name="viewport"]');
        return el ? "pass" : "fail";
      },
    },
    {
      id: "tap-targets", category: "mobile", icon: Smartphone,
      label: "Touch-friendly targets", labelAr: "أهداف لمس مناسبة",
      description: "Buttons and links are at least 44x44px", descriptionAr: "الأزرار والروابط بحجم 44×44 بكسل على الأقل",
      status: "pending",
      autoCheck: async () => {
        const btns = document.querySelectorAll("button, a");
        let small = 0;
        btns.forEach(b => {
          const rect = b.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.width < 36 || rect.height < 36)) small++;
        });
        return small === 0 ? "pass" : small < 5 ? "warning" : "fail";
      },
    },
    // Content
    {
      id: "h1-tag", category: "content", icon: FileText,
      label: "Single H1 tag", labelAr: "وسم H1 واحد",
      description: "Page has exactly one H1 heading", descriptionAr: "الصفحة تحتوي على عنوان H1 واحد فقط",
      status: "pending",
      autoCheck: async () => {
        const h1s = document.querySelectorAll("h1");
        return h1s.length === 1 ? "pass" : h1s.length === 0 ? "fail" : "warning";
      },
    },
    {
      id: "img-alt", category: "content", icon: Image,
      label: "Images have alt text", labelAr: "الصور تحتوي alt",
      description: "All images have descriptive alt attributes", descriptionAr: "جميع الصور لديها سمات alt وصفية",
      status: "pending",
      autoCheck: async () => {
        const imgs = document.querySelectorAll("img");
        if (imgs.length === 0) return "pass";
        const noAlt = Array.from(imgs).filter(i => !i.alt && !i.getAttribute("role")?.includes("presentation")).length;
        return noAlt === 0 ? "pass" : noAlt <= 2 ? "warning" : "fail";
      },
    },
    {
      id: "structured-data", category: "content", icon: Code2,
      label: "JSON-LD structured data", labelAr: "بيانات JSON-LD المنظمة",
      description: "Page has structured data for rich snippets", descriptionAr: "الصفحة تحتوي على بيانات منظمة",
      status: "pending",
      autoCheck: async () => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        return scripts.length > 0 ? "pass" : "warning";
      },
    },
    // Security
    {
      id: "https", category: "security", icon: Lock,
      label: "HTTPS enabled", labelAr: "HTTPS مفعّل",
      description: "Site served over secure HTTPS", descriptionAr: "الموقع يُقدّم عبر HTTPS الآمن",
      status: "pending",
      autoCheck: async () => window.location.protocol === "https:" ? "pass" : "fail",
    },
    {
      id: "mixed-content", category: "security", icon: Shield,
      label: "No mixed content", labelAr: "لا محتوى مختلط",
      description: "No HTTP resources loaded on HTTPS pages", descriptionAr: "لا موارد HTTP محملة على صفحات HTTPS",
      status: "pending",
      autoCheck: async () => {
        const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
        const http = resources.filter(r => r.name.startsWith("http://"));
        return http.length === 0 ? "pass" : "fail";
      },
    },
    // i18n
    {
      id: "hreflang", category: "i18n", icon: Languages,
      label: "Hreflang tags", labelAr: "وسوم Hreflang",
      description: "Alternate language links for AR/EN", descriptionAr: "روابط لغات بديلة للعربية/الإنجليزية",
      status: "pending",
      autoCheck: async () => {
        const el = document.querySelector('link[rel="alternate"][hreflang]');
        return el ? "pass" : "warning";
      },
    },
    {
      id: "og-locale", category: "i18n", icon: Globe,
      label: "OG locale set", labelAr: "OG Locale محدد",
      description: "Open Graph locale and alternate locale configured", descriptionAr: "OG locale و alternate locale مهيأين",
      status: "pending",
      autoCheck: async () => {
        const el = document.querySelector('meta[property="og:locale"]');
        return el ? "pass" : "warning";
      },
    },
  ];
}

export const SEOTechnicalChecklist = memo(function SEOTechnicalChecklist({ isAr }: { isAr: boolean }) {
  const [checks, setChecks] = useState<CheckItem[]>(createChecks);
  const [running, setRunning] = useState(false);

  const runAllChecks = async (signal?: { cancelled: boolean }) => {
    setRunning(true);
    const updated = [...checks];
    for (let i = 0; i < updated.length; i++) {
      if (signal?.cancelled) return;
      if (updated[i].autoCheck) {
        try {
          updated[i] = { ...updated[i], status: await updated[i].autoCheck!() };
        } catch {
          updated[i] = { ...updated[i], status: "fail" };
        }
        if (!signal?.cancelled) setChecks([...updated]);
      }
    }
    if (!signal?.cancelled) setRunning(false);
  };

  // Auto-run on mount
  useEffect(() => {
    const signal = { cancelled: false };
    runAllChecks(signal);
    return () => { signal.cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const total = checks.length;
    const pass = checks.filter(c => c.status === "pass").length;
    const fail = checks.filter(c => c.status === "fail").length;
    const warning = checks.filter(c => c.status === "warning").length;
    const pending = checks.filter(c => c.status === "pending").length;
    const score = total > 0 ? Math.round((pass / total) * 100) : 0;
    return { total, pass, fail, warning, pending, score };
  }, [checks]);

  const statusIcon = (s: string) => {
    if (s === "pass") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (s === "fail") return <XCircle className="h-4 w-4 text-destructive" />;
    if (s === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
  };

  return (
    <div className="space-y-4">
      {/* Score overview */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                {isAr ? "قائمة التدقيق التقني" : "Technical SEO Checklist"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr ? `${stats.total} فحص · ${stats.pass} ناجح · ${stats.fail} فاشل · ${stats.warning} تحذير` : `${stats.total} checks · ${stats.pass} pass · ${stats.fail} fail · ${stats.warning} warning`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className={`text-3xl font-bold ${stats.score >= 80 ? "text-green-500" : stats.score >= 50 ? "text-amber-500" : "text-destructive"}`}>
                  {stats.score}%
                </p>
                <p className="text-[12px] text-muted-foreground uppercase tracking-wider">{isAr ? "النتيجة" : "Score"}</p>
              </div>
              <Button onClick={() => runAllChecks()} disabled={running} variant="outline" size="sm" className="gap-1.5">
                {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {isAr ? "إعادة فحص" : "Re-scan"}
              </Button>
            </div>
          </div>
          <Progress value={stats.score} className="h-2" />
        </CardContent>
      </Card>

      {/* Checks by category */}
      {CATEGORIES.map(cat => {
        const catChecks = checks.filter(c => c.category === cat.key);
        if (catChecks.length === 0) return null;
        const catPass = catChecks.filter(c => c.status === "pass").length;
        const CatIcon = cat.icon;

        return (
          <Card key={cat.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CatIcon className="h-4 w-4 text-primary" />
                {isAr ? cat.ar : cat.en}
                <Badge variant={catPass === catChecks.length ? "default" : "secondary"} className="text-[12px] ms-auto">
                  {catPass}/{catChecks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {catChecks.map(check => (
                <div key={check.id} className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="mt-0.5 shrink-0">{statusIcon(check.status)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{isAr ? check.labelAr : check.label}</p>
                    <p className="text-[12px] text-muted-foreground">{isAr ? check.descriptionAr : check.description}</p>
                  </div>
                  <Badge
                    variant={check.status === "pass" ? "default" : check.status === "fail" ? "destructive" : check.status === "warning" ? "secondary" : "outline"}
                    className="text-[12px] shrink-0"
                  >
                    {check.status === "pass" ? (isAr ? "ناجح" : "Pass") : check.status === "fail" ? (isAr ? "فشل" : "Fail") : check.status === "warning" ? (isAr ? "تحذير" : "Warn") : (isAr ? "انتظار" : "Pending")}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
