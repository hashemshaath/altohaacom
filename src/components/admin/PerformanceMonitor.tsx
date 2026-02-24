import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gauge, Zap, HardDrive, Clock, Wifi, Monitor, TrendingUp } from "lucide-react";

function getPerformanceMetrics() {
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const paint = performance.getEntriesByType("paint");
  const fcp = paint.find(p => p.name === "first-contentful-paint");
  const memory = (performance as any).memory;

  return {
    pageLoad: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
    domReady: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
    ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : null,
    fcp: fcp ? Math.round(fcp.startTime) : null,
    jsHeap: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : null,
    jsHeapLimit: memory ? Math.round(memory.jsHeapSizeLimit / 1024 / 1024) : null,
    resourceCount: performance.getEntriesByType("resource").length,
    connectionType: (navigator as any).connection?.effectiveType || "unknown",
  };
}

function getScore(value: number | null, thresholds: [number, number]): "good" | "ok" | "bad" {
  if (value === null) return "ok";
  if (value <= thresholds[0]) return "good";
  if (value <= thresholds[1]) return "ok";
  return "bad";
}

const scoreColors = {
  good: "text-green-600",
  ok: "text-yellow-600",
  bad: "text-destructive",
};

export function PerformanceMonitor() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const metrics = useMemo(() => getPerformanceMetrics(), []);

  const items = [
    {
      icon: Clock, label: isAr ? "تحميل الصفحة" : "Page Load",
      value: metrics.pageLoad, unit: "ms", thresholds: [2000, 4000] as [number, number],
    },
    {
      icon: Zap, label: isAr ? "أول محتوى مرئي" : "FCP",
      value: metrics.fcp, unit: "ms", thresholds: [1800, 3000] as [number, number],
    },
    {
      icon: Wifi, label: "TTFB",
      value: metrics.ttfb, unit: "ms", thresholds: [200, 600] as [number, number],
    },
    {
      icon: Monitor, label: isAr ? "جاهزية DOM" : "DOM Ready",
      value: metrics.domReady, unit: "ms", thresholds: [1500, 3000] as [number, number],
    },
  ];

  const overallScore = useMemo(() => {
    let score = 100;
    if (metrics.pageLoad && metrics.pageLoad > 2000) score -= Math.min(30, (metrics.pageLoad - 2000) / 100);
    if (metrics.fcp && metrics.fcp > 1800) score -= Math.min(30, (metrics.fcp - 1800) / 100);
    if (metrics.ttfb && metrics.ttfb > 200) score -= Math.min(20, (metrics.ttfb - 200) / 50);
    return Math.max(0, Math.round(score));
  }, [metrics]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Gauge className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{isAr ? "مراقبة الأداء" : "Performance Monitor"}</h3>
      </div>

      {/* Overall Score */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="6" />
                <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor"
                  className={overallScore >= 80 ? "text-green-500" : overallScore >= 50 ? "text-yellow-500" : "text-destructive"}
                  strokeWidth="6" strokeDasharray={`${overallScore * 2.2} 220`} strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{overallScore}</span>
              </div>
            </div>
            <div>
              <p className="font-semibold">{isAr ? "نقاط الأداء" : "Performance Score"}</p>
              <p className="text-sm text-muted-foreground">
                {overallScore >= 80 ? (isAr ? "ممتاز" : "Excellent")
                  : overallScore >= 50 ? (isAr ? "جيد" : "Good")
                  : (isAr ? "يحتاج تحسين" : "Needs Improvement")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => {
          const score = getScore(item.value, item.thresholds);
          return (
            <Card key={i}>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <p className={`text-lg font-bold ${scoreColors[score]}`}>
                  {item.value !== null ? `${item.value}${item.unit}` : "—"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resources & Memory */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isAr ? "الموارد" : "Resources"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">{isAr ? "الملفات المحملة" : "Loaded Resources"}</span>
            <Badge variant="outline">{metrics.resourceCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">{isAr ? "نوع الاتصال" : "Connection"}</span>
            <Badge variant="outline">{metrics.connectionType}</Badge>
          </div>
          {metrics.jsHeap !== null && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm flex items-center gap-1">
                  <HardDrive className="h-3.5 w-3.5" />
                  {isAr ? "الذاكرة" : "JS Heap"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {metrics.jsHeap}MB / {metrics.jsHeapLimit}MB
                </span>
              </div>
              <Progress value={metrics.jsHeapLimit ? (metrics.jsHeap / metrics.jsHeapLimit) * 100 : 0} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            {isAr ? "نصائح التحسين" : "Optimization Tips"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {metrics.fcp && metrics.fcp > 1800 && (
              <li>• {isAr ? "تحسين FCP: قلّل حجم JavaScript الأولي" : "Improve FCP: Reduce initial JS bundle size"}</li>
            )}
            {metrics.ttfb && metrics.ttfb > 200 && (
              <li>• {isAr ? "تحسين TTFB: تحقق من سرعة الخادم" : "Improve TTFB: Check server response time"}</li>
            )}
            {metrics.resourceCount > 100 && (
              <li>• {isAr ? "تقليل عدد الملفات المحملة باستخدام التجميع" : "Reduce resource count with better bundling"}</li>
            )}
            {overallScore >= 80 && (
              <li>✅ {isAr ? "الأداء ممتاز! استمر في المراقبة" : "Performance is great! Keep monitoring"}</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
