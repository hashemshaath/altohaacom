import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "left" | "right";
  delay?: number;
}

export function SectionReveal({ children, className, direction = "up", delay = 0 }: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top >= window.innerHeight) {
      setShouldAnimate(true);

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setHasAnimated(true);
            observer.unobserve(el);
          }
        },
        { threshold: 0.01, rootMargin: "0px 0px 80px 0px" }
      );

      observer.observe(el);
      return () => observer.disconnect();
    }
  }, []);

  const hiddenTransform =
    direction === "up"
      ? "translate-y-5"
      : direction === "left"
        ? "-translate-x-5"
        : "translate-x-5";

  const isHidden = shouldAnimate && !hasAnimated;

  return (
    <div
      ref={ref}
      className={cn(
        shouldAnimate && "transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isHidden ? `opacity-0 blur-[2px] ${hiddenTransform}` : "opacity-100 blur-0 translate-y-0 translate-x-0",
        className
      )}
      style={shouldAnimate && hasAnimated ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
