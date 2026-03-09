import { cn } from "@/lib/utils";
import { memo, ReactNode } from "react";
import { TrendIndicator } from "./trend-indicator";
import { ActivityPulse } from "./activity-pulse";

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: number; label?: string };
  isLive?: boolean;
  className?: string;
}

export const StatsCard = memo(function StatsCard({
  icon, label, value, trend, isLive, className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 space-y-2 transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-primary/20 group/stat",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium group-hover/stat:text-foreground transition-colors">{label}</span>
        <div className="flex items-center gap-2">
          {isLive && <ActivityPulse status="live" />}
          <div className="rounded-lg bg-primary/10 p-2 text-primary transition-transform duration-200 group-hover/stat:scale-105">{icon}</div>
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      {trend && <TrendIndicator value={trend.value} suffix={trend.label} />}
    </div>
  );
});
