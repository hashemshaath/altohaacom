import { memo } from "react";
import { useScrollProgress } from "@/hooks/useScrollProgress";

/**
 * A slim progress bar at the top of the viewport indicating scroll depth.
 */
export const NewsReadingProgress = memo(function NewsReadingProgress() {
  const progress = useScrollProgress();

  if (progress < 1) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[60] h-0.5 bg-muted/30" aria-hidden>
      <div
        className="h-full bg-gradient-to-r from-primary to-primary/70 transition-[width] duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
});
