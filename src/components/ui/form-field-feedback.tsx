import { memo } from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldFeedbackProps {
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Hint/help text always shown */
  hint?: string;
  /** Character count display */
  charCount?: { current: number; max: number };
  className?: string;
}

/**
 * Inline form field feedback: errors, success, hints, character count.
 * Replaces ad-hoc error/success text across forms.
 */
export const FormFieldFeedback = memo(function FormFieldFeedback({
  error,
  success,
  hint,
  charCount,
  className,
}: FormFieldFeedbackProps) {
  const hasCharWarning = charCount && charCount.current > charCount.max * 0.9;

  return (
    <div className={cn("flex items-start justify-between gap-2 mt-1.5", className)}>
      <div className="flex-1 min-w-0">
        {error && (
          <p className="flex items-center gap-1 text-xs text-destructive animate-in slide-in-from-top-1 duration-200">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {!error && success && (
          <p className="flex items-center gap-1 text-xs text-success animate-in slide-in-from-top-1 duration-200">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            <span>{success}</span>
          </p>
        )}
        {!error && !success && hint && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="h-3 w-3 shrink-0" />
            <span>{hint}</span>
          </p>
        )}
      </div>
      {charCount && (
        <span className={cn(
          "text-[10px] tabular-nums shrink-0",
          charCount.current > charCount.max
            ? "text-destructive font-medium"
            : hasCharWarning
              ? "text-warning"
              : "text-muted-foreground"
        )}>
          {charCount.current}/{charCount.max}
        </span>
      )}
    </div>
  );
});
