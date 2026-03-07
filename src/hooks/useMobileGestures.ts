import { useRef, useCallback } from "react";

/**
 * Haptic feedback utility with fallback
 */
export function haptic(style: "light" | "medium" | "heavy" = "light") {
  try {
    if ("vibrate" in navigator) {
      const durations = { light: 8, medium: 15, heavy: 25 };
      navigator.vibrate(durations[style]);
    }
  } catch {}
}

/**
 * Hook for detecting double-tap gestures
 */
export function useDoubleTap(callback: () => void, delay = 300) {
  const lastTap = useRef(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < delay) {
      callback();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  }, [callback, delay]);

  return handleTap;
}

/**
 * Hook for detecting long-press gestures
 */
export function useLongPress(callback: () => void, duration = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const activeRef = useRef(false);

  const start = useCallback(() => {
    activeRef.current = true;
    timerRef.current = setTimeout(() => {
      if (activeRef.current) {
        haptic("medium");
        callback();
      }
    }, duration);
  }, [callback, duration]);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: stop,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
  };
}

/**
 * Hook to detect if the current device is mobile based on viewport
 */
export function useIsMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}
