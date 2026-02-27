import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Palette, Save } from "lucide-react";
import { THEME_PRESETS } from "@/config/themePresets";

interface Props {
  settings: Record<string, any>;
  onSave: (key: string, value: Record<string, any>, category?: string) => void;
  isPending: boolean;
}

export function ThemePresetsPanel({ settings, onSave, isPending }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const themeCfg = settings.theme || {};
  const [activePreset, setActivePreset] = useState(themeCfg.preset || "gold");

  useEffect(() => {
    setActivePreset(themeCfg.preset || "gold");
  }, [JSON.stringify(themeCfg)]);

  const handleSave = () => {
    onSave("theme", { preset: activePreset }, "appearance");
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
                <div className="space-y-1.5">
                  {/* 3 Primary colors */}
                  <div className="flex gap-1">
                    {preset.preview.slice(0, 3).map((color, i) => (
                      <div
                        key={i}
                        className="h-7 flex-1 rounded-md border border-border/20"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  {/* 4 Secondary colors */}
                  <div className="flex gap-0.5">
                    {preset.preview.slice(3, 7).map((color, i) => (
                      <div
                        key={i}
                        className="h-3 flex-1 rounded-sm border border-border/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
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
