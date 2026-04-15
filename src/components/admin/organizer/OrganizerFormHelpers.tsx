import { useState, memo, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { AlertCircle, Languages, Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ─── Section Header ─── */
export const SectionHeader = memo(({ icon: Icon, title, desc, actions }: { icon: LucideIcon; title: string; desc: string; actions?: ReactNode }) => (
  <div className="flex items-center justify-between gap-3 mb-5">
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
));
SectionHeader.displayName = "SectionHeader";

/* ─── Field Group ─── */
export const FieldGroup = memo(({ label, required, error, hint, children, className }: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label className="text-xs font-medium">
      {label}{required && <span className="text-destructive ms-0.5">*</span>}
    </Label>
    {children}
    {error && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
    {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
));
FieldGroup.displayName = "FieldGroup";

/* ─── Bilingual Field ─── */
export function BilingualField({ labelAr, labelEn, valueAr, valueEn, onChangeAr, onChangeEn, multiline, rows, translateField, context, placeholder_ar, placeholder_en }: {
  labelAr: string; labelEn: string; valueAr: string; valueEn: string;
  onChangeAr: (v: string) => void; onChangeEn: (v: string) => void;
  multiline?: boolean; rows?: number;
  translateField: (text: string, from: "en" | "ar", to: "en" | "ar", ctx?: string) => Promise<string | null>;
  context?: string; placeholder_ar?: string; placeholder_en?: string;
}) {
  const [tAr, setTAr] = useState(false);
  const [tEn, setTEn] = useState(false);

  const translateToEn = async () => {
    if (!valueAr?.trim()) return;
    setTEn(true);
    const result = await translateField(valueAr, "ar", "en", context);
    if (result) { onChangeEn(result); toast.success("Translated to English"); }
    setTEn(false);
  };
  const translateToAr = async () => {
    if (!valueEn?.trim()) return;
    setTAr(true);
    const result = await translateField(valueEn, "en", "ar", context);
    if (result) { onChangeAr(result); toast.success("تمت الترجمة للعربية"); }
    setTAr(false);
  };

  const InputComp = multiline ? Textarea : Input;
  const extraProps = multiline ? { rows: rows || 4 } : {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">{labelAr}</Label>
          {valueAr?.trim() && (
            <Button type="button" variant="ghost" size="sm" className="h-5 px-1.5 text-xs gap-1 text-primary" onClick={translateToEn} disabled={tEn}>
              {tEn ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />} AR → EN
            </Button>
          )}
        </div>
        <InputComp value={valueAr} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeAr(e.target.value)} dir="rtl" placeholder={placeholder_ar} {...extraProps} />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">{labelEn}</Label>
          {valueEn?.trim() && (
            <Button type="button" variant="ghost" size="sm" className="h-5 px-1.5 text-xs gap-1 text-primary" onClick={translateToAr} disabled={tAr}>
              {tAr ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />} EN → AR
            </Button>
          )}
        </div>
        <InputComp value={valueEn} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeEn(e.target.value)} dir="ltr" placeholder={placeholder_en} {...extraProps} />
      </div>
    </div>
  );
}

/* ─── Progress Ring ─── */
export function ProgressRing({ pct }: { pct: number }) {
  const r = 16, c = 2 * Math.PI * r;
  const color = pct >= 80 ? "stroke-chart-2" : pct >= 50 ? "stroke-amber-500" : "stroke-primary";
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <svg width="42" height="42" className="shrink-0 -rotate-90 cursor-help">
            <circle cx="21" cy="21" r={r} fill="none" strokeWidth="3" className="stroke-muted/30" />
            <circle cx="21" cy="21" r={r} fill="none" strokeWidth="3" className={cn(color, "transition-all duration-500")}
              strokeDasharray={c} strokeDashoffset={c - (c * pct / 100)} strokeLinecap="round" />
            <text x="21" y="21" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-xs font-bold rotate-90 origin-center">{pct}%</text>
          </svg>
        </TooltipTrigger>
        <TooltipContent side="bottom"><p className="text-xs">{pct}% complete</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ─── Quick Nav Item ─── */
export function QuickNavItem({ icon: Icon, label, status, active, onClick }: { icon: LucideIcon; label: string; status: "complete" | "partial" | "empty"; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs transition-all",
      active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
    )}>
      <div className={cn(
        "h-1.5 w-1.5 rounded-full shrink-0",
        status === "complete" ? "bg-chart-2" : status === "partial" ? "bg-amber-500" : "bg-muted-foreground/30"
      )} />
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

/* ─── Slug Generator ─── */
export function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "").replace(/^-+/, "");
}
