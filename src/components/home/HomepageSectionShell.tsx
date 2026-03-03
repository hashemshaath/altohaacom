import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { type HomepageSection } from "@/hooks/useHomepageSections";
import { useSectionConfig } from "./SectionKeyContext";

const SPACING_MAP: Record<string, string> = {
  none: "py-0",
  compact: "py-4 md:py-6",
  normal: "py-8 md:py-12",
  relaxed: "py-12 md:py-20",
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
export function HomepageSectionShell({ children }: { children: ReactNode }) {
  const config = useSectionConfig();

  // If no config, render children with defaults
  if (!config) return <>{children}</>;

  const spacing = SPACING_MAP[config.spacing] || SPACING_MAP.normal;
  const animation = ANIMATION_MAP[config.animation] || "";
  const containerWidth = CONTAINER_MAP[config.container_width] || "";

  return (
    <div
      className={cn(spacing, animation, containerWidth && "mx-auto px-4", containerWidth, config.css_class)}
      style={config.bg_color ? { backgroundColor: config.bg_color } : undefined}
    >
      {children}
    </div>
  );
}
