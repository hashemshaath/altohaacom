import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Ruler, Save } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const CONTAINER_PRESETS = [
  { id: "narrow", en: "Narrow (1024px)", ar: "ضيق (1024px)", value: 1024 },
  { id: "default", en: "Default (1280px)", ar: "افتراضي (1280px)", value: 1280 },
  { id: "wide", en: "Wide (1440px)", ar: "عريض (1440px)", value: 1440 },
  { id: "full", en: "Ultra Wide (1600px)", ar: "عريض جداً (1600px)", value: 1600 },
];

const RADIUS_PRESETS = [
  { id: "none", en: "None (0px)", ar: "بدون (0px)", value: 0 },
  { id: "sm", en: "Small (4px)", ar: "صغير (4px)", value: 4 },
  { id: "md", en: "Medium (8px)", ar: "متوسط (8px)", value: 8 },
  { id: "lg", en: "Large (12px)", ar: "كبير (12px)", value: 12 },
  { id: "xl", en: "Extra Large (16px)", ar: "كبير جداً (16px)", value: 16 },
  { id: "2xl", en: "Rounded (24px)", ar: "مستدير (24px)", value: 24 },
];

const SHADOW_PRESETS = [
  { id: "none", en: "No Shadow", ar: "بدون ظل", class: "shadow-none" },
  { id: "sm", en: "Subtle", ar: "خفيف", class: "shadow-sm" },
  { id: "md", en: "Medium", ar: "متوسط", class: "shadow-md" },
  { id: "lg", en: "Large", ar: "كبير", class: "shadow-lg" },
  { id: "xl", en: "Elevated", ar: "مرتفع", class: "shadow-xl" },
];

const SPACING_SCALES = [
  { id: "compact", en: "Compact", ar: "مضغوط", multiplier: 0.75 },
  { id: "default", en: "Default", ar: "افتراضي", multiplier: 1 },
  { id: "relaxed", en: "Relaxed", ar: "مريح", multiplier: 1.25 },
  { id: "spacious", en: "Spacious", ar: "واسع", multiplier: 1.5 },
];

