import { useState, useEffect, useRef } from "react";
import { subscribeScroll } from "@/lib/scrollManager";

/**
 * Returns `true` when the page has scrolled past the given threshold.
 * Uses the centralized scroll manager (single RAF-throttled listener).
 */
export function useScrolled(threshold = 10) {
  const [scrolled, setScrolled] = useState(false);
  const scrolledRef = useRef(false);

  useEffect(() => {
    return subscribeScroll((scrollY) => {
      const isScrolled = scrollY > threshold;
      if (isScrolled !== scrolledRef.current) {
        scrolledRef.current = isScrolled;
        setScrolled(isScrolled);
      }
    });
  }, [threshold]);

  return scrolled;
}
