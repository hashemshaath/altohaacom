import { memo } from "react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./animated-counter";
import { Users, Eye, Star, Trophy } from "lucide-react";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

interface SocialProofCounterProps {
  type: "members" | "views" | "rating" | "winners";
  value: number;
  label: string;
  className?: string;
}

const config = {
  members: { icon: Users, color: "text-primary", bg: "bg-primary/10" },
  views: { icon: Eye, color: "text-chart-2", bg: "bg-chart-2/10" },
  rating: { icon: Star, color: "text-chart-4", bg: "bg-chart-4/10" },
  winners: { icon: Trophy, color: "text-chart-3", bg: "bg-chart-3/10" },
};

/**
 * Compact social proof indicator with animated count.
 * Use in cards, headers, and list items to build trust.
 */
export const SocialProofCounter = memo(function SocialProofCounter({ type, value, label, className }: SocialProofCounterProps) {
  const c = config[type];
  const Icon = c.icon;

  return (
    <div className={cn("inline-flex items-center gap-1.5 text-xs", className)}>
      <div className={cn("rounded-lg p-1", c.bg)}>
        <Icon className={cn("h-3 w-3", c.color)} />
      </div>
      <AnimatedCounter value={value} className={cn("text-sm", c.color)} format />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
});
