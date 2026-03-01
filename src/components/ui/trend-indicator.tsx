import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface TrendIndicatorProps {
  value: number;
  /** What the value represents */
  suffix?: string;
  /** Show as percentage */
  isPercentage?: boolean;
  className?: string;
  size?: "sm" | "md";
}

/**
 * A compact trend arrow with value, colored by direction.
 * Use alongside stats, KPIs, and metric cards.
 */
export function TrendIndicator({ value, suffix, isPercentage = true, className, size = "sm" }: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  const Icon = isPositive ? ArrowUpRight : isNeutral ? Minus : ArrowDownRight;
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 font-semibold tabular-nums",
      textSize,
      isPositive && "text-chart-2",
      isNeutral && "text-muted-foreground",
      !isPositive && !isNeutral && "text-destructive",
      className
    )}>
      <Icon className={iconSize} />
      {Math.abs(value)}{isPercentage ? "%" : ""}{suffix ? ` ${suffix}` : ""}
    </span>
  );
}
