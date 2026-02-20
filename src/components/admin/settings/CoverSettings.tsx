import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, Image, Layers, Eye } from "lucide-react";
import type { CoverMode } from "@/hooks/useCoverSettings";

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
  { value: "full", en: "Full Cover", ar: "غطاء كامل" },
  { value: "medium", en: "Medium Cover", ar: "غطاء متوسط" },
  { value: "small", en: "Small Cover", ar: "غطاء صغير" },
  { value: "none", en: "No Cover", ar: "بدون غطاء" },
];

export function CoverSettings({ settings, onSave, isPending }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const coverCfg = settings.cover || {};

  const [cover, setCover] = useState({
    defaultHeight: 340,
    gradientColor: "",
    gradientIntensity: 60,
    pages: {} as Record<string, { mode: CoverMode }>,
    ...coverCfg,
  });

  useEffect(() => {
    setCover({
      defaultHeight: 340,
      gradientColor: "",
      gradientIntensity: 60,
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

  // Preview gradient
  const previewColor = cover.gradientColor || "25 30% 8%";
  const previewAlpha = (cover.gradientIntensity ?? 60) / 100;

  return (
    <div className="space-y-6">
      {/* Global Cover Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Image className="h-4.5 w-4.5 text-primary" />
            {isAr ? "إعدادات الغطاء العامة" : "Global Cover Settings"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr
              ? "التحكم في ارتفاع صورة الغلاف ولون التدرج وشدته لجميع الصفحات"
              : "Control cover image height, gradient color, and intensity across all pages"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Height */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الارتفاع الافتراضي (px)" : "Default Height (px)"}</Label>
              <Input
                type="number"
                min={100}
                max={800}
                value={cover.defaultHeight}
                onChange={e => setCover({ ...cover, defaultHeight: parseInt(e.target.value) || 340 })}
              />
              <p className="text-[10px] text-muted-foreground">
                {isAr ? "يُطبق على الصفحات بوضع \"متوسط\"" : "Applied to pages with \"medium\" mode"}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "لون التدرج (HSL)" : "Gradient Color (HSL)"}</Label>
              <Input
                value={cover.gradientColor}
                onChange={e => setCover({ ...cover, gradientColor: e.target.value })}
                placeholder="25 30% 8%"
              />
              <p className="text-[10px] text-muted-foreground">
                {isAr ? "اتركه فارغاً لاستخدام لون الخلفية" : "Leave empty to use background color"}
              </p>
            </div>
          </div>

          {/* Intensity Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{isAr ? "شدة التدرج" : "Gradient Intensity"}</Label>
              <Badge variant="outline" className="text-[10px] font-mono px-2">
                {cover.gradientIntensity ?? 60}%
              </Badge>
            </div>
            <Slider
              value={[cover.gradientIntensity ?? 60]}
              onValueChange={([v]) => setCover({ ...cover, gradientIntensity: v })}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{isAr ? "شفاف" : "Transparent"}</span>
              <span>{isAr ? "معتدل" : "Moderate"}</span>
              <span>{isAr ? "داكن" : "Dark"}</span>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Eye className="h-3 w-3" />
              {isAr ? "معاينة التدرج" : "Gradient Preview"}
            </Label>
            <div
              className="relative h-24 w-full rounded-lg overflow-hidden border border-border/40"
              style={{
                background: `linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--accent) / 0.1))`,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, hsl(${previewColor}) ${Math.round(previewAlpha * 80)}%, transparent)`,
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to right, hsl(${previewColor} / ${(previewAlpha * 0.5).toFixed(2)}), transparent, hsl(${previewColor} / ${(previewAlpha * 0.5).toFixed(2)}))`,
                }}
              />
              <div className="absolute inset-x-0 bottom-2 text-center text-[10px] font-medium text-white/70">
                {isAr ? "معاينة" : "Preview"}
              </div>
            </div>
          </div>

          <Button size="sm" className="gap-1.5" onClick={() => onSave("cover", cover, "appearance")} disabled={isPending}>
            <Save className="h-3.5 w-3.5" />{isAr ? "حفظ الإعدادات" : "Save Settings"}
          </Button>
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
                className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2.5 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{isAr ? page.ar : page.en}</span>
                  <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0">
                    {page.slug}
                  </Badge>
                </div>
                <Select
                  value={cover.pages[page.slug]?.mode || "medium"}
                  onValueChange={(v) => updatePageMode(page.slug, v as CoverMode)}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs">
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

          <Button size="sm" className="gap-1.5" onClick={() => onSave("cover", cover, "appearance")} disabled={isPending}>
            <Save className="h-3.5 w-3.5" />{isAr ? "حفظ إعدادات الصفحات" : "Save Page Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
