import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Code2, Save, RotateCcw, Eye, AlertTriangle, Copy, Check } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const CSS_VARIABLE_GROUPS = [
  {
    id: "colors",
    en: "Colors",
    ar: "الألوان",
    vars: [
      { name: "--primary", en: "Primary", ar: "اللون الأساسي", placeholder: "40 72% 50%" },
      { name: "--secondary", en: "Secondary", ar: "اللون الثانوي", placeholder: "25 55% 22%" },
      { name: "--accent", en: "Accent", ar: "اللون المميز", placeholder: "15 50% 42%" },
      { name: "--background", en: "Background", ar: "الخلفية", placeholder: "42 35% 97%" },
      { name: "--foreground", en: "Foreground", ar: "النص", placeholder: "25 45% 8%" },
      { name: "--muted", en: "Muted", ar: "صامت", placeholder: "36 14% 92%" },
      { name: "--card", en: "Card", ar: "البطاقة", placeholder: "40 30% 95%" },
    ],
  },
  {
    id: "sizing",
    en: "Sizing",
    ar: "الأحجام",
    vars: [
      { name: "--radius", en: "Border Radius", ar: "الزوايا", placeholder: "0.75rem" },
      { name: "--sidebar-width", en: "Sidebar Width", ar: "عرض الشريط الجانبي", placeholder: "16rem" },
    ],
  },
];

const CSS_SNIPPETS = [
  {
    id: "glass",
    en: "Glassmorphism Cards",
    ar: "بطاقات زجاجية",
    code: `.glass-card {\n  background: hsl(var(--card) / 0.6);\n  backdrop-filter: blur(12px);\n  border: 1px solid hsl(var(--border) / 0.3);\n}`,
  },
  {
    id: "gradient-text",
    en: "Gradient Heading",
    ar: "عنوان متدرج",
    code: `.gradient-text {\n  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n}`,
  },
  {
    id: "smooth-hover",
    en: "Smooth Card Hover",
    ar: "تأثير مرور ناعم",
    code: `.hover-lift {\n  transition: transform 0.3s ease, box-shadow 0.3s ease;\n}\n.hover-lift:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 24px hsl(var(--primary) / 0.1);\n}`,
  },
  {
    id: "hide-scrollbar",
    en: "Hide Scrollbar",
    ar: "إخفاء شريط التمرير",
    code: `.no-scrollbar {\n  -ms-overflow-style: none;\n  scrollbar-width: none;\n}\n.no-scrollbar::-webkit-scrollbar {\n  display: none;\n}`,
  },
];