export default function LayoutSpacingPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { settings, isLoading, saveSetting } = useSiteSettings();

  const layoutCfg = settings.layout || {};
  const [layout, setLayout] = useState({
    containerWidth: layoutCfg.containerWidth || 1280,
    borderRadius: layoutCfg.borderRadius || 12,
    shadowPreset: layoutCfg.shadowPreset || "md",
    spacingScale: layoutCfg.spacingScale || "default",
    sectionGap: layoutCfg.sectionGap || 48,
    cardPadding: layoutCfg.cardPadding || 24,
    contentPadding: layoutCfg.contentPadding || 16,
  });

  useEffect(() => {
    const cfg = settings.layout || {};
    setLayout({
      containerWidth: cfg.containerWidth || 1280,
      borderRadius: cfg.borderRadius || 12,
      shadowPreset: cfg.shadowPreset || "md",
      spacingScale: cfg.spacingScale || "default",
      sectionGap: cfg.sectionGap || 48,
      cardPadding: cfg.cardPadding || 24,
      contentPadding: cfg.contentPadding || 16,
    });
  }, [JSON.stringify(settings.layout)]);

  const handleSave = () => {
    saveSetting.mutate({ key: "layout", value: layout, category: "appearance" });
  };

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Ruler}
        title={isAr ? "التخطيط والتباعد" : "Layout & Spacing"}
        description={isAr ? "التحكم في أبعاد الحاويات والزوايا والظلال ومقاييس التباعد" : "Control container dimensions, border radius, shadows & spacing scales"}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Container Width */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isAr ? "عرض الحاوية" : "Container Width"}</CardTitle>
            <CardDescription className="text-xs">
              {isAr ? "الحد الأقصى لعرض المحتوى الرئيسي" : "Maximum width of the main content area"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {CONTAINER_PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setLayout({ ...layout, containerWidth: p.value })}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-start text-xs transition-all",
                    layout.containerWidth === p.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/40 hover:bg-muted/30"
                  )}
                >
                  {isAr ? p.ar : p.en}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{isAr ? "قيمة مخصصة" : "Custom Value"}</Label>
                <Badge variant="outline" className="text-[10px] font-mono">{layout.containerWidth}px</Badge>
              </div>
              <Slider value={[layout.containerWidth]} onValueChange={([v]) => setLayout({ ...layout, containerWidth: v })} min={768} max={1920} step={16} />
            </div>
            {/* Visual preview */}
            <div className="relative h-8 rounded-lg border border-border/30 bg-muted/20 overflow-hidden">
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 bg-primary/15 border-x border-primary/30" style={{ width: `${(layout.containerWidth / 1920) * 100}%` }} />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] text-muted-foreground">{layout.containerWidth}px / 1920px</span>
            </div>
          </CardContent>
        </Card>

        {/* Border Radius */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isAr ? "الزوايا المستديرة" : "Border Radius"}</CardTitle>
            <CardDescription className="text-xs">
              {isAr ? "درجة استدارة زوايا البطاقات والأزرار" : "Roundness of cards, buttons, and UI elements"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {RADIUS_PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setLayout({ ...layout, borderRadius: p.value })}
                  className={cn(
                    "border px-3 py-2.5 text-xs text-center transition-all",
                    layout.borderRadius === p.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/40 hover:bg-muted/30"
                  )}
                  style={{ borderRadius: p.value }}
                >
                  {isAr ? p.ar : p.en}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{isAr ? "قيمة مخصصة" : "Custom Value"}</Label>
                <Badge variant="outline" className="text-[10px] font-mono">{layout.borderRadius}px</Badge>
              </div>
              <Slider value={[layout.borderRadius]} onValueChange={([v]) => setLayout({ ...layout, borderRadius: v })} min={0} max={32} step={1} />
            </div>
            {/* Visual preview */}
            <div className="flex gap-3 items-center justify-center py-2">
              <div className="h-16 w-24 bg-primary/15 border border-primary/30" style={{ borderRadius: layout.borderRadius }} />
              <div className="h-8 w-20 bg-primary/20 border border-primary/30 flex items-center justify-center text-[9px] text-primary" style={{ borderRadius: Math.max(layout.borderRadius / 2, 4) }}>
                {isAr ? "زر" : "Button"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shadow Presets */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isAr ? "ظلال العناصر" : "Shadow Style"}</CardTitle>
            <CardDescription className="text-xs">
              {isAr ? "مستوى الظل الافتراضي للبطاقات والعناصر" : "Default shadow level for cards and components"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3">
              {SHADOW_PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setLayout({ ...layout, shadowPreset: p.id })}
                  className={cn(
                    "flex flex-col items-center gap-2 py-3 rounded-xl border transition-all",
                    layout.shadowPreset === p.id
                      ? "border-primary bg-primary/5"
                      : "border-border/40 hover:bg-muted/30"
                  )}
                >
                  <div className={cn("h-10 w-10 rounded-lg bg-card border border-border/20", p.class)} />
                  <span className="text-[10px]">{isAr ? p.ar : p.en}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Spacing Scale */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isAr ? "مقياس التباعد" : "Spacing Scale"}</CardTitle>
            <CardDescription className="text-xs">
              {isAr ? "تحكم في الكثافة العامة للمحتوى" : "Control overall content density"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {SPACING_SCALES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setLayout({ ...layout, spacingScale: s.id })}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-xs text-start transition-all",
                    layout.spacingScale === s.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/40 hover:bg-muted/30"
                  )}
                >
                  <span className="font-medium">{isAr ? s.ar : s.en}</span>
                  <span className="text-[10px] text-muted-foreground block">×{s.multiplier}</span>
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{isAr ? "تباعد الأقسام" : "Section Gap"}</Label>
                  <Badge variant="outline" className="text-[10px] font-mono">{layout.sectionGap}px</Badge>
                </div>
                <Slider value={[layout.sectionGap]} onValueChange={([v]) => setLayout({ ...layout, sectionGap: v })} min={16} max={96} step={4} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{isAr ? "حشو البطاقات" : "Card Padding"}</Label>
                  <Badge variant="outline" className="text-[10px] font-mono">{layout.cardPadding}px</Badge>
                </div>
                <Slider value={[layout.cardPadding]} onValueChange={([v]) => setLayout({ ...layout, cardPadding: v })} min={8} max={48} step={4} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={handleSave} disabled={saveSetting.isPending}>
          <Save className="h-4 w-4" />
          {isAr ? "حفظ التخطيط والتباعد" : "Save Layout & Spacing"}
        </Button>
      </div>
    </div>
  );
}
