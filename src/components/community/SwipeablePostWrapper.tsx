import { useRef, useState, useCallback, memo } from "react";
import { cn } from "@/lib/utils";
import { Heart, Bookmark, MessageCircle } from "lucide-react";

interface SwipeablePostWrapperProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;  // bookmark
  onSwipeRight?: () => void; // like
  isLiked?: boolean;
  isBookmarked?: boolean;
  className?: string;
}

export function SwipeablePostWrapper({
  children,
  onSwipeLeft,
  onSwipeRight,
  isLiked,
  isBookmarked,
  className,
}: SwipeablePostWrapperProps) {
  const [translateX, setTranslateX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);

  const THRESHOLD = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    setSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Determine direction on first significant movement
    if (isHorizontal.current === null) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }

    if (!isHorizontal.current) return;

    // Apply resistance after threshold
    const resistance = Math.abs(dx) > THRESHOLD ? 0.3 : 0.8;
    setTranslateX(dx * resistance);
  }, [swiping]);

  const handleTouchEnd = useCallback(() => {
    setSwiping(false);
    if (Math.abs(translateX) > THRESHOLD) {
      if (translateX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (translateX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    setTranslateX(0);
    isHorizontal.current = null;
  }, [translateX, onSwipeLeft, onSwipeRight]);

  const showLeftAction = translateX > 30;
  const showRightAction = translateX < -30;

  return (
    <div className={cn("relative overflow-hidden md:overflow-visible", className)}>
      {/* Left swipe reveal (Like) */}
      <div className={cn(
        "absolute inset-y-0 start-0 w-20 flex items-center justify-center transition-opacity duration-150 md:hidden",
        showLeftAction ? "opacity-100" : "opacity-0"
      )}>
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-all",
          isLiked ? "bg-destructive/20 text-destructive" : "bg-primary/10 text-primary",
          translateX > THRESHOLD && "scale-125"
        )}>
          <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
        </div>
      </div>

      {/* Right swipe reveal (Bookmark) */}
      <div className={cn(
        "absolute inset-y-0 end-0 w-20 flex items-center justify-center transition-opacity duration-150 md:hidden",
        showRightAction ? "opacity-100" : "opacity-0"
      )}>
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-all",
          isBookmarked ? "bg-chart-4/20 text-chart-4" : "bg-muted text-muted-foreground",
          translateX < -THRESHOLD && "scale-125"
        )}>
          <Bookmark className={cn("h-5 w-5", isBookmarked && "fill-current")} />
        </div>
      </div>

      {/* Content */}
      <div
        className={cn("relative bg-background", !swiping && "transition-transform duration-200")}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
