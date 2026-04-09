import { useEffect, useRef, useState } from "react";

/**
 * Tracks page scroll progress as a percentage (0–100).
 * Uses rAF throttling to avoid layout thrash.
 */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return progress;
}
