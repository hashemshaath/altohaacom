import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bell, Send, Eye, AlertCircle, TrendingUp, Zap } from "lucide-react";

export function NotificationAnalyticsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: stats } = useQuery({
    queryKey: ["notification-analytics-widget"],
    queryFn: async () => {
      const [totalRes, readRes, queuePending, queueFailed, recentNotifs] = await Promise.all([
        supabase.from("notifications").select("*", { count: "exact", head: true }),
        supabase.from("notifications").select("*", { count: "exact", head: true }).eq("is_read", true),
        supabase.from("notification_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("notification_queue").select("*", { count: "exact", head: true }).eq("status", "failed"),
        supabase.from("notifications").select("type, created_at").order("created_at", { ascending: false }).limit(200),
      ]);

      // Type distribution
      const byType: Record<string, number> = {};
      (recentNotifs.data || []).forEach((n: any) => { byType[n.type || "info"] = (byType[n.type || "info"] || 0) + 1; });

      // Today's count
      const today = new Date().toISOString().split("T")[0];
      const todayCount = (recentNotifs.data || []).filter((n: any) => n.created_at?.startsWith(today)).length;

      return {
        total: totalRes.count || 0,
        read: readRes.count || 0,
        queuePending: queuePending.count || 0,
        queueFailed: queueFailed.count || 0,
        byType,
        todayCount,
      };
    },
    staleTime: 2 * 60 * 1000,
  });

  if (!stats) return null;

  const readRate = stats.total > 0 ? Math.round((stats.read / stats.total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-chart-4" />
          {isAr ? "تحليلات الإشعارات" : "Notification Insights"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Send, value: stats.total, label: isAr ? "المرسلة" : "Sent", color: "text-primary" },
            { icon: Eye, value: stats.read, label: isAr ? "مقروءة" : "Read", color: "text-chart-2" },
            { icon: Zap, value: stats.todayCount, label: isAr ? "اليوم" : "Today", color: "text-chart-3" },
            { icon: AlertCircle, value: stats.queueFailed, label: isAr ? "فاشلة" : "Failed", color: "text-destructive" },
          ].map((s) => (
            <div key={s.label} className="text-center p-2 rounded-lg bg-muted/50">
              <s.icon className={`h-3.5 w-3.5 mx-auto ${s.color} mb-1`} />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{isAr ? "نسبة القراءة" : "Read Rate"}</span>
            <span className="font-medium">{readRate}%</span>
          </div>
          <Progress value={readRate} className="h-1.5" />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {isAr ? "حسب النوع" : "By Type"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stats.byType).slice(0, 6).map(([type, count]) => (
              <Badge key={type} variant="outline" className="text-[10px] capitalize">
                {type}: {count as number}
              </Badge>
            ))}
          </div>
        </div>

        {stats.queuePending > 0 && (
          <div className="p-2 rounded-lg bg-chart-4/10 text-xs text-chart-4 flex items-center gap-1.5">
            <Zap className="h-3 w-3" />
            {isAr
              ? `${stats.queuePending} إشعار في الانتظار`
              : `${stats.queuePending} notifications pending delivery`}
          </div>
        )}

        {stats.queueFailed > 0 && (
          <div className="p-2 rounded-lg bg-destructive/10 text-xs text-destructive flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3" />
            {isAr
              ? `${stats.queueFailed} إشعار فاشل - يحتاج إعادة محاولة`
              : `${stats.queueFailed} failed notifications - retry needed`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
