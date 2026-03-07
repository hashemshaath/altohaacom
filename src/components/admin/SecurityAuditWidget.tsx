import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ShieldAlert, ShieldCheck, Monitor, Ban, Activity, AlertTriangle } from "lucide-react";
import { subDays, format } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export function SecurityAuditWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-security-audit-widget"],
    queryFn: async () => {
      const now = new Date();
      const sevenDaysAgo = subDays(now, 7).toISOString();

      const [events, sessions, blockedIPs] = await Promise.all([
        supabase.from("security_events").select("id, event_type, severity, created_at").gte("created_at", sevenDaysAgo).order("created_at", { ascending: false }),
        supabase.from("user_sessions").select("id, is_active, last_active_at").eq("is_active", true),
        supabase.from("ip_blocklist").select("id, is_active").eq("is_active", true),
      ]);

      const allEvents = events.data || [];
      const activeSessions = sessions.data?.length || 0;
      const blockedCount = blockedIPs.data?.length || 0;

      // Severity breakdown
      const severityMap: Record<string, number> = {};
      allEvents.forEach(e => { severityMap[e.severity || "info"] = (severityMap[e.severity || "info"] || 0) + 1; });

      // Event type breakdown
      const typeMap: Record<string, number> = {};
      allEvents.forEach(e => { typeMap[e.event_type] = (typeMap[e.event_type] || 0) + 1; });
      const topEventTypes = Object.entries(typeMap).sort((a, b) => b[1] - a[1]).slice(0, 6);

      // Daily events (7 days)
      const dailyMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        dailyMap[format(subDays(now, i), "EEE")] = 0;
      }
      allEvents.forEach(e => {
        const d = format(new Date(e.created_at), "EEE");
        if (dailyMap[d] !== undefined) dailyMap[d]++;
      });
      const dailyEvents = Object.entries(dailyMap).map(([day, count]) => ({ day, count }));

      const criticalCount = (severityMap["critical"] || 0) + (severityMap["high"] || 0);

      return {
        totalEvents: allEvents.length,
        criticalCount,
        activeSessions,
        blockedCount,
        severityMap,
        topEventTypes,
        dailyEvents,
      };
    },
    refetchInterval: useVisibleRefetchInterval(60000),
  });

  if (isLoading) return <Skeleton className="h-52 w-full rounded-xl" />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: Activity, label: isAr ? "أحداث (7 أيام)" : "Events (7d)", value: data.totalEvents, color: "text-primary", bg: "bg-primary/10" },
          { icon: AlertTriangle, label: isAr ? "حرجة" : "Critical", value: data.criticalCount, color: data.criticalCount > 0 ? "text-destructive" : "text-chart-5", bg: data.criticalCount > 0 ? "bg-destructive/10" : "bg-chart-5/10" },
          { icon: Monitor, label: isAr ? "جلسات نشطة" : "Active Sessions", value: data.activeSessions, color: "text-chart-3", bg: "bg-chart-3/10" },
          { icon: Ban, label: isAr ? "IPs محظورة" : "Blocked IPs", value: data.blockedCount, color: "text-chart-4", bg: "bg-chart-4/10" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-3 p-3">
              <div className={`rounded-full p-2 ${kpi.bg}`}><kpi.icon className={`h-4 w-4 ${kpi.color}`} /></div>
              <div>
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                <p className="text-lg font-bold"><AnimatedCounter value={kpi.value} /></p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Daily Events Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              {isAr ? "الأحداث الأمنية اليومية" : "Daily Security Events"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.dailyEvents}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={28} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name={isAr ? "أحداث" : "Events"} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right side */}
        <div className="space-y-4">
          {/* Severity Breakdown */}
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> {isAr ? "مستوى الخطورة" : "Severity"}
              </p>
              <div className="space-y-1.5">
                {["critical", "high", "medium", "low", "info"].map(level => {
                  const count = data.severityMap[level] || 0;
                  const pct = data.totalEvents > 0 ? Math.round((count / data.totalEvents) * 100) : 0;
                  return (
                    <div key={level} className="space-y-0.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="capitalize">{level}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <Progress value={pct} className="h-1" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Event Types */}
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">{isAr ? "أنواع الأحداث" : "Event Types"}</p>
              <div className="space-y-1">
                {data.topEventTypes.map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-[10px]">
                    <span className="capitalize truncate max-w-[120px]">{type.replace(/_/g, " ")}</span>
                    <Badge variant="outline" className="text-[9px] h-4">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
