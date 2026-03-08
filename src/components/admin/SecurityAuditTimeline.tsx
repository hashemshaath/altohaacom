import { useState, useMemo, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldAlert, ShieldCheck, Shield, Lock, LogIn, LogOut, UserX, KeyRound, AlertTriangle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const SEVERITY_CONFIG = {
  critical: { color: "text-destructive", bg: "bg-destructive/10", icon: AlertTriangle },
  high: { color: "text-orange-500", bg: "bg-orange-500/10", icon: ShieldAlert },
  medium: { color: "text-yellow-500", bg: "bg-yellow-500/10", icon: Shield },
  low: { color: "text-chart-3", bg: "bg-chart-3/10", icon: ShieldCheck },
  info: { color: "text-primary", bg: "bg-primary/10", icon: Lock },
};

const EVENT_ICONS: Record<string, typeof Shield> = {
  login_failed: LogIn,
  login_success: LogIn,
  logout: LogOut,
  account_locked: UserX,
  password_change: KeyRound,
  role_change: Shield,
  session_revoked: Lock,
};

export function SecurityAuditTimeline() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [severityFilter, setSeverityFilter] = useState("all");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["security-audit-timeline", severityFilter],
    queryFn: async () => {
      let query = supabase
        .from("security_events")
        .select("id, event_type, severity, description, description_ar, ip_address, user_agent, user_id, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (severityFilter !== "all") {
        query = query.eq("severity", severityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: useVisibleRefetchInterval(60000),
  });

  const stats = useMemo(() => ({
    critical: events.filter((e: any) => e.severity === "critical").length,
    high: events.filter((e: any) => e.severity === "high").length,
    medium: events.filter((e: any) => e.severity === "medium").length,
    total: events.length,
  }), [events]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              {isAr ? "سجل تدقيق الأمان" : "Security Audit Log"}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {stats.critical > 0 && (
              <Badge variant="destructive" className="text-xs">
                {stats.critical} {isAr ? "حرج" : "critical"}
              </Badge>
            )}
            {stats.high > 0 && (
              <Badge className="bg-orange-500/15 text-orange-600 border-orange-500/20 text-xs">
                {stats.high} {isAr ? "عالي" : "high"}
              </Badge>
            )}
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="critical">{isAr ? "حرج" : "Critical"}</SelectItem>
                <SelectItem value="high">{isAr ? "عالي" : "High"}</SelectItem>
                <SelectItem value="medium">{isAr ? "متوسط" : "Medium"}</SelectItem>
                <SelectItem value="low">{isAr ? "منخفض" : "Low"}</SelectItem>
                <SelectItem value="info">{isAr ? "معلومات" : "Info"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[360px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShieldCheck className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">{isAr ? "لا توجد أحداث أمنية" : "No security events"}</p>
            </div>
          ) : (
            <div className="relative px-4 py-2">
              {/* Timeline line */}
              <div className="absolute start-7 top-0 bottom-0 w-px bg-border" />

              {events.map((event: any, idx: number) => {
                const severity = SEVERITY_CONFIG[event.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.info;
                const EventIcon = EVENT_ICONS[event.event_type] || severity.icon;

                return (
                  <div key={event.id} className="relative flex items-start gap-3 py-2.5">
                    <div className={`z-10 rounded-full p-1.5 ${severity.bg} ${severity.color} shrink-0`}>
                      <EventIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{event.event_type?.replace(/_/g, " ")}</p>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${severity.color}`}>
                          {event.severity}
                        </Badge>
                      </div>
                      {event.details && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
                          {typeof event.details === "string" ? event.details : JSON.stringify(event.details)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground/70">
                        <span>{formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: isAr ? ar : undefined })}</span>
                        {event.ip_address && <span>· IP: {event.ip_address}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
