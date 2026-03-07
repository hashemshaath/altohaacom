import { memo } from "react";
import { AlertTriangle, ArrowUp, Minus, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const priorityConfig = {
  urgent: {
    icon: AlertTriangle,
    en: "Urgent",
    ar: "عاجل",
    className: "bg-destructive/15 text-destructive border-destructive/30 animate-pulse",
  },
  high: {
    icon: ArrowUp,
    en: "High",
    ar: "مهم",
    className: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  },
  normal: {
    icon: Minus,
    en: "Normal",
    ar: "عادي",
    className: "bg-muted text-muted-foreground border-border/30",
  },
  low: {
    icon: ArrowDown,
    en: "Low",
    ar: "منخفض",
    className: "bg-muted/50 text-muted-foreground/70 border-border/20",
  },
} as const;

type Priority = keyof typeof priorityConfig;

interface Props {
  priority: string | null | undefined;
  isAr?: boolean;
  showLabel?: boolean;
  size?: "sm" | "xs";
}

export const NotificationPriorityBadge = memo(function NotificationPriorityBadge({ priority, isAr, showLabel = false, size = "xs" }: Props) {
  const p = (priority as Priority) || "normal";
  if (p === "normal" && !showLabel) return null;

  const config = priorityConfig[p] || priorityConfig.normal;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-0.5 font-medium border",
        config.className,
        size === "xs" ? "text-[8px] px-1 py-0 h-3.5" : "text-[10px] px-1.5 py-0.5 h-5"
      )}
    >
      <Icon className={size === "xs" ? "h-2 w-2" : "h-2.5 w-2.5"} />
      {showLabel && <span>{isAr ? config.ar : config.en}</span>}
    </Badge>
  );
});

/** Derive priority from notification type for older notifications without explicit priority */
export function inferPriority(notification: { type?: string | null; priority?: string | null }): string {
  if (notification.priority && notification.priority !== "normal") return notification.priority;
  const type = notification.type || "";
  if (["error", "security", "payment_failed"].includes(type)) return "urgent";
  if (["booth_assignment", "exhibition_reminder", "follow_request", "supplier_inquiry"].includes(type)) return "high";
  if (["story_view", "bio_milestone", "link_milestone"].includes(type)) return "low";
  return "normal";
}
