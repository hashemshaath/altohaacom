import { memo, useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * A thin progress bar that shows reading progress as the user scrolls through the feed.
 * Appears at the top of the feed column.
 */
export const FeedScrollProgress = memo(function FeedScrollProgress() {
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight <= 0) { setProgress(0); return; }
        setProgress(Math.min(100, (scrollTop / docHeight) * 100));
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  if (progress <= 0) return null;

  return (
    <div className="sticky top-0 z-50 h-[2px] w-full bg-border/20">
      <div
        className={cn(
          "h-full bg-gradient-to-r from-primary via-primary to-chart-4 transition-[width] duration-100 ease-out rounded-full"
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
});
