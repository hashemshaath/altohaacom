import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const PostSkeleton = memo(function PostSkeleton() {
  return (
    <div className="px-4 py-3 animate-in fade-in-50 duration-300">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3.5 w-2/3" />
          <div className="flex items-center gap-4 pt-1">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <div className="ms-auto">
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeedSkeletonLoader({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}
