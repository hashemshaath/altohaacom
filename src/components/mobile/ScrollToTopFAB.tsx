import { useState, useEffect, memo } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { subscribeScroll } from "@/lib/scrollManager";

/**
 * Floating scroll-to-top button for mobile.
 * Uses the centralized scroll manager.
 */
export const ScrollToTopFAB = memo(function ScrollToTopFAB() {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    return subscribeScroll((scrollY) => {
      setVisible(scrollY > 400);
    });
  }, [isMobile]);

  if (!isMobile) return null;

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-[7rem] end-4 z-40 h-11 w-11 rounded-full shadow-lg transition-all duration-300 touch-manipulation safe-area-right",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        visible
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-4 opacity-0 scale-75 pointer-events-none"
      )}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-[18px] w-[18px]" />
    </Button>
  );
});
