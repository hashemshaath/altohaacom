import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

/**
 * World-class light clean section background system.
 *
 * Pure white base with subtle warm/cool alternation for visual rhythm.
 * Each section has a distinct personality using extremely subtle tints,
 * hairline borders, and decorative overlays.
 *
 * Dark mode provides complementary deep tones.
 */

export type SectionTheme = {
  /** Tailwind background classes */
  bg: string;
  /** Optional decorative overlay (geometric patterns, gradients) */
  overlay?: ReactNode;
  /** Extra wrapper classes */
  className?: string;
  /** Hairline border on top */
  topBorder?: boolean;
};

export const SECTION_THEMES: Record<string, SectionTheme> = {

  /* ── Search — crisp white ── */
  search: {
    bg: "bg-white dark:bg-background",
  },

  /* ── Stats — soft cool tint ── */
  stats: {
    bg: "bg-[#F8FAFC] dark:bg-[hsl(213_30%_9%)]",
    topBorder: true,
  },

  /* ── Events — pure white with floating accent blobs ── */
  events_by_category: {
    bg: "bg-white dark:bg-card",
    overlay: (
      <>
        <div className="absolute top-12 start-[8%] h-48 w-48 rounded-full bg-primary/[0.04] blur-[80px]" aria-hidden="true" />
        <div className="absolute bottom-16 end-[6%] h-36 w-36 rounded-full bg-accent/[0.05] blur-[60px]" aria-hidden="true" />
      </>
    ),
    className: "relative overflow-hidden",
    topBorder: true,
  },

  /* ── Regional events — warm off-white ── */
  regional_events: {
    bg: "bg-[#FAFAF9] dark:bg-[hsl(20_12%_9%)]",
    topBorder: true,
  },

  /* ── Events calendar — cool tint with soft radial ── */
  events_calendar: {
    bg: "bg-[#F8FAFC] dark:bg-[hsl(213_28%_10%)]",
    overlay: (
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.02),transparent_70%)]" aria-hidden="true" />
    ),
    className: "relative overflow-hidden",
    topBorder: true,
  },

  /* ── Featured chefs — warm ivory ── */
  featured_chefs: {
    bg: "bg-[#FDFCF8] dark:bg-[hsl(20_15%_9%)]",
    topBorder: true,
  },

  /* ── Newly joined — whisper gray ── */
  newly_joined: {
    bg: "bg-[#F9FAFB] dark:bg-[hsl(213_25%_8%)]",
    topBorder: true,
  },

  /* ── Sponsors — very light slate with subtle grid ── */
  sponsors: {
    bg: "bg-[#F6F8FA] dark:bg-[hsl(213_25%_10%)]",
    overlay: (
      <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]" style={{
        backgroundImage: `linear-gradient(to right, #94A3B8 1px, transparent 1px), linear-gradient(to bottom, #94A3B8 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} aria-hidden="true" />
    ),
    className: "relative overflow-hidden",
    topBorder: true,
  },

  /* ── Partners — warm off-white ── */
  partners: {
    bg: "bg-[#FAFAF9] dark:bg-[hsl(20_12%_9%)]",
    topBorder: true,
  },

  /* ── Pro suppliers — pure white with micro dot pattern ── */
  pro_suppliers: {
    bg: "bg-white dark:bg-card",
    overlay: (
      <div className="absolute inset-0 opacity-[0.012] dark:opacity-[0.025]" style={{
        backgroundImage: `radial-gradient(circle, #64748B 0.8px, transparent 0.8px)`,
        backgroundSize: "20px 20px",
      }} aria-hidden="true" />
    ),
    className: "relative overflow-hidden",
    topBorder: true,
  },

  /* ── Masterclasses — cool slate ── */
  masterclasses: {
    bg: "bg-[#F8FAFC] dark:bg-[hsl(213_28%_10%)]",
    topBorder: true,
  },

  /* ── Articles — warm ivory ── */
  articles: {
    bg: "bg-[#FDFCF8] dark:bg-[hsl(20_12%_8%)]",
    topBorder: true,
  },

  /* ── Trending — whisper gray ── */
  trending_content: {
    bg: "bg-[#F9FAFB] dark:bg-[hsl(213_22%_9%)]",
    topBorder: true,
  },

  /* ── Testimonials — elegant warm ivory with paper texture ── */
  testimonials: {
    bg: "bg-[#FDFCF8] dark:bg-[hsl(20_18%_9%)]",
    overlay: (
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.015] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "150px 150px",
        }}
        aria-hidden="true"
      />
    ),
    className: "relative overflow-hidden",
    topBorder: true,
  },

  /* ── Sponsorships — cool glass ── */
  sponsorships: {
    bg: "bg-[#F6F8FA] dark:bg-[hsl(213_25%_10%)]",
    topBorder: true,
  },

  /* ── Platform features — white with floating accents ── */
  features: {
    bg: "bg-white dark:bg-card",
    overlay: (
      <>
        <div className="absolute top-[20%] end-[4%] h-44 w-44 rounded-full bg-primary/[0.025] blur-[80px]" aria-hidden="true" />
        <div className="absolute bottom-[15%] start-[3%] h-36 w-36 rounded-full bg-accent/[0.03] blur-[60px]" aria-hidden="true" />
      </>
    ),
    className: "relative overflow-hidden",
    topBorder: true,
  },
  platform_features: {
    bg: "bg-white dark:bg-card",
    overlay: (
      <>
        <div className="absolute top-[20%] end-[4%] h-44 w-44 rounded-full bg-primary/[0.025] blur-[80px]" aria-hidden="true" />
        <div className="absolute bottom-[15%] start-[3%] h-36 w-36 rounded-full bg-accent/[0.03] blur-[60px]" aria-hidden="true" />
      </>
    ),
    className: "relative overflow-hidden",
    topBorder: true,
  },

  /* ── Newsletter CTA — clean white ── */
  newsletter: {
    bg: "bg-white dark:bg-[hsl(213_22%_9%)]",
    topBorder: true,
  },

  /* ── Quick actions — whisper gray ── */
  quick_actions: {
    bg: "bg-[#F9FAFB] dark:bg-[hsl(213_22%_9%)]",
    topBorder: true,
  },

  /* ── Ad banners — transparent ── */
  ad_banner_top: { bg: "bg-transparent" },
  ad_banner_mid: { bg: "bg-transparent" },
  ad_banner_bottom: { bg: "bg-transparent" },
};

export function getSectionTheme(sectionKey: string): SectionTheme {
  return SECTION_THEMES[sectionKey] || { bg: "bg-white dark:bg-background" };
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
      {/* Hairline separator — 1px gradient border */}
      {theme.topBorder && (
        <div className="h-px bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent dark:via-border/30" aria-hidden="true" />
      )}
      {theme.overlay}
      <div className="relative">{children}</div>
    </div>
  );
}
