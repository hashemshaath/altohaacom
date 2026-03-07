import { useState, useEffect, useRef } from "react";

export function useScrolled(threshold = 10) {
  const [scrolled, setScrolled] = useState(false);
  const scrolledRef = useRef(false);
  const rafId = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const isScrolled = window.scrollY > threshold;
        if (isScrolled !== scrolledRef.current) {
          scrolledRef.current = isScrolled;
          setScrolled(isScrolled);
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, [threshold]);

  return scrolled;
}
