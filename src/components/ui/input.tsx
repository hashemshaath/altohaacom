import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, dir, ...props }, ref) => {
    const resolvedDir = dir ?? (document.documentElement.getAttribute("dir") as "ltr" | "rtl" | undefined) ?? undefined;
    return (
      <input
        type={type}
        dir={resolvedDir}
        className={cn(
          "flex h-11 md:h-10 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm touch-manipulation",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
