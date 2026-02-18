import { cn } from "@/lib/utils";

export function StatPill({ icon: Icon, value, label, color }: { icon: any; value: number; label: string; color: string }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-xl border px-3.5 py-2 bg-background/60 backdrop-blur-sm shadow-sm", `border-${color}/15`)}>
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", `bg-${color}/10`)}>
        <Icon className={cn("h-4 w-4", `text-${color}`)} />
      </div>
      <div>
        <p className={cn("text-lg font-bold tabular-nums leading-none", `text-${color}`)}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
