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
  /* Hero / Search — no background */
  search: { bg: "bg-background" },

  /* Stats — success green wash (achievements) */
  stats: { bg: "bg-semantic-success-bg dark:bg-emerald-950/20" },

  /* Events — info blue wash (informational) */
  events_by_category: { bg: "bg-semantic-info-bg dark:bg-blue-950/20", topBorder: true },
  regional_events: { bg: "bg-background", topBorder: true },
  events_calendar: { bg: "bg-semantic-info-bg dark:bg-blue-950/20", topBorder: true },

  /* Chefs — clean white */
  featured_chefs: { bg: "bg-background", topBorder: true },
  newly_joined: { bg: "bg-muted/30 dark:bg-muted/10", topBorder: true },

  /* Partners / Sponsors — clean white */
  sponsors: { bg: "bg-background" },
  partners: { bg: "bg-background" },

  /* Suppliers — warning amber wash (promotions) */
  pro_suppliers: { bg: "bg-semantic-warning-bg dark:bg-amber-950/20", topBorder: true },

  /* Masterclasses — info blue wash */
  masterclasses: { bg: "bg-semantic-info-bg dark:bg-blue-950/20", topBorder: true },

  /* Articles — clean white */
  articles: { bg: "bg-background", topBorder: true },

  /* Trending — success green wash */
  trending_content: { bg: "bg-semantic-success-bg dark:bg-emerald-950/20", topBorder: true },

  /* Testimonials — soft muted */
  testimonials: { bg: "bg-muted/30 dark:bg-muted/10", topBorder: true },

  /* Sponsorships — warning amber wash (promotions) */
  sponsorships: { bg: "bg-semantic-warning-bg dark:bg-amber-950/20", topBorder: true },

  /* Features — info blue wash */
  features: { bg: "bg-semantic-info-bg dark:bg-blue-950/20", topBorder: true },
  platform_features: { bg: "bg-semantic-info-bg dark:bg-blue-950/20", topBorder: true },

  /* Newsletter — success green wash */
  newsletter: { bg: "bg-semantic-success-bg dark:bg-emerald-950/20", topBorder: true },

  /* Quick actions — muted */
  quick_actions: { bg: "bg-muted/30 dark:bg-muted/10", topBorder: true },

  /* CTA & Ads — transparent */
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
