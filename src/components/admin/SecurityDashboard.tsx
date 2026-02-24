import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Shield, ShieldAlert, ShieldCheck, Activity, Ban, Monitor,
  Search, RefreshCw, Loader2, AlertTriangle, Eye, Clock, Users,
  Lock, Unlock, Globe, Smartphone
} from "lucide-react";

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
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
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
    { icon: Activity, label: t("Events (24h)", "الأحداث (24 ساعة)"), value: stats.events_24h, color: "text-blue-500" },
    { icon: ShieldAlert, label: t("Critical (7d)", "حرج (7 أيام)"), value: stats.critical_7d, color: "text-red-500" },
    { icon: Monitor, label: t("Active Sessions", "الجلسات النشطة"), value: stats.active_sessions, color: "text-green-500" },
    { icon: Ban, label: t("Blocked IPs", "عناوين محظورة"), value: stats.blocked_ips, color: "text-orange-500" },
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
              <p className="text-2xl font-bold">{loading ? "—" : s.value}</p>
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
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                          event.severity === "critical" ? "bg-red-100 dark:bg-red-900/30" :
                          event.severity === "warning" ? "bg-yellow-100 dark:bg-yellow-900/30" :
                          "bg-muted/60"
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            event.severity === "critical" ? "text-red-600" :
                            event.severity === "warning" ? "text-yellow-600" :
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
