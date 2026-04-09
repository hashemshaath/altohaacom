import { cn } from "@/lib/utils";
import { type ReactNode, forwardRef } from "react";

export type SectionTheme = {
  bg: string;
  overlay?: ReactNode;
  className?: string;
  topBorder?: boolean;
};

/**
 * Vibrant alternating background system.
 * Clean backgrounds with subtle color accents per section.
 */
export const SECTION_THEMES: Record<string, SectionTheme> = {
  /* Primary (white) sections */
  search: { bg: "bg-background" },
  stats: { bg: "bg-[#F8F8F8] dark:bg-muted/10" },
  events_by_category: { bg: "bg-background", topBorder: true },
  regional_events: { bg: "bg-[#F8F8F8] dark:bg-muted/10", topBorder: true },
  events_calendar: { bg: "bg-background", topBorder: true },
  featured_chefs: { bg: "bg-[#F8F8F8] dark:bg-muted/10", topBorder: true },
  newly_joined: { bg: "bg-background", topBorder: true },
  sponsors: { bg: "bg-[#F8F8F8] dark:bg-muted/10", topBorder: true },
  partners: { bg: "bg-background", topBorder: true },
  pro_suppliers: { bg: "bg-[#F8F8F8] dark:bg-muted/10", topBorder: true },
  masterclasses: { bg: "bg-background", topBorder: true },
  articles: { bg: "bg-[#F8F8F8] dark:bg-muted/10", topBorder: true },
  trending_content: { bg: "bg-background", topBorder: true },
  testimonials: { bg: "bg-[#F8F8F8] dark:bg-muted/10", topBorder: true },
  sponsorships: { bg: "bg-background", topBorder: true },
  features: { bg: "bg-[#F8F8F8] dark:bg-muted/10", topBorder: true },
  platform_features: { bg: "bg-background", topBorder: true },
  newsletter: { bg: "bg-[#F8F8F8] dark:bg-muted/10", topBorder: true },
  quick_actions: { bg: "bg-background", topBorder: true },
  premium_cta: { bg: "bg-[#F8F8F8] dark:bg-muted/10", topBorder: true },
  ad_banner_top: { bg: "bg-transparent" },
  ad_banner_mid: { bg: "bg-transparent" },
  ad_banner_bottom: { bg: "bg-transparent" },
};

export function getSectionTheme(sectionKey: string): SectionTheme {
  return SECTION_THEMES[sectionKey] || { bg: "bg-background" };
}

export const SectionBackgroundWrapper = forwardRef<HTMLDivElement, {
  sectionKey: string;
  children: ReactNode;
  className?: string;
}>(function SectionBackgroundWrapper({ sectionKey, children, className }, ref) {
  const theme = getSectionTheme(sectionKey);

  return (
    <div ref={ref} className={cn(theme.bg, theme.className, className)}>
      {theme.topBorder && (
        <div className="h-px bg-border/40" aria-hidden="true" />
      )}
      {theme.overlay}
      <div className="relative">{children}</div>
    </div>
  );
});
