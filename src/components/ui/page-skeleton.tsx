import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface PageSkeletonProps {
  /** Preset layout type */
  variant?: "list" | "grid" | "detail" | "form" | "dashboard";
  /** Number of skeleton items for list/grid */
  count?: number;
  className?: string;
}

/**
 * Professional page-level loading skeleton presets. 
 * Use instead of ad-hoc Skeleton arrangements for consistent UX.
 */
export const PageSkeleton = memo(function PageSkeleton({
  variant = "list",
  count = 6,
  className,
}: PageSkeletonProps) {
  if (variant === "dashboard") {
    return (
      <div className={cn("space-y-6 animate-pulse", className)}>
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        {/* Table */}
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className={cn("space-y-6 animate-pulse", className)}>
        <Skeleton className="h-8 w-2/3 rounded-xl" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
        <Skeleton className="aspect-video rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-5/6 rounded-md" />
          <Skeleton className="h-4 w-4/6 rounded-md" />
        </div>
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className={cn("space-y-5 animate-pulse max-w-lg", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div className={cn("grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-3 animate-pulse">
            <Skeleton className="aspect-[16/10] rounded-xl" />
            <Skeleton className="h-5 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  // List variant
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3 rounded-md" />
            <Skeleton className="h-3 w-1/3 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
});
