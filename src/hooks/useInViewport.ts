import { useRef, useState, useEffect } from "react";

/**
 * Lightweight hook that returns true once the element enters the viewport.
 * Uses IntersectionObserver for performance — the component can skip
 * rendering expensive children until actually visible.
 */
export function useInViewport(rootMargin = "200px 0px") {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Already in viewport on mount?
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 200) {
      setInView(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin, threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
