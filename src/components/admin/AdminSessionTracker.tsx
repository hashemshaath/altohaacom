import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Monitor, Smartphone, Globe, Shield, Clock, Activity } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { ActivityPulse } from "@/components/ui/activity-pulse";

export const AdminSessionTracker = memo(function AdminSessionTracker() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: sessions = [] } = useQuery({
    queryKey: ["adminActiveSessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_sessions")
        .select("id, user_id, device_info, ip_address, is_active, last_active_at, created_at")
        .eq("is_active", true)
        .order("last_active_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: useVisibleRefetchInterval(60000),
  });

  const { data: recentEvents = [] } = useQuery({
    queryKey: ["recentSecurityEvents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_events")
        .select("id, event_type, severity, ip_address, user_agent, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: useVisibleRefetchInterval(60000),
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "secondary";
      default: return "outline";
    }
  };

  const getDeviceIcon = (info: string | null) => {
    if (!info) return <Globe className="h-3.5 w-3.5" />;
    const lower = info.toLowerCase();
    if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone")) return <Smartphone className="h-3.5 w-3.5" />;
    return <Monitor className="h-3.5 w-3.5" />;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-chart-2" />
            {isAr ? "الجلسات النشطة" : "Active Sessions"}
            <ActivityPulse status={sessions.length > 0 ? "live" : "idle"} className="ms-1" />
            <Badge variant="secondary" className="ms-auto text-xs">{sessions.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-60">
            <div className="space-y-0">
              {sessions.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">{isAr ? "لا توجد جلسات نشطة" : "No active sessions"}</p>
              ) : sessions.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 last:border-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-chart-2/10 text-chart-2">
                    {getDeviceIcon(typeof s.device_info === "string" ? s.device_info : null)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{typeof s.device_info === "string" ? s.device_info : (isAr ? "جهاز غير معروف" : "Unknown device")}</p>
                    <p className="text-[10px] text-muted-foreground">{typeof s.ip_address === "string" ? s.ip_address : "—"}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {s.last_active_at && formatDistanceToNow(new Date(s.last_active_at), { addSuffix: true, locale: isAr ? ar : undefined })}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-destructive" />
            {isAr ? "أحداث الأمان الأخيرة" : "Recent Security Events"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-60">
            <div className="space-y-0">
              {recentEvents.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">{isAr ? "لا توجد أحداث" : "No recent events"}</p>
              ) : recentEvents.map(e => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 last:border-0">
                  <Badge variant={getSeverityColor(e.severity || "low")} className="text-[9px] shrink-0">
                    {e.severity || "info"}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{e.event_type}</p>
                    <p className="text-[10px] text-muted-foreground">{e.ip_address || "—"}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(e.created_at), { addSuffix: true, locale: isAr ? ar : undefined })}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
