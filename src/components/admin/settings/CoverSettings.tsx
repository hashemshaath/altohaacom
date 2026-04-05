import { useState, useEffect, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, Image, Layers, Eye, Palette, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Circle, CornerDownRight, LayoutTemplate } from "lucide-react";
import type { CoverMode, GradientDirection } from "@/hooks/useCoverSettings";
import { COVER_TEMPLATES } from "@/hooks/useCoverSettings";

interface Props {
  settings: Record<string, any>;
  onSave: (key: string, value: Record<string, any>, category?: string) => void;
  isPending: boolean;
}

const PAGE_OPTIONS: { slug: string; en: string; ar: string }[] = [
  { slug: "home", en: "Home Page", ar: "الصفحة الرئيسية" },
  { slug: "competitions", en: "Competitions", ar: "المسابقات" },
  { slug: "competition-detail", en: "Competition Detail", ar: "تفاصيل المسابقة" },
  { slug: "exhibitions", en: "Exhibitions", ar: "المعارض" },
  { slug: "exhibition-detail", en: "Exhibition Detail", ar: "تفاصيل المعرض" },
  { slug: "community", en: "Community", ar: "المجتمع" },
  { slug: "masterclasses", en: "Masterclasses", ar: "الدورات التعليمية" },
  { slug: "shop", en: "Shop", ar: "المتجر" },
  { slug: "chefs-table", en: "Chef's Table", ar: "طاولة الشيف" },
  { slug: "entities", en: "Entities", ar: "الجهات" },
  { slug: "knowledge", en: "Knowledge Portal", ar: "بوابة المعرفة" },
  { slug: "tastings", en: "Tastings", ar: "التذوق" },
  { slug: "profile", en: "Profile", ar: "الملف الشخصي" },
];

const MODE_OPTIONS: { value: CoverMode; en: string; ar: string }[] = [
  { value: "full", en: "Full Cover (520px)", ar: "غطاء كامل (520px)" },
  { value: "medium", en: "Medium Cover (340px)", ar: "غطاء متوسط (340px)" },
  { value: "small", en: "Small Cover (200px)", ar: "غطاء صغير (200px)" },
  { value: "none", en: "No Cover", ar: "بدون غطاء" },
];

const DIRECTION_OPTIONS: { value: GradientDirection; en: string; ar: string; icon: typeof ArrowUp }[] = [
  { value: "to-top", en: "Bottom → Top", ar: "أسفل → أعلى", icon: ArrowUp },
  { value: "to-bottom", en: "Top → Bottom", ar: "أعلى → أسفل", icon: ArrowDown },
  { value: "to-left", en: "Right → Left", ar: "يمين → يسار", icon: ArrowLeft },
  { value: "to-right", en: "Left → Right", ar: "يسار → يمين", icon: ArrowRight },
  { value: "radial", en: "Radial (Center)", ar: "شعاعي (من المركز)", icon: Circle },
  { value: "diagonal", en: "Diagonal (135°)", ar: "قطري (135°)", icon: CornerDownRight },
];

const PRESET_COLORS = [
  { hex: "#0a0a0a", label: "Black" },
  { hex: "#1a1a2e", label: "Dark Navy" },
  { hex: "#16213e", label: "Deep Blue" },
  { hex: "#1b1a17", label: "Charcoal" },
  { hex: "#2d132c", label: "Dark Purple" },
  { hex: "#1a1a1a", label: "Neutral" },
  { hex: "#0f3460", label: "Royal Blue" },
  { hex: "#3a0000", label: "Dark Red" },
  { hex: "#1e3a29", label: "Forest" },
  { hex: "#2c2c34", label: "Gunmetal" },
];

