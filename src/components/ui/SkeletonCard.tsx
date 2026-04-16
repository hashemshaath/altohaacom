import { memo } from "react";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  /** Show image area at top */
  withImage?: boolean;
  /** Number of text lines to show */
  lines?: number;
}

/**
 * Skeleton loading card that mimics a content card shape.
 * Uses warm gray tones with a shimmer animation.
 */
export const SkeletonCard = memo(function SkeletonCard({
  className,
  withImage = true,
  lines = 3,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/40 bg-card overflow-hidden",
        className
      )}
    >
      {withImage && (
        <div className="aspect-[16/10] bg-muted/60 animate-pulse" />
      )}
      <div className="p-4 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-3 rounded-full bg-muted/50 animate-pulse",
              i === 0 && "w-3/4 h-4",
              i === 1 && "w-full",
              i >= 2 && "w-1/2"
            )}
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
});

interface SkeletonGridProps {
  count?: number;
  columns?: string;
  cardClassName?: string;
  withImage?: boolean;
  lines?: number;
}

/**
 * Grid of skeleton cards for listing pages.
 */
export const SkeletonGrid = memo(function SkeletonGrid({
  count = 6,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  cardClassName,
  withImage = true,
  lines = 3,
}: SkeletonGridProps) {
  return (
    <div className={cn("grid gap-4", columns)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard
          key={i}
          className={cardClassName}
          withImage={withImage}
          lines={lines}
        />
      ))}
    </div>
  );
});
