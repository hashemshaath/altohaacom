import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Save, Image, Upload, Palette, Type, AlertTriangle, Bell,
  Eye, Moon, Sun, Contrast, Check, Calendar, Trash2, Plus, Star
} from "lucide-react";

interface Props {
  settings: Record<string, any>;
  onSave: (key: string, value: Record<string, any>, category?: string) => void;
  isPending: boolean;
}

/* ── Contrast ratio helpers ── */
function hslToRgb(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}
function luminance(r: number, g: number, b: number) {
  const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function contrastRatio(hsl1: string, hsl2: string) {
  const parse = (s: string) => {
    const parts = s.trim().split(/\s+/).map(Number);
    return parts.length >= 3 ? parts : [0, 0, 0];
  };
  const [h1, s1, l1] = parse(hsl1);
  const [h2, s2, l2] = parse(hsl2);
  const lum1 = luminance(...hslToRgb(h1, s1, l1) as [number, number, number]);
  const lum2 = luminance(...hslToRgb(h2, s2, l2) as [number, number, number]);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return ((lighter + 0.05) / (darker + 0.05));
}
function getWcagGrade(ratio: number) {
  if (ratio >= 7) return { grade: "AAA", color: "text-green-600 dark:text-green-400" };
  if (ratio >= 4.5) return { grade: "AA", color: "text-yellow-600 dark:text-yellow-400" };
  if (ratio >= 3) return { grade: "AA Large", color: "text-orange-500" };
  return { grade: "Fail", color: "text-destructive" };
}

/* ── Color Swatch with Picker ── */
function ColorSwatch({ label, labelAr, isAr, value, onChange, size = "md" }: {
  label: string; labelAr: string; isAr: boolean;
  value: string; onChange: (v: string) => void; size?: "sm" | "md";
}) {
  const parts = value.trim().split(/\s+/).map(Number);
  const h = parts[0] || 0, s = parts[1] || 0, l = parts[2] || 50;
  const hex = hslToHex(h, s, l);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{isAr ? labelAr : label}</Label>
      <div className="flex items-center gap-2">
        <label className={cn(
          "relative rounded-lg border-2 border-border/40 cursor-pointer overflow-hidden transition-shadow hover:shadow-md",
          size === "md" ? "h-10 w-10" : "h-8 w-8"
        )} style={{ backgroundColor: `hsl(${value})` }}>
          <input
            type="color"
            value={hex}
            onChange={(e) => {
              const rgb = hexToHsl(e.target.value);
              onChange(rgb);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs font-mono h-8 flex-1"
          placeholder="H S% L%"
        />
      </div>
    </div>
  );
}

function hslToHex(h: number, s: number, l: number) {
  const [r, g, b] = hslToRgb(h, s, l);
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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

/* ── Logo Upload Slot ── */
function LogoSlot({ label, labelAr, isAr, value, onChange, bgClass }: {
  label: string; labelAr: string; isAr: boolean;
  value: string; onChange: (v: string) => void; bgClass: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{isAr ? labelAr : label}</Label>
      <div className={cn("rounded-xl border-2 border-dashed border-border/50 p-4 flex flex-col items-center justify-center gap-2 min-h-[100px] transition-colors", bgClass)}>
        {value ? (
          <img src={value} alt={label} className="max-h-16 object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Upload className="h-5 w-5" />
            <span className="text-[10px]">{isAr ? "رفع الشعار" : "Upload Logo"}</span>
          </div>
        )}
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isAr ? "رابط الشعار" : "Logo URL"}
        className="text-xs h-7"
      />
    </div>
  );
}

/* ── Seasonal Identity ── */
const OCCASION_PRESETS = [
  { id: "national_day", nameEn: "National Day", nameAr: "اليوم الوطني", emoji: "🇸🇦", colors: ["130 65% 38%", "0 0% 100%", "130 65% 25%"] },
  { id: "founding_day", nameEn: "Founding Day", nameAr: "يوم التأسيس", emoji: "🏰", colors: ["35 75% 45%", "140 50% 30%", "25 60% 28%"] },
  { id: "ramadan", nameEn: "Ramadan", nameAr: "رمضان", emoji: "🌙", colors: ["45 80% 50%", "220 45% 25%", "280 35% 30%"] },
  { id: "eid", nameEn: "Eid Celebration", nameAr: "عيد مبارك", emoji: "🎉", colors: ["38 82% 52%", "160 50% 35%", "340 55% 45%"] },
  { id: "new_year", nameEn: "New Year", nameAr: "رأس السنة", emoji: "🎆", colors: ["220 60% 30%", "45 75% 50%", "0 0% 95%"] },
  { id: "custom", nameEn: "Custom Occasion", nameAr: "مناسبة مخصصة", emoji: "✨", colors: ["200 50% 40%", "350 50% 45%", "40 60% 50%"] },
];

export function BrandIdentityPanel({ settings, onSave, isPending }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const identity = settings.brand_identity || {};

  const [logos, setLogos] = useState(identity.logos || {
    natural: "", black: "", white: "",
    variation1: "", variation2: "", variation3: "",
  });

  const [primaryColors, setPrimaryColors] = useState(identity.primaryColors || {
    primary: "40 72% 50%",
    accent: "25 55% 22%",
    tertiary: "15 50% 42%",
  });

  const [secondaryColors, setSecondaryColors] = useState(identity.secondaryColors || {
    background: "42 35% 97%",
    card: "40 30% 95%",
    surface: "38 22% 91%",
    muted: "36 14% 92%",
    border: "38 20% 83%",
  });

  const [typographyColors, setTypographyColors] = useState(identity.typographyColors || {
    heading: "25 45% 8%",
    body: "25 35% 14%",
    caption: "25 18% 42%",
    link: "40 72% 50%",
  });

  const [statusColors, setStatusColors] = useState(identity.statusColors || {
    success: "152 60% 38%",
    warning: "38 92% 50%",
    error: "0 84% 48%",
    info: "210 70% 50%",
    successBg: "152 40% 95%",
    warningBg: "38 50% 95%",
    errorBg: "0 50% 96%",
    infoBg: "210 40% 96%",
  });

  const [seasonalIdentities, setSeasonalIdentities] = useState<any[]>(identity.seasonalIdentities || []);
  const [activeSeasonalId, setActiveSeasonalId] = useState<string | null>(identity.activeSeasonalId || null);

  useEffect(() => {
    const id = settings.brand_identity || {};
    if (id.logos) setLogos(id.logos);
    if (id.primaryColors) setPrimaryColors(id.primaryColors);
    if (id.secondaryColors) setSecondaryColors(id.secondaryColors);
    if (id.typographyColors) setTypographyColors(id.typographyColors);
    if (id.statusColors) setStatusColors(id.statusColors);
    if (id.seasonalIdentities) setSeasonalIdentities(id.seasonalIdentities);
    if (id.activeSeasonalId !== undefined) setActiveSeasonalId(id.activeSeasonalId);
  }, [JSON.stringify(settings.brand_identity)]);

  /* Contrast pairs */
  const contrastPairs = useMemo(() => [
    { name: isAr ? "أساسي / خلفية" : "Primary / Background", c1: primaryColors.primary, c2: secondaryColors.background },
    { name: isAr ? "ثانوي / خلفية" : "Accent / Background", c1: primaryColors.accent, c2: secondaryColors.background },
    { name: isAr ? "ثالثي / خلفية" : "Tertiary / Background", c1: primaryColors.tertiary, c2: secondaryColors.background },
    { name: isAr ? "عنوان / خلفية" : "Heading / Background", c1: typographyColors.heading, c2: secondaryColors.background },
    { name: isAr ? "نص / بطاقة" : "Body / Card", c1: typographyColors.body, c2: secondaryColors.card },
    { name: isAr ? "تعليق / خلفية" : "Caption / Background", c1: typographyColors.caption, c2: secondaryColors.background },
  ], [primaryColors, secondaryColors, typographyColors, isAr]);

  const handleSaveAll = () => {
    onSave("brand_identity", {
      logos, primaryColors, secondaryColors, typographyColors, statusColors,
      seasonalIdentities, activeSeasonalId,
    }, "general");
  };

  const addSeasonalIdentity = (preset?: typeof OCCASION_PRESETS[0]) => {
    const newId = {
      id: Date.now().toString(),
      name: preset?.nameEn || "Custom",
      nameAr: preset?.nameAr || "مخصص",
      emoji: preset?.emoji || "✨",
      startDate: "",
      endDate: "",
      logoUrl: "",
      colors: preset?.colors || ["200 50% 40%", "350 50% 45%", "40 60% 50%"],
      isActive: false,
    };
    setSeasonalIdentities([...seasonalIdentities, newId]);
  };

  const removeSeasonalIdentity = (id: string) => {
    setSeasonalIdentities(seasonalIdentities.filter((s: any) => s.id !== id));
    if (activeSeasonalId === id) setActiveSeasonalId(null);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="logos" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="logos" className="text-xs gap-1.5 flex-1 min-w-[100px]">
            <Image className="h-3.5 w-3.5" />{isAr ? "الشعارات" : "Logos"}
          </TabsTrigger>
          <TabsTrigger value="colors" className="text-xs gap-1.5 flex-1 min-w-[100px]">
            <Palette className="h-3.5 w-3.5" />{isAr ? "الألوان" : "Colors"}
          </TabsTrigger>
          <TabsTrigger value="contrast" className="text-xs gap-1.5 flex-1 min-w-[100px]">
            <Contrast className="h-3.5 w-3.5" />{isAr ? "التباين" : "Contrast"}
          </TabsTrigger>
          <TabsTrigger value="typography" className="text-xs gap-1.5 flex-1 min-w-[100px]">
            <Type className="h-3.5 w-3.5" />{isAr ? "ألوان الخطوط" : "Typography"}
          </TabsTrigger>
          <TabsTrigger value="status" className="text-xs gap-1.5 flex-1 min-w-[100px]">
            <Bell className="h-3.5 w-3.5" />{isAr ? "التنبيهات" : "Alerts"}
          </TabsTrigger>
          <TabsTrigger value="seasonal" className="text-xs gap-1.5 flex-1 min-w-[100px]">
            <Calendar className="h-3.5 w-3.5" />{isAr ? "المناسبات" : "Seasonal"}
          </TabsTrigger>
        </TabsList>

        {/* ── LOGOS TAB ── */}
        <TabsContent value="logos" className="mt-4 space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="h-4.5 w-4.5 text-primary" />
                {isAr ? "حالات الشعار الثلاث" : "Three Logo States"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr ? "الشعار بالألوان الطبيعية والأسود والأبيض للتناسب مع جميع الخلفيات" : "Natural color, black, and white versions for all backgrounds"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <LogoSlot label="Natural Color" labelAr="اللون الطبيعي" isAr={isAr}
                  value={logos.natural} onChange={v => setLogos({ ...logos, natural: v })}
                  bgClass="bg-muted/30" />
                <LogoSlot label="Black Version" labelAr="النسخة السوداء" isAr={isAr}
                  value={logos.black} onChange={v => setLogos({ ...logos, black: v })}
                  bgClass="bg-background" />
                <LogoSlot label="White Version" labelAr="النسخة البيضاء" isAr={isAr}
                  value={logos.white} onChange={v => setLogos({ ...logos, white: v })}
                  bgClass="bg-foreground/90" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{isAr ? "تنوّعات الشعار" : "Logo Variations"}</CardTitle>
              <CardDescription className="text-xs">
                {isAr ? "3 تنوّعات للشعار: أيقونة مختصرة، أفقي، وعمودي" : "3 variations: icon/mark, horizontal, and vertical layouts"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <LogoSlot label="Icon / Logomark" labelAr="الأيقونة / الرمز" isAr={isAr}
                  value={logos.variation1} onChange={v => setLogos({ ...logos, variation1: v })}
                  bgClass="bg-muted/20" />
                <LogoSlot label="Horizontal Lockup" labelAr="أفقي" isAr={isAr}
                  value={logos.variation2} onChange={v => setLogos({ ...logos, variation2: v })}
                  bgClass="bg-muted/20" />
                <LogoSlot label="Vertical Lockup" labelAr="عمودي" isAr={isAr}
                  value={logos.variation3} onChange={v => setLogos({ ...logos, variation3: v })}
                  bgClass="bg-muted/20" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── COLORS TAB ── */}
        <TabsContent value="colors" className="mt-4 space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4.5 w-4.5 text-primary" />
                {isAr ? "الألوان الأساسية (3)" : "Primary Colors (3)"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr ? "الألوان الرئيسية التي تمثل هوية العلامة التجارية" : "Core brand colors that define the visual identity"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Live preview */}
              <div className="flex gap-2 mb-4">
                {[primaryColors.primary, primaryColors.accent, primaryColors.tertiary].map((c, i) => (
                  <div key={i} className="flex-1 h-14 rounded-xl border border-border/30 shadow-sm transition-colors"
                    style={{ backgroundColor: `hsl(${c})` }} />
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ColorSwatch label="Primary" labelAr="اللون الأساسي" isAr={isAr}
                  value={primaryColors.primary} onChange={v => setPrimaryColors({ ...primaryColors, primary: v })} />
                <ColorSwatch label="Accent" labelAr="اللون المميز" isAr={isAr}
                  value={primaryColors.accent} onChange={v => setPrimaryColors({ ...primaryColors, accent: v })} />
                <ColorSwatch label="Tertiary" labelAr="اللون الثالثي" isAr={isAr}
                  value={primaryColors.tertiary} onChange={v => setPrimaryColors({ ...primaryColors, tertiary: v })} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{isAr ? "الألوان المساندة (5)" : "Secondary Colors (5)"}</CardTitle>
              <CardDescription className="text-xs">
                {isAr ? "ألوان الخلفيات والأسطح والحدود لإتمام تناغم الهوية" : "Background, surface, and border colors for visual harmony"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1 mb-4">
                {[secondaryColors.background, secondaryColors.card, secondaryColors.surface,
                  secondaryColors.muted, secondaryColors.border].map((c, i) => (
                  <div key={i} className="flex-1 h-10 rounded-lg border border-border/20"
                    style={{ backgroundColor: `hsl(${c})` }} />
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <ColorSwatch label="Background" labelAr="الخلفية" isAr={isAr} size="sm"
                  value={secondaryColors.background} onChange={v => setSecondaryColors({ ...secondaryColors, background: v })} />
                <ColorSwatch label="Card" labelAr="البطاقات" isAr={isAr} size="sm"
                  value={secondaryColors.card} onChange={v => setSecondaryColors({ ...secondaryColors, card: v })} />
                <ColorSwatch label="Surface" labelAr="السطح" isAr={isAr} size="sm"
                  value={secondaryColors.surface} onChange={v => setSecondaryColors({ ...secondaryColors, surface: v })} />
                <ColorSwatch label="Muted" labelAr="صامت" isAr={isAr} size="sm"
                  value={secondaryColors.muted} onChange={v => setSecondaryColors({ ...secondaryColors, muted: v })} />
                <ColorSwatch label="Border" labelAr="الحدود" isAr={isAr} size="sm"
                  value={secondaryColors.border} onChange={v => setSecondaryColors({ ...secondaryColors, border: v })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CONTRAST TAB ── */}
        <TabsContent value="contrast" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Contrast className="h-4.5 w-4.5 text-primary" />
                {isAr ? "نسب التباين (WCAG)" : "Contrast Ratios (WCAG)"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr ? "تحقق من توافق الألوان مع معايير إمكانية الوصول العالمية" : "Verify color combinations meet WCAG accessibility standards"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {contrastPairs.map((pair, i) => {
                const ratio = contrastRatio(pair.c1, pair.c2);
                const { grade, color } = getWcagGrade(ratio);
                return (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
                    <div className="flex gap-1">
                      <div className="h-8 w-8 rounded-md border border-border/20" style={{ backgroundColor: `hsl(${pair.c1})` }} />
                      <div className="h-8 w-8 rounded-md border border-border/20" style={{ backgroundColor: `hsl(${pair.c2})` }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium">{pair.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{ratio.toFixed(2)}:1</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] font-bold", color)}>
                      {grade}
                    </Badge>
                  </div>
                );
              })}
              <div className="flex items-start gap-2 pt-2 text-[11px] text-muted-foreground">
                <Eye className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{isAr ? "AAA = 7:1+ (ممتاز) | AA = 4.5:1+ (جيد) | AA Large = 3:1+ (نص كبير فقط)" : "AAA = 7:1+ (Excellent) | AA = 4.5:1+ (Good) | AA Large = 3:1+ (Large text only)"}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TYPOGRAPHY COLORS TAB ── */}
        <TabsContent value="typography" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Type className="h-4.5 w-4.5 text-primary" />
                {isAr ? "ألوان الخطوط والنصوص" : "Typography Colors"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr ? "ألوان مخصصة للعناوين، النصوص، التعليقات والروابط" : "Colors for headings, body text, captions, and links"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Live preview */}
              <div className="rounded-xl border border-border/40 p-5 space-y-2" style={{ backgroundColor: `hsl(${secondaryColors.background})` }}>
                <h3 className="text-lg font-serif font-bold" style={{ color: `hsl(${typographyColors.heading})` }}>
                  {isAr ? "عنوان تجريبي" : "Sample Heading"}
                </h3>
                <p className="text-sm" style={{ color: `hsl(${typographyColors.body})` }}>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── STATUS / ALERTS TAB ── */}
        <TabsContent value="status" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-primary" />
                {isAr ? "ألوان الحالات والتنبيهات" : "Status & Alert Colors"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr ? "ألوان النجاح والتحذير والخطأ والمعلومات مع خلفياتها" : "Success, warning, error, and info colors with their backgrounds"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Live alert previews */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: "success", icon: "✓", en: "Operation completed successfully", ar: "تمت العملية بنجاح" },
                  { key: "warning", icon: "⚠", en: "Please check your input", ar: "يرجى التحقق من المدخلات" },
                  { key: "error", icon: "✕", en: "An error occurred", ar: "حدث خطأ" },
                  { key: "info", icon: "ℹ", en: "New feature available", ar: "ميزة جديدة متاحة" },
                ].map(item => (
                  <div key={item.key} className="rounded-lg p-3 border flex items-start gap-2 text-xs"
                    style={{
                      backgroundColor: `hsl(${(statusColors as any)[item.key + "Bg"]})`,
                      borderColor: `hsl(${(statusColors as any)[item.key]} / 0.3)`,
                      color: `hsl(${(statusColors as any)[item.key]})`,
                    }}>
                    <span className="font-bold text-sm">{item.icon}</span>
                    <span className="font-medium">{isAr ? item.ar : item.en}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <ColorSwatch label="Success" labelAr="نجاح" isAr={isAr}
                  value={statusColors.success} onChange={v => setStatusColors({ ...statusColors, success: v })} />
                <ColorSwatch label="Warning" labelAr="تحذير" isAr={isAr}
                  value={statusColors.warning} onChange={v => setStatusColors({ ...statusColors, warning: v })} />
                <ColorSwatch label="Error" labelAr="خطأ" isAr={isAr}
                  value={statusColors.error} onChange={v => setStatusColors({ ...statusColors, error: v })} />
                <ColorSwatch label="Info" labelAr="معلومات" isAr={isAr}
                  value={statusColors.info} onChange={v => setStatusColors({ ...statusColors, info: v })} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <ColorSwatch label="Success Bg" labelAr="خلفية النجاح" isAr={isAr} size="sm"
                  value={statusColors.successBg} onChange={v => setStatusColors({ ...statusColors, successBg: v })} />
                <ColorSwatch label="Warning Bg" labelAr="خلفية التحذير" isAr={isAr} size="sm"
                  value={statusColors.warningBg} onChange={v => setStatusColors({ ...statusColors, warningBg: v })} />
                <ColorSwatch label="Error Bg" labelAr="خلفية الخطأ" isAr={isAr} size="sm"
                  value={statusColors.errorBg} onChange={v => setStatusColors({ ...statusColors, errorBg: v })} />
                <ColorSwatch label="Info Bg" labelAr="خلفية المعلومات" isAr={isAr} size="sm"
                  value={statusColors.infoBg} onChange={v => setStatusColors({ ...statusColors, infoBg: v })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SEASONAL / OCCASION TAB ── */}
        <TabsContent value="seasonal" className="mt-4 space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-primary" />
                {isAr ? "الهويات الموسمية والمناسبات" : "Seasonal & Occasion Identities"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr ? "هويات مؤقتة للمناسبات الوطنية والأعياد والفعاليات الخاصة" : "Temporary brand identities for national days, holidays, and special events"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick presets */}
              <div>
                <Label className="text-xs mb-2 block">{isAr ? "إضافة سريعة من القوالب" : "Quick Add from Presets"}</Label>
                <div className="flex flex-wrap gap-2">
                  {OCCASION_PRESETS.map(preset => (
                    <Button key={preset.id} variant="outline" size="sm"
                      className="text-xs gap-1.5 h-8"
                      onClick={() => addSeasonalIdentity(preset)}>
                      <span>{preset.emoji}</span>
                      {isAr ? preset.nameAr : preset.nameEn}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Existing seasonal identities */}
              {seasonalIdentities.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">{isAr ? "لا توجد هويات موسمية بعد" : "No seasonal identities yet"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {seasonalIdentities.map((item: any, idx: number) => (
                    <div key={item.id} className={cn(
                      "rounded-xl border-2 p-4 space-y-3 transition-all",
                      activeSeasonalId === item.id
                        ? "border-primary bg-primary/5"
                        : "border-border/40"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.emoji}</span>
                          <div>
                            <Input
                              value={isAr ? (item.nameAr || item.name) : item.name}
                              onChange={e => {
                                const updated = [...seasonalIdentities];
                                if (isAr) updated[idx].nameAr = e.target.value;
                                else updated[idx].name = e.target.value;
                                setSeasonalIdentities(updated);
                              }}
                              className="text-sm font-semibold h-7 w-40 border-none p-0 focus-visible:ring-0"
                            />
                          </div>
                          {activeSeasonalId === item.id && (
                            <Badge variant="default" className="text-[9px]">
                              <Star className="h-2.5 w-2.5 me-1" />{isAr ? "نشط" : "Active"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                            onClick={() => setActiveSeasonalId(activeSeasonalId === item.id ? null : item.id)}>
                            {activeSeasonalId === item.id ? <Check className="h-3.5 w-3.5 text-primary" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive"
                            onClick={() => removeSeasonalIdentity(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Date range */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px]">{isAr ? "تاريخ البدء" : "Start Date"}</Label>
                          <Input type="date" className="text-xs h-7"
                            value={item.startDate || ""}
                            onChange={e => {
                              const updated = [...seasonalIdentities];
                              updated[idx].startDate = e.target.value;
                              setSeasonalIdentities(updated);
                            }} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">{isAr ? "تاريخ الانتهاء" : "End Date"}</Label>
                          <Input type="date" className="text-xs h-7"
                            value={item.endDate || ""}
                            onChange={e => {
                              const updated = [...seasonalIdentities];
                              updated[idx].endDate = e.target.value;
                              setSeasonalIdentities(updated);
                            }} />
                        </div>
                      </div>

                      {/* Seasonal logo */}
                      <div className="space-y-1">
                        <Label className="text-[10px]">{isAr ? "شعار المناسبة" : "Occasion Logo URL"}</Label>
                        <Input className="text-xs h-7"
                          value={item.logoUrl || ""}
                          placeholder={isAr ? "رابط شعار المناسبة" : "Seasonal logo URL"}
                          onChange={e => {
                            const updated = [...seasonalIdentities];
                            updated[idx].logoUrl = e.target.value;
                            setSeasonalIdentities(updated);
                          }} />
                      </div>

                      {/* Seasonal colors */}
                      <div className="flex gap-1">
                        {(item.colors || []).map((c: string, ci: number) => (
                          <label key={ci} className="relative flex-1 h-8 rounded-md border border-border/20 cursor-pointer overflow-hidden"
                            style={{ backgroundColor: `hsl(${c})` }}>
                            <input type="color" className="absolute inset-0 opacity-0 cursor-pointer"
                              value={(() => { const p = c.trim().split(/\s+/).map(Number); return hslToHex(p[0]||0,p[1]||0,p[2]||50); })()}
                              onChange={e => {
                                const updated = [...seasonalIdentities];
                                const newColors = [...(updated[idx].colors || [])];
                                newColors[ci] = hexToHsl(e.target.value);
                                updated[idx].colors = newColors;
                                setSeasonalIdentities(updated);
                              }} />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Global Save */}
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={handleSaveAll} disabled={isPending}>
          <Save className="h-4 w-4" />{isAr ? "حفظ الهوية البصرية" : "Save Brand Identity"}
        </Button>
      </div>
    </div>
  );
}
