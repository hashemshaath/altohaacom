import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface UsePullToRefreshOptions {
  onRefresh?: () => Promise<void> | void;
  threshold?: number;
  maxPull?: number;
  disabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
  disabled = false,
}: UsePullToRefreshOptions = {}) {
  const queryClient = useQueryClient();
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const triggered = useRef(false);
  const currentDistance = useRef(0);
  const rafId = useRef(0);

  const defaultRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
    await new Promise((r) => setTimeout(r, 500));
  }, [queryClient]);

  const refreshFn = onRefresh || defaultRefresh;

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || refreshing) return;
      if (window.scrollY > 5) return;
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
      triggered.current = false;
    },
    [disabled, refreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling.current || disabled || refreshing) return;
      const diff = e.touches[0].clientY - startY.current;
      if (diff < 0) {
        isPulling.current = false;
        setPulling(false);
        setPullDistance(0);
        currentDistance.current = 0;
        return;
      }
      const distance = Math.min(diff * 0.45, maxPull);
      currentDistance.current = distance;

      // Throttle state updates with rAF
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        setPullDistance(currentDistance.current);
        setPulling(true);
      });

      if (distance >= threshold && !triggered.current) {
        triggered.current = true;
        try { if ("vibrate" in navigator) navigator.vibrate(15); } catch {}
      }
    },
    [disabled, refreshing, threshold, maxPull]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    cancelAnimationFrame(rafId.current);

    if (currentDistance.current >= threshold && !refreshing) {
      setRefreshing(true);
      try { if ("vibrate" in navigator) navigator.vibrate([10, 30, 10]); } catch {}
      try {
        await refreshFn();
      } catch {
        // silently fail
      }
      setRefreshing(false);
    }
    setPulling(false);
    setPullDistance(0);
    currentDistance.current = 0;
  }, [threshold, refreshing, refreshFn]);

  useEffect(() => {
    if (disabled) return;
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      cancelAnimationFrame(rafId.current);
    };
  }, [disabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);

  return { pulling, pullDistance, refreshing, progress };
}
