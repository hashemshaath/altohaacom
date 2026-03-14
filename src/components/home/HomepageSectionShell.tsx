import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useSectionConfig } from "./SectionKeyContext";

const SPACING: Record<string, string> = {
  none: "py-0",
  compact: "py-3 sm:py-3 md:py-4",
  normal: "py-4 sm:py-5 md:py-6",
  relaxed: "py-5 sm:py-6 md:py-8",
};

const ANIMATION_ACTIVE: Record<string, string> = {
  fade: "opacity-100",
  "slide-up": "translate-y-0 opacity-100",
  "slide-left": "translate-x-0 opacity-100",
  scale: "scale-100 opacity-100",
  blur: "blur-0 opacity-100",
};

const ANIMATION_INITIAL: Record<string, string> = {
  fade: "opacity-0",
  "slide-up": "opacity-0 translate-y-6",
  "slide-left": "opacity-0 -translate-x-6",
  scale: "opacity-0 scale-95",
  blur: "opacity-0 blur-sm",
};

export function HomepageSectionShell({ children }: { children: ReactNode }) {
  const config = useSectionConfig();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  const animation = config?.animation || "none";
  const hasAnim = animation !== "none";

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

  const spacing = SPACING[config?.spacing || "normal"];

  return (
    <section
      ref={sectionRef}
      className={cn(
        spacing,
        config?.css_class,
        hasAnim && "transition-all duration-700 ease-out",
        hasAnim && (visible ? ANIMATION_ACTIVE[animation] : ANIMATION_INITIAL[animation])
      )}
      style={
        config?.bg_color && !document.documentElement.classList.contains("dark")
          ? { backgroundColor: config.bg_color }
          : undefined
      }
    >
      {children}
    </section>
  );
}
