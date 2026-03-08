import { type ReactNode, memo } from "react";
import { cn } from "@/lib/utils";
import { type HomepageSection } from "@/hooks/useHomepageSections";
import { useSectionConfig } from "./SectionKeyContext";

const SPACING_MAP: Record<string, string> = {
  none: "py-0",
  compact: "py-2 sm:py-3 md:py-5",
  normal: "py-4 sm:py-5 md:py-8",
  relaxed: "py-5 sm:py-6 md:py-12",
};

const CONTAINER_MAP: Record<string, string> = {
  narrow: "max-w-4xl",
  default: "max-w-7xl",
  wide: "max-w-[1400px]",
  full: "max-w-full px-0",
};

const ANIMATION_MAP: Record<string, string> = {
  none: "",
  fade: "animate-in fade-in duration-700",
  "slide-up": "animate-in slide-in-from-bottom-4 duration-700",
  "slide-left": "animate-in slide-in-from-left-4 duration-700",
  scale: "animate-in zoom-in-95 duration-500",
  blur: "animate-in fade-in duration-700",
};

/**
 * Shell wrapper that applies universal DB config (spacing, bg_color, css_class, 
 * container_width, animation) to any homepage section component.
 * Components inside only handle their own content rendering.
 */
export const HomepageSectionShell = memo(function HomepageSectionShell({ children }: { children: ReactNode }) {
  const config = useSectionConfig();

  // If no config, render children with sensible default spacing
  if (!config) {
    return <div className={SPACING_MAP.normal}>{children}</div>;
  }

  const spacing = SPACING_MAP[config.spacing] || SPACING_MAP.normal;
  const animation = ANIMATION_MAP[config.animation] || "";

  return (
    <div
      className={cn(spacing, animation, config.css_class)}
      style={config.bg_color ? { backgroundColor: config.bg_color } : undefined}
    >
      {children}
    </div>
  );
}
