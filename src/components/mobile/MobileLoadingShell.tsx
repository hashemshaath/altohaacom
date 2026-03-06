import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mobile-optimized full-page loading shell.
 * Shows a native-feeling skeleton that matches the app layout.
 */
export const MobileLoadingShell = memo(function MobileLoadingShell() {
  return (
    <div className="flex flex-col gap-4 p-4 animate-pulse md:hidden">
      {/* Search bar skeleton */}
      <Skeleton className="h-11 w-full rounded-xl" />

      {/* Hero card */}
      <Skeleton className="aspect-[16/9] w-full rounded-2xl" />

      {/* Quick actions row */}
      <div className="flex gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <Skeleton className="h-3 w-10 rounded" />
          </div>
        ))}
      </div>

      {/* Section title */}
      <div className="space-y-2 pt-2">
        <Skeleton className="h-5 w-28 rounded-lg" />
        <Skeleton className="h-3 w-48 rounded" />
      </div>

      {/* Horizontal card row */}
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map(i => (
          <div key={i} className="shrink-0 w-[72vw] space-y-2">
            <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>

      {/* Another section */}
      <div className="space-y-2 pt-4">
        <Skeleton className="h-5 w-32 rounded-lg" />
      </div>

      {/* List items */}
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3 rounded-lg" />
            <Skeleton className="h-3 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
});
