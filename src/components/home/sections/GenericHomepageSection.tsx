import { useIsAr } from "@/hooks/useIsAr";
import { useLanguage } from "@/i18n/LanguageContext";
import { useHomepageSection } from "@/hooks/useHomepageSections";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Construction } from "lucide-react";

interface Props {
  sectionKey: string;
}

/**
 * Generic placeholder for homepage sections that don't have a dedicated component yet.
 * Renders title/subtitle from DB config with a professional "coming soon" state.
 */
export default function GenericHomepageSection({ sectionKey }: Props) {
  const isAr = useIsAr();
  const section = useHomepageSection(sectionKey);

  if (!section || !section.is_visible) return null;

  const title = isAr ? section.title_ar : section.title_en;
  const subtitle = isAr ? section.subtitle_ar : section.subtitle_en;
  const perRow = section.items_per_row || 3;
  const count = Math.min(section.item_count || 3, perRow * 2);

  return (
    <section id={sectionKey}>
      <div className={cn(
        "container mx-auto px-4",
        section.container_width === "narrow" && "max-w-3xl",
        section.container_width === "wide" && "max-w-7xl",
        section.container_width === "full" && "max-w-full px-0",
      )}>
        {section.show_title && title && (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            {section.show_subtitle && subtitle && (
              <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}

        {/* Skeleton grid placeholder matching section config */}
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${Math.min(perRow, 4)}, 1fr)` }}
        >
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/30 bg-muted/20 overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-3/4 rounded-lg" />
                <Skeleton className="h-2.5 w-1/2 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Coming soon indicator */}
        <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground/40 text-xs">
          <Construction className="h-3.5 w-3.5" />
          {isAr ? "قريباً" : "Coming soon"}
        </div>
      </div>
    </section>
  );
}

