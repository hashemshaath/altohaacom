import { forwardRef, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HorizontalScrollRowProps {
  children: ReactNode;
  className?: string;
  isAr?: boolean;
  showArrows?: boolean;
}

export const HorizontalScrollRow = forwardRef<HTMLDivElement, HorizontalScrollRowProps>(function HorizontalScrollRow(
  { children, className, isAr = false, showArrows = true }: HorizontalScrollRowProps,
  ref
) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);

  const setScrollRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const atStart = Math.abs(scrollLeft) < 2;
    const atEnd = Math.abs(scrollLeft) + clientWidth >= scrollWidth - 2;

    setCanScrollStart(!atStart);
    setCanScrollEnd(!atEnd);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const frame = requestAnimationFrame(checkScroll);
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll, { passive: true });

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(checkScroll) : null;
    resizeObserver?.observe(el);

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      resizeObserver?.disconnect();
    };
  }, [checkScroll, children]);

  const scroll = (direction: "start" | "end") => {
    const el = scrollRef.current;
    if (!el) return;

    const amount = el.clientWidth * 0.7;
    const dir = direction === "end" ? 1 : -1;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <div className="relative group/scroll">
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

      <div
        ref={setScrollRef}
        dir={isAr ? "rtl" : "ltr"}
        className={cn(
          "flex gap-3.5 sm:gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1 touch-pan-x",
          className
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </div>
    </div>
  );
});
