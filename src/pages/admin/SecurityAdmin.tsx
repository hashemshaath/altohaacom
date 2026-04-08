import { useState, lazy, Suspense, memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ActivityPulse } from "@/components/ui/activity-pulse";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { translateRole } from "@/lib/chartConfig";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import {
  ShieldAlert, ShieldCheck, Shield, Activity, Ban, Monitor,
  Search, RefreshCw, Loader2, AlertTriangle, Eye, Clock, Users,
  Lock, Unlock, Globe, Smartphone, Key, CheckCircle, Wifi, WifiOff,
  FileSearch, ChevronRight,
} from "lucide-react";
import { format, subDays, subHours, formatDistanceToNow } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const CHART_COLORS = [
  "hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--destructive))", "hsl(var(--chart-5))",
];

const EVENT_TYPE_ICONS: Record<string, any> = {
  login_success: ShieldCheck, login_failed: ShieldAlert, password_changed: Lock,
  role_changed: Users, permission_override: Unlock, suspicious_activity: AlertTriangle,
  account_locked: Ban, session_revoked: Monitor, ip_blocked: Globe,
};

const TabSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
    <Skeleton className="h-64 rounded-xl" />
  </div>
);

// ── KPI Strip ────────────────────────────────────────────
const SecurityKPIStrip = memo(function SecurityKPIStrip() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["security-kpi-strip"],
    queryFn: async () => {
      const last24h = subHours(new Date(), 24).toISOString();
      const last7d = subDays(new Date(), 7).toISOString();
      const [events24h, critical7d, activeSessions, blockedIPs, suspendedUsers, roleAssignments] = await Promise.all([
        supabase.from("security_events").select("id", { count: "exact", head: true }).gte("created_at", last24h),
        supabase.from("security_events").select("id", { count: "exact", head: true }).gte("created_at", last7d).in("severity", ["high", "critical"]),
        supabase.from("user_sessions").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("ip_blocklist").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "suspended"),
        supabase.from("user_roles").select("id", { count: "exact", head: true }),
      ]);
      return {
        events24h: events24h.count || 0,
        critical7d: critical7d.count || 0,
        activeSessions: activeSessions.count || 0,
        blockedIPs: blockedIPs.count || 0,
        suspendedUsers: suspendedUsers.count || 0,
        roleAssignments: roleAssignments.count || 0,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  const items = [
    { icon: Activity, label: isAr ? "أحداث 24س" : "Events 24h", value: data?.events24h, color: "text-primary", bg: "bg-primary/10", accent: "bg-primary" },
    { icon: AlertTriangle, label: isAr ? "حرجة 7 أيام" : "Critical 7d", value: data?.critical7d, color: "text-destructive", bg: "bg-destructive/10", accent: "bg-destructive" },
    { icon: Monitor, label: isAr ? "جلسات نشطة" : "Active Sessions", value: data?.activeSessions, color: "text-chart-2", bg: "bg-chart-2/10", accent: "bg-chart-2" },
    { icon: Ban, label: isAr ? "IPs محظورة" : "Blocked IPs", value: data?.blockedIPs, color: "text-chart-4", bg: "bg-chart-4/10", accent: "bg-chart-4" },
    { icon: Lock, label: isAr ? "معلقين" : "Suspended", value: data?.suspendedUsers, color: "text-chart-5", bg: "bg-chart-5/10", accent: "bg-chart-5" },
    { icon: Users, label: isAr ? "تعيين أدوار" : "Roles", value: data?.roleAssignments, color: "text-chart-3", bg: "bg-chart-3/10", accent: "bg-chart-3" },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
      {items.map((item) => (
        <Card key={item.label} className="group relative overflow-hidden border-border/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-border/60 rounded-2xl">
          <div className={cn("absolute inset-x-0 top-0 h-1 rounded-t-2xl transition-all duration-300 group-hover:h-1.5", item.accent)} />
          <CardContent className="p-3.5 pt-4 flex items-center gap-3">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", item.bg)}>
              <item.icon className={cn("h-4.5 w-4.5", item.color)} />
            </div>
            <div className="min-w-0">
              {isLoading ? <Skeleton className="h-6 w-10 rounded-xl" /> : (
                <AnimatedCounter value={item.value || 0} className="text-lg font-black leading-none tracking-tight" />
              )}
              <p className="text-[12px] text-muted-foreground truncate mt-0.5">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

// ── Events Tab ───────────────────────────────────────────
const EventsTab = memo(function EventsTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [filter, setFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["security-events-tab"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("security-audit", { body: { action: "get_dashboard" } });
      if (error) throw error;
      return {
        events: (data?.recent_events || []) as any[],
        typeBreakdown: (data?.type_breakdown || {}) as Record<string, number>,
        stats: data?.stats || { events_24h: 0, critical_7d: 0, active_sessions: 0, blocked_ips: 0 },
      };
    },
  });

  const filteredEvents = useMemo(() => {
    if (!data?.events) return [];
    return data.events.filter((e: any) => {
      if (severityFilter !== "all" && e.severity !== severityFilter) return false;
      if (filter) {
        const q = filter.toLowerCase();
        return e.event_type?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || e.ip_address?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [data?.events, filter, severityFilter]);

  const topEventTypes = useMemo(() =>
    Object.entries(data?.typeBreakdown || {}).sort(([, a], [, b]) => b - a).slice(0, 8),
    [data?.typeBreakdown]
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder={isAr ? "بحث في الأحداث..." : "Search events..."} value={filter} onChange={(e) => setFilter(e.target.value)} className="ps-9 h-9" />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
            <SelectItem value="info">{isAr ? "معلومات" : "Info"}</SelectItem>
            <SelectItem value="warning">{isAr ? "تحذير" : "Warning"}</SelectItem>
            <SelectItem value="critical">{isAr ? "حرج" : "Critical"}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="h-9">
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Events List */}
        <div className="lg:col-span-2 space-y-2">
          {isLoading ? <TabSkeleton /> : filteredEvents.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">
              <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-chart-2" />
              {isAr ? "لا توجد أحداث أمنية" : "No security events found"}
            </CardContent></Card>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2 pe-2">
                {filteredEvents.map((event: any) => {
                  const Icon = EVENT_TYPE_ICONS[event.event_type] || Shield;
                  const isCritical = event.severity === "critical" || event.severity === "high";
                  return (
                    <Card key={event.id} className="border-border/40 transition-all hover:shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl shrink-0", isCritical ? "bg-destructive/10" : event.severity === "warning" ? "bg-chart-4/10" : "bg-muted/60")}>
                            <Icon className={cn("h-4 w-4", isCritical ? "text-destructive" : event.severity === "warning" ? "text-chart-4" : "text-muted-foreground")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{event.event_type?.replace(/_/g, " ")}</span>
                              <Badge className={cn("text-[11px] border-0", isCritical ? "bg-destructive/10 text-destructive" : event.severity === "warning" ? "bg-chart-4/10 text-chart-4" : "bg-primary/10 text-primary")}>{event.severity}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{isAr ? event.description_ar || event.description : event.description}</p>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(event.created_at).toLocaleString(isAr ? "ar" : "en")}</span>
                              {event.ip_address && <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {event.ip_address}</span>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Sidebar: Type Breakdown */}
        <Card className="border-border/40 h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              {isAr ? "توزيع الأحداث (7 أيام)" : "Event Breakdown (7d)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topEventTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{isAr ? "لا توجد بيانات" : "No data"}</p>
            ) : topEventTypes.map(([type, count]) => {
              const maxCount = topEventTypes[0]?.[1] || 1;
              const Icon = EVENT_TYPE_ICONS[type] || Shield;
              return (
                <div key={type} className="flex items-center gap-3">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs capitalize">{type.replace(/_/g, " ")}</span>
                      <Badge variant="outline" className="text-[11px]">{count}</Badge>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

// ── Sessions Tab ─────────────────────────────────────────
const SessionsTab = memo(function SessionsTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["security-sessions-full"],
    queryFn: async () => {
      const [sessionsRes, blockedRes] = await Promise.all([
        supabase.from("user_sessions").select("id, user_id, device_info, ip_address, is_active, created_at, last_active_at").order("last_active_at", { ascending: false }).limit(100),
        supabase.from("ip_blocklist").select("id, ip_address, reason, is_active, created_at").eq("is_active", true),
      ]);
      const sessions = sessionsRes.data || [];
      const blocked = blockedRes.data || [];
      const activeSessions = sessions.filter(s => s.is_active);
      const uniqueIPs = new Set(activeSessions.map(s => s.ip_address)).size;

      const deviceMap: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
      activeSessions.forEach(s => {
        const info = (typeof s.device_info === "string" ? s.device_info : "").toLowerCase();
        if (info.includes("mobile") || info.includes("phone")) deviceMap.mobile++;
        else if (info.includes("tablet") || info.includes("ipad")) deviceMap.tablet++;
        else if (info.includes("desktop") || info.includes("windows") || info.includes("mac")) deviceMap.desktop++;
        else deviceMap.unknown++;
      });

      const deviceData = Object.entries(deviceMap).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

      return { activeSessions, uniqueIPs, blockedCount: blocked.length, blocked, deviceMap, deviceData };
    },
    staleTime: 1000 * 60,
  });

  if (isLoading) return <TabSkeleton />;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Sessions Table */}
      <Card className="lg:col-span-2 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Monitor className="h-4 w-4 text-chart-2" />
            {isAr ? "الجلسات النشطة" : "Active Sessions"} ({data?.activeSessions.length || 0})
            <Badge variant="default" className="ms-auto animate-pulse text-[11px]"><Wifi className="h-2.5 w-2.5 me-1" />{isAr ? "مباشر" : "Live"}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!data?.activeSessions.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">{isAr ? "لا توجد جلسات نشطة" : "No active sessions"}</p>
          ) : (
            <ScrollArea className="max-h-[450px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{isAr ? "المستخدم" : "User"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "الجهاز" : "Device"}</TableHead>
                    <TableHead className="text-xs">IP</TableHead>
                    <TableHead className="text-xs">{isAr ? "آخر نشاط" : "Last Active"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.activeSessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs font-mono truncate max-w-[120px]">{s.user_id?.substring(0, 8)}...</TableCell>
                      <TableCell><div className="flex items-center gap-1"><Smartphone className="h-3 w-3 text-muted-foreground" /><span className="text-xs truncate max-w-[150px]">{typeof s.device_info === "string" ? s.device_info : "Unknown"}</span></div></TableCell>
                      <TableCell className="text-xs font-mono">{s.ip_address || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{s.last_active_at ? format(new Date(s.last_active_at), "MMM d, HH:mm") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Device Breakdown Pie */}
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "توزيع الأجهزة" : "Device Breakdown"}</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.deviceData && data.deviceData.length > 0 ? (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.deviceData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" nameKey="name">
                      {data.deviceData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">{isAr ? "لا توجد بيانات" : "No data"}</p>
            )}
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              {data?.deviceData?.map((d, i) => (
                <span key={d.name} className="text-[11px] flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-border/40">
          <CardContent className="p-4 space-y-3">
            {[
              { icon: Globe, label: isAr ? "عناوين IP فريدة" : "Unique IPs", value: data?.uniqueIPs || 0, color: "text-primary" },
              { icon: WifiOff, label: isAr ? "IPs محظورة" : "Blocked IPs", value: data?.blockedCount || 0, color: "text-destructive" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 p-2 rounded-xl bg-muted/30">
                <s.icon className={cn("h-4 w-4", s.color)} />
                <div>
                  <p className="text-sm font-bold">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

// ── Permissions Tab ──────────────────────────────────────
const PermissionsTab = memo(function PermissionsTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["security-permissions-full"],
    queryFn: async () => {
      const [rolesRes, permRes, overrideRes] = await Promise.all([
        supabase.from("user_roles").select("role").limit(1000),
        supabase.from("role_permissions").select("role, permission_id").limit(1000),
        supabase.from("user_permission_overrides").select("id, user_id, permission_id, granted, reason, expires_at").limit(50),
      ]);

      const roleCounts: Record<string, number> = {};
      rolesRes.data?.forEach(r => { roleCounts[r.role] = (roleCounts[r.role] || 0) + 1; });

      const permPerRole: Record<string, number> = {};
      permRes.data?.forEach(p => { permPerRole[p.role] = (permPerRole[p.role] || 0) + 1; });

      const grantedOverrides = overrideRes.data?.filter(o => o.granted).length || 0;
      const revokedOverrides = (overrideRes.data?.length || 0) - grantedOverrides;

      const roleData = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

      return { roleCounts, permPerRole, roleData, overrides: overrideRes.data || [], grantedOverrides, revokedOverrides, totalRoles: rolesRes.data?.length || 0 };
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) return <TabSkeleton />;

  const maxRole = Math.max(...Object.values(data?.roleCounts || {}), 1);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Role Distribution */}
      <Card className="lg:col-span-2 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            {isAr ? "توزيع الأدوار" : "Role Distribution"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Bar Chart */}
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.roleData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name={isAr ? "المستخدمين" : "Users"}>
                    {data?.roleData?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Progress Bars */}
            <div className="space-y-2">
              {Object.entries(data?.roleCounts || {}).sort((a, b) => b[1] - a[1]).map(([role, count]) => (
                <div key={role} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{translateRole(role, isAr)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{count}</span>
                      {data?.permPerRole?.[role] && <Badge variant="outline" className="text-[11px] px-1">{data.permPerRole[role]} {isAr ? "صلاحية" : "perms"}</Badge>}
                    </div>
                  </div>
                  <Progress value={(count / maxRole) * 100} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overrides */}
      <Card className="border-border/40 h-fit">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Key className="h-4 w-4 text-chart-4" />
            {isAr ? "استثناءات الصلاحيات" : "Permission Overrides"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-chart-2"><CheckCircle className="h-3.5 w-3.5" /> {data?.grantedOverrides} {isAr ? "ممنوحة" : "granted"}</span>
            <span className="flex items-center gap-1 text-destructive"><AlertTriangle className="h-3.5 w-3.5" /> {data?.revokedOverrides} {isAr ? "مسحوبة" : "revoked"}</span>
          </div>
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2">
              {data?.overrides.map(o => (
                <div key={o.id} className="p-2 rounded-xl bg-muted/30 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-[11px] border-0", o.granted ? "bg-chart-2/10 text-chart-2" : "bg-destructive/10 text-destructive")}>
                      {o.granted ? (isAr ? "ممنوحة" : "Granted") : (isAr ? "مسحوبة" : "Revoked")}
                    </Badge>
                    <span className="font-mono truncate">{o.user_id?.substring(0, 8)}...</span>
                  </div>
                  {o.reason && <p className="text-muted-foreground truncate">{o.reason}</p>}
                </div>
              ))}
              {!data?.overrides.length && (
                <p className="text-xs text-muted-foreground text-center py-4">{isAr ? "لا توجد استثناءات" : "No overrides"}</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
});

// ── Analytics Tab ────────────────────────────────────────
const AnalyticsTab = memo(function AnalyticsTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["security-analytics-full"],
    queryFn: async () => {
      const [eventsRes, actionsRes, sessionsRes] = await Promise.all([
        supabase.from("security_events").select("id, event_type, severity, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("admin_actions").select("id, action_type, created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("user_sessions").select("id, is_active, created_at").limit(200),
      ]);
      const events = eventsRes.data || [];
      const actions = actionsRes.data || [];

      // 14-day trend
      const trend: Record<string, { events: number; actions: number }> = {};
      for (let i = 13; i >= 0; i--) trend[format(subDays(new Date(), i), "MM/dd")] = { events: 0, actions: 0 };
      events.forEach(e => { const d = format(new Date(e.created_at), "MM/dd"); if (d in trend) trend[d].events++; });
      actions.forEach(a => { const d = format(new Date(a.created_at), "MM/dd"); if (d in trend) trend[d].actions++; });
      const trendData = Object.entries(trend).map(([date, v]) => ({ date, ...v }));

      // Severity donut
      const severityMap: Record<string, number> = {};
      events.forEach(e => { severityMap[e.severity || "info"] = (severityMap[e.severity || "info"] || 0) + 1; });
      const severityData = Object.entries(severityMap).map(([name, value]) => ({ name, value }));

      // 7-day stacked by severity
      const stackTrend: Record<string, { critical: number; warning: number; info: number }> = {};
      for (let i = 6; i >= 0; i--) stackTrend[format(subDays(new Date(), i), "MM/dd")] = { critical: 0, warning: 0, info: 0 };
      events.forEach(e => {
        const d = format(new Date(e.created_at), "MM/dd");
        if (d in stackTrend) {
          if (e.severity === "critical" || e.severity === "high") stackTrend[d].critical++;
          else if (e.severity === "warning" || e.severity === "medium") stackTrend[d].warning++;
          else stackTrend[d].info++;
        }
      });
      const stackData = Object.entries(stackTrend).map(([date, v]) => ({ date, ...v }));

      // Top admin actions
      const actionMap: Record<string, number> = {};
      actions.forEach(a => { actionMap[a.action_type] = (actionMap[a.action_type] || 0) + 1; });
      const topActions = Object.entries(actionMap).sort(([, a], [, b]) => b - a).slice(0, 6).map(([name, value]) => ({ name, value }));

      return { trendData, severityData, stackData, topActions, totalEvents: events.length, totalActions: actions.length };
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) return <TabSkeleton />;

  const SEVERITY_COLORS: Record<string, string> = {
    critical: "hsl(var(--destructive))", high: "hsl(var(--destructive))",
    warning: "hsl(var(--chart-4))", medium: "hsl(var(--chart-4))",
    info: "hsl(var(--primary))", low: "hsl(var(--chart-2))",
  };

  return (
    <div className="space-y-4">
      {/* Activity Trend (14d) */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            {isAr ? "نشاط الأمان والإدارة - 14 يوم" : "Security & Admin Activity (14d)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Area type="monotone" dataKey="events" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.12} name={isAr ? "أحداث أمنية" : "Security Events"} />
                <Area type="monotone" dataKey="actions" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.12} name={isAr ? "إجراءات إدارية" : "Admin Actions"} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Severity Stacked Bar */}
        <Card className="lg:col-span-2 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              {isAr ? "الأحداث حسب الخطورة (7 أيام)" : "Events by Severity (7d)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.stackData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="critical" stackId="1" fill="hsl(var(--destructive))" radius={[0, 0, 0, 0]} name={isAr ? "حرجة" : "Critical"} />
                  <Bar dataKey="warning" stackId="1" fill="hsl(var(--chart-4))" radius={[0, 0, 0, 0]} name={isAr ? "تحذير" : "Warning"} />
                  <Bar dataKey="info" stackId="1" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name={isAr ? "معلومات" : "Info"} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Severity Donut */}
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isAr ? "توزيع الخطورة" : "Severity Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.severityData && data.severityData.length > 0 ? (
              <>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.severityData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" nameKey="name">
                        {data.severityData.map((entry, i) => <Cell key={i} fill={SEVERITY_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {data.severityData.map((d, i) => (
                    <span key={d.name} className="text-[11px] flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[d.name] || CHART_COLORS[i] }} />
                      {d.name} ({d.value})
                    </span>
                  ))}
                </div>
              </>
            ) : <p className="text-xs text-muted-foreground text-center py-8">{isAr ? "لا توجد بيانات" : "No data"}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Top Admin Actions */}
      {data?.topActions && data.topActions.length > 0 && (
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-chart-3" />
              {isAr ? "أكثر الإجراءات الإدارية" : "Top Admin Actions"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topActions} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={100} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name={isAr ? "العدد" : "Count"}>
                    {data.topActions.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

// ── Main Page ────────────────────────────────────────────
export default function SecurityAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("events");

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={ShieldAlert}
        title={isAr ? "مركز الأمان والحماية" : "Security Center"}
        description={isAr ? "مراقبة الأحداث الأمنية والجلسات والصلاحيات" : "Monitor security events, sessions, and permissions"}
        actions={
          <div className="flex items-center gap-3">
            <ActivityPulse status="live" label={isAr ? "مراقبة مباشرة" : "Live monitoring"} size="md" />
            <ConfidenceBadge level="verified" label={isAr ? "محمي" : "Protected"} />
          </div>
        }
      />

      <SecurityKPIStrip />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="events" className="gap-1.5 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Activity className="h-3.5 w-3.5" />
            {isAr ? "الأحداث" : "Events"}
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1.5 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Monitor className="h-3.5 w-3.5" />
            {isAr ? "الجلسات" : "Sessions"}
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1.5 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Lock className="h-3.5 w-3.5" />
            {isAr ? "الصلاحيات" : "Permissions"}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Eye className="h-3.5 w-3.5" />
            {isAr ? "التحليلات" : "Analytics"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-4">
          <Suspense fallback={<TabSkeleton />}><EventsTab /></Suspense>
        </TabsContent>
        <TabsContent value="sessions" className="mt-4">
          <Suspense fallback={<TabSkeleton />}><SessionsTab /></Suspense>
        </TabsContent>
        <TabsContent value="permissions" className="mt-4">
          <Suspense fallback={<TabSkeleton />}><PermissionsTab /></Suspense>
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <Suspense fallback={<TabSkeleton />}><AnalyticsTab /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
