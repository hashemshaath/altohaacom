import { cn } from "@/lib/utils";
import { CheckCircle2, ShieldCheck, AlertTriangle, Info, TrendingUp } from "lucide-react";
import { Badge } from "./badge";

type Level = "verified" | "high" | "medium" | "low" | "info";

interface ConfidenceBadgeProps {
  level: Level;
  label?: string;
  className?: string;
}

const config: Record<Level, { icon: typeof CheckCircle2; colors: string; defaultLabel: string }> = {
  verified: { icon: ShieldCheck, colors: "bg-chart-2/10 text-chart-2 border-chart-2/30", defaultLabel: "Verified" },
  high: { icon: CheckCircle2, colors: "bg-primary/10 text-primary border-primary/30", defaultLabel: "High confidence" },
  medium: { icon: TrendingUp, colors: "bg-chart-4/10 text-chart-4 border-chart-4/30", defaultLabel: "Moderate" },
  low: { icon: AlertTriangle, colors: "bg-destructive/10 text-destructive border-destructive/30", defaultLabel: "Low confidence" },
  info: { icon: Info, colors: "bg-muted text-muted-foreground border-border", defaultLabel: "Info" },
};

/**
 * Shows data confidence or verification level.
 * Use alongside metrics, user profiles, and data tables.
 */
export function ConfidenceBadge({ level, label, className }: ConfidenceBadgeProps) {
  const c = config[level];
  const Icon = c.icon;

  return (
    <Badge variant="outline" className={cn("gap-1 text-[10px] px-2 py-0.5 font-semibold", c.colors, className)}>
      <Icon className="h-3 w-3" />
      {label || c.defaultLabel}
    </Badge>
  );
}
