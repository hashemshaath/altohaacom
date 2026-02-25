import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Palette, Type, Minimize2 } from "lucide-react";

const ACCENT_KEY = "altoha_accent_color";
const FONT_SIZE_KEY = "altoha_font_size";
const COMPACT_KEY = "altoha_compact_mode";

const ACCENT_OPTIONS = [
  { name: "Default", nameAr: "افتراضي", class: "bg-primary" },
  { name: "Ocean", nameAr: "محيطي", class: "bg-chart-2" },
  { name: "Forest", nameAr: "غابة", class: "bg-chart-5" },
  { name: "Sunset", nameAr: "غروب", class: "bg-chart-4" },
  { name: "Berry", nameAr: "توتي", class: "bg-chart-1" },
  { name: "Royal", nameAr: "ملكي", class: "bg-chart-3" },
];

export function DashboardPersonalizationWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [selectedAccent, setSelectedAccent] = useState(() => localStorage.getItem(ACCENT_KEY) || "Default");
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    return saved ? parseInt(saved) : 100;
  });
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem(COMPACT_KEY) === "true");

  const handleAccent = (name: string) => {
    setSelectedAccent(name);
    localStorage.setItem(ACCENT_KEY, name);
  };

  const handleFontSize = (value: number[]) => {
    const v = value[0];
    setFontSize(v);
    localStorage.setItem(FONT_SIZE_KEY, String(v));
    document.documentElement.style.fontSize = `${v}%`;
  };

  const handleCompact = (v: boolean) => {
    setCompactMode(v);
    localStorage.setItem(COMPACT_KEY, String(v));
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          {isAr ? "التخصيص" : "Personalization"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Accent Color */}
        <div className="space-y-2">
          <p className="text-xs font-semibold">{isAr ? "لون التمييز" : "Accent Color"}</p>
          <div className="flex gap-2">
            {ACCENT_OPTIONS.map((opt) => (
              <button
                key={opt.name}
                onClick={() => handleAccent(opt.name)}
                className={`h-7 w-7 rounded-full ${opt.class} ring-2 transition-all ${selectedAccent === opt.name ? "ring-foreground scale-110" : "ring-transparent hover:ring-border"}`}
                title={isAr ? opt.nameAr : opt.name}
              />
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              <Type className="h-3.5 w-3.5 text-primary" />
              {isAr ? "حجم الخط" : "Font Size"}
            </Label>
            <span className="text-[10px] text-muted-foreground font-mono">{fontSize}%</span>
          </div>
          <Slider
            value={[fontSize]}
            onValueChange={handleFontSize}
            min={80}
            max={120}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>{isAr ? "صغير" : "Small"}</span>
            <span>{isAr ? "كبير" : "Large"}</span>
          </div>
        </div>

        {/* Compact Mode */}
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-xs cursor-pointer">
            <Minimize2 className="h-3.5 w-3.5 text-primary" />
            {isAr ? "الوضع المضغوط" : "Compact Mode"}
          </Label>
          <Switch checked={compactMode} onCheckedChange={handleCompact} />
        </div>
      </CardContent>
    </Card>
  );
}