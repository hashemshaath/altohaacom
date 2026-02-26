import { memo } from "react";
import { type HomepageSection } from "@/hooks/useHomepageSections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionIcon } from "./SectionIcon";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Monitor } from "lucide-react";

interface Props {
  sections: HomepageSection[];
  isAr: boolean;
}

export const HomepageLivePreview = memo(function HomepageLivePreview({ sections, isAr }: Props) {
  const sorted = [...sections].sort((a, b) => a.sort_order - b.sort_order);

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
          <div className="h-5 bg-muted/40 flex items-center justify-center">
            <div className="h-1.5 w-10 rounded-full bg-border/60" />
          </div>

          {/* Content */}
          <div className="p-2 space-y-1 min-h-[300px] max-h-[420px] overflow-y-auto scrollbar-none">
            {sorted.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "group flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-all text-[9px] leading-tight border",
                  s.is_visible
                    ? "bg-card border-border/40 hover:border-primary/30"
                    : "bg-muted/30 border-transparent opacity-40"
                )}
              >
                <SectionIcon sectionKey={s.section_key} className="h-3 w-3 text-primary/60 shrink-0" />
                <span className="flex-1 truncate font-medium">
                  {isAr ? s.title_ar : s.title_en}
                </span>
                {s.is_visible ? (
                  <Eye className="h-2.5 w-2.5 text-primary/50 shrink-0" />
                ) : (
                  <EyeOff className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />
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

        <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-primary/60" />
            {sorted.filter(s => s.is_visible).length} {isAr ? "ظاهر" : "visible"}
          </span>
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
            {sorted.filter(s => !s.is_visible).length} {isAr ? "مخفي" : "hidden"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});
