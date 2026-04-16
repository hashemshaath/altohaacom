import { memo } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * Error state placeholder for when a data fetch fails.
 */
export const ErrorState = memo(function ErrorState({
  title,
  message,
  onRetry,
  retryLabel,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 mb-4">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        {title || "حدث خطأ"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        {message || "تعذّر تحميل البيانات. يرجى المحاولة مرة أخرى."}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="mt-4 rounded-xl gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {retryLabel || "إعادة المحاولة"}
        </Button>
      )}
    </div>
  );
});
