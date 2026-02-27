import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const CompetitionCardSkeleton = memo(function CompetitionCardSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-2xl border-border/30">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <CardContent className="flex flex-1 flex-col p-3 sm:p-4">
        <Skeleton className="mb-2 h-4 w-3/4 rounded" />
        <Skeleton className="mb-3 h-3 w-1/2 rounded" />
        <div className="mt-auto flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
});
