import { useLocation } from "react-router-dom";
import { useRef, useEffect, memo, type ReactNode } from "react";

/**
 * Lightweight mobile page transition – fades content in on route change.
 * Uses CSS animations only (no extra deps).
 */
export const PageTransition = memo(function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPath.current && ref.current) {
      ref.current.style.opacity = "0";
      ref.current.style.transform = "translateY(4px)";
      // Double rAF ensures the browser paints the "hidden" state first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (ref.current) {
            ref.current.style.transition = "opacity 0.2s cubic-bezier(0.22,1,0.36,1), transform 0.2s cubic-bezier(0.22,1,0.36,1)";
            ref.current.style.opacity = "1";
            ref.current.style.transform = "translateY(0)";
          }
        });
      });
      prevPath.current = pathname;
    }
  }, [pathname]);

  return (
    <div ref={ref} style={{ opacity: 1, transform: "translateY(0)" }}>
      {children}
    </div>
  );
});
