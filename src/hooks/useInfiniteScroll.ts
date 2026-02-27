import { useCallback, useRef, useEffect } from "react";

/**
 * Lightweight infinite scroll hook using IntersectionObserver.
 * Attach `sentinelRef` to a sentinel element at the bottom of a list.
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  { enabled = true, rootMargin = "200px" }: { enabled?: boolean; rootMargin?: string } = {}
) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const stableCallback = useRef(onLoadMore);
  stableCallback.current = onLoadMore;

  useEffect(() => {
    if (!enabled) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) stableCallback.current();
      },
      { rootMargin }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return { sentinelRef };
}
