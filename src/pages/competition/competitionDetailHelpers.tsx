/**
 * Shared helper components for CompetitionDetail page.
 */
import { useState, useEffect, useRef } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

export type CompetitionStatus = Database["public"]["Enums"]["competition_status"];

export const statusConfig: Record<CompetitionStatus, { bg: string; dot: string; label: string; labelAr: string; glow?: boolean }> = {
  pending: { bg: "bg-chart-4/10 text-chart-4", dot: "bg-chart-4", label: "Pending Approval", labelAr: "بانتظار الموافقة" },
  draft: { bg: "bg-muted/60", dot: "bg-muted-foreground", label: "Draft", labelAr: "مسودة" },
  upcoming: { bg: "bg-accent/10 text-accent-foreground", dot: "bg-accent", label: "Upcoming", labelAr: "قادمة" },
  registration_open: { bg: "bg-primary/10 text-primary", dot: "bg-primary", label: "Registration Open", labelAr: "التسجيل مفتوح", glow: true },
  registration_closed: { bg: "bg-muted/60 text-muted-foreground", dot: "bg-muted-foreground", label: "Registration Closed", labelAr: "التسجيل مغلق" },
  in_progress: { bg: "bg-chart-3/10 text-chart-3", dot: "bg-chart-3", label: "In Progress", labelAr: "جارية", glow: true },
  judging: { bg: "bg-chart-4/10 text-chart-4", dot: "bg-chart-4", label: "Judging", labelAr: "التحكيم", glow: true },
  completed: { bg: "bg-chart-5/10 text-chart-5", dot: "bg-chart-5", label: "Completed", labelAr: "مكتملة" },
  cancelled: { bg: "bg-destructive/10 text-destructive", dot: "bg-destructive", label: "Cancelled", labelAr: "ملغاة" },
};

/* ─── Tab Content Transition Wrapper ─── */
export function TabTransition({ children, activeKey }: { children: React.ReactNode; activeKey: string }) {
  const [visible, setVisible] = useState(true);
  const prevKey = useRef(activeKey);
  useEffect(() => {
    if (prevKey.current !== activeKey) {
      setVisible(false);
      const t = setTimeout(() => { setVisible(true); prevKey.current = activeKey; }, 80);
      return () => clearTimeout(t);
    }
  }, [activeKey]);
  return (
    <div className={`transition-all duration-300 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
      {children}
    </div>
  );
}

/* ─── Live Countdown Hook ─── */
function useLiveCountdown(targetDate: string | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!targetDate) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate) return null;
  const target = new Date(targetDate).getTime();
  const diff = target - now;
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, total: diff };
}

/* ─── Mini Progress Ring ─── */
function ProgressRing({ value, max, size = 44, strokeWidth = 4, color = "text-primary" }: { value: number; max: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference - progress * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`${color} transition-all duration-1000 ease-out`} />
    </svg>
  );
}

/* ─── Section Wrapper — premium editorial feel ─── */
export function Section({
  icon, title, defaultOpen = true, badge, children, accent = false,
}: {
  icon: React.ReactNode; title: string; defaultOpen?: boolean; badge?: React.ReactNode; children: React.ReactNode; accent?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="scroll-mt-36" id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${accent ? "border-primary/15 bg-primary/[0.02]" : "border-border/40 bg-card"} ${open ? "shadow-sm" : "shadow-none"}`}>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 text-start hover:bg-muted/20 transition-colors group touch-manipulation active:scale-[0.98]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-primary/8 shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/12">
              <span className="text-primary">{icon}</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base tracking-tight">{title}</h3>
              {badge && <div className="mt-0.5">{badge}</div>}
            </div>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground/60 transition-transform duration-300 ease-out-expo ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className="mx-4 sm:mx-6 mb-0.5">
            <Separator className="opacity-30" />
          </div>
          <div className="p-4 sm:p-6">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/* ─── Live Countdown Display ─── */
export function LiveCountdownStrip({ targetDate, label, labelAr, isAr }: { targetDate: string; label: string; labelAr: string; isAr: boolean }) {
  const countdown = useLiveCountdown(targetDate);
  if (!countdown) return null;
  const units = [
    { value: countdown.days, en: "Days", ar: "يوم" },
    { value: countdown.hours, en: "Hrs", ar: "ساعة" },
    { value: countdown.minutes, en: "Min", ar: "دقيقة" },
    { value: countdown.seconds, en: "Sec", ar: "ثانية" },
  ];
  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.04] via-transparent to-primary/[0.04] p-4 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">{isAr ? labelAr : label}</p>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {units.map((u) => (
          <div key={u.en} className="text-center">
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground leading-none">{String(u.value).padStart(2, "0")}</div>
            <p className="text-[0.6875rem] sm:text-xs text-muted-foreground mt-1 font-medium">{isAr ? u.ar : u.en}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
