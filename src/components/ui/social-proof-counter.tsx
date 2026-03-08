import { memo } from "react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./animated-counter";
import { Users, Eye, Star, Trophy } from "lucide-react";

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
export function SocialProofCounter({ type, value, label, className }: SocialProofCounterProps) {
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
}
