import React, { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SectionRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "left" | "right";
  delay?: number;
}

export const SectionReveal = forwardRef<HTMLDivElement, SectionRevealProps>(
  ({ children, className, direction = "up", delay = 0 }, forwardedRef) => {
    const innerRef = useRef<HTMLDivElement>(null);
    // Start visible by default to prevent flash
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      // Only animate elements that start below the viewport
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
      // Elements already in viewport: no animation needed, stay visible
    }, []);

    const hiddenTransform =
      direction === "up"
        ? "translate-y-5"
        : direction === "left"
        ? "-translate-x-5"
        : "translate-x-5";

    // If not animating (already in viewport on mount), render children directly
    const isHidden = shouldAnimate && !hasAnimated;

    return (
      <div
        ref={(node) => {
          (innerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
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
);

SectionReveal.displayName = "SectionReveal";
