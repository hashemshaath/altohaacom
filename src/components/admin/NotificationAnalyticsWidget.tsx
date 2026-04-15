import { useIsAr } from "@/hooks/useIsAr";
import { CACHE } from "@/lib/queryConfig";
import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bell, Send, Eye, AlertCircle, TrendingUp, Zap } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export const NotificationAnalyticsWidget = memo(function NotificationAnalyticsWidget() {
  const isAr = useIsAr();

  const { data: stats } = useQuery({
    queryKey: ["notification-analytics-widget"],
    queryFn: async () => {
      const [totalRes, readRes, queuePending, queueFailed, recentNotifs] = await Promise.all([
        supabase.from("notifications").select("id", { count: "exact", head: true }),
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", true),
        supabase.from("notification_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("notification_queue").select("id", { count: "exact", head: true }).eq("status", "failed"),
        supabase.from("notifications").select("type, created_at").order("created_at", { ascending: false }).limit(200),
      ]);

      const byType: Record<string, number> = {};
      (recentNotifs.data || []).forEach((n) => { byType[n.type || "info"] = (byType[n.type || "info"] || 0) + 1; });

      const today = new Date().toISOString().split("T")[0];
      const todayCount = (recentNotifs.data || []).filter((n) => n.created_at?.startsWith(today)).length;

      return {
        total: totalRes.count || 0,
        read: readRes.count || 0,
        queuePending: queuePending.count || 0,
        queueFailed: queueFailed.count || 0,
        byType,
        todayCount,
      };
    },
    ...CACHE.short,
  });

  if (!stats) return null;

  const readRate = stats.total > 0 ? Math.round((stats.read / stats.total) * 100) : 0;

  const statItems = [
    { icon: Send, value: stats.total, label: isAr ? "المرسلة" : "Sent", color: "text-primary", bg: "bg-primary/10" },
    { icon: Eye, value: stats.read, label: isAr ? "مقروءة" : "Read", color: "text-chart-2", bg: "bg-chart-2/10" },
    { icon: Zap, value: stats.todayCount, label: isAr ? "اليوم" : "Today", color: "text-chart-3", bg: "bg-chart-3/10" },
    { icon: AlertCircle, value: stats.queueFailed, label: isAr ? "فاشلة" : "Failed", color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-4/10">
            <Bell className="h-4 w-4 text-chart-4" />
          </div>
          {isAr ? "تحليلات الإشعارات" : "Notification Insights"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {statItems.map((s) => (
            <div key={s.label} className="text-center p-2.5 rounded-xl border border-border/30 group transition-all duration-200 hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${s.bg} mx-auto mb-1.5 transition-transform duration-200 group-hover:scale-110`}>
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              </div>
              <p className="text-lg font-bold tabular-nums"><AnimatedCounter value={s.value} /></p>
              <p className="text-[12px] text-muted-foreground font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">{isAr ? "نسبة القراءة" : "Read Rate"}</span>
            <span className="font-semibold tabular-nums">{readRate}%</span>
          </div>
          <Progress value={readRate} className="h-1.5" />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            {isAr ? "حسب النوع" : "By Type"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stats.byType).slice(0, 6).map(([type, count]) => (
              <Badge key={type} variant="outline" className="text-[12px] capitalize font-medium">
                {type}: {count as number}
              </Badge>
            ))}
          </div>
        </div>

        {stats.queuePending > 0 && (
          <div className="p-2.5 rounded-xl bg-chart-4/10 border border-chart-4/20 text-xs text-chart-4 flex items-center gap-2 font-medium">
            <Zap className="h-3.5 w-3.5 shrink-0" />
            {isAr
              ? `${stats.queuePending} إشعار في انتظار الإرسال`
              : `${stats.queuePending} notifications pending delivery`}
          </div>
        )}

        {stats.queueFailed > 0 && (
          <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2 font-medium">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {isAr
              ? `${stats.queueFailed} إشعار فاشل — يحتاج إعادة محاولة`
              : `${stats.queueFailed} failed notifications — retry needed`}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
