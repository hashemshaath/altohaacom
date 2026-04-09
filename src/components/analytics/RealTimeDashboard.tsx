import { useState, useEffect, useCallback, memo, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, MessageSquare, Award, Activity, Wifi, WifiOff } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";

interface LiveMetric {
  label: string;
  labelAr: string;
  value: number;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  history: number[];
}

export const RealTimeDashboard = memo(function RealTimeDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [metrics, setMetrics] = useState<LiveMetric[]>([
    { label: "Active Users (5m)", labelAr: "مستخدمين نشطين (5د)", value: 0, icon: Users, color: "primary", borderColor: "border-s-primary", history: [] },
    { label: "New Signups", labelAr: "تسجيلات جديدة", value: 0, icon: Activity, color: "chart-2", borderColor: "border-s-chart-2", history: [] },
    { label: "Messages", labelAr: "الرسائل", value: 0, icon: MessageSquare, color: "chart-3", borderColor: "border-s-chart-3", history: [] },
    { label: "Competitions", labelAr: "المسابقات", value: 0, icon: Trophy, color: "chart-4", borderColor: "border-s-chart-4", history: [] },
    { label: "Certificates", labelAr: "الشهادات", value: 0, icon: Award, color: "chart-5", borderColor: "border-s-chart-5", history: [] },
  ]);

  const fetchCounts = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const [
      { count: activeUsers },
      { count: todaySignups },
      { count: todayMessages },
      { count: todayComps },
      { count: todayCerts },
    ] = await Promise.all([
      // Real active users: distinct sessions in ad_user_behaviors in last 5 minutes
      supabase.from("ad_user_behaviors").select("session_id", { count: "exact", head: true }).gte("created_at", fiveMinAgo),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
      supabase.from("messages").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
      supabase.from("competitions").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
      supabase.from("certificates").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
    ]);

    const values = [activeUsers || 0, todaySignups || 0, todayMessages || 0, todayComps || 0, todayCerts || 0];

    setMetrics(prev => prev.map((m, i) => ({
      ...m,
      value: values[i],
      history: [...m.history, values[i]].slice(-20),
    })));
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchCounts();

    // Visibility-aware polling: pause when tab is hidden
    let refreshInterval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (refreshInterval) clearInterval(refreshInterval);
      refreshInterval = setInterval(() => {
        if (!cancelled) fetchCounts();
      }, 30000);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (refreshInterval) { clearInterval(refreshInterval); refreshInterval = null; }
      } else {
        if (!cancelled) fetchCounts();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);

    const channel = supabase
      .channel("realtime-analytics")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => {
        setMetrics(prev => prev.map((m, i) =>
          i === 1 ? { ...m, value: m.value + 1, history: [...m.history, m.value + 1].slice(-20) } : m
        ));
        setLastUpdate(new Date());
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        setMetrics(prev => prev.map((m, i) =>
          i === 2 ? { ...m, value: m.value + 1, history: [...m.history, m.value + 1].slice(-20) } : m
        ));
        setLastUpdate(new Date());
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "competitions" }, () => {
        setMetrics(prev => prev.map((m, i) =>
          i === 3 ? { ...m, value: m.value + 1, history: [...m.history, m.value + 1].slice(-20) } : m
        ));
        setLastUpdate(new Date());
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "certificates" }, () => {
        setMetrics(prev => prev.map((m, i) =>
          i === 4 ? { ...m, value: m.value + 1, history: [...m.history, m.value + 1].slice(-20) } : m
        ));
        setLastUpdate(new Date());
      })
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      supabase.removeChannel(channel);
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [fetchCounts]);

  const timeSince = () => {
    const secs = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    if (secs < 5) return isAr ? "الآن" : "just now";
    if (secs < 60) return isAr ? `منذ ${secs} ثانية` : `${secs}s ago`;
    return isAr ? `منذ ${Math.floor(secs / 60)} دقيقة` : `${Math.floor(secs / 60)}m ago`;
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-chart-2" />
          ) : (
            <WifiOff className="h-4 w-4 text-destructive" />
          )}
          {isAr ? "البيانات المباشرة" : "Live Data"}
        </h3>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-chart-2 animate-pulse" : "bg-destructive"}`} />
          <span className="text-[12px] text-muted-foreground">{timeSince()}</span>
        </div>
      </div>

      {/* Live Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => {
          const sparkData = metric.history.map(v => ({ v }));
          return (
            <Card key={metric.label} className={`border-s-[3px] ${metric.borderColor} overflow-hidden`}>
              <CardContent className="pt-4 pb-3 relative">
                {/* Mini sparkline background */}
                {sparkData.length > 1 && (
                  <div className="absolute inset-0 opacity-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke={`hsl(var(--${metric.color}))`}
                          fill={`hsl(var(--${metric.color}))`}
                          fillOpacity={0.3}
                          strokeWidth={1}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <metric.icon className={`h-4 w-4 text-${metric.color}`} />
                    <Badge variant="outline" className="text-[12px] px-1 py-0">
                      {isAr ? "مباشر" : "LIVE"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-2xl font-bold tabular-nums">{metric.value}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {isAr ? metric.labelAr : metric.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
});
