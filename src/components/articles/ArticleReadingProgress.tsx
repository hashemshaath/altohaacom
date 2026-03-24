import { useEffect, useState, useRef, memo } from "react";

export const ArticleReadingProgress = memo(function ArticleReadingProgress() {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const el = document.documentElement;
        const scrollTop = el.scrollTop;
        const scrollHeight = el.scrollHeight - el.clientHeight;
        setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
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
    <div className="fixed top-0 inset-x-0 z-[60] h-[2px] bg-muted/20 pointer-events-none" aria-hidden>
      <div
        className="h-full bg-gradient-to-r from-primary via-primary to-primary/70 transition-[width] duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
      {progress > 0 && progress < 100 && (
        <div
          className="absolute top-0 h-full w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)] transition-[left] duration-100 ease-out"
          style={{ left: `${progress}%` }}
        />
      )}
    </div>
  );
});
