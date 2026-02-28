import { memo } from "react";
import { type HomepageSection } from "@/hooks/useHomepageSections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionIcon } from "./SectionIcon";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Monitor, Sparkles, LayoutGrid } from "lucide-react";

interface Props {
  sections: HomepageSection[];
  isAr: boolean;
}

function MiniGrid({ perRow, count, size }: { perRow: number; count: number; size: string }) {
  const h = size === "large" ? 4 : size === "medium" ? 3 : 2;
  const total = Math.min(count, perRow * 2);
  return (
    <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${perRow}, 1fr)` }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="rounded-[1px] bg-primary/25" style={{ height: h }} />
      ))}
    </div>
  );
}

export const HomepageLivePreview = memo(function HomepageLivePreview({ sections, isAr }: Props) {
  const sorted = [...sections].sort((a, b) => a.sort_order - b.sort_order);
  const visibleSections = sorted.filter(s => s.is_visible);
  const animatedCount = sorted.filter(s => s.animation !== "none").length;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Monitor className="h-4 w-4 text-primary" />
          {isAr ? "معاينة تخطيط الصفحة" : "Page Layout Preview"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Phone-like frame */}
        <div className="mx-auto max-w-[280px] rounded-2xl border-2 border-border/60 bg-muted/20 overflow-hidden shadow-inner">
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
          <div className="p-2 space-y-1 min-h-[300px] max-h-[420px] overflow-y-auto scrollbar-none">
            {sorted.map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  "group rounded-md transition-all border",
                  s.is_visible
                    ? "bg-card border-border/40 hover:border-primary/30"
                    : "bg-muted/30 border-transparent opacity-30"
                )}
              >
                {/* Section header */}
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  <SectionIcon sectionKey={s.section_key} className="h-3 w-3 text-primary/60 shrink-0" />
                  <span className="flex-1 truncate text-[8px] font-medium leading-tight">
                    {isAr ? s.title_ar : s.title_en}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {s.animation !== "none" && (
                      <Sparkles className="h-2 w-2 text-primary/40" />
                    )}
                    {s.is_visible ? (
                      <Eye className="h-2.5 w-2.5 text-primary/50 shrink-0" />
                    ) : (
                      <EyeOff className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />
                    )}
                  </div>
                </div>

                {/* Mini grid visualization for visible sections */}
                {s.is_visible && (
                  <div className="px-2 pb-1.5">
                    <MiniGrid perRow={s.items_per_row} count={s.item_count} size={s.item_size} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer bar */}
          <div className="h-4 bg-muted/40 flex items-center justify-center gap-3">
            <div className="h-1 w-6 rounded-full bg-border/40" />
            <div className="h-1 w-6 rounded-full bg-border/40" />
            <div className="h-1 w-6 rounded-full bg-border/40" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-primary/60" />
            {visibleSections.length} {isAr ? "ظاهر" : "visible"}
          </span>
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
            {sorted.length - visibleSections.length} {isAr ? "مخفي" : "hidden"}
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5 text-primary/50" />
            {animatedCount} {isAr ? "متحرك" : "animated"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});
