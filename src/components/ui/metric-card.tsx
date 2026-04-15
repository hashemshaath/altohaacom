import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

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
