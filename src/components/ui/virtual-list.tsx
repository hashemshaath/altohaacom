import { useRef, useState, useEffect, useCallback, ReactNode, useMemo } from "react";
import { cn } from "@/lib/utils";

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  className?: string;
  containerClassName?: string;
  renderItem: (item: T, index: number) => ReactNode;
  emptyState?: ReactNode;
  /** Max visible height in px, defaults to 600 */
  maxHeight?: number;
}

/**
 * Lightweight virtual scrolling list.
 * Only renders visible items + overscan buffer for performance with large datasets.
 */
export function VirtualList<T>({
  items,
  itemHeight,
  overscan = 5,
  className,
  containerClassName,
  renderItem,
  emptyState,
  maxHeight = 600,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;

  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(maxHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);
    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items.slice(start, end),
    };
  }, [scrollTop, itemHeight, maxHeight, overscan, items]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  if (!items.length && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn("overflow-auto", containerClassName)}
      style={{ maxHeight }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: startIndex * itemHeight,
            left: 0,
            right: 0,
          }}
          className={className}
        >
          {visibleItems.map((item, i) => (
            <div
              key={startIndex + i}
              style={{ height: itemHeight }}
              className="flex items-stretch"
            >
              {renderItem(item, startIndex + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
