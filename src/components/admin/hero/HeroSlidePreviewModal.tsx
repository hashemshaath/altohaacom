import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Monitor, Tablet, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { HERO_TEMPLATES, templateLabels } from "./heroTemplates";
import { HeroSlidePreview } from "./HeroSlidePreview";
import { HEIGHT_PRESETS, ANIMATION_EFFECTS, type HeroSlide } from "./heroSlideConstants";

interface Props {
  slide: HeroSlide;
  isAr: boolean;
  previewDevice: "desktop" | "tablet" | "mobile";
  setPreviewDevice: (d: "desktop" | "tablet" | "mobile") => void;
  onClose: () => void;
}

export const HeroSlidePreviewModal = memo(function HeroSlidePreviewModal({
  slide, isAr, previewDevice, setPreviewDevice, onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate max-w-[200px]">{slide.title}</p>
          <Badge variant="outline" className="text-[12px]">
            {HERO_TEMPLATES.find(t => t.id === slide.template)?.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 border border-border/50 rounded-xl p-0.5">
            {(["desktop", "tablet", "mobile"] as const).map(d => (
              <Button key={d} size="icon" variant={previewDevice === d ? "default" : "ghost"} className="h-7 w-7" onClick={() => setPreviewDevice(d)}>
                {d === "desktop" ? <Monitor className="h-3.5 w-3.5" /> : d === "tablet" ? <Tablet className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
              </Button>
            ))}
          </div>
          <Button size="sm" variant="ghost" className="gap-1.5" onClick={onClose}>
            <X className="h-4 w-4" />{isAr ? "إغلاق" : "Close"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
        <div className={cn(
          "w-full transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-border/30",
          previewDevice === "desktop" ? "max-w-5xl" : previewDevice === "tablet" ? "max-w-[768px]" : "max-w-[390px]"
        )}>
          <HeroSlidePreview slide={slide} />
        </div>
      </div>

      <div className="px-4 py-2 border-t border-border/40 bg-card/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-center gap-4 text-[12px] text-muted-foreground">
          <span>Template: {templateLabels[slide.template]}</span>
          <span>·</span>
          <span>Height: {HEIGHT_PRESETS[slide.height_preset]?.label ?? slide.height_preset}</span>
          <span>·</span>
          <span>Overlay: {slide.overlay_opacity}%</span>
          <span>·</span>
          <span>Motion: {ANIMATION_EFFECTS.find(a => a.value === slide.animation_effect)?.label}</span>
        </div>
      </div>
    </div>
  );
});
