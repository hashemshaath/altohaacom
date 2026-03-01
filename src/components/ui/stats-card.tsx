import { cn } from "@/lib/utils";
import { memo, ReactNode } from "react";
import { TrendIndicator } from "./trend-indicator";
import { ActivityPulse } from "./activity-pulse";

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: number; label?: string };
  /** Show a live activity pulse */
  isLive?: boolean;
  className?: string;
}

/**
 * Reusable statistics card for dashboards. Provides consistent styling
 * across admin, profile, and analytics pages.
 */
export const StatsCard = memo(function StatsCard({
  icon,
  label,
  value,
  trend,
  isLive,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/40 bg-card p-4 space-y-2 transition-all hover:shadow-md hover:border-primary/20",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {isLive && <ActivityPulse status="live" />}
          <div className="rounded-xl bg-primary/10 p-2 text-primary">{icon}</div>
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {trend && <TrendIndicator value={trend.value} suffix={trend.label} />}
    </div>
  );
});
