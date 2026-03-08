import { memo } from "react";
import { cn } from "@/lib/utils";

interface ActivityPulseProps {
  /** "live" = green pulse, "recent" = amber, "idle" = muted, "error" = red */
  status?: "live" | "recent" | "idle" | "error";
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

const statusStyles = {
  live: { dot: "bg-chart-2", ring: "bg-chart-2/40", label: "text-chart-2" },
  recent: { dot: "bg-chart-4", ring: "bg-chart-4/40", label: "text-chart-4" },
  idle: { dot: "bg-muted-foreground/40", ring: "bg-muted-foreground/20", label: "text-muted-foreground" },
  error: { dot: "bg-destructive", ring: "bg-destructive/40", label: "text-destructive" },
};

/**
 * A pulsing dot indicator to show live/recent activity status.
 * Use in dashboards, headers, and list items.
 */
export const ActivityPulse = memo(function ActivityPulse({ status = "live", label, className, size = "sm" }: ActivityPulseProps) {
  const s = statusStyles[status];
  const dotSize = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  const ringSize = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="relative flex">
        <span className={cn(ringSize, "rounded-full absolute inset-0", s.ring, status === "live" && "animate-ping")} />
        <span className={cn(dotSize, "rounded-full relative", s.dot)} />
      </span>
      {label && <span className={cn("text-[10px] font-semibold", s.label)}>{label}</span>}
    </span>
  );
});
