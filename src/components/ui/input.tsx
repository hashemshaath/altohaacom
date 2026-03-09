import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const inputBaseClasses =
  "flex h-11 md:h-10 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm touch-manipulation transition-all duration-200 hover:border-ring/50 focus-visible:border-primary/40 focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.06)]";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, dir, startIcon, endIcon, ...props }, ref) => {
    const resolvedDir = dir ?? (document.documentElement.getAttribute("dir") as "ltr" | "rtl" | undefined) ?? undefined;

    if (startIcon || endIcon) {
      return (
        <div className="group/input relative w-full">
          {startIcon && (
            <div className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-colors duration-200 group-focus-within/input:text-primary">
              {startIcon}
            </div>
          )}
          <input
            type={type}
            dir={resolvedDir}
            className={cn(
              inputBaseClasses,
              startIcon && "ps-9",
              endIcon && "pe-9",
              className,
            )}
            ref={ref}
            {...props}
          />
          {endIcon && (
            <div className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-colors duration-200 group-focus-within/input:text-primary">
              {endIcon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        dir={resolvedDir}
        className={cn(inputBaseClasses, className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
