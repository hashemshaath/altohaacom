import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

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
  search: { bg: "bg-background" },
  stats: { bg: "bg-background" },
  events_by_category: { bg: "bg-muted/30 dark:bg-muted/10", topBorder: true },
  regional_events: { bg: "bg-background", topBorder: true },
  events_calendar: { bg: "bg-muted/30 dark:bg-muted/10", topBorder: true },
  featured_chefs: { bg: "bg-background", topBorder: true },
  newly_joined: { bg: "bg-muted/30 dark:bg-muted/10", topBorder: true },
  sponsors: { bg: "bg-background" },
  partners: { bg: "bg-background" },
  pro_suppliers: { bg: "bg-muted/30 dark:bg-muted/10", topBorder: true },
  masterclasses: { bg: "bg-background", topBorder: true },
  articles: { bg: "bg-muted/30 dark:bg-muted/10", topBorder: true },
  trending_content: { bg: "bg-background", topBorder: true },
  testimonials: { bg: "bg-muted/30 dark:bg-muted/10", topBorder: true },
  sponsorships: { bg: "bg-background", topBorder: true },
  features: { bg: "bg-muted/30 dark:bg-muted/10", topBorder: true },
  platform_features: { bg: "bg-muted/30 dark:bg-muted/10", topBorder: true },
  newsletter: { bg: "bg-background", topBorder: true },
  quick_actions: { bg: "bg-muted/30 dark:bg-muted/10", topBorder: true },
  premium_cta: { bg: "bg-transparent" },
  ad_banner_top: { bg: "bg-transparent" },
  ad_banner_mid: { bg: "bg-transparent" },
  ad_banner_bottom: { bg: "bg-transparent" },
};

export function getSectionTheme(sectionKey: string): SectionTheme {
  return SECTION_THEMES[sectionKey] || { bg: "bg-background" };
}

export function SectionBackgroundWrapper({
  sectionKey,
  children,
  className,
}: {
  sectionKey: string;
  children: ReactNode;
  className?: string;
}) {
  const theme = getSectionTheme(sectionKey);

  return (
    <div className={cn(theme.bg, theme.className, className)}>
      {theme.topBorder && (
        <div className="h-px bg-border/40" aria-hidden="true" />
      )}
      {theme.overlay}
      <div className="relative">{children}</div>
    </div>
  );
}
