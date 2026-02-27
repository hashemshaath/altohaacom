import { useRef, useEffect, useCallback } from "react";

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  enabled?: boolean;
}

/**
 * Hook for detecting swipe gestures on touch devices.
 * Returns a ref to attach to the swipeable element.
 */
export function useSwipeGesture<T extends HTMLElement = HTMLDivElement>(
  options: SwipeGestureOptions
) {
  const ref = useRef<T>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);

  const threshold = options.threshold ?? 50;
  const enabled = options.enabled ?? true;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    tracking.current = true;
  }, [enabled]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!tracking.current || !enabled) return;
    tracking.current = false;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Must exceed threshold and be primarily in one direction
    if (Math.max(absDx, absDy) < threshold) return;

    if (absDx > absDy) {
      // Horizontal swipe
      if (dx > 0) options.onSwipeRight?.();
      else options.onSwipeLeft?.();
    } else {
      // Vertical swipe
      if (dy > 0) options.onSwipeDown?.();
      else options.onSwipeUp?.();
    }
  }, [enabled, threshold, options]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return ref;
}
