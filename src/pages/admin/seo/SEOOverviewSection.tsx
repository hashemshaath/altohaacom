import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { SEOScoreGauge } from "@/components/admin/seo/SEOScoreGauge";
import { Eye, Activity, TrendingUp, Clock, ArrowUp, ArrowDown, Gauge, Smartphone, Monitor } from "lucide-react";

interface VitalsAgg {
  lcp: number | null;
  inp: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
  sampleCount: number;
  mobileCount: number;
  desktopCount: number;
}

const CWV_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  inp: { good: 200, poor: 500 },
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
};

function getVitalStatus(metric: keyof typeof CWV_THRESHOLDS, value: number): "good" | "needs-improvement" | "poor" {
  const t = CWV_THRESHOLDS[metric];
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}

interface SEOOverviewSectionProps {
  isAr: boolean;
  range: number;
  totalViews: number;
  prevTotalViews: number;
  uniqueSessions: number;
  prevUniqueSessions: number;
  bounceRate: number;
  prevBounceRate: number;
  avgDuration: number;
  prevAvgDuration: number;
  vitalsAgg: VitalsAgg | null;
  indexingStatus: { status: string }[] | undefined;
  trackedKeywords: unknown[] | undefined;
  totalPages: number;
}

export function SEOOverviewSection({
  isAr, range, totalViews, prevTotalViews, uniqueSessions, prevUniqueSessions,
  bounceRate, prevBounceRate, avgDuration, prevAvgDuration,
  vitalsAgg, indexingStatus, trackedKeywords, totalPages,
}: SEOOverviewSectionProps) {
  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Eye, label: isAr ? "مشاهدات الصفحة" : "Page Views", value: totalViews, prev: prevTotalViews, sub: isAr ? `آخر ${range} أيام` : `Last ${range} days` },
          { icon: Activity, label: isAr ? "جلسات فريدة" : "Unique Sessions", value: uniqueSessions, prev: prevUniqueSessions },
          { icon: TrendingUp, label: isAr ? "معدل الارتداد" : "Bounce Rate", value: bounceRate, prev: prevBounceRate, suffix: "%", invert: true, badge: bounceRate > 60 ? "destructive" : bounceRate > 40 ? "secondary" : "default", badgeText: bounceRate > 60 ? (isAr ? "مرتفع" : "High") : bounceRate > 40 ? (isAr ? "متوسط" : "Medium") : (isAr ? "جيد" : "Good") },
          { icon: Clock, label: isAr ? "متوسط المدة" : "Avg Duration", value: avgDuration, prev: prevAvgDuration, suffix: "s" },
        ].map((kpi, i) => {
          const diff = kpi.value - kpi.prev;
          const pctChange = kpi.prev > 0 ? Math.round(((kpi.value - kpi.prev) / kpi.prev) * 100) : 0;
          const isPositive = kpi.invert ? diff < 0 : diff > 0;
          const isNegative = kpi.invert ? diff > 0 : diff < 0;
          return (
            <Card key={i} className="border-border/40 hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5">
                  <kpi.icon className="h-3.5 w-3.5" />
                  {kpi.label}
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold tabular-nums"><AnimatedCounter value={kpi.value} />{kpi.suffix && <span className="text-sm font-normal text-muted-foreground ms-0.5">{kpi.suffix}</span>}</p>
                  {kpi.prev > 0 && diff !== 0 && (
                    <span className={`inline-flex items-center gap-0.5 text-xs font-medium mb-1 ${isPositive ? "text-chart-2" : isNegative ? "text-destructive" : "text-muted-foreground"}`}>
                      {isPositive ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                      {Math.abs(pctChange)}%
                    </span>
                  )}
                </div>
                {kpi.sub && <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>}
                {kpi.badge && (
                  <Badge variant={kpi.badge as "destructive" | "secondary" | "default"} className="text-xs mt-1">{kpi.badgeText}</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* SEO Score */}
      <SEOScoreGauge
        score={(() => { const a = (trackedKeywords || []) as unknown[]; return a.length > 0 ? Math.min(100, Math.round(65 + (vitalsAgg ? 10 : 0) + (indexingStatus?.filter((s) => s.status === "indexed").length ? 10 : 0))) : null; })()}
        previousScore={null}
        vitalsPass={vitalsAgg ? (["lcp", "inp", "cls", "fcp", "ttfb"] as const).filter(m => vitalsAgg[m] != null && getVitalStatus(m, vitalsAgg[m]!) === "good").length : 0}
        vitalsTotal={5}
        indexedPages={indexingStatus?.filter((s) => s.status === "indexed").length || 0}
        totalPages={totalPages}
        issueCount={0}
        isAr={isAr}
      />

      {/* Quick vitals summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["lcp", "inp", "cls", "fcp", "ttfb"] as const).map(metric => {
          const thresh = CWV_THRESHOLDS[metric];
          const val = vitalsAgg?.[metric];
          const status = val != null ? getVitalStatus(metric, val) : null;
          return (
            <Card key={metric} className="relative overflow-hidden border-border/40">
              {status && <div className={`absolute top-0 inset-x-0 h-0.5 ${status === "good" ? "bg-chart-2" : status === "needs-improvement" ? "bg-chart-4" : "bg-destructive"}`} />}
              <CardContent className="p-3 pt-4 text-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{metric.toUpperCase()}</p>
                {val != null ? (
                  <p className={`text-xl font-bold tabular-nums mt-1 ${status === "good" ? "text-chart-2" : status === "needs-improvement" ? "text-chart-4" : "text-destructive"}`}>
                    {metric === "cls" ? val.toFixed(3) : Math.round(val)}
                    <span className="text-xs font-normal text-muted-foreground ms-0.5">{metric === "cls" ? "" : "ms"}</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">{isAr ? "لا بيانات" : "No data"}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
