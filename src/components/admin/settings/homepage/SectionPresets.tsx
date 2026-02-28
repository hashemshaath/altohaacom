import { memo } from "react";
import { type HomepageSection } from "@/hooks/useHomepageSections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Wand2, LayoutGrid, Maximize, Minimize, Sparkles, Film, Columns3 } from "lucide-react";

interface Preset {
  id: string;
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  icon: React.ElementType;
  color: string;
  config: Partial<HomepageSection>;
}

const PRESETS: Preset[] = [
  {
    id: "minimal",
    nameEn: "Minimal",
    nameAr: "بسيط",
    descEn: "Small, compact, no animations",
    descAr: "صغير، مضغوط، بدون حركات",
    icon: Minimize,
    color: "bg-muted",
    config: {
      item_size: "small", items_per_row: 4, max_items_mobile: 2,
      spacing: "compact", animation: "none", container_width: "default",
      cover_type: "none", bg_color: "", css_class: "",
    },
  },
  {
    id: "card-grid",
    nameEn: "Card Grid",
    nameAr: "شبكة بطاقات",
    descEn: "Medium items, fade animation",
    descAr: "عناصر متوسطة، حركة تلاشي",
    icon: LayoutGrid,
    color: "bg-blue-500/10",
    config: {
      item_size: "medium", items_per_row: 4, max_items_mobile: 4,
      spacing: "normal", animation: "fade", container_width: "default",
      cover_type: "none", bg_color: "", css_class: "",
    },
  },
  {
    id: "bold",
    nameEn: "Bold",
    nameAr: "جريء",
    descEn: "Large items, relaxed spacing",
    descAr: "عناصر كبيرة، تباعد مريح",
    icon: Maximize,
    color: "bg-orange-500/10",
    config: {
      item_size: "large", items_per_row: 3, max_items_mobile: 2,
      spacing: "relaxed", animation: "scale", container_width: "wide",
      cover_type: "none", bg_color: "", css_class: "",
    },
  },
  {
    id: "immersive",
    nameEn: "Immersive",
    nameAr: "غامر",
    descEn: "Full width, slide-up, with cover",
    descAr: "عرض كامل، انزلاق، مع غلاف",
    icon: Sparkles,
    color: "bg-purple-500/10",
    config: {
      item_size: "large", items_per_row: 3, max_items_mobile: 2,
      spacing: "relaxed", animation: "slide-up", container_width: "full",
      cover_type: "background", cover_height: 250, cover_overlay_opacity: 40,
      bg_color: "", css_class: "",
    },
  },
  {
    id: "magazine",
    nameEn: "Magazine",
    nameAr: "مجلة",
    descEn: "2 per row, large, blur effect",
    descAr: "عنصران بالصف، كبير، تأثير ضبابي",
    icon: Film,
    color: "bg-rose-500/10",
    config: {
      item_size: "large", items_per_row: 2, max_items_mobile: 1,
      spacing: "relaxed", animation: "blur", container_width: "wide",
      cover_type: "none", bg_color: "", css_class: "",
    },
  },
  {
    id: "compact-3col",
    nameEn: "3 Columns",
    nameAr: "3 أعمدة",
    descEn: "Medium, normal spacing, slide",
    descAr: "متوسط، تباعد عادي، انزلاق",
    icon: Columns3,
    color: "bg-emerald-500/10",
    config: {
      item_size: "medium", items_per_row: 3, max_items_mobile: 2,
      spacing: "normal", animation: "slide-left", container_width: "default",
      cover_type: "none", bg_color: "", css_class: "",
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
          {PRESETS.map((preset) => {
            // Mini preview grid
            const perRow = preset.config.items_per_row || 4;
            const cellH = preset.config.item_size === "large" ? 5 : preset.config.item_size === "medium" ? 4 : 3;

            return (
              <button
                key={preset.id}
                onClick={() => onApply(preset.config)}
                disabled={isPending}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-lg border border-border/50 p-3 text-start",
                  "transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm",
                  "disabled:opacity-50 disabled:pointer-events-none"
                )}
              >
                <div className="flex items-center gap-1.5 w-full">
                  <div className={cn("h-6 w-6 rounded-md flex items-center justify-center", preset.color)}>
                    <preset.icon className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-[10px] font-semibold flex-1">{isAr ? preset.nameAr : preset.nameEn}</span>
                </div>

                {/* Mini grid visualization */}
                <div className="w-full rounded border border-border/30 bg-muted/20 p-1.5">
                  <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${perRow}, 1fr)` }}>
                    {Array.from({ length: perRow * 2 }).map((_, i) => (
                      <div key={i} className="rounded-[1px] bg-primary/20" style={{ height: cellH }} />
                    ))}
                  </div>
                </div>

                <p className="text-[8px] text-muted-foreground leading-relaxed">
                  {isAr ? preset.descAr : preset.descEn}
                </p>

                <div className="flex flex-wrap gap-0.5">
                  <Badge variant="secondary" className="text-[7px] px-1 py-0">{preset.config.item_size}</Badge>
                  <Badge variant="secondary" className="text-[7px] px-1 py-0">{perRow}/row</Badge>
                  <Badge variant="outline" className="text-[7px] px-1 py-0">{preset.config.animation}</Badge>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
