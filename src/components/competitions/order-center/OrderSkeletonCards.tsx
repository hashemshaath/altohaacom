import { memo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton for metric cards grid (4 cards) */
export const MetricCardsSkeleton = memo(function MetricCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-border/60">
          <CardContent className="p-3 text-center space-y-2">
            <Skeleton className="mx-auto h-5 w-5 rounded-full" />
            <Skeleton className="mx-auto h-6 w-12" />
            <Skeleton className="mx-auto h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Skeleton for a single list card with items */
export function ListCardSkeleton({ itemCount = 4 }: { itemCount?: number }) {
  return (
    <Card className="border-border/60 overflow-hidden">
      <CardHeader className="py-2.5 px-3 bg-muted/30 border-b">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {Array.from({ length: itemCount }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b last:border-0 px-3 py-2.5">
            <Skeleton className="h-4 w-4 rounded" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
            <Skeleton className="h-6 w-20 rounded" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** Full checklist page skeleton */
export function ChecklistSkeleton() {
  return (
    <div className="space-y-4">
      <MetricCardsSkeleton />
      <Card className="border-border/60">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </CardContent>
      </Card>
      <ListCardSkeleton itemCount={3} />
      <ListCardSkeleton itemCount={5} />
    </div>
  );
}

/** Dashboard overview skeleton */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <MetricCardsSkeleton />
      <Card className="border-border/60">
        <CardContent className="p-3 sm:p-4 space-y-3">
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-1 space-y-1.5 flex flex-col items-center">
                <Skeleton className="h-2.5 w-full rounded-full" />
                <Skeleton className="h-3 w-6" />
                <Skeleton className="h-2.5 w-10" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/60">
        <CardContent className="p-3 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2.5 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
