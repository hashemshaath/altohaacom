import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const CompetitionCardSkeleton = memo(function CompetitionCardSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-2xl border-border/30 animate-pulse">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <CardContent className="flex flex-1 flex-col p-3 sm:p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-xl" />
          <Skeleton className="h-5 w-12 rounded-xl" />
        </div>
        <Skeleton className="h-4 w-4/5 rounded-lg" />
        <Skeleton className="h-3 w-2/3 rounded-lg" />
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3 w-20 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
});
