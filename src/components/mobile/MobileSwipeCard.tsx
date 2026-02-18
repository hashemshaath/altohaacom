import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface MobileSwipeCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

export function MobileSwipeCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className,
}: MobileSwipeCardProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const swiping = useRef(false);
  const THRESHOLD = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    swiping.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return;
    const diff = e.touches[0].clientX - startX.current;
    const clamped = Math.max(-THRESHOLD * 1.5, Math.min(THRESHOLD * 1.5, diff));
    setOffset(clamped);
  }, []);

  const handleTouchEnd = useCallback(() => {
    swiping.current = false;
    if (offset > THRESHOLD && onSwipeRight) {
      onSwipeRight();
    } else if (offset < -THRESHOLD && onSwipeLeft) {
      onSwipeLeft();
    }
    setOffset(0);
  }, [offset, onSwipeLeft, onSwipeRight]);

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {/* Background actions */}
      {leftAction && (
        <div className="absolute inset-y-0 start-0 flex items-center px-4 text-destructive">
          {leftAction}
        </div>
      )}
      {rightAction && (
        <div className="absolute inset-y-0 end-0 flex items-center px-4 text-primary">
          {rightAction}
        </div>
      )}

      {/* Swipeable content */}
      <div
        className="relative bg-card transition-transform"
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping.current ? "none" : "transform 0.3s ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
