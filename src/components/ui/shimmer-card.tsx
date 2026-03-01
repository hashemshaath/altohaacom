import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

interface ShimmerCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "horizontal" | "profile" | "stat";
  lines?: number;
}

/**
 * Pre-built shimmer loading cards for common content patterns.
 */
export function ShimmerCard({ variant = "default", lines = 3, className, ...props }: ShimmerCardProps) {
  if (variant === "stat") {
    return (
      <div className={cn("rounded-xl border border-border/40 p-4 space-y-3", className)} {...props}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
    );
  }

  if (variant === "profile") {
    return (
      <div className={cn("rounded-xl border border-border/40 p-4 space-y-3", className)} {...props}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    );
  }

  if (variant === "horizontal") {
    return (
      <div className={cn("rounded-xl border border-border/40 p-3 flex items-center gap-3", className)} {...props}>
        <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border/40 p-4 space-y-3", className)} {...props}>
      <Skeleton className="h-32 w-full rounded-xl" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3", i === 0 ? "w-3/4" : i === lines - 1 ? "w-1/3" : "w-full")}
        />
      ))}
    </div>
  );
}

/**
 * Grid of shimmer cards for list loading states.
 */
export function ShimmerGrid({
  count = 6,
  variant = "default",
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  className,
}: {
  count?: number;
  variant?: ShimmerCardProps["variant"];
  columns?: string;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4", columns, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerCard key={i} variant={variant} />
      ))}
    </div>
  );
}
