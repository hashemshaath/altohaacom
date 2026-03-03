import { forwardRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useHomepageSection } from "@/hooks/useHomepageSections";
import { cn } from "@/lib/utils";

interface Props {
  sectionKey: string;
}

/**
 * Generic placeholder for homepage sections that don't have a dedicated component yet.
 * Renders title/subtitle from DB config but shows a "coming soon" indicator.
 * This ensures all admin-configured sections appear in the correct order.
 */
const GenericHomepageSection = forwardRef<HTMLElement, Props>(function GenericHomepageSection({ sectionKey }, ref) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const section = useHomepageSection(sectionKey);

  if (!section || !section.is_visible) return null;

  const title = isAr ? section.title_ar : section.title_en;
  const subtitle = isAr ? section.subtitle_ar : section.subtitle_en;

  return (
    <section
      ref={ref}
      id={sectionKey}
      className={cn(
        "py-12",
        section.spacing === "compact" && "py-6",
        section.spacing === "relaxed" && "py-16",
        section.spacing === "none" && "py-0",
        section.css_class
      )}
      style={section.bg_color ? { backgroundColor: section.bg_color } : undefined}
    >
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
        {/* Placeholder content — will be replaced with real data rendering */}
        <div className="text-center py-8 text-muted-foreground/40 text-xs">
          {isAr ? "قريباً" : "Coming soon"}
        </div>
      </div>
    </section>
  );
});

export default GenericHomepageSection;
