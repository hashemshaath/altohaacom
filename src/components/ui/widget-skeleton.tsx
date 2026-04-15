import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface WidgetSkeletonProps {
  /** Number of stat rows */
  rows?: number;
  /** Show a mini chart placeholder */
  chart?: boolean;
  /** Show progress bar placeholder */
  progress?: boolean;
  className?: string;
}

/**
 * Card-level skeleton for admin dashboard widgets.
 * Matches the typical Card > CardHeader > CardContent pattern.
 */
export const WidgetSkeleton = memo(function WidgetSkeleton({
  rows = 3,
  chart = false,
  progress = false,
  className,
}: WidgetSkeletonProps) {
  return (
    <Card className={cn("animate-pulse", className)}>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-40 rounded-md" />
      </CardHeader>
      <CardContent className="space-y-3">
        {progress && <Skeleton className="h-2 w-full rounded-full" />}
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-5 w-12 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          ))}
        </div>
        {chart && <Skeleton className="h-32 w-full rounded-xl" />}
      </CardContent>
    </Card>
  );
});
