import { memo } from "react";
import { type HomepageBlock, DATA_SOURCES, DISPLAY_STYLES } from "@/hooks/useHomepageBlocks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Monitor, Eye, EyeOff, Sparkles } from "lucide-react";

interface Props {
  blocks: HomepageBlock[];
  isAr: boolean;
}

function MiniBlockViz({ block }: { block: HomepageBlock }) {
  const ds = block.display_style;
  if (ds === "carousel") {
    return (
      <div className="flex gap-px overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shrink-0 rounded-[1px] bg-primary/25" style={{ width: 14, height: 8 }} />
        ))}
        <div className="shrink-0 rounded-[1px] bg-primary/10" style={{ width: 7, height: 8 }} />
      </div>
    );
  }
  if (ds === "featured_list") {
    return (
      <div className="flex gap-px">
        <div className="rounded-[1px] bg-primary/30" style={{ width: 24, height: 14 }} />
        <div className="flex flex-col gap-px flex-1">
          <div className="rounded-[1px] bg-primary/20" style={{ height: 4 }} />
          <div className="rounded-[1px] bg-primary/20" style={{ height: 4 }} />
          <div className="rounded-[1px] bg-primary/20" style={{ height: 4 }} />
        </div>
      </div>
    );
  }
  if (ds === "cover_banner") {
    return <div className="rounded-[1px] bg-primary/20 w-full" style={{ height: 12 }} />;
  }
  // Grid / List / Masonry
  const perRow = block.items_per_row || 4;
  const rows = Math.min(block.row_count || 2, 3);
  const cellH = 3;
  return (
    <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${perRow}, 1fr)` }}>
      {Array.from({ length: perRow * rows }).map((_, i) => (
        <div key={i} className="rounded-[1px] bg-primary/25" style={{ height: cellH }} />
      ))}
    </div>
  );
}

export const BlockLivePreview = memo(function BlockLivePreview({ blocks, isAr }: Props) {
  const sorted = [...blocks].sort((a, b) => a.sort_order - b.sort_order);
  const visibleCount = sorted.filter((b) => b.is_visible).length;
  const animatedCount = sorted.filter((b) => b.animation !== "none").length;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Monitor className="h-4 w-4 text-primary" />
          {isAr ? "معاينة تخطيط الصفحة" : "Page Layout Preview"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="mx-auto max-w-[280px] rounded-2xl border-2 border-border/60 bg-muted/20 overflow-hidden shadow-inner">
          <div className="h-5 bg-muted/40 flex items-center justify-between px-3">
            <span className="text-[6px] text-muted-foreground/50 font-mono">9:41</span>
            <div className="h-1.5 w-10 rounded-full bg-border/60" />
            <div className="flex gap-0.5">
              {[0,1,2].map(i => <div key={i} className="h-1 w-1 rounded-full bg-border/60" />)}
            </div>
          </div>

          <div className="p-2 space-y-1 min-h-[300px] max-h-[420px] overflow-y-auto scrollbar-none">
            {sorted.map((b) => {
              const src = DATA_SOURCES.find((d) => d.value === b.data_source);
              return (
                <div
                  key={b.id}
                  className={cn(
                    "rounded-md transition-all border",
                    b.is_visible
                      ? "bg-card border-border/40 hover:border-primary/30"
                      : "bg-muted/30 border-transparent opacity-30"
                  )}
                >
                  <div className="flex items-center gap-1.5 px-2 py-1.5">
                    <span className="text-[8px]">{src?.icon}</span>
                    <span className="flex-1 truncate text-[8px] font-medium">
                      {isAr ? b.title_ar || b.title_en : b.title_en || "—"}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {b.animation !== "none" && <Sparkles className="h-2 w-2 text-primary/40" />}
                      {b.is_visible ? <Eye className="h-2.5 w-2.5 text-primary/50" /> : <EyeOff className="h-2.5 w-2.5 text-muted-foreground/40" />}
                    </div>
                  </div>
                  {b.is_visible && (
                    <div className="px-2 pb-1.5">
                      <MiniBlockViz block={b} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="h-4 bg-muted/40 flex items-center justify-center gap-3">
            {[0,1,2].map(i => <div key={i} className="h-1 w-6 rounded-full bg-border/40" />)}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-primary/60" />
            {visibleCount} {isAr ? "ظاهر" : "visible"}
          </span>
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
            {sorted.length - visibleCount} {isAr ? "مخفي" : "hidden"}
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
