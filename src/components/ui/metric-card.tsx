import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

interface MetricCardProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
  valueClassName?: string;
  className?: string;
}

/**
 * Compact metric display — value + label.
 * Used in stat grids, dashboards, and summary cards.
 * Replaces the repeated pattern: <p className="text-2xl font-bold">X</p><p className="text-xs text-muted-foreground">Label</p>
 */
export const MetricCard = memo(function MetricCard({
  value,
  label,
  icon,
  valueClassName,
  className,
}: MetricCardProps) {
  return (
    <div className={cn("text-center rounded-xl border border-border/50 bg-card p-3", className)}>
      {icon && <div className="flex justify-center mb-1.5">{icon}</div>}
      <p className={cn("text-2xl font-bold tabular-nums", valueClassName)}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
});
