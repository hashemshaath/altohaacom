import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gauge, Smartphone, Monitor, Tablet, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

interface VitalsRow {
  lcp: number | null;
  inp: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
  device_type: string | null;
  path: string | null;
}

function getScore(metric: string, value: number): "good" | "needs-improvement" | "poor" {
  const thresholds: Record<string, [number, number]> = {
    lcp: [2500, 4000],
    fcp: [1800, 3000],
    inp: [200, 500],
    ttfb: [800, 1800],
    cls: [0.1, 0.25],
  };
  const [good, poor] = thresholds[metric] || [1000, 3000];
  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

const scoreColors = {
  good: "bg-green-500/10 text-green-700 dark:text-green-400",
  "needs-improvement": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  poor: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const deviceIcons: Record<string, React.ElementType> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

export const WebVitalsWidget = memo(function WebVitalsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-web-vitals-summary"],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("seo_web_vitals")
        .select("lcp, inp, cls, fcp, ttfb, device_type, path")
        .gte("created_at", since)
        .limit(500);

      if (error) throw error;
      const rows = (data || []) as VitalsRow[];

      const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
      const avgDec = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 1000) / 1000 : null;

      const lcpVals = rows.map(r => r.lcp).filter((v): v is number => v != null);
      const fcpVals = rows.map(r => r.fcp).filter((v): v is number => v != null);
      const inpVals = rows.map(r => r.inp).filter((v): v is number => v != null);
      const ttfbVals = rows.map(r => r.ttfb).filter((v): v is number => v != null);
      const clsVals = rows.map(r => r.cls).filter((v): v is number => v != null);

      // Device breakdown
      const devices: Record<string, number> = {};
      rows.forEach(r => {
        const d = r.device_type || "unknown";
        devices[d] = (devices[d] || 0) + 1;
      });

      // Slowest pages by LCP
      const pageLcp: Record<string, number[]> = {};
      rows.forEach(r => {
        if (r.path && r.lcp != null) {
          if (!pageLcp[r.path]) pageLcp[r.path] = [];
          pageLcp[r.path].push(r.lcp);
        }
      });
      const slowestPages = Object.entries(pageLcp)
        .map(([path, vals]) => ({ path, avgLcp: avg(vals)! }))
        .sort((a, b) => b.avgLcp - a.avgLcp)
        .slice(0, 5);

      return {
        total: rows.length,
        lcp: avg(lcpVals),
        fcp: avg(fcpVals),
        inp: avg(inpVals),
        ttfb: avg(ttfbVals),
        cls: avgDec(clsVals),
        devices,
        slowestPages,
      };
    },
    staleTime: 60000,
    refetchInterval: useVisibleRefetchInterval(120000),
  });

  const metrics = [
    { key: "lcp", label: "LCP", labelAr: "أكبر محتوى مرئي", unit: "ms", value: data?.lcp },
    { key: "fcp", label: "FCP", labelAr: "أول محتوى مرئي", unit: "ms", value: data?.fcp },
    { key: "inp", label: "INP", labelAr: "التفاعل للرسم", unit: "ms", value: data?.inp },
    { key: "ttfb", label: "TTFB", labelAr: "وقت الاستجابة", unit: "ms", value: data?.ttfb },
    { key: "cls", label: "CLS", labelAr: "إزاحة التصميم", unit: "", value: data?.cls },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Gauge className="h-4 w-4 text-primary" />
          {isAr ? "مقاييس الأداء (24 ساعة)" : "Web Vitals (24h)"}
          {data && (
            <Badge variant="outline" className="ms-auto text-[10px]">
              {data.total} {isAr ? "عينة" : "samples"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : !data || data.total === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            {isAr ? "لا توجد بيانات أداء بعد" : "No performance data yet"}
          </p>
        ) : (
          <>
            {/* Metric cards */}
            <div className="grid grid-cols-5 gap-2">
              {metrics.map((m) => {
                const score = m.value != null ? getScore(m.key, m.value) : null;
                return (
                  <div
                    key={m.key}
                    className={cn(
                      "rounded-lg p-2.5 text-center",
                      score ? scoreColors[score] : "bg-muted/50"
                    )}
                  >
                    <p className="text-[10px] font-medium opacity-70">{m.key.toUpperCase()}</p>
                    <p className="text-lg font-bold tabular-nums">
                      {m.value != null ? m.value : "—"}
                    </p>
                    {m.unit && <p className="text-[9px] opacity-60">{m.unit}</p>}
                  </div>
                );
              })}
            </div>

            {/* Device breakdown */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {Object.entries(data.devices).map(([device, count]) => {
                const Icon = deviceIcons[device] || Monitor;
                return (
                  <span key={device} className="flex items-center gap-1">
                    <Icon className="h-3 w-3" />
                    {count}
                  </span>
                );
              })}
            </div>

            {/* Slowest pages */}
            {data.slowestPages.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground">
                  {isAr ? "أبطأ الصفحات (LCP)" : "Slowest Pages (LCP)"}
                </p>
                {data.slowestPages.map((p) => {
                  const score = getScore("lcp", p.avgLcp);
                  return (
                    <div key={p.path} className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[200px] font-mono text-[11px]">{p.path}</span>
                      <Badge variant="outline" className={cn("text-[10px]", scoreColors[score])}>
                        {p.avgLcp}ms
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
});
