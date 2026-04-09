import { cn } from "@/lib/utils";
import { useScrollProgress } from "@/hooks/useScrollProgress";

/**
 * Thin 2px gradient scroll progress bar — fixed at the very top.
 * Only renders when the user has scrolled past 1%.
 */
export function ScrollProgress({ className }: { className?: string }) {
  const progress = useScrollProgress();

  if (progress < 1) return null;

  return (
    <div
      className={cn("fixed top-0 inset-x-0 z-[100] h-[2px]", className)}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full transition-[width] duration-100 ease-out"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(to right, var(--color-primary), #C084FC)",
        }}
      />
    </div>
  );
}