export default function CustomCSSPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { settings, isLoading, saveSetting } = useSiteSettings();

  const cssCfg = settings.custom_css || {};
  const [customCSS, setCustomCSS] = useState(cssCfg.code || "");
  const [isEnabled, setIsEnabled] = useState(cssCfg.enabled ?? false);
  const [cssVarOverrides, setCssVarOverrides] = useState<Record<string, string>>(cssCfg.varOverrides || {});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const cfg = settings.custom_css || {};
    setCustomCSS(cfg.code || "");
    setIsEnabled(cfg.enabled ?? false);
    setCssVarOverrides(cfg.varOverrides || {});
  }, [JSON.stringify(settings.custom_css)]);

  const handleSave = () => {
    saveSetting.mutate({
      key: "custom_css",
      value: { code: customCSS, enabled: isEnabled, varOverrides: cssVarOverrides },
      category: "appearance",
    });
  };

  const copySnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const insertSnippet = (code: string) => {
    setCustomCSS(prev => prev ? `${prev}\n\n${code}` : code);
  };

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;

  const lineCount = customCSS.split("\n").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Code2}
        title={isAr ? "CSS مخصص" : "Custom CSS"}
        description={isAr ? "حقن أنماط مخصصة وتجاوز متغيرات CSS للتحكم المتقدم بالمظهر" : "Inject custom styles and override CSS variables for advanced theming control"}
      />

      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="w-full flex h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="editor" className="text-xs gap-1.5 flex-1">
            <Code2 className="h-3.5 w-3.5" />{isAr ? "محرر CSS" : "CSS Editor"}
          </TabsTrigger>
          <TabsTrigger value="variables" className="text-xs gap-1.5 flex-1">
            <Eye className="h-3.5 w-3.5" />{isAr ? "متغيرات CSS" : "CSS Variables"}
          </TabsTrigger>
          <TabsTrigger value="snippets" className="text-xs gap-1.5 flex-1">
            <Copy className="h-3.5 w-3.5" />{isAr ? "قوالب جاهزة" : "Snippets"}
          </TabsTrigger>
        </TabsList>

        {/* CSS Editor */}
        <TabsContent value="editor" className="mt-4 space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{isAr ? "محرر الأنماط المخصصة" : "Custom Styles Editor"}</CardTitle>
                  <CardDescription className="text-xs">
                    {isAr ? "اكتب CSS مخصص يُطبّق على جميع صفحات الموقع" : "Write custom CSS applied globally across all pages"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">{isAr ? "مفعّل" : "Enabled"}</Label>
                  <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isEnabled && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    {isAr ? "CSS المخصص معطّل حالياً. فعّله لتطبيق الأنماط." : "Custom CSS is currently disabled. Enable it to apply styles."}
                  </span>
                </div>
              )}
              <div className="relative">
                <Textarea
                  value={customCSS}
                  onChange={(e) => setCustomCSS(e.target.value)}
                  placeholder={isAr ? "/* اكتب CSS المخصص هنا */\n\n.my-class {\n  color: hsl(var(--primary));\n}" : "/* Write your custom CSS here */\n\n.my-class {\n  color: hsl(var(--primary));\n}"}
                  className="font-mono text-xs min-h-[300px] resize-y leading-relaxed"
                  dir="ltr"
                />
                <div className="absolute bottom-2 end-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] font-mono">{lineCount} {isAr ? "سطر" : "lines"}</Badge>
                  <Badge variant="outline" className="text-[9px] font-mono">{customCSS.length} {isAr ? "حرف" : "chars"}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saveSetting.isPending}>
                  <Save className="h-3.5 w-3.5" />{isAr ? "حفظ" : "Save"}
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCustomCSS("")}>
                  <RotateCcw className="h-3.5 w-3.5" />{isAr ? "مسح" : "Clear"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSS Variables Override */}
        <TabsContent value="variables" className="mt-4 space-y-4">
          {CSS_VARIABLE_GROUPS.map(group => (
            <Card key={group.id} className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{isAr ? group.ar : group.en}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.vars.map(v => (
                    <div key={v.name} className="space-y-1">
                      <Label className="text-xs flex items-center gap-1.5">
                        <code className="text-[10px] font-mono text-primary">{v.name}</code>
                        <span className="text-muted-foreground">— {isAr ? v.ar : v.en}</span>
                      </Label>
                      <div className="flex gap-2 items-center">
                        {v.name.includes("color") || group.id === "colors" ? (
                          <div className="h-8 w-8 rounded-lg border border-border/30 shrink-0" style={{ backgroundColor: cssVarOverrides[v.name] ? `hsl(${cssVarOverrides[v.name]})` : undefined }} />
                        ) : null}
                        <Input
                          value={cssVarOverrides[v.name] || ""}
                          onChange={(e) => setCssVarOverrides({ ...cssVarOverrides, [v.name]: e.target.value })}
                          placeholder={v.placeholder}
                          className="text-xs font-mono h-8"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saveSetting.isPending}>
              <Save className="h-3.5 w-3.5" />{isAr ? "حفظ المتغيرات" : "Save Variables"}
            </Button>
          </div>
        </TabsContent>

        {/* Snippets */}
        <TabsContent value="snippets" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {CSS_SNIPPETS.map(snippet => (
              <Card key={snippet.id} className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{isAr ? snippet.ar : snippet.en}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <pre className="text-[10px] font-mono bg-muted/50 rounded-lg p-3 overflow-x-auto leading-relaxed" dir="ltr">
                    {snippet.code}
                  </pre>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => copySnippet(snippet.code, snippet.id)}>
                      {copied === snippet.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied === snippet.id ? (isAr ? "تم" : "Copied") : (isAr ? "نسخ" : "Copy")}
                    </Button>
                    <Button size="sm" variant="secondary" className="gap-1 text-xs h-7" onClick={() => insertSnippet(snippet.code)}>
                      <Code2 className="h-3 w-3" />
                      {isAr ? "إدراج" : "Insert"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
