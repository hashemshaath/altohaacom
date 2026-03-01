import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/i18n/LanguageContext";
import { Zap, Database, RefreshCw, Clock, HardDrive, TrendingDown } from "lucide-react";

interface CacheEntry {
  key: string;
  dataUpdatedAt: number;
  staleTime: number;
  isFresh: boolean;
}

export function PerformanceOptimizer() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [cacheStats, setCacheStats] = useState({ total: 0, fresh: 0, stale: 0 });
  const [loadTime, setLoadTime] = useState(0);

  useEffect(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    const fresh = queries.filter(q => !q.isStale()).length;
    setCacheStats({ total: queries.length, fresh, stale: queries.length - fresh });

    // Measure page load performance
    if (typeof window !== "undefined" && window.performance) {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      if (nav) setLoadTime(Math.round(nav.loadEventEnd - nav.startTime));
    }
  }, [queryClient]);

  const clearStaleCache = () => {
    queryClient.invalidateQueries({ stale: true });
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    const fresh = queries.filter(q => !q.isStale()).length;
    setCacheStats({ total: queries.length, fresh, stale: queries.length - fresh });
  };

  const cacheHitRate = cacheStats.total > 0 ? Math.round((cacheStats.fresh / cacheStats.total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-chart-4" />
            {isAr ? "مراقب الأداء" : "Performance Monitor"}
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearStaleCache}>
            <RefreshCw className="h-3 w-3" /> {isAr ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-xl bg-muted/50">
            <Clock className="h-4 w-4 mx-auto text-chart-3 mb-1" />
            <p className="text-lg font-bold">{loadTime}<span className="text-xs">ms</span></p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "وقت التحميل" : "Load Time"}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-muted/50">
            <Database className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{cacheStats.total}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "استعلامات مخزنة" : "Cached Queries"}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-muted/50">
            <HardDrive className="h-4 w-4 mx-auto text-chart-2 mb-1" />
            <p className="text-lg font-bold">{cacheHitRate}%</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "نسبة الكاش" : "Cache Hit"}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{isAr ? "كفاءة الكاش" : "Cache Efficiency"}</span>
            <span className="font-medium">{cacheStats.fresh} / {cacheStats.total}</span>
          </div>
          <Progress value={cacheHitRate} className="h-1.5" />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Badge variant="secondary" className="bg-chart-2/10 text-chart-2 text-[10px]">
            {cacheStats.fresh} {isAr ? "محدث" : "Fresh"}
          </Badge>
          <Badge variant="secondary" className="bg-chart-4/10 text-chart-4 text-[10px]">
            {cacheStats.stale} {isAr ? "قديم" : "Stale"}
          </Badge>
        </div>

        <div className="p-2 rounded-xl bg-muted/30 text-xs text-muted-foreground">
          <TrendingDown className="h-3 w-3 inline me-1" />
          {isAr
            ? "يتم تحسين الاستعلامات تلقائياً مع التخزين المؤقت لمدة 2-5 دقائق"
            : "Queries auto-optimized with 2-5 min stale times & parallel fetching"}
        </div>
      </CardContent>
    </Card>
  );
}
