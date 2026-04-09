import { memo } from "react";
import { cn } from "@/lib/utils";
import { useScrollProgress } from "@/hooks/useScrollProgress";

/**
 * A thin progress bar that shows reading progress as the user scrolls through the feed.
 * Appears at the top of the feed column.
 */
export const FeedScrollProgress = memo(function FeedScrollProgress() {
  const progress = useScrollProgress();

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
