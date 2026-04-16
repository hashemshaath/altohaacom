import { memo } from "react";
import { cn } from "@/lib/utils";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

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
      {label && <span className={cn("text-xs font-semibold", s.label)}>{label}</span>}
    </span>
  );
});
