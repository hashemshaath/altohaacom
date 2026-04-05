
import { cn } from "@/lib/utils";
import React from "react";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    /** Show animated shimmer on the fill */
    animated?: boolean;
    /** Color variant */
    variant?: "default" | "success" | "warning" | "destructive";
  }
>(({ className, value, animated, variant = "default", ...props }, ref) => {
  const variantClasses: Record<string, string> = {
    default: "bg-primary",
    success: "bg-chart-2",
    warning: "bg-chart-4",
    destructive: "bg-destructive",
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-3 w-full overflow-hidden rounded-full bg-secondary", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 rounded-full transition-all duration-500 ease-out",
          variantClasses[variant],
          animated && "relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:animate-[shimmer_2s_infinite]"
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
