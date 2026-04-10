import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "left" | "right";
  delay?: number;
}

/**
 * Optimised scroll-reveal wrapper using a single IntersectionObserver.
 * - Elements already in the viewport on mount → rendered immediately (no animation).
 * - Elements below the fold → fade/slide in once they enter.
 */
export const SectionReveal = forwardRef<HTMLDivElement, SectionRevealProps>(function SectionReveal(
  { children, className, direction = "up", delay = 0 },
  _forwardedRef
) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"pending" | "animate" | "visible">("pending");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          // Below fold — switch to animate mode and wait for entry
          setState("animate");
          return;
        }
        // In viewport — show immediately
        setState("visible");
        observer.disconnect();
      },
      { threshold: 0.01, rootMargin: "0px 0px 80px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Once in "animate" mode, observe for viewport entry
  useEffect(() => {
    if (state !== "animate") return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: "0px 0px 80px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [state]);

  const hiddenTransform =
    direction === "up" ? "translate-y-4" : direction === "left" ? "-translate-x-4" : "translate-x-4";

  const isHidden = state === "animate";

  return (
    <div
      ref={ref}
      className={cn(
        state === "animate" || state === "visible"
          ? "transition-[transform,opacity] duration-600 ease-out-quint will-change-[transform,opacity]"
          : undefined,
        isHidden ? `opacity-0 ${hiddenTransform}` : "opacity-100 translate-y-0 translate-x-0",
        className
      )}
      style={state === "visible" && delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
});
