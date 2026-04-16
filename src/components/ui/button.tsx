import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(192,91,46,0.2)] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 touch-manipulation active:scale-[0.98] select-none min-h-[44px] md:min-h-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#C05B2E] text-[#FEFCF8] hover:bg-[#A34D24]",
        secondary:
          "border-[1.5px] border-[#C05B2E] text-[#C05B2E] bg-transparent hover:bg-[#FAECE7]",
        ghost:
          "border-none text-[#6B6560] hover:bg-[#F5F0E8] hover:text-[#1C1C1A]",
        destructive:
          "bg-[#8B1A1A] text-[#FEFCF8] hover:bg-[#7A1616]",
        success:
          "bg-[#2D5016] text-[#FEFCF8] hover:bg-[#244212]",
        outline:
          "border-[1.5px] border-[rgba(28,28,26,0.2)] text-[#1C1C1A] bg-transparent hover:bg-[#F5F0E8]",
        link:
          "text-[#C05B2E] underline-offset-4 hover:underline bg-transparent",
        premium:
          "bg-gradient-to-r from-[#C05B2E] to-[#A34D24] text-[#FEFCF8] shadow-md hover:shadow-lg",
      },
      size: {
        sm: "h-[34px] px-[14px] text-[0.8125rem] rounded-[6px] [&_svg]:size-3.5",
        default: "h-[44px] px-[20px] text-[0.9375rem] rounded-[8px] [&_svg]:size-4",
        lg: "h-[52px] px-[28px] text-[1.0625rem] rounded-[10px] [&_svg]:size-5",
        icon: "h-[44px] w-[44px] rounded-[8px] [&_svg]:size-[18px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" />}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
