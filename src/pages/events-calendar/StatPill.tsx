import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const COLOR_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  primary: { border: "border-primary/15", bg: "bg-primary/10", text: "text-primary" },
  "chart-1": { border: "border-chart-1/15", bg: "bg-chart-1/10", text: "text-chart-1" },
  "chart-2": { border: "border-chart-2/15", bg: "bg-chart-2/10", text: "text-chart-2" },
  "chart-3": { border: "border-chart-3/15", bg: "bg-chart-3/10", text: "text-chart-3" },
  "chart-4": { border: "border-chart-4/15", bg: "bg-chart-4/10", text: "text-chart-4" },
  "chart-5": { border: "border-chart-5/15", bg: "bg-chart-5/10", text: "text-chart-5" },
};

export function StatPill({ icon: Icon, value, label, color }: { icon: LucideIcon; value: number; label: string; color: string }) {
  const styles = COLOR_STYLES[color] ?? COLOR_STYLES.primary;
  return (
    <div className={cn("flex items-center gap-2 rounded-xl border px-3.5 py-2 bg-background/60 backdrop-blur-sm shadow-sm", styles.border)}>
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", styles.bg)}>
        <Icon className={cn("h-4 w-4", styles.text)} />
      </div>
      <div>
        <p className={cn("text-lg font-bold tabular-nums leading-none", styles.text)}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
