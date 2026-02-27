import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, Bell, CheckCircle2, AlertCircle, Clock, Play, ArrowRight, MailOpen, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export function AutomationStatusWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-automation-status"],
    queryFn: async () => {
      const [
        runsRes,
        queuePendingRes,
        queueFailedRes,
        queueSentRes,
        notifRulesRes,
        triggersRes,
        recentRunsRes,
      ] = await Promise.all([
        supabase.from("automation_runs").select("id", { count: "exact", head: true }),
        supabase.from("notification_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("notification_queue").select("id", { count: "exact", head: true }).eq("status", "failed"),
        supabase.from("notification_queue").select("id", { count: "exact", head: true }).eq("status", "sent"),
        supabase.from("notification_rules").select("id, is_active"),
        supabase.from("lifecycle_triggers").select("id, is_active"),
        supabase.from("automation_runs").select("action, status, created_at, results").order("created_at", { ascending: false }).limit(5),
      ]);

      const rules = notifRulesRes.data || [];
      const triggers = triggersRes.data || [];
      const activeRules = rules.filter((r: any) => r.is_active).length;
      const activeTriggers = triggers.filter((t: any) => t.is_active).length;

      return {
        totalRuns: runsRes.count || 0,
        queuePending: queuePendingRes.count || 0,
        queueFailed: queueFailedRes.count || 0,
        queueSent: queueSentRes.count || 0,
        activeRules,
        totalRules: rules.length,
        activeTriggers,
        totalTriggers: triggers.length,
        recentRuns: recentRunsRes.data || [],
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;
  }

  if (!data) return null;

  const kpis = [
    { icon: Play, label: isAr ? "التشغيلات" : "Runs", value: data.totalRuns, color: "text-primary" },
    { icon: Clock, label: isAr ? "في الانتظار" : "Pending", value: data.queuePending, color: "text-chart-4", urgent: data.queuePending > 50 },
    { icon: CheckCircle2, label: isAr ? "تم الإرسال" : "Sent", value: data.queueSent, color: "text-chart-2" },
    { icon: AlertCircle, label: isAr ? "فشل" : "Failed", value: data.queueFailed, color: "text-destructive", urgent: data.queueFailed > 0 },
    { icon: Bell, label: isAr ? "قواعد نشطة" : "Active Rules", value: `${data.activeRules}/${data.totalRules}`, color: "text-chart-5" },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-chart-4" />
          {isAr ? "حالة الأتمتة والإشعارات" : "Automation & Notifications Status"}
        </CardTitle>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/marketing-automation" className="gap-1.5 text-xs">
              <Zap className="h-3 w-3" /> {isAr ? "الأتمتة" : "Automation"}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/notifications" className="gap-1.5 text-xs">
              <Bell className="h-3 w-3" /> {isAr ? "الإشعارات" : "Notifications"}
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI Row */}
        <div className="grid grid-cols-5 gap-2">
          {kpis.map((kpi, i) => (
            <div key={i} className={`text-center p-2 rounded-lg ${kpi.urgent ? "bg-destructive/5 ring-1 ring-destructive/20" : "bg-muted/40"}`}>
              <kpi.icon className={`h-4 w-4 mx-auto mb-1 ${kpi.color}`} />
              <p className="text-lg font-bold">{kpi.value}</p>
              <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Recent Runs */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {isAr ? "آخر التشغيلات" : "Recent Runs"}
            </p>
            <div className="space-y-1.5">
              {data.recentRuns.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">{isAr ? "لا يوجد سجل" : "No runs yet"}</p>
              ) : (
                data.recentRuns.map((run: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant={run.status === "completed" ? "default" : "destructive"} className="text-[9px] shrink-0">
                        {run.status === "completed" ? "✓" : "✗"}
                      </Badge>
                      <span className="truncate font-medium">{run.action}</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(run.created_at), { addSuffix: true, locale: isAr ? ar : enUS })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System Status */}
          <div className="space-y-3">
            {/* Triggers status */}
            <div>
              <p className="text-xs font-medium mb-1.5 text-muted-foreground">{isAr ? "المحفزات" : "Lifecycle Triggers"}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-chart-2 transition-all"
                    style={{ width: `${data.totalTriggers > 0 ? (data.activeTriggers / data.totalTriggers) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-chart-2">{data.activeTriggers}/{data.totalTriggers}</span>
              </div>
            </div>

            {/* Queue health */}
            <div>
              <p className="text-xs font-medium mb-1.5 text-muted-foreground">{isAr ? "صحة قائمة الإرسال" : "Queue Health"}</p>
              {(() => {
                const total = data.queuePending + data.queueFailed + data.queueSent;
                const successRate = total > 0 ? Math.round((data.queueSent / total) * 100) : 100;
                return (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${successRate > 90 ? "bg-chart-2" : successRate > 70 ? "bg-chart-4" : "bg-destructive"}`}
                        style={{ width: `${successRate}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold">{successRate}%</span>
                  </div>
                );
              })()}
            </div>

            {/* Quick alerts */}
            {data.queueFailed > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                <span className="text-[10px] text-destructive">
                  {isAr ? `${data.queueFailed} إشعار فشل في الإرسال` : `${data.queueFailed} notifications failed to send`}
                </span>
                <Button variant="ghost" size="sm" className="h-5 text-[9px] ms-auto px-1.5" asChild>
                  <Link to="/admin/notifications">{isAr ? "مراجعة" : "Review"} <ArrowRight className="h-2.5 w-2.5 ms-0.5" /></Link>
                </Button>
              </div>
            )}
            {data.queuePending > 50 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-chart-4/5 border border-chart-4/20">
                <Clock className="h-3.5 w-3.5 text-chart-4 shrink-0" />
                <span className="text-[10px] text-chart-4">
                  {isAr ? `${data.queuePending} إشعار في الانتظار` : `${data.queuePending} notifications pending`}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
