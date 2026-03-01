import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ShieldAlert, Users, Monitor, Ban, AlertTriangle, Activity, Clock } from "lucide-react";
import { format, subDays } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export function SecurityLiveWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["security-live-widget"],
    queryFn: async () => {
      const [eventsRes, sessionsRes, blocklistRes, rolesRes] = await Promise.all([
        supabase.from("security_events").select("id, event_type, severity, created_at, ip_address").order("created_at", { ascending: false }).limit(500),
        supabase.from("user_sessions").select("id, is_active, device_info, last_active_at, created_at").limit(500),
        supabase.from("ip_blocklist").select("id, is_active, reason").limit(200),
        supabase.from("user_roles").select("role"),
      ]);

      const events = eventsRes.data || [];
      const sessions = sessionsRes.data || [];
      const blocklist = blocklistRes.data || [];
      const roles = rolesRes.data || [];

      // Event trend (7 days)
      const eventTrend: Record<string, { high: number; medium: number; low: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "MM/dd");
        eventTrend[d] = { high: 0, medium: 0, low: 0 };
      }
      events.forEach(e => {
        const d = format(new Date(e.created_at), "MM/dd");
        if (d in eventTrend) {
          const sev = e.severity || "low";
          if (sev === "high" || sev === "critical") eventTrend[d].high++;
          else if (sev === "medium") eventTrend[d].medium++;
          else eventTrend[d].low++;
        }
      });
      const trendData = Object.entries(eventTrend).map(([date, vals]) => ({ date, ...vals }));

      // Event types
      const typeDist: Record<string, number> = {};
      events.forEach(e => { typeDist[e.event_type] = (typeDist[e.event_type] || 0) + 1; });
      const topTypes = Object.entries(typeDist).sort(([, a], [, b]) => b - a).slice(0, 6);

      // Sessions
      const activeSessions = sessions.filter(s => s.is_active).length;
      const today = new Date().toISOString().split("T")[0];
      const todayEvents = events.filter(e => e.created_at.startsWith(today)).length;
      const criticalEvents = events.filter(e => e.severity === "high" || e.severity === "critical").length;

      // Blocked IPs
      const activeBlocks = blocklist.filter(b => b.is_active).length;

      // Role distribution
      const roleDist: Record<string, number> = {};
      roles.forEach(r => { roleDist[r.role] = (roleDist[r.role] || 0) + 1; });

      // Unique IPs with issues
      const suspiciousIps = new Set(events.filter(e => e.severity === "high" || e.severity === "critical").map(e => e.ip_address).filter(Boolean)).size;

      return {
        totalEvents: events.length, todayEvents, criticalEvents,
        activeSessions, totalSessions: sessions.length,
        activeBlocks, totalBlocks: blocklist.length,
        suspiciousIps, trendData, topTypes, roleDist,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  if (!data) return null;

  const kpis = [
    { icon: ShieldAlert, label: isAr ? "أحداث اليوم" : "Today's Events", value: data.todayEvents, color: "text-chart-4", sub: `${data.criticalEvents} ${isAr ? "حرجة" : "critical"}` },
    { icon: Monitor, label: isAr ? "جلسات نشطة" : "Active Sessions", value: data.activeSessions, color: "text-chart-2", sub: `/ ${data.totalSessions}` },
    { icon: Ban, label: isAr ? "IPs محظورة" : "Blocked IPs", value: data.activeBlocks, color: "text-destructive", sub: `${data.suspiciousIps} ${isAr ? "مشبوهة" : "suspicious"}` },
    { icon: Users, label: isAr ? "توزيع الأدوار" : "Role Distribution", value: Object.values(data.roleDist).reduce((a, b) => a + b, 0), color: "text-primary", sub: `${Object.keys(data.roleDist).length} ${isAr ? "أدوار" : "roles"}` },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi, i) => (
        <Card key={i} className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-xl bg-destructive/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold"><AnimatedCounter value={typeof kpi.value === "number" ? kpi.value : parseInt(kpi.value) || 0} /> <span className="text-xs font-normal text-muted-foreground">{kpi.sub}</span></p>
          </CardContent>
        </Card>
      ))}

      {/* Security Events Trend */}
      <Card className="md:col-span-2 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-chart-4" />
            {isAr ? "الأحداث الأمنية (7 أيام)" : "Security Events (7d)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="high" stackId="1" fill="hsl(var(--destructive))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="medium" stackId="1" fill="hsl(var(--chart-4))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="low" stackId="1" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Event Types */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {isAr ? "أنواع الأحداث" : "Event Types"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3 space-y-2">
          {data.topTypes.map(([type, count]) => (
            <div key={type} className="flex items-center justify-between text-xs">
              <span className="truncate max-w-[120px]">{type.replace(/_/g, " ")}</span>
              <Badge variant="secondary" className="text-[10px]">{count}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Role Distribution */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {isAr ? "توزيع الأدوار" : "Role Breakdown"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3 space-y-2">
          {Object.entries(data.roleDist).sort(([, a], [, b]) => b - a).map(([role, count]) => {
            const total = Object.values(data.roleDist).reduce((a, b) => a + b, 0);
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={role} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize">{role}</span>
                  <span className="text-muted-foreground">{count} ({pct}%)</span>
                </div>
                <Progress value={pct} className="h-1" />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
