import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Centralized status color mappings for consistent badge styling across admin pages.
 * Uses design system tokens exclusively.
 */
const STATUS_STYLES: Record<string, string> = {
  // General statuses
  active: "bg-chart-2/15 text-chart-2 border-chart-2/25",
  inactive: "bg-muted text-muted-foreground border-border",
  pending: "bg-chart-4/15 text-chart-4 border-chart-4/25",
  approved: "bg-chart-2/15 text-chart-2 border-chart-2/25",
  rejected: "bg-destructive/15 text-destructive border-destructive/25",
  suspended: "bg-destructive/15 text-destructive border-destructive/25",
  banned: "bg-destructive/20 text-destructive border-destructive/30",

  // Order statuses
  draft: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20",
  in_progress: "bg-chart-3/15 text-chart-3 border-chart-3/25",
  processing: "bg-chart-3/15 text-chart-3 border-chart-3/25",
  completed: "bg-chart-5/15 text-chart-5 border-chart-5/25",
  cancelled: "bg-muted text-muted-foreground border-border",
  confirmed: "bg-primary/15 text-primary border-primary/25",

  // Shipping
  shipped: "bg-chart-1/15 text-chart-1 border-chart-1/25",
  delivered: "bg-chart-5/15 text-chart-5 border-chart-5/25",
  refunded: "bg-muted text-muted-foreground border-border",

  // Content
  published: "bg-chart-2/15 text-chart-2 border-chart-2/25",
  archived: "bg-muted text-muted-foreground border-border",

  // Fallback
  default: "bg-muted text-muted-foreground border-border",
};

interface AdminStatusBadgeProps {
  status: string | null | undefined;
  label?: string;
  className?: string;
}

export const AdminStatusBadge = memo(function AdminStatusBadge({
  status,
  label,
  className,
}: AdminStatusBadgeProps) {
  const key = status?.toLowerCase().replace(/\s+/g, "_") || "default";
  const style = STATUS_STYLES[key] || STATUS_STYLES.default;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] font-medium px-2 py-0.5 rounded-md capitalize",
        style,
        className
      )}
    >
      {label || status || "Unknown"}
    </Badge>
  );
});

/** Helper function for inline use without React component */
export function getStatusStyle(status: string | null | undefined): string {
  const key = status?.toLowerCase().replace(/\s+/g, "_") || "default";
  return STATUS_STYLES[key] || STATUS_STYLES.default;
}
