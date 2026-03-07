import { useRef, useCallback, useState } from "react";

interface UseSwipeTabsOptions {
  tabs: string[];
  currentTab: string;
  onTabChange: (tab: string) => void;
  threshold?: number;
  enabled?: boolean;
}

/**
 * Hook to enable horizontal swipe navigation between tabs on mobile.
 * Returns touch handlers to attach to the swipeable container.
 */
export function useSwipeTabs({
  tabs,
  currentTab,
  onTabChange,
  threshold = 60,
  enabled = true,
}: UseSwipeTabsOptions) {
  const startX = useRef(0);
  const startY = useRef(0);
  const swiping = useRef(false);
  const isHorizontal = useRef<boolean | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      swiping.current = true;
      isHorizontal.current = null;
    },
    [enabled]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!swiping.current || !enabled) return;
      const diffX = e.touches[0].clientX - startX.current;
      const diffY = e.touches[0].clientY - startY.current;

      // Determine direction on first significant move
      if (isHorizontal.current === null && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
        isHorizontal.current = Math.abs(diffX) > Math.abs(diffY);
      }

      if (isHorizontal.current) {
        const currentIdx = tabs.indexOf(currentTab);
        // Don't allow swiping beyond first/last tab
        if ((diffX > 0 && currentIdx === 0) || (diffX < 0 && currentIdx === tabs.length - 1)) {
          setSwipeOffset(diffX * 0.2); // rubber band
          return;
        }
        setSwipeOffset(diffX);
      }
    },
    [enabled, tabs, currentTab]
  );

  const onTouchEnd = useCallback(() => {
    if (!swiping.current || !enabled) {
      setSwipeOffset(0);
      return;
    }
    swiping.current = false;

    if (isHorizontal.current && Math.abs(swipeOffset) > threshold) {
      const currentIdx = tabs.indexOf(currentTab);
      if (swipeOffset < 0 && currentIdx < tabs.length - 1) {
        // Swipe left → next tab
        onTabChange(tabs[currentIdx + 1]);
        try { if ("vibrate" in navigator) navigator.vibrate(10); } catch {}
      } else if (swipeOffset > 0 && currentIdx > 0) {
        // Swipe right → previous tab
        onTabChange(tabs[currentIdx - 1]);
        try { if ("vibrate" in navigator) navigator.vibrate(10); } catch {}
      }
    }

    setSwipeOffset(0);
    isHorizontal.current = null;
  }, [enabled, swipeOffset, threshold, tabs, currentTab, onTabChange]);

  return {
    swipeHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    swipeOffset,
    isSwiping: swipeOffset !== 0,
  };
}
