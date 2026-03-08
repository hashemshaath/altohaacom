import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const BioCareerSkeleton = memo(function BioCareerSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in-0 duration-300">
      {[1, 2].map(i => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-3.5 w-3.5 rounded" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-6 rounded-full" />
            <div className="flex-1 h-px bg-border/20" />
          </div>
          {[1, 2].map(j => (
            <div key={j} className="flex gap-3 px-3.5 py-3 rounded-xl border border-border/30">
              <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-2.5 w-24" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-4 w-16 rounded-full" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});
