import { useEffect, useState } from "react";

export function ArticleReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 inset-x-0 z-[60] h-[3px] bg-muted/30 pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-primary to-chart-2 transition-[width] duration-150 ease-out shadow-[0_0_8px_hsl(var(--primary)/0.3)]"
        style={{ width: `${progress}%` }}
      />
      {progress > 0 && progress < 100 && (
        <div
          className="absolute top-0 h-full w-1 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)] transition-[left] duration-150 ease-out"
          style={{ left: `${progress}%` }}
        />
      )}
    </div>
  );
}
