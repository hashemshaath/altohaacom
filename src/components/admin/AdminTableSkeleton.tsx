import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AdminTableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showActions?: boolean;
  className?: string;
}

export const AdminTableSkeleton = memo(function AdminTableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  showActions = true,
  className,
}: AdminTableSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Filter bar skeleton */}
      <div className="flex items-center gap-3 flex-wrap">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
        {showActions && <Skeleton className="h-9 w-28 rounded-xl ms-auto" />}
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-border/40 overflow-hidden">
        {showHeader && (
          <div className="flex items-center gap-4 p-3 bg-muted/30 border-b border-border/30">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton
                key={`h-${i}`}
                className={cn(
                  "h-3.5 rounded-xl",
                  i === 0 ? "w-32" : i === columns - 1 ? "w-20 ms-auto" : "w-24"
                )}
              />
            ))}
          </div>
        )}

        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`r-${rowIndex}`}
            className="flex items-center gap-4 p-3 border-b border-border/20 last:border-b-0"
          >
            {/* Avatar column */}
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            {/* Text columns */}
            {Array.from({ length: columns - 1 }).map((_, colIndex) => (
              <Skeleton
                key={`c-${colIndex}`}
                className={cn(
                  "h-3.5 rounded-xl",
                  colIndex === 0 ? "w-28" : colIndex === columns - 2 ? "w-16 ms-auto" : "w-20"
                )}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-32 rounded-xl" />
        <div className="flex gap-1.5">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Compact card-based skeleton for dashboard widgets */
export function AdminWidgetSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-border/30 p-3">
          <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24 rounded-xl" />
            <Skeleton className="h-2.5 w-16 rounded-xl" />
          </div>
          <Skeleton className="h-5 w-12 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
