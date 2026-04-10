import { useEffect, useRef, useState, type RefObject } from "react";

interface UseInViewOptions {
  /** Root margin for early/late triggering */
  rootMargin?: string;
  /** Visibility threshold (0-1) */
  threshold?: number;
  /** Only trigger once then disconnect */
  once?: boolean;
}

/**
 * Reusable IntersectionObserver hook.
 *
 * Returns [ref, inView] — attach `ref` to your element and use `inView` for conditional rendering.
 *
 * ```tsx
 * const [ref, inView] = useInView({ rootMargin: "200px", once: true });
 * return <div ref={ref}>{inView && <ExpensiveComponent />}</div>;
 * ```
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
): [RefObject<T | null>, boolean] {
  const { rootMargin = "0px", threshold = 0, once = false } = options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setInView(isVisible);
        if (isVisible && once) {
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return [ref, inView];
}
