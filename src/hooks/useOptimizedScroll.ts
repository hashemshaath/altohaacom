import { useEffect, useRef } from "react";

/**
 * Applies CSS `will-change: transform` during active scroll for smoother 60fps scrolling.
 * Removes the hint after scrolling stops to free GPU memory.
 */
export function useOptimizedScroll(ref: React.RefObject<HTMLElement | null>) {
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      el.style.willChange = "transform";
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        el.style.willChange = "auto";
      }, 150);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(timer.current);
    };
  }, [ref]);
}
