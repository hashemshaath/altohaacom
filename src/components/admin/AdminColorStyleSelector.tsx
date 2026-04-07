import { memo, useState, useEffect } from "react";
import { Palette, Check, RotateCcw } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ADMIN_COLOR_TEMPLATES,
  ADMIN_COLOR_STORAGE_KEY,
  applyAdminColorTemplate,
} from "@/config/adminColorTemplates";

const COLOR_LABELS_EN = [
  "Primary", "Accent", "Background", "Card", "Text",
  "Muted", "Muted Text", "Border", "Success", "Error",
];
const COLOR_LABELS_AR = [
  "رئيسي", "تمييز", "خلفية", "بطاقة", "نص",
  "خافت", "نص خافت", "حدود", "نجاح", "خطأ",
];

export const AdminColorStyleSelector = memo(function AdminColorStyleSelector() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeId, setActiveId] = useState<string | null>(
    localStorage.getItem(ADMIN_COLOR_STORAGE_KEY)
  );

  useEffect(() => {
    if (activeId) {
      applyAdminColorTemplate(activeId);
    }
  }, []);

  const handleSelect = (id: string) => {
    const newId = activeId === id ? null : id;
    setActiveId(newId);
    if (newId) {
      applyAdminColorTemplate(newId);
    } else {
      applyAdminColorTemplate(null);
    }
  };

  const handleReset = () => {
    setActiveId(null);
    applyAdminColorTemplate(null);
  };

  const getColorSwatches = (template: typeof ADMIN_COLOR_TEMPLATES[number]) => {
    const c = template.colors;
    return [
      c.primary, c.accent, c.background, c.card, c.foreground,
      c.muted, c.mutedForeground, c.border, c.success, c.destructive,
    ];
  };

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-md h-8 w-8 hover:bg-muted transition-all active:scale-95 relative"
            >
              <Palette className="h-4 w-4" />
              {activeId && (
                <span className="absolute -top-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-card" />
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent className="text-xs">
          {isAr ? "نمط الألوان" : "Color Style"}
        </TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className="w-80 p-0 rounded-2xl" sideOffset={8}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                {isAr ? "نمط ألوان لوحة التحكم" : "Admin Color Style"}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr ? "اختر قالب الألوان المفضل" : "Choose your preferred color template"}
              </p>
            </div>
            {activeId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3 me-1" />
                {isAr ? "إعادة" : "Reset"}
              </Button>
            )}
          </div>
        </div>

        <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
          {ADMIN_COLOR_TEMPLATES.map((template) => {
            const isActive = activeId === template.id;
            const swatches = getColorSwatches(template);
            const labels = isAr ? COLOR_LABELS_AR : COLOR_LABELS_EN;

            return (
              <button
                key={template.id}
                onClick={() => handleSelect(template.id)}
                className={`w-full rounded-xl p-3 text-start transition-all duration-200 border-2 hover:scale-[1.01] active:scale-[0.99] ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-transparent hover:border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-semibold text-foreground">
                      {isAr ? template.nameAr : template.nameEn}
                    </span>
                    <p className="text-[12px] text-muted-foreground mt-0.5 leading-tight">
                      {isAr ? template.descAr : template.descEn}
                    </p>
                  </div>
                  {isActive && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary shrink-0 ms-2">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Color swatches grid: 10 colors */}
                <div className="grid grid-cols-10 gap-1 mt-2">
                  {swatches.map((color, i) => (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <div
                          className="aspect-square rounded-md border border-black/10 transition-transform hover:scale-125 cursor-default"
                          style={{ backgroundColor: `hsl(${color})` }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-[12px] px-2 py-1">
                        {labels[i]}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
});
