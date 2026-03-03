import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

// No-op haptic stub (native haptics module removed)
const haptic = (_type?: string) => {};

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
        return;
      }
      const distance = Math.min(diff * 0.45, maxPull);
      setPullDistance(distance);
      setPulling(true);

      if (distance >= threshold && !triggered.current) {
        triggered.current = true;
        haptic("medium");
      }
    },
    [disabled, refreshing, threshold, maxPull]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      haptic("success");
      try {
        await refreshFn();
      } catch {
        // silently fail
      }
      setRefreshing(false);
    }
    setPulling(false);
    setPullDistance(0);
  }, [pullDistance, threshold, refreshing, refreshFn]);

  useEffect(() => {
    if (disabled) return;
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [disabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);

  return { pulling, pullDistance, refreshing, progress };
}
