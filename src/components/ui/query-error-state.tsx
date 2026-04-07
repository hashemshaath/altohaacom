import { memo } from "react";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QueryErrorStateProps {
  error?: Error | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Friendly error state with retry for data-fetching failures.
 * Detects offline vs server errors and shows appropriate messaging.
 */
export const QueryErrorState = memo(function QueryErrorState({
  error,
  onRetry,
  isRetrying,
  title,
  titleAr,
  description,
  descriptionAr,
  className,
  compact = false,
}: QueryErrorStateProps) {
  const isAr = document.documentElement.lang === "ar" ||
    localStorage.getItem("altoha-lang") === "ar";

  const isOffline = !navigator.onLine;
  const Icon = isOffline ? WifiOff : AlertTriangle;

  const defaultTitle = isOffline
    ? (isAr ? "لا يوجد اتصال" : "You're Offline")
    : (isAr ? "حدث خطأ" : "Something Went Wrong");

  const defaultDesc = isOffline
    ? (isAr ? "تحقق من اتصالك بالإنترنت وحاول مرة أخرى" : "Check your internet connection and try again")
    : (isAr ? "لم نتمكن من تحميل البيانات. يرجى المحاولة مرة أخرى." : "We couldn't load the data. Please try again.");

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3", className)}>
        <Icon className="h-4 w-4 text-destructive shrink-0" />
        <p className="text-sm text-muted-foreground flex-1">
          {isAr ? (titleAr || title || defaultTitle) : (title || defaultTitle)}
        </p>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} disabled={isRetrying} className="h-7 text-xs gap-1.5 shrink-0">
            <RefreshCw className={cn("h-3 w-3", isRetrying && "animate-spin")} />
            {isAr ? "إعادة" : "Retry"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-destructive/20 bg-destructive/5 py-14 px-6 text-center animate-in fade-in-50 slide-in-from-bottom-4 duration-500",
        className
      )}
      role="alert"
    >
      <div className="rounded-2xl bg-destructive/10 p-4 ring-4 ring-destructive/5">
        <Icon className="h-7 w-7 text-destructive/70" />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <h3 className="text-base font-semibold text-foreground">
          {isAr ? (titleAr || title || defaultTitle) : (title || defaultTitle)}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isAr ? (descriptionAr || description || defaultDesc) : (description || defaultDesc)}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying} className="gap-2 rounded-xl">
          <RefreshCw className={cn("h-4 w-4", isRetrying && "animate-spin")} />
          {isAr ? "إعادة المحاولة" : "Try Again"}
        </Button>
      )}
      {error && import.meta.env.DEV && (
        <details className="mt-2 text-start max-w-sm w-full">
          <summary className="text-[12px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            {isAr ? "تفاصيل تقنية" : "Technical details"}
          </summary>
          <pre className="mt-1 text-[12px] bg-muted/50 rounded-xl p-2 overflow-auto max-h-20 text-destructive font-mono">
            {error.message}
          </pre>
        </details>
      )}
    </div>
  );
});
