import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

/**
 * Maps section keys to distinct background personalities.
 * Each section gets a unique feel while sharing brand accent colors.
 *
 * Uses CSS custom properties from index.css for theming consistency.
 * All colors are HSL-based for dark mode compatibility.
 */

export type SectionTheme = {
  /** Tailwind background classes */
  bg: string;
  /** Optional decorative overlay (geometric patterns, gradients) */
  overlay?: ReactNode;
  /** Extra wrapper classes */
  className?: string;
};

/**
 * Section background theme map.
 * Uses semantic tokens to maintain dark mode compatibility.
 */
export const SECTION_THEMES: Record<string, SectionTheme> = {
  /* ── Search — clean, minimal ── */
  search: {
    bg: "bg-gradient-to-b from-[hsl(210_33%_98%)] to-background dark:from-background dark:to-background",
  },

  /* ── Stats — soft radial glow ── */
  stats: {
    bg: "bg-gradient-to-br from-[hsl(213_30%_97%)] via-background to-[hsl(37_40%_97%)] dark:from-[hsl(213_30%_10%)] dark:via-background dark:to-[hsl(37_20%_10%)]",
  },

  /* ── Events — clean white with floating geometric accents ── */
  events_by_category: {
    bg: "bg-[hsl(0_0%_100%)] dark:bg-card",
    overlay: (
      <>
        <div className="absolute top-8 start-[10%] h-32 w-32 rounded-full bg-primary/[0.03] blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-12 end-[8%] h-24 w-24 rounded-2xl rotate-12 bg-accent/[0.04] blur-2xl" aria-hidden="true" />
      </>
    ),
    className: "relative overflow-hidden",
  },

  /* ── Regional events — warm off-white ── */
  regional_events: {
    bg: "bg-[hsl(20_30%_98%)] dark:bg-[hsl(213_30%_9%)]",
  },

  /* ── Events calendar — cool slate tint ── */
  events_calendar: {
    bg: "bg-[hsl(210_25%_97%)] dark:bg-[hsl(213_28%_10%)]",
    overlay: (
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.03),transparent_70%)]" aria-hidden="true" />
    ),
    className: "relative overflow-hidden",
  },

  /* ── Featured chefs — warm off-white with soft shadow separator ── */
  featured_chefs: {
    bg: "bg-[hsl(25_33%_98%)] dark:bg-[hsl(20_15%_9%)]",
    overlay: (
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" aria-hidden="true" />
    ),
    className: "relative",
  },

  /* ── Newly joined — alternating light ── */
  newly_joined: {
    bg: "bg-[hsl(0_0%_98%)] dark:bg-[hsl(213_25%_8%)]",
  },

  /* ── Sponsors/Partners — glass-morphism inspired ── */
  sponsors: {
    bg: "bg-gradient-to-b from-[hsl(210_20%_97%)] to-[hsl(210_20%_95%)] dark:from-[hsl(213_25%_10%)] dark:to-[hsl(213_25%_8%)]",
    overlay: (
      <>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,hsl(var(--primary)/0.04),transparent_50%)]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,hsl(var(--accent)/0.04),transparent_50%)]" aria-hidden="true" />
      </>
    ),
    className: "relative overflow-hidden",
  },
  partners: {
    bg: "bg-[hsl(25_20%_98%)] dark:bg-[hsl(20_12%_9%)]",
  },

  /* ── Pro suppliers — clean white with subtle pattern ── */
  pro_suppliers: {
    bg: "bg-[hsl(0_0%_100%)] dark:bg-card",
    overlay: (
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }} aria-hidden="true" />
    ),
    className: "relative overflow-hidden",
  },

  /* ── Masterclasses — cool slate ── */
  masterclasses: {
    bg: "bg-[hsl(210_25%_97%)] dark:bg-[hsl(213_28%_10%)]",
  },

  /* ── Articles — warm off-white ── */
  articles: {
    bg: "bg-[hsl(25_33%_99%)] dark:bg-[hsl(20_12%_8%)]",
  },

  /* ── Trending — alternating light rhythm ── */
  trending_content: {
    bg: "bg-[hsl(0_0%_98%)] dark:bg-[hsl(213_22%_9%)]",
  },

  /* ── Testimonials — warm off-white with shadow separators ── */
  testimonials: {
    bg: "bg-[hsl(25_40%_98%)] dark:bg-[hsl(20_18%_9%)]",
    overlay: (
      <>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border/25 to-transparent" aria-hidden="true" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border/25 to-transparent" aria-hidden="true" />
      </>
    ),
    className: "relative",
  },

  /* ── Sponsorships — cool glass ── */
  sponsorships: {
    bg: "bg-gradient-to-br from-[hsl(210_25%_97%)] to-[hsl(210_20%_95%)] dark:from-[hsl(213_25%_10%)] dark:to-[hsl(213_20%_8%)]",
  },

  /* ── Platform features — white with geometric ── */
  features: {
    bg: "bg-[hsl(0_0%_100%)] dark:bg-card",
    overlay: (
      <>
        <div className="absolute top-[15%] end-[5%] h-40 w-40 rounded-full bg-primary/[0.025] blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-[10%] start-[3%] h-32 w-32 rounded-full bg-accent/[0.03] blur-3xl" aria-hidden="true" />
      </>
    ),
    className: "relative overflow-hidden",
  },
  platform_features: {
    bg: "bg-[hsl(0_0%_100%)] dark:bg-card",
    overlay: (
      <>
        <div className="absolute top-[15%] end-[5%] h-40 w-40 rounded-full bg-primary/[0.025] blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-[10%] start-[3%] h-32 w-32 rounded-full bg-accent/[0.03] blur-3xl" aria-hidden="true" />
      </>
    ),
    className: "relative overflow-hidden",
  },

  /* ── Newsletter CTA — bold primary gradient ── */
  newsletter: {
    bg: "bg-gradient-to-br from-primary via-[hsl(213_75%_25%)] to-[hsl(213_80%_20%)] dark:from-primary dark:via-[hsl(213_60%_35%)] dark:to-[hsl(213_65%_22%)]",
    overlay: (
      <>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--accent)/0.12),transparent_60%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }} aria-hidden="true" />
      </>
    ),
    className: "relative overflow-hidden",
  },

  /* ── Quick actions — soft gradient ── */
  quick_actions: {
    bg: "bg-gradient-to-b from-[hsl(210_20%_97%)] to-background dark:from-[hsl(213_22%_10%)] dark:to-background",
  },

  /* ── Ad banners — transparent ── */
  ad_banner_top: { bg: "bg-transparent" },
  ad_banner_mid: { bg: "bg-transparent" },
  ad_banner_bottom: { bg: "bg-transparent" },
};

/**
 * Returns the theme for a section key, with a sensible default.
 */
export function getSectionTheme(sectionKey: string): SectionTheme {
  return SECTION_THEMES[sectionKey] || { bg: "bg-background" };
}

/**
 * Wraps section content with its themed background and decorative overlays.
 */
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
      {theme.overlay}
      <div className="relative">{children}</div>
    </div>
  );
}
