import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton for a profile/user card layout.
 */
const ProfileCardSkeleton = memo(function ProfileCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/40 p-4 animate-pulse">
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-3 w-20 rounded-md" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  );
});

/**
 * Skeleton for a stat/metric card.
 */
const StatCardSkeleton = memo(function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 p-4 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20 rounded-md" />
        <Skeleton className="h-6 w-6 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-16 rounded-md" />
      <Skeleton className="h-2.5 w-24 rounded-md" />
    </div>
  );
});

/**
 * Grid of stat card skeletons.
 */
const StatGridSkeleton = memo(function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
});

/**
 * Skeleton for a media/content card (image + text).
 */
const ContentCardSkeleton = memo(function ContentCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 overflow-hidden animate-pulse">
      <Skeleton className="aspect-[16/10] w-full" />
      <div className="p-4 space-y-2.5">
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
});

/**
 * Grid of content card skeletons.
 */
export const ContentGridSkeleton = memo(function ContentGridSkeleton({
  count = 6,
  columns = "sm:grid-cols-2 lg:grid-cols-3",
}: {
  count?: number;
  columns?: string;
}) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      {Array.from({ length: count }).map((_, i) => (
        <ContentCardSkeleton key={i} />
      ))}
    </div>
  );
});

/**
 * Skeleton for a chart area.
 */
const ChartSkeleton = memo(function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`rounded-2xl border border-border/40 p-4 space-y-3 animate-pulse`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-6 w-16 rounded-lg" />
      </div>
      <Skeleton className={`${height} w-full rounded-xl`} />
    </div>
  );
});
