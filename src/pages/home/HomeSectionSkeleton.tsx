import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface HomeSectionSkeletonProps {
  index: number;
}

function GridSkeleton() {
  return (
    <div className="container py-6 md:py-8 space-y-3">
      <Skeleton className="h-4 w-28 rounded-lg" />
      <Skeleton className="h-5 w-56 rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border/20 overflow-hidden bg-card/30">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="p-2.5 space-y-1.5">
              <Skeleton className="h-3 w-3/4 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CarouselSkeleton() {
  return (
    <div className="container py-6 md:py-8 space-y-3">
      <Skeleton className="h-4 w-32 rounded-lg" />
      <Skeleton className="h-5 w-48 rounded-xl" />
      <div className="flex gap-3 mt-3 overflow-hidden">
        {[1, 2].map((i) => (
          <Skeleton
            key={i}
            className="aspect-[4/3] w-[72vw] sm:w-[45vw] md:w-[32vw] shrink-0 rounded-2xl"
          />
        ))}
      </div>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="container py-4 md:py-6">
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 flex-1 min-w-[120px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/** Minimal placeholder — just reserves vertical space with zero DOM weight */
function MinimalPlaceholder() {
  return <div className="container py-6"><div className="h-32" /></div>;
}

const VARIANTS = [GridSkeleton, CarouselSkeleton, MetricsSkeleton, MinimalPlaceholder] as const;

export const HomeSectionSkeleton = React.forwardRef<HTMLDivElement, HomeSectionSkeletonProps>(
  function HomeSectionSkeleton({ index }, ref) {
    const Variant = VARIANTS[index % VARIANTS.length];
    return (
      <div ref={ref}>
        <Variant />
      </div>
    );
  }
);
