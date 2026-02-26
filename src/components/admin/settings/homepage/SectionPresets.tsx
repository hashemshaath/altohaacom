import { memo } from "react";
import { type HomepageSection } from "@/hooks/useHomepageSections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Wand2, LayoutGrid, Maximize, Minimize, Sparkles } from "lucide-react";

interface Preset {
  id: string;
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  icon: React.ElementType;
  config: Partial<HomepageSection>;
}

const PRESETS: Preset[] = [
  {
    id: "minimal",
    nameEn: "Minimal Clean",
    nameAr: "بسيط ونظيف",
    descEn: "Small items, compact spacing, no animations",
    descAr: "عناصر صغيرة، تباعد مضغوط، بدون حركات",
    icon: Minimize,
    config: {
      item_size: "small",
      items_per_row: 4,
      max_items_mobile: 2,
      spacing: "compact",
      animation: "none",
      container_width: "default",
      cover_type: "none",
      bg_color: "",
      css_class: "",
    },
  },
  {
    id: "bold",
    nameEn: "Bold Showcase",
    nameAr: "عرض جريء",
    descEn: "Large items, relaxed spacing, scale animation",
    descAr: "عناصر كبيرة، تباعد مريح، حركة تكبير",
    icon: Maximize,
    config: {
      item_size: "large",
      items_per_row: 3,
      max_items_mobile: 2,
      spacing: "relaxed",
      animation: "scale",
      container_width: "wide",
      cover_type: "none",
      bg_color: "",
      css_class: "",
    },
  },
  {
    id: "card-grid",
    nameEn: "Card Grid",
    nameAr: "شبكة بطاقات",
    descEn: "Medium items, normal spacing, fade animation",
    descAr: "عناصر متوسطة، تباعد عادي، حركة تلاشي",
    icon: LayoutGrid,
    config: {
      item_size: "medium",
      items_per_row: 4,
      max_items_mobile: 4,
      spacing: "normal",
      animation: "fade",
      container_width: "default",
      cover_type: "none",
      bg_color: "",
      css_class: "",
    },
  },
  {
    id: "immersive",
    nameEn: "Immersive",
    nameAr: "غامر",
    descEn: "Large items, full width, slide-up animation with cover",
    descAr: "عناصر كبيرة، عرض كامل، حركة انزلاق مع غلاف",
    icon: Sparkles,
    config: {
      item_size: "large",
      items_per_row: 3,
      max_items_mobile: 2,
      spacing: "relaxed",
      animation: "slide-up",
      container_width: "full",
      cover_type: "background",
      cover_height: 250,
      cover_overlay_opacity: 40,
      bg_color: "",
      css_class: "",
    },
  },
];

interface Props {
  onApply: (config: Partial<HomepageSection>) => void;
  isAr: boolean;
  isPending?: boolean;
}

export const SectionPresets = memo(function SectionPresets({ onApply, isAr, isPending }: Props) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" />
          {isAr ? "قوالب سريعة" : "Quick Presets"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onApply(preset.config)}
              disabled={isPending}
              className={cn(
                "flex flex-col items-start gap-1.5 rounded-lg border border-border/50 p-3 text-start",
                "transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm",
                "disabled:opacity-50 disabled:pointer-events-none"
              )}
            >
              <div className="flex items-center gap-1.5">
                <preset.icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">{isAr ? preset.nameAr : preset.nameEn}</span>
              </div>
              <p className="text-[9px] text-muted-foreground leading-relaxed">
                {isAr ? preset.descAr : preset.descEn}
              </p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                <Badge variant="secondary" className="text-[7px] px-1 py-0">{preset.config.item_size}</Badge>
                <Badge variant="secondary" className="text-[7px] px-1 py-0">{preset.config.items_per_row}/row</Badge>
                <Badge variant="outline" className="text-[7px] px-1 py-0">{preset.config.animation}</Badge>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
