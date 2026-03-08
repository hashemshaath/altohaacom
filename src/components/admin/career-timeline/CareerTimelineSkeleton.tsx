import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const CareerTimelineSkeleton = memo(function CareerTimelineSkeleton() {
  return (
    <div className="space-y-3 animate-in fade-in-0 duration-300">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-xl border bg-card/50 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-8 rounded-full" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          {i <= 2 && (
            <div className="border-t px-5 py-4 space-y-2.5">
              {[1, 2].map(j => (
                <div key={j} className="flex items-center gap-3 rounded-xl border border-border/30 px-4 py-3">
                  <Skeleton className="h-8 w-8 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-48" />
                    <Skeleton className="h-2.5 w-32" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
