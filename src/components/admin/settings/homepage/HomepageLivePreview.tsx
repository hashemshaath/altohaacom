import { memo, useState } from "react";
import { type HomepageSection } from "@/hooks/useHomepageSections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionIcon } from "./SectionIcon";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Monitor, Sparkles, Smartphone, MonitorSmartphone } from "lucide-react";

interface Props {
  sections: HomepageSection[];
  isAr: boolean;
}

function MiniGrid({ perRow, count, size }: { perRow: number; count: number; size: string }) {
  const h = size === "large" ? 5 : size === "medium" ? 4 : 2.5;
  const total = Math.min(count, perRow * 2);
  return (
    <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${perRow}, 1fr)` }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="rounded-[2px] bg-primary/20" style={{ height: h }} />
      ))}
    </div>
  );
}

function MiniCarousel({ count }: { count: number }) {
  return (
    <div className="flex gap-px overflow-hidden">
      {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
        <div key={i} className="h-3 w-6 shrink-0 rounded-[2px] bg-primary/20" />
      ))}
      <div className="h-3 w-3 shrink-0 rounded-[2px] bg-primary/10" />
    </div>
  );
}

export const HomepageLivePreview = memo(function HomepageLivePreview({ sections, isAr }: Props) {
  const sorted = [...sections].sort((a, b) => a.sort_order - b.sort_order);
  const visibleSections = sorted.filter(s => s.is_visible);
  const animatedCount = sorted.filter(s => s.animation !== "none").length;
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const isMobile = previewMode === "mobile";

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            {isAr ? "معاينة التخطيط" : "Layout Preview"}
          </CardTitle>
          <div className="flex items-center gap-0.5 rounded-lg border border-border/40 p-0.5">
            <button
              onClick={() => setPreviewMode("mobile")}
              className={cn(
                "p-1 rounded-md transition-colors",
                isMobile ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Smartphone className="h-3 w-3" />
            </button>
            <button
              onClick={() => setPreviewMode("desktop")}
              className={cn(
                "p-1 rounded-md transition-colors",
                !isMobile ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MonitorSmartphone className="h-3 w-3" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Device frame */}
        <div className={cn(
          "mx-auto rounded-2xl border-2 border-border/60 bg-muted/20 overflow-hidden shadow-inner transition-all duration-300",
          isMobile ? "max-w-[220px]" : "max-w-[280px]"
        )}>
          {/* Status bar */}
          <div className="h-5 bg-muted/40 flex items-center justify-between px-3">
            <span className="text-[6px] text-muted-foreground/50 font-mono">9:41</span>
            <div className="h-1.5 w-10 rounded-full bg-border/60" />
            <div className="flex gap-0.5">
              <div className="h-1 w-1 rounded-full bg-border/60" />
              <div className="h-1 w-1 rounded-full bg-border/60" />
              <div className="h-1 w-1 rounded-full bg-border/60" />
            </div>
          </div>

          {/* Content */}
          <div className="p-1.5 space-y-1 min-h-[280px] max-h-[400px] overflow-y-auto scrollbar-none">
            {sorted.map((s) => {
              const isHero = s.section_key === "hero";
              const isAd = s.section_key?.startsWith("ad_banner");
              
              return (
                <div
                  key={s.id}
                  className={cn(
                    "group rounded-md transition-all border",
                    s.is_visible
                      ? isHero
                        ? "bg-primary/5 border-primary/20"
                        : isAd
                          ? "bg-chart-4/5 border-chart-4/20"
                          : "bg-card border-border/40 hover:border-primary/30"
                      : "bg-muted/30 border-transparent opacity-25"
                  )}
                >
                  {/* Hero gets special treatment */}
                  {isHero && s.is_visible ? (
                    <div className="relative h-10 rounded-md overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                      <div className="absolute bottom-1 start-2 space-y-0.5">
                        <div className="h-1 w-8 rounded-full bg-primary/40" />
                        <div className="h-0.5 w-5 rounded-full bg-primary/20" />
                      </div>
                      <div className="absolute bottom-1 end-1.5 flex gap-0.5">
                        {[1, 2, 3].map(i => (
                          <div key={i} className={cn("h-1 rounded-full", i === 1 ? "w-3 bg-primary/50" : "w-1 bg-primary/20")} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Section header */}
                      <div className="flex items-center gap-1 px-1.5 py-1">
                        <SectionIcon sectionKey={s.section_key} className="h-2.5 w-2.5 text-primary/50 shrink-0" />
                        <span className="flex-1 truncate text-[7px] font-medium leading-tight">
                          {isAr ? s.title_ar : s.title_en}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {s.animation !== "none" && (
                            <Sparkles className="h-2 w-2 text-primary/30" />
                          )}
                          {s.is_visible ? (
                            <Eye className="h-2 w-2 text-primary/40 shrink-0" />
                          ) : (
                            <EyeOff className="h-2 w-2 text-muted-foreground/30 shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* Content visualization */}
                      {s.is_visible && (
                        <div className="px-1.5 pb-1">
                          {isAd ? (
                            <div className="h-3 rounded-sm bg-chart-4/15 border border-chart-4/10" />
                          ) : s.display_style === "carousel" ? (
                            <MiniCarousel count={s.item_count} />
                          ) : (
                            <MiniGrid
                              perRow={isMobile ? Math.min(s.items_per_row, 2) : s.items_per_row}
                              count={s.item_count}
                              size={s.item_size}
                            />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer bar */}
          <div className="h-4 bg-muted/40 flex items-center justify-center gap-3">
            <div className="h-1 w-6 rounded-full bg-border/40" />
            <div className="h-1 w-6 rounded-full bg-border/40" />
            <div className="h-1 w-6 rounded-full bg-border/40" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-primary/60" />
            {visibleSections.length} {isAr ? "ظاهر" : "visible"}
          </span>
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
            {sorted.length - visibleSections.length} {isAr ? "مخفي" : "hidden"}
          </span>
          {animatedCount > 0 && (
            <span className="flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-primary/50" />
              {animatedCount}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
