import * as React from "react";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface InputProps extends React.ComponentProps<"input"> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  /** Show a clear button when value is non-empty */
  clearable?: boolean;
  onClear?: () => void;
  /** Max character count — shows a counter when set */
  maxCharacters?: number;
  /** Visual state override */
  state?: "default" | "error" | "success";
}

const inputBaseClasses =
  "flex h-12 md:h-11 w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm touch-manipulation transition-all duration-200 hover:border-ring/50 focus-visible:border-primary/40";

const stateClasses: Record<string, string> = {
  error: "border-destructive/60 focus-visible:ring-destructive/30 focus-visible:border-destructive hover:border-destructive/80",
  success: "border-emerald-500/60 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 hover:border-emerald-500/80",
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, dir, startIcon, endIcon, clearable, onClear, maxCharacters, state = "default", value, ...props }, ref) => {
    const resolvedDir = dir ?? (document.documentElement.getAttribute("dir") as "ltr" | "rtl" | undefined) ?? undefined;
    const charCount = typeof value === "string" ? value.length : 0;
    const isOverLimit = maxCharacters ? charCount > maxCharacters : false;
    const effectiveState = isOverLimit ? "error" : state;
    const stateClass = stateClasses[effectiveState] ?? "";

    const showClear = clearable && typeof value === "string" && value.length > 0;

    const renderClearButton = showClear && (
      <button
        type="button"
        onClick={onClear}
        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-150 p-0.5 rounded-full hover:bg-muted active:scale-90"
        aria-label="Clear input"
        tabIndex={-1}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    );

    const renderCharCounter = maxCharacters != null && (
      <span
        className={cn(
          "absolute end-1 -bottom-5 text-[10px] tabular-nums transition-colors duration-200",
          isOverLimit ? "text-destructive font-medium" : "text-muted-foreground/70"
        )}
      >
        {charCount}/{maxCharacters}
      </span>
    );

    if (startIcon || endIcon || showClear || maxCharacters != null) {
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
            value={value}
            className={cn(
              inputBaseClasses,
              stateClass,
              startIcon && "ps-9",
              (endIcon || showClear) && "pe-9",
              className,
            )}
            ref={ref}
            {...props}
          />
          {endIcon && !showClear && (
            <div className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-colors duration-200 group-focus-within/input:text-primary">
              {endIcon}
            </div>
          )}
          {renderClearButton}
          {renderCharCounter}
        </div>
      );
    }

    return (
      <input
        type={type}
        dir={resolvedDir}
        value={value}
        className={cn(inputBaseClasses, stateClass, className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
