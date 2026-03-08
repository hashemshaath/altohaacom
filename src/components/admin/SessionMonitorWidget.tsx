import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Monitor, Smartphone, Globe, Shield, Clock, Activity, Wifi, WifiOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export const SessionMonitorWidget = memo(function SessionMonitorWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["sessionMonitor"],
    queryFn: async () => {
      const [sessionsRes, eventsRes, blockedRes] = await Promise.all([
        supabase.from("user_sessions").select("id, user_id, device_info, ip_address, is_active, created_at, last_active_at").order("last_active_at", { ascending: false }).limit(100),
        supabase.from("security_events").select("id, event_type, severity, ip_address, user_agent, created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("ip_blocklist").select("id, ip_address, reason, is_active, created_at").eq("is_active", true),
      ]);

      const sessions = sessionsRes.data || [];
      const events = eventsRes.data || [];
      const blocked = blockedRes.data || [];

      const activeSessions = sessions.filter(s => s.is_active);
      const uniqueIPs = new Set(activeSessions.map(s => s.ip_address)).size;

      // Device breakdown
      const deviceMap: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
      activeSessions.forEach(s => {
        const info = (s.device_info as string || "").toLowerCase();
        if (info.includes("mobile") || info.includes("phone")) deviceMap.mobile++;
        else if (info.includes("tablet") || info.includes("ipad")) deviceMap.tablet++;
        else if (info.includes("desktop") || info.includes("windows") || info.includes("mac")) deviceMap.desktop++;
        else deviceMap.unknown++;
      });

      // Recent suspicious events
      const suspicious = events.filter(e => e.severity === "high" || e.severity === "critical").slice(0, 8);

      return {
        totalActive: activeSessions.length,
        uniqueIPs,
        blockedCount: blocked.length,
        deviceMap,
        recentSessions: activeSessions.slice(0, 10),
        suspicious,
      };
    },
    refetchInterval: useVisibleRefetchInterval(60000),
  });

  if (!data) return null;

  const stats = [
    { icon: Activity, label: isAr ? "جلسات نشطة" : "Active Sessions", value: data.totalActive, color: "text-chart-5" },
    { icon: Globe, label: isAr ? "عناوين IP فريدة" : "Unique IPs", value: data.uniqueIPs, color: "text-primary" },
    { icon: WifiOff, label: isAr ? "IPs محظورة" : "Blocked IPs", value: data.blockedCount, color: "text-destructive" },
  ];

  const deviceIcons: Record<string, typeof Monitor> = { desktop: Monitor, mobile: Smartphone, tablet: Monitor };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          {isAr ? "مراقبة الجلسات المباشرة" : "Live Session Monitor"}
          <Badge variant="default" className="ms-auto animate-pulse text-[10px]">
            <Wifi className="h-2.5 w-2.5 me-1" />
            {isAr ? "مباشر" : "Live"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-3 text-center group transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color} transition-transform duration-300 group-hover:scale-110`} />
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Device Breakdown */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "توزيع الأجهزة" : "Device Breakdown"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(data.deviceMap).filter(([,v]) => v > 0).map(([device, count]) => {
                const DevIcon = deviceIcons[device] || Globe;
                return (
                  <div key={device} className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl">
                    <DevIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-bold">{count}</div>
                      <div className="text-[9px] text-muted-foreground capitalize">{device}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suspicious Events */}
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              {isAr ? "أحداث مشبوهة" : "Suspicious Events"}
            </p>
            <ScrollArea className="h-[120px]">
              <div className="space-y-1">
                {data.suspicious.map(e => (
                  <div key={e.id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-destructive/5">
                    <div className="h-1.5 w-1.5 rounded-full bg-destructive flex-shrink-0" />
                    <span className="text-[11px] truncate flex-1">{e.event_type}</span>
                    <span className="text-[9px] text-muted-foreground">
                      {formatDistanceToNow(new Date(e.created_at), { addSuffix: true, locale: isAr ? ar : undefined })}
                    </span>
                  </div>
                ))}
                {data.suspicious.length === 0 && (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    ✅ {isAr ? "لا توجد أحداث مشبوهة" : "No suspicious events"}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
