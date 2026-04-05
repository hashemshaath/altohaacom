import { memo, useEffect, useState, useRef } from "react";

/**
 * A slim progress bar at the top of the viewport indicating scroll depth.
 */
export const NewsReadingProgress = memo(function NewsReadingProgress() {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

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
