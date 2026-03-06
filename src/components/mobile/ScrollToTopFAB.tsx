import { useState, useEffect, memo } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Floating scroll-to-top button for mobile.
 * Appears after scrolling 400px down, hides near top.
 */
export const ScrollToTopFAB = memo(function ScrollToTopFAB() {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setVisible(window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile]);

  if (!isMobile) return null;

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-[8.5rem] end-4 z-40 h-10 w-10 rounded-full shadow-lg transition-all duration-300 touch-manipulation",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        visible
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-4 opacity-0 scale-75 pointer-events-none"
      )}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-4 w-4" />
    </Button>
  );
});
