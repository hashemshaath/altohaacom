import { useState, useEffect, useMemo, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Zap, Database, Wifi, HardDrive, RefreshCw, Trash2,
  CheckCircle, AlertTriangle, Activity, Gauge, Globe, Clock
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface PerformanceMetrics {
  cacheSize: number;
  queriesCount: number;
  memoryUsage: number;
  connectionStatus: string;
  lastRefresh: string;
}

export default function PerformanceEnhancements() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cacheSize: 0, queriesCount: 0, memoryUsage: 0,
    connectionStatus: "online", lastRefresh: new Date().toISOString()
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("altoha_perf_settings");
    return saved ? JSON.parse(saved) : {
      prefetchEnabled: true,
      lazyImages: true,
      cacheEnabled: true,
      reducedMotion: false,
      offlineMode: false,
    };
  });

  // Update metrics
  useEffect(() => {
    const updateMetrics = () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();

      let size = 0;
      queries.forEach(q => {
        try { size += JSON.stringify(q.state.data || "").length; } catch {}
      });

      const memMB = (performance as any)?.memory?.usedJSHeapSize
        ? Math.round((performance as any).memory.usedJSHeapSize / 1048576)
        : 0;

      setMetrics({
        cacheSize: Math.round(size / 1024),
        queriesCount: queries.length,
        memoryUsage: memMB,
        connectionStatus: navigator.onLine ? "online" : "offline",
        lastRefresh: new Date().toISOString()
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 10000);
    return () => clearInterval(interval);
  }, [queryClient]);

  // Save settings
  useEffect(() => {
    localStorage.setItem("altoha_perf_settings", JSON.stringify(settings));
  }, [settings]);

  const clearCache = useCallback(() => {
    queryClient.clear();
    setMetrics(p => ({ ...p, cacheSize: 0, queriesCount: 0, lastRefresh: new Date().toISOString() }));
  }, [queryClient]);

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries();
    setMetrics(p => ({ ...p, lastRefresh: new Date().toISOString() }));
  }, [queryClient]);

  const clearLocalStorage = useCallback(() => {
    const keysToKeep = ["altoha-lang", "altoha_perf_settings"];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key) && key.startsWith("altoha_")) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  const healthScore = useMemo(() => {
    let score = 100;
    if (metrics.cacheSize > 5000) score -= 20;
    if (metrics.queriesCount > 50) score -= 15;
    if (metrics.memoryUsage > 200) score -= 25;
    if (metrics.connectionStatus !== "online") score -= 20;
    return Math.max(0, score);
  }, [metrics]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{isAr ? "الأداء والتحسينات" : "Performance & Optimizations"}</h2>
        <p className="text-sm text-muted-foreground">{isAr ? "مراقبة وتحسين أداء التطبيق" : "Monitor and optimize app performance"}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Health Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              {isAr ? "مؤشر الصحة" : "Health Score"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className={`text-5xl font-bold mb-2 ${getHealthColor(healthScore)}`}>{healthScore}</div>
            <Progress value={healthScore} className="mb-3" />
            <Badge variant={healthScore >= 80 ? "default" : healthScore >= 50 ? "secondary" : "destructive"}>
              {healthScore >= 80 ? (isAr ? "ممتاز" : "Excellent") :
                healthScore >= 50 ? (isAr ? "جيد" : "Good") : (isAr ? "يحتاج تحسين" : "Needs Improvement")}
            </Badge>
          </CardContent>
        </Card>

        {/* Cache Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              {isAr ? "ذاكرة التخزين المؤقت" : "Cache"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{isAr ? "الحجم" : "Size"}</span>
              <span className="font-medium">{metrics.cacheSize} KB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{isAr ? "الاستعلامات" : "Queries"}</span>
              <span className="font-medium">{metrics.queriesCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{isAr ? "الذاكرة" : "Memory"}</span>
              <span className="font-medium">{metrics.memoryUsage || "N/A"} MB</span>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={refreshAll}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                {isAr ? "تحديث" : "Refresh"}
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={clearCache}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {isAr ? "مسح" : "Clear"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              {isAr ? "حالة الاتصال" : "Connection"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${metrics.connectionStatus === "online" ? "bg-green-500" : "bg-red-500"} animate-pulse`} />
              <span className="font-medium capitalize">{metrics.connectionStatus}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{isAr ? "آخر تحديث" : "Last refresh"}</span>
              <span className="text-xs">{new Date(metrics.lastRefresh).toLocaleTimeString()}</span>
            </div>
            <Separator />
            <Button variant="outline" size="sm" className="w-full" onClick={clearLocalStorage}>
              <HardDrive className="h-3.5 w-3.5 mr-1" />
              {isAr ? "مسح البيانات المحلية" : "Clear Local Data"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {isAr ? "إعدادات الأداء" : "Performance Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "prefetchEnabled", labelEn: "Route Prefetching", labelAr: "التحميل المسبق للمسارات", descEn: "Preload routes on hover", descAr: "تحميل المسارات عند التحويم" },
            { key: "lazyImages", labelEn: "Lazy Load Images", labelAr: "تحميل الصور كسول", descEn: "Load images only when visible", descAr: "تحميل الصور عند الظهور فقط" },
            { key: "cacheEnabled", labelEn: "Data Caching", labelAr: "تخزين البيانات مؤقتاً", descEn: "Cache API responses", descAr: "تخزين استجابات API مؤقتاً" },
            { key: "reducedMotion", labelEn: "Reduce Animations", labelAr: "تقليل الحركات", descEn: "Minimize animations for performance", descAr: "تقليل الحركات لتحسين الأداء" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <Label className="text-sm">{isAr ? item.labelAr : item.labelEn}</Label>
                <p className="text-xs text-muted-foreground">{isAr ? item.descAr : item.descEn}</p>
              </div>
              <Switch
                checked={settings[item.key as keyof typeof settings] as boolean}
                onCheckedChange={v => setSettings((p: typeof settings) => ({ ...p, [item.key]: v }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {isAr ? "نصائح الأداء" : "Performance Tips"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { icon: CheckCircle, color: "text-green-500", textEn: "Code splitting enabled for all admin routes", textAr: "تقسيم الكود مفعّل لجميع مسارات الإدارة" },
              { icon: CheckCircle, color: "text-green-500", textEn: "TanStack Query caching active", textAr: "تخزين TanStack Query المؤقت نشط" },
              { icon: CheckCircle, color: "text-green-500", textEn: "Lazy loading for images enabled", textAr: "التحميل الكسول للصور مفعّل" },
              { icon: metrics.cacheSize > 3000 ? AlertTriangle : CheckCircle, color: metrics.cacheSize > 3000 ? "text-yellow-500" : "text-green-500", textEn: metrics.cacheSize > 3000 ? "Cache growing large - consider clearing" : "Cache size optimal", textAr: metrics.cacheSize > 3000 ? "حجم التخزين المؤقت كبير - يُنصح بالمسح" : "حجم التخزين المؤقت مثالي" },
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <tip.icon className={`h-4 w-4 shrink-0 ${tip.color}`} />
                <span>{isAr ? tip.textAr : tip.textEn}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
