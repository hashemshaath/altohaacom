import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical, ChevronDown, ChevronUp, Copy, Maximize2,
  ArrowUp, ArrowDown, ToggleLeft, ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HERO_TEMPLATES } from "./heroTemplates";
import { HEIGHT_PRESETS, ANIMATION_EFFECTS, type HeroSlide } from "./heroSlideConstants";

interface Props {
  slide: HeroSlide;
  rawSlide: HeroSlide;
  idx: number;
  total: number;
  isOpen: boolean;
  isDirty: boolean;
  isAr: boolean;
  onExpand: () => void;
  onPreview: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleActive: () => void;
  onDuplicate: () => void;
  duplicating: boolean;
}

export const HeroSlideCardHeader = memo(function HeroSlideCardHeader({
  slide, idx, total, isOpen, isDirty, isAr,
  onExpand, onPreview, onMoveUp, onMoveDown, onToggleActive, onDuplicate, duplicating,
}: Props) {
  const tpl = HERO_TEMPLATES.find(t => t.id === slide.template) ?? HERO_TEMPLATES[0];

  return (
    <div className="flex items-center gap-3 p-3">
      <div className="flex flex-col items-center gap-0.5 shrink-0 cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
        <span className="text-[12px] text-muted-foreground/50 font-mono">{idx + 1}</span>
      </div>

      <div
        className="h-14 w-24 rounded-xl overflow-hidden shrink-0 bg-muted cursor-pointer relative group"
        onClick={onPreview}
      >
        {slide.image_url && (
          <img loading="lazy" decoding="async" src={slide.image_url} alt={slide.title} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground/60 flex items-center justify-center">
          <Maximize2 className="h-4 w-4 text-background" />
        </div>
        <div className="absolute bottom-0 inset-x-0 h-1 bg-primary/60" style={{ background: tpl.previewGradient }} />
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onExpand}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold truncate">{slide.title || <span className="text-muted-foreground italic">Untitled</span>}</span>
          <Badge variant="outline" className="text-[12px] px-1.5 py-0 shrink-0">{tpl.label}</Badge>
          {isDirty && (
            <Badge variant="outline" className="text-[12px] px-1.5 py-0 shrink-0 border-amber-300 text-amber-600">
              {isAr ? "غير محفوظ" : "Unsaved"}
            </Badge>
          )}
        </div>
        <p className="text-[12px] text-muted-foreground truncate mt-0.5">
          {slide.subtitle || slide.image_url || "—"}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[12px] text-muted-foreground/60 font-mono">
            {HEIGHT_PRESETS[slide.height_preset]?.label ?? slide.height_preset}
            {slide.height_preset === "custom" && slide.custom_height ? ` · ${slide.custom_height}px` : ""}
          </span>
          {slide.animation_effect !== "none" && (
            <span className="text-[12px] text-muted-foreground/60">
              · {ANIMATION_EFFECTS.find(a => a.value === slide.animation_effect)?.label}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button size="icon" variant="ghost" className="h-7 w-7 hidden sm:flex" disabled={idx === 0} onClick={e => { e.stopPropagation(); onMoveUp(); }} title="Move up">
          <ArrowUp className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 hidden sm:flex" disabled={idx === total - 1} onClick={e => { e.stopPropagation(); onMoveDown(); }} title="Move down">
          <ArrowDown className="h-3 w-3" />
        </Button>
        <Button
          size="icon" variant="ghost"
          className={cn("h-7 w-7", slide.is_active ? "text-emerald-600" : "text-muted-foreground")}
          onClick={onToggleActive}
          title={slide.is_active ? "Deactivate" : "Activate"}
        >
          {slide.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onDuplicate} disabled={duplicating} title="Duplicate">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onExpand}>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
});
