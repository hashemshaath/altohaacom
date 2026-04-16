import { memo } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

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
export const TrendIndicator = memo(function TrendIndicator({ value, suffix, isPercentage = true, className, size = "sm" }: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  const Icon = isPositive ? ArrowUpRight : isNeutral ? Minus : ArrowDownRight;
  const textSize = size === "sm" ? "text-xs" : "text-xs";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold tabular-nums",
      textSize,
      isPositive && "text-chart-2 bg-chart-2/10",
      isNeutral && "text-muted-foreground bg-muted",
      !isPositive && !isNeutral && "text-destructive bg-destructive/10",
      className
    )}>
      <Icon className={cn(iconSize, "transition-transform duration-200", isPositive && "animate-bounce-subtle")} />
      {Math.abs(value)}{isPercentage ? "%" : ""}{suffix ? ` ${suffix}` : ""}
    </span>
  );
});
