import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, Shield, Users, Ban, Activity, Eye } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, subDays } from "date-fns";

export function SecurityInsightsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-security-insights"],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const twentyFourHoursAgo = subDays(new Date(), 1).toISOString();

      const [
        securityEventsRes,
        criticalEventsRes,
        activeSessionsRes,
        blockedIpsRes,
        rolesRes,
        recentEventsRes,
      ] = await Promise.all([
        supabase.from("security_events").select("id", { count: "exact", head: true }),
        supabase.from("security_events").select("id", { count: "exact", head: true }).eq("severity", "critical").gte("created_at", twentyFourHoursAgo),
        supabase.from("user_sessions").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("ip_blocklist").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("user_roles").select("role"),
        supabase.from("security_events").select("event_type, severity, created_at").gte("created_at", sevenDaysAgo).order("created_at", { ascending: false }).limit(200),
      ]);

      // Role distribution
      const roleMap: Record<string, number> = {};
      (rolesRes.data || []).forEach((r: any) => { roleMap[r.role] = (roleMap[r.role] || 0) + 1; });

      // Event type breakdown
      const eventTypeMap: Record<string, number> = {};
      const severityMap: Record<string, number> = {};
      const recentEvents = recentEventsRes.data || [];
      recentEvents.forEach((e: any) => {
        eventTypeMap[e.event_type] = (eventTypeMap[e.event_type] || 0) + 1;
        severityMap[e.severity || "info"] = (severityMap[e.severity || "info"] || 0) + 1;
      });

      // Daily event trend (7 days)
      const dailyTrend: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        dailyTrend[format(subDays(new Date(), i), "EEE")] = 0;
      }
      recentEvents.forEach((e: any) => {
        const key = format(new Date(e.created_at), "EEE");
        if (dailyTrend[key] !== undefined) dailyTrend[key]++;
      });
      const dailyData = Object.entries(dailyTrend).map(([day, count]) => ({ day, count }));

      // Top event types
      const topEvents = Object.entries(eventTypeMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type, count]) => ({ type, count }));

      return {
        totalEvents: securityEventsRes.count || 0,
        criticalEvents: criticalEventsRes.count || 0,
        activeSessions: activeSessionsRes.count || 0,
        blockedIps: blockedIpsRes.count || 0,
        roleMap,
        severityMap,
        dailyData,
        topEvents,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;
  }

  if (!data) return null;

  const kpis = [
    { icon: Activity, label: isAr ? "الأحداث" : "Events", value: data.totalEvents, color: "text-primary" },
    { icon: ShieldAlert, label: isAr ? "حرجة (24س)" : "Critical (24h)", value: data.criticalEvents, color: "text-destructive", urgent: data.criticalEvents > 0 },
    { icon: Eye, label: isAr ? "جلسات نشطة" : "Active Sessions", value: data.activeSessions, color: "text-chart-2" },
    { icon: Ban, label: isAr ? "IP محظورة" : "Blocked IPs", value: data.blockedIps, color: "text-chart-4" },
    { icon: Shield, label: isAr ? "الأدوار" : "Roles", value: Object.values(data.roleMap).reduce((a, b) => a + b, 0), color: "text-chart-5" },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          {isAr ? "تحليلات الأمان والصلاحيات" : "Security & Permissions Insights"}
        </CardTitle>
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
          {/* Daily Security Events */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {isAr ? "الأحداث الأمنية (7 أيام)" : "Security Events (7 days)"}
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Roles + Severity + Top Events */}
          <div className="space-y-3">
            {/* Role distribution */}
            <div>
              <p className="text-xs font-medium mb-1.5 text-muted-foreground">{isAr ? "توزيع الأدوار" : "Role Distribution"}</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.roleMap).map(([role, count]) => (
                  <Badge key={role} variant="secondary" className="text-[10px]">
                    {role}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Severity breakdown */}
            <div>
              <p className="text-xs font-medium mb-1.5 text-muted-foreground">{isAr ? "مستوى الخطورة" : "Severity (7d)"}</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(data.severityMap).map(([sev, count]) => {
                  const sevColor = sev === "critical" ? "border-destructive/30 text-destructive" : sev === "high" ? "border-chart-4/30 text-chart-4" : sev === "medium" ? "border-chart-2/30 text-chart-2" : "";
                  return (
                    <Badge key={sev} variant="outline" className={`text-[10px] ${sevColor}`}>
                      {sev}: {count as number}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Top event types */}
            {data.topEvents.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1.5 text-muted-foreground">{isAr ? "أكثر الأحداث" : "Top Events"}</p>
                <div className="space-y-1">
                  {data.topEvents.map((e: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/30">
                      <span className="truncate text-muted-foreground">{e.type.replace(/_/g, " ")}</span>
                      <Badge variant="outline" className="text-[9px]">{e.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
