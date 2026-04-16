import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

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
