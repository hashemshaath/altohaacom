import { useState, useEffect, useRef } from "react";

/**
 * Tracks scroll direction and returns whether the element should be visible.
 * Used for auto-hide headers/toolbars on mobile.
 */
export function useScrollDirection(threshold = 10) {
  const [visible, setVisible] = useState(true);
  const [atTop, setAtTop] = useState(true);
  const prevY = useRef(0);
  const rafId = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const y = window.scrollY;
        const isAtTop = y < 50;
        setAtTop(isAtTop);

        if (isAtTop) {
          setVisible(true);
        } else if (y > prevY.current + threshold) {
          setVisible(false);
        } else if (y < prevY.current - threshold) {
          setVisible(true);
        }
        prevY.current = y;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, [threshold]);

  return { visible, atTop };
}
