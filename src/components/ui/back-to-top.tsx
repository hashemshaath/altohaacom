import { forwardRef, useEffect, useState, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { subscribeScroll } from "@/lib/scrollManager";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

interface BackToTopProps {
  className?: string;
}

/**
 * Floating "back to top" button that appears after scrolling down.
 * Uses the centralized scroll manager (single RAF-throttled listener).
 */
export const BackToTop = forwardRef<HTMLButtonElement, BackToTopProps>(function BackToTop(
  { className },
  ref
) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return subscribeScroll((scrollY) => {
      setVisible(scrollY > 400);
    });
  }, []);

  const scrollUp = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <button
      ref={ref}
      onClick={scrollUp}
      aria-label="Back to top"
      className={cn(
        "fixed bottom-20 end-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-card/90 shadow-lg backdrop-blur-sm transition-all duration-300",
        visible
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-4 opacity-0 scale-90 pointer-events-none",
        "hover:bg-primary hover:text-primary-foreground hover:border-primary/50 hover:shadow-primary/20",
        "active:scale-90",
        className
      )}
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
});
