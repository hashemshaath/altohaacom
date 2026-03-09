import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, dir, ...props }, ref) => {
  const resolvedDir = dir ?? (document.documentElement.getAttribute("dir") as "ltr" | "rtl" | undefined) ?? undefined;
  return (
    <textarea
      dir={resolvedDir}
      className={cn(
        "flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3.5 py-3 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation transition-all duration-200 hover:border-ring/50 focus-visible:border-primary/40 focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.06)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
