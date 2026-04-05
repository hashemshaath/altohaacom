import { useEffect, useRef, useState } from "react";

/**
 * Returns a className string that applies a staggered fade-in + slide-up animation.
 * Each child element gets a progressively longer delay.
 */
export function useStaggeredReveal(count: number, baseDelay = 60) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Small raf so the initial render paints without the class, then animates in
    const id = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return {
    revealed,
    getStyle: (index: number) =>
      revealed
        ? {
            opacity: 1,
            transform: "translateY(0)",
            transition: `opacity 0.45s cubic-bezier(0.22,1,0.36,1) ${index * baseDelay}ms, transform 0.45s cubic-bezier(0.22,1,0.36,1) ${index * baseDelay}ms`,
          }
        : {
            opacity: 0,
            transform: "translateY(12px)",
          },
  };
}

/**
 * Simple fade-in on mount for a single element.
 */
export function useFadeIn(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return {
    style: {
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(8px)",
      transition: "opacity 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.22,1,0.36,1)",
    },
  };
}
