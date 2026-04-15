import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface StaleDataBannerProps {
  /** True when data is being refreshed in the background */
  isRevalidating: boolean;
  className?: string;
  /** Custom message */
  message?: string;
  messageAr?: string;
  isAr?: boolean;
}

/**
 * Subtle banner indicating background data refresh.
 * Show when `isFetching && !isLoading` (stale data visible, fresh data loading).
 *
 * ```tsx
 * <StaleDataBanner isRevalidating={isFetching && !isLoading} />
 * ```
 */
export function StaleDataBanner({
  isRevalidating,
  className,
  message,
  messageAr,
  isAr = false,
}: StaleDataBannerProps) {
  if (!isRevalidating) return null;

  const text = isAr
    ? (messageAr ?? "جاري تحديث البيانات...")
    : (message ?? "Refreshing data...");

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl bg-primary/5 border border-primary/10 px-3 py-1.5 text-xs text-primary animate-in fade-in-50 duration-300",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <RefreshCw className="h-3 w-3 animate-spin" />
      {text}
    </div>
  );
}
