import { useLocation } from "react-router-dom";
import { useEffect, memo, type ReactNode, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Stable page transition that cannot get stuck invisible.
 * Uses declarative class toggles + a timeout fallback.
 */
export const PageTransition = memo(function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setIsVisible(false);

    const rafId = requestAnimationFrame(() => setIsVisible(true));
    const fallbackTimer = window.setTimeout(() => setIsVisible(true), 140);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(fallbackTimer);
    };
  }, [pathname]);

  return (
    <div
      className={cn(
        "transition-all duration-200 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      )}
    >
      {children}
    </div>
  );
});
