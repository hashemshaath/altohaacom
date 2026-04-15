import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { type LucideIcon } from "lucide-react";

interface InfoBadgeProps {
  icon?: LucideIcon;
  children: ReactNode;
  variant?: "default" | "muted" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

const variantStyles = {
  default: "bg-muted/60 text-muted-foreground border-border/30",
  muted: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  warning: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
};

/**
 * Small informational badge with icon — replaces the repeated pattern:
 * <Badge variant="outline" className="text-xs gap-1 rounded-lg">
 *   <Icon className="h-2.5 w-2.5" /> label
 * </Badge>
 */
export const InfoBadge = memo(function InfoBadge({
  icon: Icon,
  children,
  variant = "default",
  className,
}: InfoBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs gap-1 rounded-lg font-medium px-2 py-0.5",
        variantStyles[variant],
        className
      )}
    >
      {Icon && <Icon className="h-2.5 w-2.5" />}
      {children}
    </Badge>
  );
});
