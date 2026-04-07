import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Adds `.visible` class to the element when it enters the viewport.
 * Use with the `.reveal` CSS class for scroll-triggered animations.
 *
 * @param threshold - Intersection ratio to trigger (default 0.15)
 * @param rootMargin - Observer root margin (default "0px 0px -40px 0px")
 */
export function useReveal(threshold = 0.15, rootMargin = "0px 0px -40px 0px") {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, visible };
}
