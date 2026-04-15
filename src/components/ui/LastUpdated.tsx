import { memo } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsAr } from "@/hooks/useIsAr";

interface LastUpdatedProps {
  /** Timestamp from `dataUpdatedAt` (epoch ms) or Date */
  updatedAt: number | Date | null | undefined;
  className?: string;
}

function formatRelative(ts: number, isAr: boolean): string {
  const diff = Math.max(0, Date.now() - ts);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return isAr ? "الآن" : "Just now";
  if (seconds < 60) return isAr ? `منذ ${seconds} ثانية` : `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return isAr ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return isAr ? `منذ ${hours} ساعة` : `${hours}h ago`;
}

/**
 * Subtle "last updated" indicator for cached/stale data.
 *
 * ```tsx
 * <LastUpdated updatedAt={dataUpdatedAt} />
 * ```
 */
export const LastUpdated = memo(function LastUpdated({ updatedAt, className }: LastUpdatedProps) {
  const isAr = useIsAr();

  if (!updatedAt) return null;

  const ts = typeof updatedAt === "number" ? updatedAt : updatedAt.getTime();
  if (ts === 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] text-muted-foreground/70 select-none",
        className,
      )}
      aria-label={isAr ? "آخر تحديث" : "Last updated"}
    >
      <Clock className="h-2.5 w-2.5" />
      {formatRelative(ts, isAr)}
    </span>
  );
});
