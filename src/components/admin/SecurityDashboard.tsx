import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Shield, ShieldAlert, ShieldCheck, Activity, Ban, Monitor,
  Search, RefreshCw, Loader2, AlertTriangle, Eye, Clock, Users,
  Lock, Unlock, Globe, Smartphone
}from "lucide-react";

interface SecurityStats {
  events_24h: number;
  critical_7d: number;
  active_sessions: number;
  blocked_ips: number;
}

interface SecurityEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  severity: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any;
  description: string | null;
  description_ar: string | null;
  created_at: string;
}

const EVENT_TYPE_ICONS: Record<string, any> = {
  login_success: ShieldCheck,
  login_failed: ShieldAlert,
  password_changed: Lock,
  role_changed: Users,
  permission_override: Unlock,
  suspicious_activity: AlertTriangle,
  account_locked: Ban,
  session_revoked: Monitor,
  ip_blocked: Globe,
};

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-primary/10 text-primary",
  warning: "bg-chart-4/10 text-chart-4",
  critical: "bg-destructive/10 text-destructive",
};

export default function SecurityDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => isAr ? ar : en;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SecurityStats>({ events_24h: 0, critical_7d: 0, active_sessions: 0, blocked_ips: 0 });
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [typeBreakdown, setTypeBreakdown] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("security-audit", {
        body: { action: "get_dashboard" },
      });
      if (error) throw error;
      if (data?.success) {
        setStats(data.stats);
        setEvents(data.recent_events || []);
        setTypeBreakdown(data.type_breakdown || {});
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (severityFilter !== "all" && e.severity !== severityFilter) return false;
      if (filter) {
        const q = filter.toLowerCase();
        return (
          e.event_type.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.ip_address?.toLowerCase().includes(q) ||
          e.user_id?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [events, filter, severityFilter]);

  const statCards = [
    { icon: Activity, label: t("Events (24h)", "الأحداث (24 ساعة)"), value: stats.events_24h, color: "text-primary" },
    { icon: ShieldAlert, label: t("Critical (7d)", "حرج (7 أيام)"), value: stats.critical_7d, color: "text-destructive" },
    { icon: Monitor, label: t("Active Sessions", "الجلسات النشطة"), value: stats.active_sessions, color: "text-chart-2" },
    { icon: Ban, label: t("Blocked IPs", "عناوين محظورة"), value: stats.blocked_ips, color: "text-chart-4" },
  ];

  const topEventTypes = Object.entries(typeBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <AnimatedCounter value={loading ? 0 : (typeof s.value === "number" ? s.value : parseInt(String(s.value)) || 0)} className="text-2xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events" className="gap-1.5 text-xs">
            <Activity className="h-3.5 w-3.5" />
            {t("Events Log", "سجل الأحداث")}
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1.5 text-xs">
            <Monitor className="h-3.5 w-3.5" />
            {t("Sessions", "الجلسات")}
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1.5 text-xs">
            <Lock className="h-3.5 w-3.5" />
            {t("Permissions", "الصلاحيات")}
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="gap-1.5 text-xs">
            <Eye className="h-3.5 w-3.5" />
            {t("Analysis", "التحليل")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-3 mt-3">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("Search events...", "بحث في الأحداث...")}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All", "الكل")}</SelectItem>
                <SelectItem value="info">{t("Info", "معلومات")}</SelectItem>
                <SelectItem value="warning">{t("Warning", "تحذير")}</SelectItem>
                <SelectItem value="critical">{t("Critical", "حرج")}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchDashboard} disabled={loading} className="h-9">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>

          {/* Events list */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  {t("No security events found", "لا توجد أحداث أمنية")}
                </CardContent>
              </Card>
            ) : (
              filteredEvents.map((event) => {
                const Icon = EVENT_TYPE_ICONS[event.event_type] || Shield;
                return (
                  <Card key={event.id} className="border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
                          event.severity === "critical" ? "bg-destructive/10" :
                          event.severity === "warning" ? "bg-chart-4/10" :
                          "bg-muted/60"
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            event.severity === "critical" ? "text-destructive" :
                            event.severity === "warning" ? "text-chart-4" :
                            "text-muted-foreground"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">
                              {event.event_type.replace(/_/g, " ")}
                            </span>
                            <Badge className={`text-[10px] ${SEVERITY_STYLES[event.severity] || ""}`}>
                              {event.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {isAr ? event.description_ar || event.description : event.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(event.created_at).toLocaleString(isAr ? "ar" : "en")}
                            </span>
                            {event.ip_address && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" /> {event.ip_address}
                              </span>
                            )}
                            {event.user_id && (
                              <span className="font-mono truncate max-w-[100px]">
                                {event.user_id.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="mt-3">
          <SessionsPanel />
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="mt-3">
          <PermissionsOverview />
        </TabsContent>

        <TabsContent value="breakdown" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("Event Type Breakdown (7 days)", "توزيع الأحداث (7 أيام)")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topEventTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("No events recorded yet", "لم يتم تسجيل أحداث بعد")}
                </p>
              ) : (
                topEventTypes.map(([type, count]) => {
                  const maxCount = topEventTypes[0]?.[1] || 1;
                  const Icon = EVENT_TYPE_ICONS[type] || Shield;
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs">{type.replace(/_/g, " ")}</span>
                          <Badge variant="outline" className="text-[10px]">{count}</Badge>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Sessions Panel ──────────────────────────────────────
function SessionsPanel() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["security-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("is_active", true)
        .order("last_active_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Monitor className="h-4 w-4 text-chart-2" />
          {isAr ? "الجلسات النشطة" : "Active Sessions"} ({sessions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {isAr ? "لا توجد جلسات نشطة" : "No active sessions"}
          </p>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{isAr ? "المستخدم" : "User"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "الجهاز" : "Device"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "IP" : "IP"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "آخر نشاط" : "Last Active"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session: any) => (
                  <TableRow key={session.id}>
                    <TableCell className="text-xs font-mono truncate max-w-[120px]">
                      {session.user_id?.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs truncate max-w-[150px]">
                          {session.device_info || "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {session.ip_address || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {session.last_active_at ? format(new Date(session.last_active_at), "MMM d, HH:mm") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// ── Permissions Overview ──────────────────────────────────
function PermissionsOverview() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["security-permissions-overview"],
    queryFn: async () => {
      const [rolesRes, overridesRes, permissionsRes] = await Promise.all([
        supabase.from("user_roles").select("role"),
        supabase.from("user_permission_overrides").select("*").limit(20),
        supabase.from("role_permissions").select("role, permissions(code, name, name_ar, category)"),
      ]);
      
      // Role distribution
      const roleCounts: Record<string, number> = {};
      (rolesRes.data || []).forEach((r: any) => {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
      });

      return {
        roleCounts,
        overrides: overridesRes.data || [],
        rolePermissions: permissionsRes.data || [],
        totalRoleAssignments: rolesRes.data?.length || 0,
      };
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;

  const sortedRoles = Object.entries(data?.roleCounts || {}).sort(([, a], [, b]) => b - a);
  const maxCount = sortedRoles[0]?.[1] || 1;

  return (
    <div className="space-y-4">
      {/* Role distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            {isAr ? "توزيع الأدوار" : "Role Distribution"} (<AnimatedCounter value={data?.totalRoleAssignments || 0} />)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedRoles.map(([role, count]) => (
            <div key={role} className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs min-w-[80px] justify-center">
                {role}
              </Badge>
              <div className="flex-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-bold tabular-nums w-8 text-end">{count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent overrides */}
      {(data?.overrides?.length || 0) > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Unlock className="h-4 w-4 text-chart-4" />
              {isAr ? "تجاوزات الصلاحيات الأخيرة" : "Recent Permission Overrides"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[250px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{isAr ? "المستخدم" : "User"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "النوع" : "Type"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "السبب" : "Reason"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.overrides.map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell className="text-xs font-mono truncate max-w-[100px]">
                        {o.user_id?.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant={o.granted ? "default" : "destructive"} className="text-[9px] h-4 px-1.5">
                          {o.granted ? (isAr ? "ممنوح" : "Granted") : (isAr ? "محظور" : "Denied")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {o.reason || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
