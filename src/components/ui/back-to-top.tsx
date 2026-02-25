import { memo, useEffect, useState, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating "back to top" button that appears after scrolling down.
 */
export const BackToTop = memo(function BackToTop({ className }: { className?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollUp = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <button
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
