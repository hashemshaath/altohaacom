import * as React from "react";
import { cn } from "@/lib/utils";

const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-md bg-muted",
          "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite]",
          "before:bg-gradient-to-r before:from-transparent before:via-foreground/5 before:to-transparent",
          className
        )}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
