import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Save, Type } from "lucide-react";
import { FONT_OPTIONS, HEADING_FONT_OPTIONS } from "@/config/themePresets";

interface Props {
  settings: Record<string, any>;
  onSave: (key: string, value: Record<string, any>, category?: string) => void;
  isPending: boolean;
}

export function TypographySettings({ settings, onSave, isPending }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const typoCfg = settings.typography || {};
  const [typo, setTypo] = useState({
    bodyFont: typoCfg.bodyFont || "dm-sans",
    headingFont: typoCfg.headingFont || "dm-serif",
  });

  useEffect(() => {
    setTypo({
      bodyFont: typoCfg.bodyFont || "dm-sans",
      headingFont: typoCfg.headingFont || "dm-serif",
    });
  }, [JSON.stringify(typoCfg)]);

  // Load Google Fonts dynamically for preview
  useEffect(() => {
    const fonts = ["Inter", "Poppins", "Cairo", "Tajawal", "Playfair+Display", "Lora"];
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f}:wght@400;500;600;700`).join("&")}&display=swap`;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const currentBodyFont = FONT_OPTIONS.find(f => f.id === typo.bodyFont);
  const currentHeadingFont = HEADING_FONT_OPTIONS.find(f => f.id === typo.headingFont);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Type className="h-4.5 w-4.5 text-primary" />
          {isAr ? "الخطوط والطباعة" : "Typography Settings"}
        </CardTitle>
        <CardDescription className="text-xs">
          {isAr
            ? "اختر خطوط النص والعناوين لجميع صفحات المنصة"
            : "Choose body and heading fonts for the entire platform"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Body Font */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">{isAr ? "خط النص الأساسي" : "Body Font"}</Label>
          <Select value={typo.bodyFont} onValueChange={v => setTypo({ ...typo, bodyFont: v })}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map(f => (
                <SelectItem key={f.id} value={f.id}>
                  <span style={{ fontFamily: f.family }}>{isAr ? f.nameAr : f.nameEn}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Preview */}
          <div className="rounded-xl border border-border/40 p-3" style={{ fontFamily: currentBodyFont?.family }}>
            <p className="text-sm">{isAr ? "هذا نص تجريبي لمعاينة الخط المحدد." : "This is a preview text for the selected font."}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? "نص مساعد بحجم أصغر للتوضيح" : "Helper text in smaller size for context"}
            </p>
          </div>
        </div>

        {/* Heading Font */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">{isAr ? "خط العناوين" : "Heading Font"}</Label>
          <Select value={typo.headingFont} onValueChange={v => setTypo({ ...typo, headingFont: v })}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HEADING_FONT_OPTIONS.map(f => (
                <SelectItem key={f.id} value={f.id}>
                  <span style={{ fontFamily: f.family }}>{isAr ? f.nameAr : f.nameEn}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Preview */}
          <div className="rounded-xl border border-border/40 p-3">
            <h3 className="text-lg font-bold" style={{ fontFamily: currentHeadingFont?.family }}>
              {isAr ? "عنوان تجريبي للمعاينة" : "Sample Heading Preview"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: currentBodyFont?.family }}>
              {isAr ? "نص المحتوى تحت العنوان" : "Body text below the heading"}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => onSave("typography", typo, "appearance")}
            disabled={isPending}
          >
            <Save className="h-3.5 w-3.5" />
            {isAr ? "حفظ الخطوط" : "Save Typography"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