export const CoverSettings = memo(function CoverSettings({ settings, onSave, isPending }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const coverCfg = settings.cover || {};

  const [cover, setCover] = useState({
    defaultHeight: 340,
    gradientColor: "",
    gradientIntensity: 60,
    gradientDirection: "to-top" as GradientDirection,
    gradientOpacityStart: 90,
    gradientOpacityEnd: 0,
    pages: {} as Record<string, { mode: CoverMode }>,
    ...coverCfg,
  });

  useEffect(() => {
    setCover({
      defaultHeight: 340,
      gradientColor: "",
      gradientIntensity: 60,
      gradientDirection: "to-top" as GradientDirection,
      gradientOpacityStart: 90,
      gradientOpacityEnd: 0,
      pages: {},
      ...coverCfg,
    });
  }, [JSON.stringify(coverCfg)]);

  const updatePageMode = (slug: string, mode: CoverMode) => {
    setCover(prev => ({
      ...prev,
      pages: { ...prev.pages, [slug]: { mode } },
    }));
  };

  // Build live preview gradient
  const previewColor = cover.gradientColor || "#1a1a1a";
  const buildPreview = () => {
    const isHex = previewColor.startsWith("#");
    const dir = cover.gradientDirection || "to-top";
    const os = ((cover.gradientOpacityStart ?? 90) / 100) * ((cover.gradientIntensity ?? 60) / 100);
    const oe = ((cover.gradientOpacityEnd ?? 0) / 100) * ((cover.gradientIntensity ?? 60) / 100);
    const start = isHex ? hexRgba(previewColor, os) : `hsl(${previewColor} / ${os.toFixed(2)})`;
    const end = isHex ? hexRgba(previewColor, oe) : `hsl(${previewColor} / ${oe.toFixed(2)})`;
    const cssDir: Record<string, string> = { "to-top": "to top", "to-bottom": "to bottom", "to-left": "to left", "to-right": "to right", "diagonal": "135deg", "radial": "radial" };
    if (dir === "radial") return `radial-gradient(ellipse at center, ${end} 0%, ${start} 100%)`;
    return `linear-gradient(${cssDir[dir]}, ${start} 0%, ${end} 100%)`;
  };

  const handleSave = () => onSave("cover", cover, "appearance");

  return (
    <div className="space-y-6">
      {/* Color & Gradient Controls */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4.5 w-4.5 text-primary" />
            {isAr ? "لون الغطاء والتدرج" : "Cover Color & Gradient"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr
              ? "اختر لون الخلفية من اللوحة أو أدخل الرمز، وتحكم في اتجاه التدرج والشفافية"
              : "Pick a background color from the palette or enter a code, control gradient direction and opacity"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Color Picker Row */}
          <div className="space-y-2">
            <Label className="text-xs">{isAr ? "لون التدرج" : "Gradient Color"}</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c.hex}
                  className={`h-8 w-8 rounded-xl border-2 transition-all hover:scale-110 ${cover.gradientColor === c.hex ? "border-primary ring-2 ring-primary/30 scale-110" : "border-border/40"}`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                  onClick={() => setCover({ ...cover, gradientColor: c.hex })}
                />
              ))}
            </div>
            <div className="flex gap-2 items-end mt-2">
              <div className="space-y-1 flex-1">
                <Label className="text-[10px] text-muted-foreground">{isAr ? "أو أدخل اللون (HEX أو HSL)" : "Or enter color (HEX or HSL)"}</Label>
                <div className="flex gap-2">
                  <Input
                    value={cover.gradientColor}
                    onChange={e => setCover({ ...cover, gradientColor: e.target.value })}
                    placeholder="#1a1a2e  or  25 30% 8%"
                    className="font-mono text-xs"
                  />
                  <input
                    type="color"
                    value={cover.gradientColor.startsWith("#") ? cover.gradientColor : "#1a1a1a"}
                    onChange={e => setCover({ ...cover, gradientColor: e.target.value })}
                    className="h-10 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
                  />
                </div>
              </div>
              {cover.gradientColor && (
                <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setCover({ ...cover, gradientColor: "" })}>
                  {isAr ? "إعادة تعيين" : "Reset"}
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Gradient Direction */}
          <div className="space-y-2">
            <Label className="text-xs">{isAr ? "اتجاه التدرج" : "Gradient Direction"}</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {DIRECTION_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const active = (cover.gradientDirection || "to-top") === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setCover({ ...cover, gradientDirection: opt.value })}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[10px] transition-all ${active ? "border-primary bg-primary/10 text-primary" : "border-border/40 text-muted-foreground hover:bg-muted/30"}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="leading-tight text-center">{isAr ? opt.ar : opt.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Opacity Start / End */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{isAr ? "شفافية البداية" : "Start Opacity"}</Label>
                <Badge variant="outline" className="text-[10px] font-mono px-2">{cover.gradientOpacityStart ?? 90}%</Badge>
              </div>
              <Slider
                value={[cover.gradientOpacityStart ?? 90]}
                onValueChange={([v]) => setCover({ ...cover, gradientOpacityStart: v })}
                min={0} max={100} step={5}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{isAr ? "شفافية النهاية" : "End Opacity"}</Label>
                <Badge variant="outline" className="text-[10px] font-mono px-2">{cover.gradientOpacityEnd ?? 0}%</Badge>
              </div>
              <Slider
                value={[cover.gradientOpacityEnd ?? 0]}
                onValueChange={([v]) => setCover({ ...cover, gradientOpacityEnd: v })}
                min={0} max={100} step={5}
              />
            </div>
          </div>

          {/* Intensity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{isAr ? "شدة التدرج الإجمالية" : "Overall Gradient Intensity"}</Label>
              <Badge variant="outline" className="text-[10px] font-mono px-2">{cover.gradientIntensity ?? 60}%</Badge>
            </div>
            <Slider
              value={[cover.gradientIntensity ?? 60]}
              onValueChange={([v]) => setCover({ ...cover, gradientIntensity: v })}
              min={0} max={100} step={5}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{isAr ? "شفاف" : "Transparent"}</span>
              <span>{isAr ? "معتدل" : "Moderate"}</span>
              <span>{isAr ? "داكن" : "Dark"}</span>
            </div>
          </div>

          <Separator />

          {/* Live Preview */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Eye className="h-3 w-3" />
              {isAr ? "معاينة حية" : "Live Preview"}
            </Label>
            <div
              className="relative h-28 w-full rounded-xl overflow-hidden border border-border/40"
              style={{
                background: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect fill="%23334155"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2394a3b8">Cover Image</text></svg>') center/cover`,
              }}
            >
              <div className="absolute inset-0" style={{ background: buildPreview() }} />
              <div className="absolute inset-x-0 bottom-2 text-center text-[10px] font-medium text-foreground/70">
                {isAr ? "معاينة التدرج المباشر" : "Live Gradient Preview"}
              </div>
            </div>
          </div>

          {/* Height */}
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "الارتفاع الافتراضي (px)" : "Default Height (px)"}</Label>
            <Input
              type="number"
              min={100} max={800}
              value={cover.defaultHeight}
              onChange={e => setCover({ ...cover, defaultHeight: parseInt(e.target.value) || 340 })}
              className="max-w-[180px]"
            />
          </div>

          <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={isPending}>
            <Save className="h-3.5 w-3.5" />{isAr ? "حفظ الإعدادات" : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Popular Templates */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LayoutTemplate className="h-4.5 w-4.5 text-primary" />
            {isAr ? "قوالب الأغلفة الشائعة" : "Popular Cover Templates"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr
              ? "أبعاد الأغلفة الأكثر استخداماً في المواقع العالمية ومنصات التواصل الاجتماعي"
              : "Most popular cover dimensions used across global websites and social media platforms"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {COVER_TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setCover({ ...cover, defaultHeight: t.height > 800 ? 520 : Math.min(t.height, 800) })}
                className="flex items-center justify-between rounded-xl border border-border/40 px-3 py-3 text-start transition-all hover:bg-muted/30 hover:border-primary/30 group"
              >
                <div>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {isAr ? t.ar : t.en}
                  </span>
                  <div className="flex gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0">{t.width}×{t.height}</Badge>
                    <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0">{t.ratio}</Badge>
                  </div>
                </div>
                <div
                  className="h-8 rounded border border-border/30 bg-muted/50 shrink-0"
                  style={{ aspectRatio: `${t.width}/${t.height}`, maxWidth: "64px" }}
                />
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            {isAr
              ? "اضغط على أي قالب لتطبيق ارتفاعه كارتفاع افتراضي. الحد الأقصى 800px."
              : "Click any template to apply its height as default. Max height is 800px."}
          </p>
        </CardContent>
      </Card>

      {/* Per-Page Cover Modes */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4.5 w-4.5 text-primary" />
            {isAr ? "إعدادات الصفحات" : "Per-Page Cover Mode"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr
              ? "تخصيص نوع الغطاء لكل صفحة: كامل، متوسط، صغير، أو بدون غطاء"
              : "Customize cover type per page: full, medium, small, or no cover"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {PAGE_OPTIONS.map(page => (
              <div
                key={page.slug}
                className="flex items-center justify-between rounded-xl border border-border/40 px-3 py-2.5 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{isAr ? page.ar : page.en}</span>
                  <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0">{page.slug}</Badge>
                </div>
                <Select
                  value={cover.pages[page.slug]?.mode || "medium"}
                  onValueChange={(v) => updatePageMode(page.slug, v as CoverMode)}
                >
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {isAr ? opt.ar : opt.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={isPending}>
            <Save className="h-3.5 w-3.5" />{isAr ? "حفظ جميع الإعدادات" : "Save All Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
});

function hexRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
