import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Palette, Save } from "lucide-react";

interface Props {
  settings: Record<string, any>;
  onSave: (key: string, value: Record<string, any>, category?: string) => void;
  isPending: boolean;
}

const THEME_PRESETS = [
  {
    id: "gold",
    nameEn: "Gold & Bronze",
    nameAr: "ذهبي وبرونزي",
    descEn: "Luxurious warm tones with rich gold accents",
    descAr: "ألوان دافئة فاخرة بلمسات ذهبية غنية",
    colors: {
      primary: "38 78% 48%",
      accent: "28 70% 28%",
      background: "45 30% 98%",
    },
    preview: ["hsl(38,78%,48%)", "hsl(28,70%,28%)", "hsl(45,30%,98%)"],
  },
  {
    id: "ocean",
    nameEn: "Ocean Blue",
    nameAr: "أزرق محيطي",
    descEn: "Cool professional blues with deep navy accents",
    descAr: "ألوان زرقاء احترافية بلمسات بحرية عميقة",
    colors: {
      primary: "215 72% 50%",
      accent: "220 60% 30%",
      background: "210 30% 98%",
    },
    preview: ["hsl(215,72%,50%)", "hsl(220,60%,30%)", "hsl(210,30%,98%)"],
  },
  {
    id: "forest",
    nameEn: "Forest Green",
    nameAr: "أخضر غابي",
    descEn: "Natural earthy greens with woodland warmth",
    descAr: "ألوان خضراء طبيعية بدفء الغابات",
    colors: {
      primary: "158 62% 36%",
      accent: "160 50% 22%",
      background: "150 20% 98%",
    },
    preview: ["hsl(158,62%,36%)", "hsl(160,50%,22%)", "hsl(150,20%,98%)"],
  },
  {
    id: "royal",
    nameEn: "Royal Purple",
    nameAr: "أرجواني ملكي",
    descEn: "Elegant purple tones with regal sophistication",
    descAr: "ألوان أرجوانية أنيقة بفخامة ملكية",
    colors: {
      primary: "270 60% 50%",
      accent: "280 50% 30%",
      background: "270 20% 98%",
    },
    preview: ["hsl(270,60%,50%)", "hsl(280,50%,30%)", "hsl(270,20%,98%)"],
  },
  {
    id: "sunset",
    nameEn: "Sunset Red",
    nameAr: "أحمر غروب",
    descEn: "Vibrant warm reds with fiery orange highlights",
    descAr: "ألوان حمراء دافئة نابضة بالحياة مع لمسات برتقالية",
    colors: {
      primary: "8 80% 54%",
      accent: "15 70% 30%",
      background: "10 25% 98%",
    },
    preview: ["hsl(8,80%,54%)", "hsl(15,70%,30%)", "hsl(10,25%,98%)"],
  },
  {
    id: "charcoal",
    nameEn: "Charcoal & Silver",
    nameAr: "فحمي وفضي",
    descEn: "Sleek monochrome with silver metallic accents",
    descAr: "تصميم أحادي اللون أنيق بلمسات فضية معدنية",
    colors: {
      primary: "220 10% 40%",
      accent: "220 8% 25%",
      background: "220 10% 98%",
    },
    preview: ["hsl(220,10%,40%)", "hsl(220,8%,25%)", "hsl(220,10%,98%)"],
  },
];

export function ThemePresetsPanel({ settings, onSave, isPending }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const themeCfg = settings.theme || {};
  const [activePreset, setActivePreset] = useState(themeCfg.preset || "gold");

  useEffect(() => {
    setActivePreset(themeCfg.preset || "gold");
  }, [JSON.stringify(themeCfg)]);

  const handleSave = () => {
    const preset = THEME_PRESETS.find((p) => p.id === activePreset);
    if (!preset) return;
    onSave("theme", { preset: activePreset, colors: preset.colors }, "appearance");
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="h-4.5 w-4.5 text-primary" />
          {isAr ? "قوالب الألوان" : "Theme Presets"}
        </CardTitle>
        <CardDescription className="text-xs">
          {isAr
            ? "اختر نظام الألوان الذي يناسب هوية منصتك. يؤثر على جميع المستخدمين."
            : "Choose a color scheme that matches your brand identity. Applies globally to all users."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {THEME_PRESETS.map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setActivePreset(preset.id)}
                className={cn(
                  "relative flex flex-col gap-3 rounded-xl border-2 p-4 text-start transition-all hover:shadow-sm",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/50 hover:border-primary/30"
                )}
              >
                {isActive && (
                  <div className="absolute top-3 end-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                {/* Color Preview */}
                <div className="flex gap-1.5">
                  {preset.preview.map((color, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-8 rounded-lg border border-border/20",
                        i === 0 ? "w-12" : i === 1 ? "w-8" : "flex-1"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {isAr ? preset.nameAr : preset.nameEn}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    {isAr ? preset.descAr : preset.descEn}
                  </p>
                </div>
                {isActive && (
                  <Badge variant="secondary" className="text-[9px] w-fit">
                    {isAr ? "نشط" : "Active"}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleSave}
            disabled={isPending}
          >
            <Save className="h-3.5 w-3.5" />
            {isAr ? "حفظ المظهر" : "Save Theme"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
