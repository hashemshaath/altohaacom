import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Activity, Ban, Eye, Clock, AlertTriangle, UserCheck, FileSearch } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { format, subDays } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--destructive))"];

export function AuditLiveStatsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["auditLiveStats"],
    queryFn: async () => {
      const [eventsRes, sessionsRes, blockedRes, actionsRes] = await Promise.all([
        supabase.from("security_events").select("id, event_type, severity, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("user_sessions").select("id, is_active, created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("ip_blocklist").select("id, is_active"),
        supabase.from("admin_actions").select("id, action_type, created_at").order("created_at", { ascending: false }).limit(500),
      ]);

      const events = eventsRes.data || [];
      const sessions = sessionsRes.data || [];
      const blocked = blockedRes.data || [];
      const actions = actionsRes.data || [];

      const totalEvents = events.length;
      const criticalEvents = events.filter(e => e.severity === "critical" || e.severity === "high").length;
      const activeSessions = sessions.filter(s => s.is_active).length;
      const blockedIPs = blocked.filter(b => b.is_active).length;

      // 14-day event trend
      const trend: Record<string, { events: number; actions: number }> = {};
      for (let i = 13; i >= 0; i--) {
        trend[format(subDays(new Date(), i), "MM/dd")] = { events: 0, actions: 0 };
      }
      events.forEach(e => {
        const d = format(new Date(e.created_at), "MM/dd");
        if (d in trend) trend[d].events++;
      });
      actions.forEach(a => {
        const d = format(new Date(a.created_at), "MM/dd");
        if (d in trend) trend[d].actions++;
      });
      const trendData = Object.entries(trend).map(([date, v]) => ({ date, ...v }));

      // Event type distribution
      const typeMap: Record<string, number> = {};
      events.forEach(e => { typeMap[e.event_type || "unknown"] = (typeMap[e.event_type || "unknown"] || 0) + 1; });
      const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

      // Admin action types
      const actionMap: Record<string, number> = {};
      actions.forEach(a => { actionMap[a.action_type] = (actionMap[a.action_type] || 0) + 1; });
      const topActions = Object.entries(actionMap).sort(([,a], [,b]) => b - a).slice(0, 3);

      return {
        totalEvents, criticalEvents, activeSessions, blockedIPs,
        totalActions: actions.length,
        trendData, typeData, topActions,
      };
    },
    refetchInterval: 60000,
  });

  if (!data) return null;

  const stats = [
    { label: isAr ? "أحداث أمنية" : "Security Events", value: data.totalEvents, icon: ShieldAlert, color: "text-primary" },
    { label: isAr ? "حرجة" : "Critical", value: data.criticalEvents, icon: AlertTriangle, color: "text-destructive" },
    { label: isAr ? "جلسات نشطة" : "Active Sessions", value: data.activeSessions, icon: Activity, color: "text-chart-2" },
    { label: isAr ? "IPs محظورة" : "Blocked IPs", value: data.blockedIPs, icon: Ban, color: "text-chart-4" },
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileSearch className="h-4 w-4 text-primary" />
          {isAr ? "إحصائيات الأمان والمراجعة المباشرة" : "Security & Audit Live Stats"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-3 text-center group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color} transition-transform duration-300 group-hover:scale-110`} />
              <div className="text-lg font-bold"><AnimatedCounter value={typeof s.value === "number" ? s.value : 0} /></div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "نشاط الأمان - 14 يوم" : "Security Activity - 14 Days"}
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={data.trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="events" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.15} name={isAr ? "أحداث" : "Events"} />
                <Area type="monotone" dataKey="actions" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} name={isAr ? "إجراءات إدارية" : "Admin Actions"} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "أنواع الأحداث" : "Event Types"}
            </p>
            {data.typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={data.typeData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 9 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 8 }} width={60} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                    {data.typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-xs text-muted-foreground">
                {isAr ? "لا توجد بيانات" : "No data"}
              </div>
            )}
          </div>
        </div>

        {/* Top Admin Actions */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {data.topActions.map(([action, count], i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-2 text-center">
              <Eye className="h-3 w-3 mx-auto mb-1 text-chart-3" />
              <div className="text-sm font-bold">{count}</div>
              <div className="text-[9px] text-muted-foreground truncate">{action}</div>
            </div>
          ))}
          {data.topActions.length === 0 && (
            <div className="col-span-3 bg-muted/50 rounded-xl p-2 text-center">
              <UserCheck className="h-3 w-3 mx-auto mb-1 text-chart-2" />
              <div className="text-sm font-bold">{data.totalActions}</div>
              <div className="text-[9px] text-muted-foreground">{isAr ? "إجراءات إدارية" : "Admin Actions"}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
