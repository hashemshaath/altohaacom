import { useState, useEffect, useRef, useMemo, useCallback } from "react";

interface UseVirtualListOptions<T> {
  /** Full data array */
  items: T[];
  /** Estimated height of each item in px */
  itemHeight: number;
  /** Extra items to render above/below viewport */
  overscan?: number;
  /** Container height — if not provided, uses the ref element's clientHeight */
  containerHeight?: number;
}

interface VirtualListResult<T> {
  /** Ref to attach to the scroll container */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Visible items slice with their indices */
  virtualItems: { item: T; index: number; offsetTop: number }[];
  /** Total height for the spacer */
  totalHeight: number;
  /** Props to spread on the inner spacer div */
  spacerStyle: React.CSSProperties;
}

/**
 * Lightweight virtual scrolling hook for long lists.
 * No external dependencies — uses native scroll events with RAF throttling.
 *
 * ```tsx
 * const { containerRef, virtualItems, totalHeight } = useVirtualList({
 *   items: data,
 *   itemHeight: 64,
 *   overscan: 5,
 * });
 *
 * return (
 *   <div ref={containerRef} style={{ height: 600, overflow: "auto" }}>
 *     <div style={{ height: totalHeight, position: "relative" }}>
 *       {virtualItems.map(({ item, index, offsetTop }) => (
 *         <div key={index} style={{ position: "absolute", top: offsetTop, width: "100%" }}>
 *           <ItemComponent data={item} />
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useVirtualList<T>({
  items,
  itemHeight,
  overscan = 5,
  containerHeight: fixedHeight,
}: UseVirtualListOptions<T>): VirtualListResult<T> {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(fixedHeight ?? 600);
  const rafRef = useRef(0);

  // Update viewport height from container
  useEffect(() => {
    if (fixedHeight) {
      setViewportHeight(fixedHeight);
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      setViewportHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fixedHeight]);

  // Throttled scroll handler
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setScrollTop(el.scrollTop);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const totalHeight = items.length * itemHeight;

  const virtualItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(viewportHeight / itemHeight) + overscan * 2;
    const endIndex = Math.min(items.length, startIndex + visibleCount);

    const result: { item: T; index: number; offsetTop: number }[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      result.push({
        item: items[i],
        index: i,
        offsetTop: i * itemHeight,
      });
    }
    return result;
  }, [items, itemHeight, scrollTop, viewportHeight, overscan]);

  const spacerStyle: React.CSSProperties = useMemo(
    () => ({ height: totalHeight, position: "relative" as const }),
    [totalHeight]
  );

  const scrollTo = useCallback(
    (index: number) => {
      containerRef.current?.scrollTo({ top: index * itemHeight, behavior: "smooth" });
    },
    [itemHeight]
  );

  return { containerRef, virtualItems, totalHeight, spacerStyle };
}
