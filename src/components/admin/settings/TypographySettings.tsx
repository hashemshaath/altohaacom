import { useState, useEffect, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Save, Type, Palette } from "lucide-react";
import { FONT_OPTIONS, HEADING_FONT_OPTIONS } from "@/config/themePresets";

interface Props {
  settings: Record<string, any>;
  onSave: (key: string, value: Record<string, any>, category?: string) => void;
  isPending: boolean;
}

/* ── Color helpers ── */
function hslToHex(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (n: number) => Math.round(f(n) * 255).toString(16).padStart(2, "0");
  return `#${toHex(0)}${toHex(8)}${toHex(4)}`;
}

function hexToHsl(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = ((b - r) / d + 2);
    else h = ((r - g) / d + 4);
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function ColorSwatch({ label, labelAr, isAr, value, onChange }: {
  label: string; labelAr: string; isAr: boolean;
  value: string; onChange: (v: string) => void;
}) {
  const parts = value.trim().split(/\s+/).map(Number);
  const h = parts[0] || 0, s = parts[1] || 0, l = parts[2] || 50;
  const hex = hslToHex(h, s, l);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{isAr ? labelAr : label}</Label>
      <div className="flex items-center gap-2">
        <label className="relative rounded-xl border-2 border-border/40 cursor-pointer overflow-hidden transition-shadow hover:shadow-md h-8 w-8"
          style={{ backgroundColor: `hsl(${value})` }}>
          <input type="color" value={hex}
            onChange={(e) => onChange(hexToHsl(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
        <Input value={value} onChange={(e) => onChange(e.target.value)}
          className="text-xs font-mono h-8 flex-1" placeholder="H S% L%" />
      </div>
    </div>
  );
}

export const TypographySettings = memo(function TypographySettings({ settings, onSave, isPending }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Font settings
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

  // Typography colors from brand_identity
  const identity = settings.brand_identity || {};
  const [typographyColors, setTypographyColors] = useState(identity.typographyColors || {
    heading: "25 45% 8%",
    body: "25 35% 14%",
    caption: "25 18% 42%",
    link: "40 72% 50%",
  });

  useEffect(() => {
    if (identity.typographyColors) setTypographyColors(identity.typographyColors);
  }, [JSON.stringify(identity.typographyColors)]);

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

  const handleSaveFonts = () => onSave("typography", typo, "appearance");

  const handleSaveColors = () => {
    const updated = { ...identity, typographyColors };
    onSave("brand_identity", updated, "general");
  };

  return (
    <div className="space-y-6">
      {/* Font Selection */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Type className="h-4.5 w-4.5 text-primary" />
            {isAr ? "الخطوط والطباعة" : "Typography Settings"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr ? "اختر خطوط النص والعناوين لجميع صفحات المنصة" : "Choose body and heading fonts for the entire platform"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Body Font */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "خط النص الأساسي" : "Body Font"}</Label>
            <Select value={typo.bodyFont} onValueChange={v => setTypo({ ...typo, bodyFont: v })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    <span style={{ fontFamily: f.family }}>{isAr ? f.nameAr : f.nameEn}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="rounded-xl border border-border/40 p-3" style={{ fontFamily: currentBodyFont?.family }}>
              <p className="text-sm">{isAr ? "هذا نص تجريبي لمعاينة الخط المحدد." : "This is a preview text for the selected font."}</p>
              <p className="text-xs text-muted-foreground mt-1">{isAr ? "نص مساعد بحجم أصغر للتوضيح" : "Helper text in smaller size for context"}</p>
            </div>
          </div>

          {/* Heading Font */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "خط العناوين" : "Heading Font"}</Label>
            <Select value={typo.headingFont} onValueChange={v => setTypo({ ...typo, headingFont: v })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {HEADING_FONT_OPTIONS.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    <span style={{ fontFamily: f.family }}>{isAr ? f.nameAr : f.nameEn}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="rounded-xl border border-border/40 p-3">
              <h3 className="text-lg font-bold" style={{ fontFamily: currentHeadingFont?.family }}>
                {isAr ? "عنوان تجريبي للمعاينة" : "Sample Heading Preview"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: currentBodyFont?.family }}>
                {isAr ? "نص المحتوى تحت العنوان" : "Body text below the heading"}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={handleSaveFonts} disabled={isPending}>
              <Save className="h-3.5 w-3.5" />{isAr ? "حفظ الخطوط" : "Save Fonts"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Typography Colors */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4.5 w-4.5 text-primary" />
            {isAr ? "ألوان الخطوط والنصوص" : "Typography Colors"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr ? "ألوان مخصصة للعناوين، النصوص، التعليقات والروابط" : "Colors for headings, body text, captions, and links"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Live preview */}
          <div className="rounded-xl border border-border/40 p-5 space-y-2 bg-background">
            <h3 className="text-lg font-bold" style={{ color: `hsl(${typographyColors.heading})`, fontFamily: currentHeadingFont?.family }}>
              {isAr ? "عنوان تجريبي" : "Sample Heading"}
            </h3>
            <p className="text-sm" style={{ color: `hsl(${typographyColors.body})`, fontFamily: currentBodyFont?.family }}>
              {isAr ? "هذا نص تجريبي يوضح لون النص الأساسي المستخدم في الفقرات." : "This is sample body text showing the primary paragraph color."}
            </p>
            <p className="text-xs" style={{ color: `hsl(${typographyColors.caption})` }}>
              {isAr ? "تعليق توضيحي — نص مساعد" : "Caption text — supporting information"}
            </p>
            <a className="text-sm font-medium underline cursor-pointer" style={{ color: `hsl(${typographyColors.link})` }}>
              {isAr ? "رابط تفاعلي" : "Interactive Link"}
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ColorSwatch label="Headings" labelAr="العناوين" isAr={isAr}
              value={typographyColors.heading} onChange={v => setTypographyColors({ ...typographyColors, heading: v })} />
            <ColorSwatch label="Body Text" labelAr="نص الفقرة" isAr={isAr}
              value={typographyColors.body} onChange={v => setTypographyColors({ ...typographyColors, body: v })} />
            <ColorSwatch label="Captions" labelAr="التعليقات" isAr={isAr}
              value={typographyColors.caption} onChange={v => setTypographyColors({ ...typographyColors, caption: v })} />
            <ColorSwatch label="Links" labelAr="الروابط" isAr={isAr}
              value={typographyColors.link} onChange={v => setTypographyColors({ ...typographyColors, link: v })} />
          </div>
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={handleSaveColors} disabled={isPending}>
              <Save className="h-3.5 w-3.5" />{isAr ? "حفظ ألوان الخطوط" : "Save Typography Colors"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
