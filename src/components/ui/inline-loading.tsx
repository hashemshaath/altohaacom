import { memo } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineLoadingProps {
  /** Loading message */
  text?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { spinner: "h-4 w-4", text: "text-xs" },
  md: { spinner: "h-5 w-5", text: "text-sm" },
  lg: { spinner: "h-8 w-8", text: "text-base" },
};

/**
 * Inline loading indicator with optional text.
 * Use instead of raw Loader2 for consistent UX.
 */
export const InlineLoading = memo(function InlineLoading({
  text,
  className,
  size = "md",
}: InlineLoadingProps) {
  const s = sizeMap[size];
  return (
    <div
      className={cn("flex items-center justify-center gap-2 py-8", className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className={cn(s.spinner, "animate-spin text-primary/60")} />
      {text && <span className={cn(s.text, "text-muted-foreground")}>{text}</span>}
      <span className="sr-only">{text || "Loading..."}</span>
    </div>
  );
});
