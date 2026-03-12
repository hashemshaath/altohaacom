import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface HomeSectionSkeletonProps {
  index: number;
}

const GridSkeleton = React.forwardRef<HTMLDivElement>(function GridSkeleton(_props, ref) {
  return (
    <div ref={ref} className="container py-6 md:py-8 space-y-3">
      <Skeleton className="h-4 w-28 rounded-lg" />
      <Skeleton className="h-5 w-56 rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border/20 overflow-hidden bg-card/30">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="p-2.5 space-y-1.5">
              <Skeleton className="h-3 w-3/4 rounded-lg" />
              <Skeleton className="h-2 w-1/2 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const CarouselSkeleton = React.forwardRef<HTMLDivElement>(function CarouselSkeleton(_props, ref) {
  return (
    <div ref={ref} className="container py-6 md:py-8 space-y-3">
      <Skeleton className="h-4 w-32 rounded-lg" />
      <Skeleton className="h-5 w-48 rounded-xl" />
      <div className="flex gap-3 mt-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            className="aspect-[4/3] w-[72vw] sm:w-[45vw] md:w-[32vw] lg:w-[24vw] shrink-0 rounded-2xl"
          />
        ))}
      </div>
    </div>
  );
});

const MetricsSkeleton = React.forwardRef<HTMLDivElement>(function MetricsSkeleton(_props, ref) {
  return (
    <div ref={ref} className="container py-4 md:py-6">
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 flex-1 min-w-[120px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
});

const VARIANTS = [GridSkeleton, CarouselSkeleton, MetricsSkeleton] as const;

export const HomeSectionSkeleton = React.forwardRef<HTMLDivElement, HomeSectionSkeletonProps>(function HomeSectionSkeleton(
  { index },
  ref
) {
  const Variant = VARIANTS[index % VARIANTS.length];
  return <Variant ref={ref} />;
});

GridSkeleton.displayName = "GridSkeleton";
CarouselSkeleton.displayName = "CarouselSkeleton";
MetricsSkeleton.displayName = "MetricsSkeleton";
HomeSectionSkeleton.displayName = "HomeSectionSkeleton";
