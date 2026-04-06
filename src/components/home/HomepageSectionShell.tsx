import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useSectionConfig, useSectionKey } from "./SectionKeyContext";
import { SectionBackgroundWrapper } from "./SectionBackground";

const SPACING: Record<string, string> = {
  none: "py-0",
  compact: "py-3 sm:py-5 md:py-6",
  normal: "py-6 sm:py-8 md:py-10",
  relaxed: "py-8 sm:py-10 md:py-12",
};

// Only GPU-composited properties (transform + opacity)
const ANIMATION_ACTIVE: Record<string, string> = {
  fade: "opacity-100",
  "slide-up": "translate-y-0 opacity-100",
  "slide-left": "translate-x-0 opacity-100",
  scale: "scale-100 opacity-100",
};

const ANIMATION_INITIAL: Record<string, string> = {
  fade: "opacity-0",
  "slide-up": "opacity-0 translate-y-4",
  "slide-left": "opacity-0 -translate-x-4",
  scale: "opacity-0 scale-95",
};

export function HomepageSectionShell({ children }: { children: ReactNode }) {
  const config = useSectionConfig();
  const sectionKey = useSectionKey();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  // Normalize: treat "blur" as "fade" since blur is not GPU-composited
  const rawAnim = config?.animation || "none";
  const animation = rawAnim === "blur" ? "fade" : rawAnim;
  const hasAnim = animation !== "none" && animation in ANIMATION_INITIAL;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !hasAnim) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => setVisible(true));
          observer.unobserve(el);
        }
      },
      { threshold: 0.01, rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnim]);

  const noShellSpacing = sectionKey === "search";
  const spacing = noShellSpacing ? SPACING.none : SPACING[config?.spacing || "normal"];

  return (
    <SectionBackgroundWrapper sectionKey={sectionKey || ""}>
      <section
        ref={sectionRef}
        className={cn(
          spacing,
          config?.css_class,
          hasAnim && "transition-[transform,opacity] duration-700 ease-out will-change-[transform,opacity]",
          hasAnim && (visible ? ANIMATION_ACTIVE[animation] : ANIMATION_INITIAL[animation])
        )}
        style={
          config?.bg_color && typeof window !== "undefined" && !document.documentElement.classList.contains("dark")
            ? { backgroundColor: config.bg_color }
            : undefined
        }
      >
        {children}
      </section>
    </SectionBackgroundWrapper>
  );
}
