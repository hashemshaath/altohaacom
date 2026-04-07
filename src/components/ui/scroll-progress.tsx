import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Thin 2px gradient scroll progress bar — fixed at the very top.
 * Only renders when the user has scrolled past 1%.
 */
export function ScrollProgress({ className }: { className?: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      cancelAnimationFrame(raf);
    };
  }, []);

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
