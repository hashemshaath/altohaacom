import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Timer, CheckCircle2, Clock, TrendingDown, Zap, BarChart3 } from "lucide-react";
import { differenceInHours } from "date-fns";

export function TicketPerformanceWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: stats } = useQuery({
    queryKey: ["ticket-performance-widget"],
    queryFn: async () => {
      const { data: tickets, error } = await supabase
        .from("support_tickets")
        .select("id, status, priority, created_at, resolved_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;

      const all = tickets || [];
      const resolved = all.filter(t => t.status === "resolved" || t.status === "closed");
      const open = all.filter(t => t.status === "open" || t.status === "in_progress");

      // Avg resolution time
      const resolvedWithTime = resolved.filter(t => t.resolved_at);
      const avgHours = resolvedWithTime.length > 0
        ? Math.round(resolvedWithTime.reduce((sum, t) =>
            sum + differenceInHours(new Date(t.resolved_at!), new Date(t.created_at)), 0
          ) / resolvedWithTime.length)
        : 0;

      // Resolution rate
      const resolutionRate = all.length > 0 ? Math.round((resolved.length / all.length) * 100) : 0;

      // Priority breakdown
      const byPriority = { urgent: 0, high: 0, normal: 0, low: 0 };
      open.forEach(t => { byPriority[t.priority as keyof typeof byPriority] = (byPriority[t.priority as keyof typeof byPriority] || 0) + 1; });

      // SLA breach count
      const slaBreach = open.filter(t => {
        const thresholds: Record<string, number> = { urgent: 4, high: 8, normal: 24, low: 72 };
        return differenceInHours(new Date(), new Date(t.created_at)) >= (thresholds[t.priority] || 24);
      }).length;

      return { total: all.length, resolved: resolved.length, open: open.length, avgHours, resolutionRate, byPriority, slaBreach };
    },
    staleTime: 2 * 60 * 1000,
  });

  if (!stats) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-chart-3" />
          {isAr ? "أداء الدعم" : "Support Performance"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-xl bg-muted/50 group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
            <Clock className="h-3.5 w-3.5 mx-auto text-chart-4 mb-1 transition-transform duration-300 group-hover:scale-110" />
            <p className="text-lg font-bold">{stats.avgHours}<span className="text-xs">h</span></p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "متوسط الحل" : "Avg Resolve"}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-muted/50 group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
            <CheckCircle2 className="h-3.5 w-3.5 mx-auto text-chart-2 mb-1 transition-transform duration-300 group-hover:scale-110" />
            <p className="text-lg font-bold">{stats.resolutionRate}%</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "نسبة الحل" : "Resolve Rate"}</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-muted/50 group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
            <Timer className="h-3.5 w-3.5 mx-auto text-destructive mb-1 transition-transform duration-300 group-hover:scale-110" />
            <p className="text-lg font-bold">{stats.slaBreach}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "تجاوز SLA" : "SLA Breach"}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{isAr ? "معدل الحل" : "Resolution Rate"}</span>
            <span className="font-medium">{stats.resolved} / {stats.total}</span>
          </div>
          <Progress value={stats.resolutionRate} className="h-1.5" />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {isAr ? "التذاكر المفتوحة حسب الأولوية" : "Open by Priority"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {stats.byPriority.urgent > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                🔴 {isAr ? "عاجل" : "Urgent"}: {stats.byPriority.urgent}
              </Badge>
            )}
            {stats.byPriority.high > 0 && (
              <Badge className="bg-chart-4/15 text-chart-4 text-[10px]" variant="outline">
                🟠 {isAr ? "مرتفع" : "High"}: {stats.byPriority.high}
              </Badge>
            )}
            {stats.byPriority.normal > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {isAr ? "عادي" : "Normal"}: {stats.byPriority.normal}
              </Badge>
            )}
            {stats.byPriority.low > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {isAr ? "منخفض" : "Low"}: {stats.byPriority.low}
              </Badge>
            )}
          </div>
        </div>

        {stats.slaBreach > 0 && (
          <div className="p-2 rounded-lg bg-destructive/10 text-xs text-destructive flex items-center gap-1.5">
            <TrendingDown className="h-3 w-3" />
            {isAr
              ? `${stats.slaBreach} تذكرة تجاوزت وقت الاستجابة المحدد`
              : `${stats.slaBreach} tickets exceeded SLA response time`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
