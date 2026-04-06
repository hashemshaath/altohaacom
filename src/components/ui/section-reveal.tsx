import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "left" | "right";
  delay?: number;
}

export const SectionReveal = forwardRef<HTMLDivElement, SectionRevealProps>(function SectionReveal({ children, className, direction = "up", delay = 0 }, forwardedRef) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Use IntersectionObserver for initial check too — avoids forced reflow from getBoundingClientRect
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Element was already in viewport on mount — no animation needed
          setHasAnimated(true);
          observer.unobserve(el);
        } else {
          // Element is below fold — animate it in when it enters
          setShouldAnimate(true);

          const revealObserver = new IntersectionObserver(
            ([e]) => {
              if (e.isIntersecting) {
                setHasAnimated(true);
                revealObserver.unobserve(el);
              }
            },
            { threshold: 0.01, rootMargin: "0px 0px 80px 0px" }
          );
          revealObserver.observe(el);
          observer.unobserve(el);
        }
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hiddenTransform =
    direction === "up"
      ? "translate-y-4"
      : direction === "left"
        ? "-translate-x-4"
        : "translate-x-4";

  const isHidden = shouldAnimate && !hasAnimated;

  return (
    <div
      ref={ref}
      className={cn(
        // Only animate GPU-composited properties: transform + opacity
        shouldAnimate && "transition-[transform,opacity] duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[transform,opacity]",
        isHidden ? `opacity-0 ${hiddenTransform}` : "opacity-100 translate-y-0 translate-x-0",
        className
      )}
      style={shouldAnimate && hasAnimated ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
});
