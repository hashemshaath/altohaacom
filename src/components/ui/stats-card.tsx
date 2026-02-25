import { cn } from "@/lib/utils";
import { memo, ReactNode } from "react";

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: number; label?: string };
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
        <div className="rounded-xl bg-primary/10 p-2 text-primary">{icon}</div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {trend && (
        <p
          className={cn(
            "text-xs font-medium",
            trend.value > 0 ? "text-chart-2" : 
            trend.value < 0 ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {trend.value > 0 ? "↑" : trend.value < 0 ? "↓" : "→"}{" "}
          {Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ""}
        </p>
      )}
    </div>
  );
});
