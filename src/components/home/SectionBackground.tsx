import { cn } from "@/lib/utils";
import { type ReactNode, forwardRef } from "react";

export type SectionTheme = {
  bg: string;
  overlay?: ReactNode;
  className?: string;
  topBorder?: boolean;
};

/**
 * Hardcoded overrides for special sections that need specific backgrounds.
 * All other sections get dynamic alternating backgrounds.
 */
const SECTION_OVERRIDES: Record<string, Partial<SectionTheme>> = {
  search: { bg: "bg-background", topBorder: false },
  ad_banner_top: { bg: "bg-transparent", topBorder: false },
  ad_banner_mid: { bg: "bg-transparent", topBorder: false },
  ad_banner_bottom: { bg: "bg-transparent", topBorder: false },
  premium_cta: { bg: "bg-[#F8F8F8] dark:bg-muted/10", topBorder: true },
};

const BG_PRIMARY = "bg-background";
const BG_SECONDARY = "bg-[#F8F8F8] dark:bg-muted/10";

/**
 * Returns the alternating background for a section based on its visible index.
 * Even indices → white, Odd indices → light gray.
 */
function getSectionTheme(sectionKey: string, visibleIndex?: number): SectionTheme {
  const override = SECTION_OVERRIDES[sectionKey];
  if (override?.bg) {
    return {
      bg: override.bg,
      topBorder: override.topBorder ?? true,
      className: override.className,
      overlay: override.overlay,
    };
  }

  const isOdd = typeof visibleIndex === "number" ? visibleIndex % 2 === 1 : false;
  return {
    bg: isOdd ? BG_SECONDARY : BG_PRIMARY,
    topBorder: typeof visibleIndex === "number" && visibleIndex > 0,
  };
}

export const SectionBackgroundWrapper = forwardRef<HTMLDivElement, {
  sectionKey: string;
  children: ReactNode;
  className?: string;
  visibleIndex?: number;
}>(function SectionBackgroundWrapper({ sectionKey, children, className, visibleIndex }, ref) {
  const theme = getSectionTheme(sectionKey, visibleIndex);

  return (
    <div ref={ref} className={cn(theme.bg, theme.className, className)}>
      {theme.topBorder && (
        <div className="h-px bg-border/30" aria-hidden="true" />
      )}
      {theme.overlay}
      <div className="relative">{children}</div>
    </div>
  );
});
