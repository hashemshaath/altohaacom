import { useRef, useState, useEffect, forwardRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HorizontalScrollRowProps {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  isAr?: boolean;
  showArrows?: boolean;
}

export const HorizontalScrollRow = forwardRef<HTMLDivElement, HorizontalScrollRowProps>(function HorizontalScrollRow({
  children,
  className,
  isAr = false,
  showArrows = true,
}, ref) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const atStart = Math.abs(scrollLeft) < 2;
    const atEnd = Math.abs(scrollLeft) + clientWidth >= scrollWidth - 2;
    setCanScrollStart(!atStart);
    setCanScrollEnd(!atEnd);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [children]);

  const scroll = (direction: "start" | "end") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    const dir = direction === "end" ? 1 : -1;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <div className="relative group/scroll">
      {/* Fade edges */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 start-0 z-10 w-6 sm:w-10 bg-gradient-to-e from-background to-transparent transition-opacity duration-300",
          canScrollStart ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 end-0 z-10 w-6 sm:w-10 bg-gradient-to-s from-background to-transparent transition-opacity duration-300",
          canScrollEnd ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Arrow buttons - desktop only */}
      {showArrows && canScrollStart && (
        <Button
          variant="outline"
          size="icon"
          className="absolute start-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full shadow-lg bg-background/90 backdrop-blur-sm opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300 hidden sm:flex"
          onClick={() => scroll("start")}
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </Button>
      )}
      {showArrows && canScrollEnd && (
        <Button
          variant="outline"
          size="icon"
          className="absolute end-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full shadow-lg bg-background/90 backdrop-blur-sm opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300 hidden sm:flex"
          onClick={() => scroll("end")}
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
      )}

      {/* Scroll container */}
      <div
        ref={scrollRef}
        dir={isAr ? "rtl" : "ltr"}
        className={cn(
          "flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1 -mx-4 px-4 sm:-mx-0 sm:px-0",
          className
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </div>
    </div>
  );
});
