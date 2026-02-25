import { useEffect, useState, memo } from "react";
import { cn } from "@/lib/utils";

/**
 * A thin progress bar at the top of the viewport that shows scroll progress.
 * Professional touch for long pages.
 */
export const ScrollProgress = memo(function ScrollProgress({
  className,
}: {
  className?: string;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  if (progress < 1) return null;

  return (
    <div
      className={cn(
        "fixed top-0 inset-x-0 z-[60] h-0.5 bg-primary/10",
        className
      )}
    >
      <div
        className="h-full bg-primary transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
});
