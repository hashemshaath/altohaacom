import React, { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SectionRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Animation direction */
  direction?: "up" | "left" | "right";
  /** Delay in ms */
  delay?: number;
}

export const SectionReveal = forwardRef<HTMLDivElement, SectionRevealProps>(
  ({ children, className, direction = "up", delay = 0 }, forwardedRef) => {
    const innerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      // Immediately show if already in viewport on mount
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setIsVisible(true);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(el);
          }
        },
        { threshold: 0.05, rootMargin: "0px 0px 50px 0px" }
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    const hiddenTransform =
      direction === "up"
        ? "translate-y-6"
        : direction === "left"
        ? "-translate-x-6"
        : "translate-x-6";

    return (
      <div
        ref={(node) => {
          (innerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={cn(
          "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isVisible ? "opacity-100 translate-y-0 translate-x-0" : `opacity-0 ${hiddenTransform}`,
          className
        )}
        style={{ transitionDelay: isVisible ? `${delay}ms` : "0ms" }}
      >
        {children}
      </div>
    );
  }
);

SectionReveal.displayName = "SectionReveal";
