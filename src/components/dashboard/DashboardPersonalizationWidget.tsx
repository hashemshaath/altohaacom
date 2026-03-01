import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Palette, Type, Minimize2, Check, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { THEME_PRESETS, FONT_OPTIONS, HEADING_FONT_OPTIONS } from "@/config/themePresets";

const THEME_KEY = "altoha_theme_preset";
const FONT_KEY = "altoha_body_font";
const HEADING_FONT_KEY = "altoha_heading_font";
const FONT_SIZE_KEY = "altoha_font_size";
const COMPACT_KEY = "altoha_compact_mode";

export function DashboardPersonalizationWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem(THEME_KEY) || "");
  const [bodyFont, setBodyFont] = useState(() => localStorage.getItem(FONT_KEY) || "");
  const [headingFont, setHeadingFont] = useState(() => localStorage.getItem(HEADING_FONT_KEY) || "");
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    return saved ? parseInt(saved) : 100;
  });
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem(COMPACT_KEY) === "true");
  const [expanded, setExpanded] = useState(false);

  const handleTheme = (id: string) => {
    setSelectedTheme(id);
    localStorage.setItem(THEME_KEY, id);
    // Trigger re-apply by dispatching a storage event
    window.dispatchEvent(new Event("theme-change"));
  };

  const handleBodyFont = (id: string) => {
    setBodyFont(id);
    localStorage.setItem(FONT_KEY, id);
    const font = FONT_OPTIONS.find(f => f.id === id);
    if (font) document.documentElement.style.setProperty("--font-sans", font.family);
  };

  const handleHeadingFont = (id: string) => {
    setHeadingFont(id);
    localStorage.setItem(HEADING_FONT_KEY, id);
    const font = HEADING_FONT_OPTIONS.find(f => f.id === id);
    if (font) document.documentElement.style.setProperty("--font-serif", font.family);
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

  const handleReset = () => {
    localStorage.removeItem(THEME_KEY);
    localStorage.removeItem(FONT_KEY);
    localStorage.removeItem(HEADING_FONT_KEY);
    localStorage.removeItem(FONT_SIZE_KEY);
    localStorage.removeItem(COMPACT_KEY);
    setSelectedTheme("");
    setBodyFont("");
    setHeadingFont("");
    setFontSize(100);
    setCompactMode(false);
    document.documentElement.style.fontSize = "100%";
    window.dispatchEvent(new Event("theme-change"));
  };

  const hasOverrides = selectedTheme || bodyFont || headingFont || fontSize !== 100 || compactMode;

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            {isAr ? "التخصيص الشخصي" : "Personalization"}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {hasOverrides && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {isAr ? "مخصص" : "Custom"}
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Theme Presets - Always visible */}
        <div className="space-y-2">
          <p className="text-xs font-semibold">{isAr ? "قالب الألوان" : "Color Theme"}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleTheme(preset.id)}
                className={`relative flex items-center gap-1.5 rounded-xl border px-2 py-1.5 text-[10px] font-medium transition-all ${
                  selectedTheme === preset.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex gap-0.5">
                  {preset.preview.map((c, i) => (
                    <div key={i} className="h-3 w-3 rounded-full border border-border/20" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="truncate">{isAr ? preset.nameAr : preset.nameEn}</span>
                {selectedTheme === preset.id && (
                  <Check className="h-3 w-3 text-primary absolute top-0.5 end-0.5" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Expanded Section */}
        {expanded && (
          <>
            <Separator />
            {/* Body Font */}
            <div className="space-y-2">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5 text-primary" />
                {isAr ? "خط النص" : "Body Font"}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {FONT_OPTIONS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => handleBodyFont(f.id)}
                    className={`rounded-md border px-2 py-1.5 text-[11px] transition-all ${
                      bodyFont === f.id
                        ? "border-primary bg-primary/10 font-semibold"
                        : "border-border/40 hover:border-border text-muted-foreground"
                    }`}
                    style={{ fontFamily: f.family }}
                  >
                    {isAr ? f.nameAr : f.nameEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Heading Font */}
            <div className="space-y-2">
              <p className="text-xs font-semibold">{isAr ? "خط العناوين" : "Heading Font"}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {HEADING_FONT_OPTIONS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => handleHeadingFont(f.id)}
                    className={`rounded-md border px-2 py-1.5 text-[11px] transition-all ${
                      headingFont === f.id
                        ? "border-primary bg-primary/10 font-semibold"
                        : "border-border/40 hover:border-border text-muted-foreground"
                    }`}
                    style={{ fontFamily: f.family !== "inherit" ? f.family : undefined }}
                  >
                    {isAr ? f.nameAr : f.nameEn}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Font Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">{isAr ? "حجم الخط" : "Font Size"}</Label>
                <span className="text-[10px] text-muted-foreground font-mono">{fontSize}%</span>
              </div>
              <Slider value={[fontSize]} onValueChange={handleFontSize} min={80} max={120} step={5} className="w-full" />
            </div>

            {/* Compact Mode */}
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-xs cursor-pointer">
                <Minimize2 className="h-3.5 w-3.5 text-primary" />
                {isAr ? "الوضع المضغوط" : "Compact Mode"}
              </Label>
              <Switch checked={compactMode} onCheckedChange={handleCompact} />
            </div>

            {/* Reset */}
            {hasOverrides && (
              <>
                <Separator />
                <Button variant="ghost" size="sm" className="w-full text-xs gap-1.5 text-muted-foreground" onClick={handleReset}>
                  <RotateCcw className="h-3 w-3" />
                  {isAr ? "إعادة للافتراضي" : "Reset to Defaults"}
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
