import { type ReactNode, useEffect, useRef, useState, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useSectionConfig, useSectionKey } from "./SectionKeyContext";
import { SectionBackgroundWrapper } from "./SectionBackground";

const SPACING: Record<string, string> = {
  none: "py-0",
  compact: "py-6 sm:py-8 md:py-12",
  normal: "py-8 sm:py-12 md:py-16 lg:py-24",
  relaxed: "py-12 sm:py-16 md:py-20 lg:py-24",
};

export const HomepageSectionShell = forwardRef<HTMLDivElement, { children: ReactNode }>(function HomepageSectionShell({ children }, ref) {
  const config = useSectionConfig();
  const sectionKey = useSectionKey();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  const animation = config?.animation || "none";
  const hasAnim = animation !== "none" && animation !== "blur";

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !hasAnim) { setVisible(true); return; }

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

  const noShellSpacing = sectionKey === "search" || sectionKey === "premium_cta" || sectionKey?.startsWith("ad_banner");
  const spacing = noShellSpacing ? SPACING.none : SPACING[config?.spacing || "normal"];

  return (
    <SectionBackgroundWrapper sectionKey={sectionKey || ""}>
      <section
        ref={sectionRef}
        className={cn(
          spacing,
          config?.css_class,
          hasAnim && "transition-[transform,opacity] duration-700 ease-out will-change-[transform,opacity]",
          hasAnim && (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")
        )}
      >
        {children}
      </section>
    </SectionBackgroundWrapper>
  );
}
