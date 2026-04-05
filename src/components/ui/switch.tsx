import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center overflow-hidden rounded-full p-0.5",
      "border border-border/40",
      "data-[state=unchecked]:bg-muted data-[state=checked]:bg-primary",
      "shadow-inner transition-colors duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full ring-0",
        "data-[state=unchecked]:bg-switchThumbOff data-[state=checked]:bg-switchThumbOn",
        "data-[state=unchecked]:shadow-sm data-[state=checked]:shadow-md",
        "transition-transform duration-200",
        "data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-5",
        "rtl:data-[state=unchecked]:-translate-x-0 rtl:data-[state=checked]:-translate-x-5",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
