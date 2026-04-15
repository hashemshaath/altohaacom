import { memo, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface Props {
  score: number | null;
  previousScore?: number | null;
  vitalsPass: number;
  vitalsTotal: number;
  indexedPages: number;
  totalPages: number;
  issueCount: number;
  isAr?: boolean;
}

export const SEOScoreGauge = memo(function SEOScoreGauge({
  score, previousScore, vitalsPass, vitalsTotal, indexedPages, totalPages, issueCount, isAr,
}: Props) {
  const s = score ?? 0;
  const diff = previousScore != null && score != null ? score - previousScore : null;

  const grade = useMemo(() => {
    if (s >= 90) return { label: "A+", color: "text-emerald-500", bg: "bg-emerald-500", ring: "ring-emerald-500/20" };
    if (s >= 80) return { label: "A", color: "text-emerald-500", bg: "bg-emerald-500", ring: "ring-emerald-500/20" };
    if (s >= 70) return { label: "B", color: "text-chart-1", bg: "bg-chart-1", ring: "ring-chart-1/20" };
    if (s >= 50) return { label: "C", color: "text-amber-500", bg: "bg-amber-500", ring: "ring-amber-500/20" };
    return { label: "D", color: "text-destructive", bg: "bg-destructive", ring: "ring-destructive/20" };
  }, [s]);

  // SVG gauge
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (s / 100) * circumference;

  return (
    <Card className={cn("relative overflow-hidden border-2", grade.ring)}>
      <div className={cn("absolute top-0 inset-x-0 h-1", grade.bg)} />
      <CardContent className="p-5">
        <div className="flex items-center gap-5">
          {/* Gauge */}
          <div className="relative shrink-0">
            <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle
                cx="60" cy="60" r={radius} fill="none"
                stroke={`hsl(var(--${s >= 80 ? "chart-2" : s >= 50 ? "chart-4" : "destructive"}))`}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-3xl font-black tabular-nums", grade.color)}>
                {score != null ? <AnimatedCounter value={s} /> : "—"}
              </span>
              <span className="text-[12px] text-muted-foreground font-medium">/100</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={cn("text-sm font-bold px-3 py-1", grade.bg, "text-primary-foreground border-0")}>
                {grade.label}
              </Badge>
              {diff != null && diff !== 0 && (
                <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium",
                  diff > 0 ? "text-emerald-500" : "text-destructive"
                )}>
                  {diff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {diff > 0 ? "+" : ""}{diff}
                </span>
              )}
              {diff === 0 && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Minus className="h-3 w-3" /> {isAr ? "ثابت" : "Stable"}</span>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center rounded-xl bg-muted/40 p-2.5">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span className="text-sm font-bold tabular-nums">{vitalsPass}/{vitalsTotal}</span>
                </div>
                <p className="text-[12px] text-muted-foreground">{isAr ? "Web Vitals" : "CWV Pass"}</p>
              </div>
              <div className="text-center rounded-xl bg-muted/40 p-2.5">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  {indexedPages === totalPages ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                  )}
                  <span className="text-sm font-bold tabular-nums">{indexedPages}/{totalPages}</span>
                </div>
                <p className="text-[12px] text-muted-foreground">{isAr ? "مفهرسة" : "Indexed"}</p>
              </div>
              <div className="text-center rounded-xl bg-muted/40 p-2.5">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  {issueCount === 0 ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-destructive" />
                  )}
                  <span className="text-sm font-bold tabular-nums">{issueCount}</span>
                </div>
                <p className="text-[12px] text-muted-foreground">{isAr ? "مشاكل" : "Issues"}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
