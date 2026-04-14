import { type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/* ─── Section Header ─── */
export function SectionHeader({ icon: Icon, title, desc, status, badge }: { icon: LucideIcon; title: string; desc?: string; status: string; badge?: string }) {
  const dotColor = status === "complete" ? "bg-chart-2" : status === "partial" ? "bg-chart-4" : "bg-muted-foreground/30";
  return (
    <div className="flex items-center gap-3 pb-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold">{title}</h3>
        {desc && <p className="text-[12px] text-muted-foreground">{desc}</p>}
      </div>
      {badge && (
        <Badge variant="outline" className="text-[12px] h-5 px-1.5">{badge}</Badge>
      )}
      <span className={cn("h-2.5 w-2.5 rounded-full shrink-0 transition-colors", dotColor)} title={status} />
    </div>
  );
}

/* ─── Field Group ─── */
export function FieldGroup({ label, required, aiSlot, hint, children }: { label: string; required?: boolean; aiSlot?: ReactNode; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">
          {label}
          {required && <span className="text-destructive ms-0.5">*</span>}
        </Label>
        {aiSlot}
      </div>
      {children}
      {hint && <p className="text-[12px] text-muted-foreground/60">{hint}</p>}
    </div>
  );
}

/* ─── Empty Hint ─── */
export function EmptyHint({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="h-12 w-12 rounded-2xl bg-muted/30 flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-muted-foreground/30" />
      </div>
      <p className="text-xs text-muted-foreground/50">{text}</p>
    </div>
  );
}
