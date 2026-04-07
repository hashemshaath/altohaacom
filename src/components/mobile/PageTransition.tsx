import { useLocation } from "react-router-dom";
import { useEffect, memo, type ReactNode, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Apple-style page transition: subtle fade + slide-up on enter,
 * quick fade on exit. Falls back instantly if stuck.
 */
export const PageTransition = memo(function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);
  const [phase, setPhase] = useState<"visible" | "exiting" | "entering">("visible");

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Exit phase
    setPhase("exiting");

    const enterTimer = window.setTimeout(() => {
      setPhase("entering");
      // Entering → visible after animation
      const visibleTimer = window.setTimeout(() => setPhase("visible"), 200);
      return () => window.clearTimeout(visibleTimer);
    }, 150);

    // Absolute fallback
    const fallback = window.setTimeout(() => setPhase("visible"), 500);

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(fallback);
    };
  }, [pathname]);

  return (
    <div
      className={cn(
        "will-change-[opacity,transform]",
        phase === "visible" && "opacity-100 translate-y-0",
        phase === "exiting" && "page-exit-active",
        phase === "entering" && "page-enter-active"
      )}
      style={phase === "entering" ? { opacity: 0, transform: "translateY(8px)", animation: "pageEnter 200ms ease forwards" } : undefined}
    >
      {children}
    </div>
  );
});
