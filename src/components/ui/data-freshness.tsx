import { memo } from "react";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/i18n/LanguageContext";
import { ActivityPulse } from "./activity-pulse";

interface DataFreshnessProps {
  /** When the data was last fetched/updated */
  lastUpdated?: Date | string | null;
  /** Is data currently being refetched? */
  isRefetching?: boolean;
  /** Callback to manually refresh */
  onRefresh?: () => void;
  className?: string;
}

/**
 * Displays when data was last refreshed with a live/stale indicator.
 * Builds trust by showing data recency.
 */
export const DataFreshness = memo(function DataFreshness({ lastUpdated, isRefetching, onRefresh, className }: DataFreshnessProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (!lastUpdated) return null;

  const date = typeof lastUpdated === "string" ? new Date(lastUpdated) : lastUpdated;
  const ageMs = Date.now() - date.getTime();
  const isStale = ageMs > 5 * 60 * 1000; // >5 min = stale

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[10px] text-muted-foreground", className)}>
      <ActivityPulse status={isRefetching ? "recent" : isStale ? "idle" : "live"} />
      {isRefetching ? (
        <span className="flex items-center gap-1">
          <RefreshCw className="h-2.5 w-2.5 animate-spin" />
          {isAr ? "جارٍ التحديث..." : "Refreshing..."}
        </span>
      ) : (
        <span>
          {formatDistanceToNow(date, { addSuffix: true, locale: isAr ? ar : undefined })}
        </span>
      )}
      {onRefresh && !isRefetching && (
        <button onClick={onRefresh} className="hover:text-primary transition-colors" title={isAr ? "تحديث" : "Refresh"}>
          <RefreshCw className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
}
