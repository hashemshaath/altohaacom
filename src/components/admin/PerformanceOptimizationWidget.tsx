import { useLanguage } from "@/i18n/LanguageContext";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Database, RefreshCw, HardDrive, Gauge } from "lucide-react";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function PerformanceOptimizationWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const { toast } = useToast();
  const [clearing, setClearing] = useState(false);

  const cacheStats = useMemo(() => {
    const cache = qc.getQueryCache();
    const queries = cache.getAll();
    const total = queries.length;
    const stale = queries.filter(q => q.isStale()).length;
    const fresh = total - stale;
    const active = queries.filter(q => q.getObserversCount() > 0).length;
    const inactive = total - active;

    // Estimate memory (rough approximation)
    let dataSize = 0;
    queries.forEach(q => {
      try {
        const d = q.state.data;
        if (d) dataSize += JSON.stringify(d).length;
      } catch { /* skip */ }
    });
    const memoryKB = Math.round(dataSize / 1024);

    return { total, stale, fresh, active, inactive, memoryKB };
  }, [qc]);

  const clearStaleCache = async () => {
    setClearing(true);
    qc.removeQueries({ predicate: q => q.isStale() && q.getObserversCount() === 0 });
    await new Promise(r => setTimeout(r, 300));
    setClearing(false);
    toast({ title: isAr ? "تم تنظيف الذاكرة المؤقتة" : "Cache cleared" });
  };

  const metrics = [
    { icon: Database, label: isAr ? "استعلامات مخزنة" : "Cached Queries", value: cacheStats.total, color: "text-primary" },
    { icon: Zap, label: isAr ? "نشطة" : "Active", value: cacheStats.active, color: "text-chart-2" },
    { icon: HardDrive, label: isAr ? "حجم الذاكرة" : "Cache Size", value: `${cacheStats.memoryKB} KB`, color: "text-chart-3" },
    { icon: Gauge, label: isAr ? "قديمة" : "Stale", value: cacheStats.stale, color: "text-chart-4" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-chart-3" />
            {isAr ? "أداء التطبيق" : "App Performance"}
          </CardTitle>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={clearStaleCache} disabled={clearing}>
            <RefreshCw className={`h-3 w-3 ${clearing ? "animate-spin" : ""}`} />
            {isAr ? "تنظيف" : "Clear Stale"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((m, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-muted/30">
              <m.icon className={`h-4 w-4 ${m.color}`} />
              <div>
                <p className="text-sm font-bold">{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          <Badge variant="outline" className="text-[9px]">{cacheStats.fresh} {isAr ? "محدثة" : "fresh"}</Badge>
          <Badge variant="outline" className="text-[9px]">{cacheStats.inactive} {isAr ? "غير نشطة" : "inactive"}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
