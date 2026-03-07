import React, { useRef, useState, memo } from "react";
import { Check, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeableNotificationCardProps {
  children: React.ReactNode;
  onMarkRead?: () => void;
  onDelete?: () => void;
  isRead?: boolean;
  className?: string;
}

export function SwipeableNotificationCard({
  children,
  onMarkRead,
  onDelete,
  isRead,
  className,
}: SwipeableNotificationCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const THRESHOLD = 80;
  const MAX_OFFSET = 120;

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = 0;
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    const diff = e.touches[0].clientX - startXRef.current;
    currentXRef.current = diff;
    // Clamp: left swipe = delete, right swipe = mark read
    const clamped = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, diff));
    setOffset(clamped);
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    if (currentXRef.current > THRESHOLD && !isRead && onMarkRead) {
      onMarkRead();
      setOffset(0);
    } else if (currentXRef.current < -THRESHOLD && onDelete) {
      setDismissed(true);
      setTimeout(() => onDelete(), 300);
    } else {
      setOffset(0);
    }
  };

  if (dismissed) {
    return (
      <div className="h-0 overflow-hidden transition-all duration-300 opacity-0" />
    );
  }

  const showMarkRead = offset > 20 && !isRead;
  const showDelete = offset < -20;

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)} ref={containerRef}>
      {/* Background actions */}
      <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
        <div
          className={cn(
            "flex items-center gap-2 text-sm font-medium transition-opacity",
            showMarkRead ? "opacity-100" : "opacity-0",
            "text-primary"
          )}
        >
          <Check className="h-5 w-5" />
          <span className="hidden sm:inline">Read</span>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 text-sm font-medium transition-opacity",
            showDelete ? "opacity-100" : "opacity-0",
            "text-destructive"
          )}
        >
          <span className="hidden sm:inline">Delete</span>
          <Trash2 className="h-5 w-5" />
        </div>
      </div>

      {/* Card content */}
      <div
        className="relative z-10 touch-manipulation"
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping ? "none" : "transform 0.3s ease-out",
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
