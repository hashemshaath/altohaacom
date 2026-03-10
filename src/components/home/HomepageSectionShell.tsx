import { type ReactNode, memo, useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useSectionConfig } from "./SectionKeyContext";

const SPACING_MAP: Record<string, string> = {
  none: "py-0",
  compact: "py-1.5 sm:py-2 md:py-3",
  normal: "py-2 sm:py-3 md:py-4",
  relaxed: "py-3 sm:py-4 md:py-6",
};

const CONTAINER_MAP: Record<string, string> = {
  narrow: "max-w-4xl",
  default: "max-w-7xl",
  wide: "max-w-[1400px]",
  full: "max-w-full px-0",
};

const ANIMATION_CLASS: Record<string, string> = {
  none: "",
  fade: "translate-y-0 opacity-100",
  "slide-up": "translate-y-0 opacity-100",
  "slide-left": "translate-x-0 opacity-100",
  scale: "scale-100 opacity-100",
  blur: "blur-0 opacity-100",
};

const ANIMATION_INITIAL: Record<string, string> = {
  none: "",
  fade: "opacity-0",
  "slide-up": "opacity-0 translate-y-6",
  "slide-left": "opacity-0 -translate-x-6",
  scale: "opacity-0 scale-95",
  blur: "opacity-0 blur-sm",
};

/**
 * Shell wrapper that applies universal DB config (spacing, bg_color, css_class, 
 * container_width, animation) to any homepage section component.
 * Uses IntersectionObserver for scroll-triggered animations.
 */
export const HomepageSectionShell = memo(function HomepageSectionShell({ children }: { children: ReactNode }) {
  const config = useSectionConfig();
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const animation = config?.animation || "none";
  const hasAnimation = animation !== "none";

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      setShouldRender(true);
      if (!hasAnimation) setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          if (!hasAnimation) setIsVisible(true);
          // For animated sections, delay visibility one frame so animation plays
          else requestAnimationFrame(() => setIsVisible(true));
          observer.unobserve(el);
        }
      },
      { threshold: 0.01, rootMargin: "200px 0px 200px 0px" }
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, [hasAnimation]);

  // If no config, render children with sensible default spacing
  if (!config) {
    return (
      <div ref={ref} className={SPACING_MAP.normal}>
        {shouldRender ? children : <div className="min-h-[120px]" />}
      </div>
    );
  }

  const spacing = SPACING_MAP[config.spacing] || SPACING_MAP.normal;

  return (
    <div
      ref={ref}
      className={cn(
        spacing,
        config.css_class,
        hasAnimation && "transition-all duration-700 ease-out",
        hasAnimation && (isVisible ? ANIMATION_CLASS[animation] : ANIMATION_INITIAL[animation])
      )}
      style={config.bg_color ? { backgroundColor: config.bg_color } : undefined}
    >
      {shouldRender ? children : <div className="min-h-[120px]" />}
    </div>
  );
});
