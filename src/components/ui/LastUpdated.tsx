import { memo } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsAr } from "@/hooks/useIsAr";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

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
