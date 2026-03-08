import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, AlertTriangle, Users, Lock, Activity, Ban } from "lucide-react";
import { subDays, subHours } from "date-fns";

export const SecurityOverviewWidget = memo(function SecurityOverviewWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-security-overview"],
    queryFn: async () => {
      const last24h = subHours(new Date(), 24).toISOString();
      const last7d = subDays(new Date(), 7).toISOString();

      const [
        { count: totalEvents24h },
        { count: failedLogins24h },
        { count: activeSessions },
        { count: blockedIPs },
        { data: recentEvents },
        { count: suspendedUsers },
        { count: roleChanges7d },
      ] = await Promise.all([
        supabase.from("security_events").select("*", { count: "exact", head: true }).gte("created_at", last24h),
        supabase.from("security_events").select("*", { count: "exact", head: true }).gte("created_at", last24h).eq("event_type", "login_failed"),
        supabase.from("user_sessions").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("ip_blocklist").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("security_events").select("event_type, severity, created_at, details").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "suspended"),
        supabase.from("security_events").select("*", { count: "exact", head: true }).gte("created_at", last7d).eq("event_type", "role_changed"),
      ]);

      const threatLevel = (failedLogins24h || 0) > 20 ? "high" : (failedLogins24h || 0) > 5 ? "medium" : "low";

      return {
        totalEvents24h: totalEvents24h || 0,
        failedLogins24h: failedLogins24h || 0,
        activeSessions: activeSessions || 0,
        blockedIPs: blockedIPs || 0,
        suspendedUsers: suspendedUsers || 0,
        roleChanges7d: roleChanges7d || 0,
        recentEvents: recentEvents || [],
        threatLevel,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) return <Skeleton className="h-72 w-full rounded-xl" />;

  const threatColors = { low: "text-chart-2", medium: "text-chart-4", high: "text-destructive" };
  const threatBg = { low: "bg-chart-2/10", medium: "bg-chart-4/10", high: "bg-destructive/10" };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {isAr ? "نظرة أمنية شاملة" : "Security Overview"}
          </CardTitle>
          <Badge className={`${threatBg[data?.threatLevel || "low"]} ${threatColors[data?.threatLevel || "low"]} border-0 text-[10px]`}>
            {data?.threatLevel === "high" ? (isAr ? "تهديد عالي" : "High Threat")
              : data?.threatLevel === "medium" ? (isAr ? "تهديد متوسط" : "Medium")
              : (isAr ? "آمن" : "Secure")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Activity, label: isAr ? "أحداث 24س" : "Events 24h", value: data?.totalEvents24h, color: "text-primary" },
            { icon: AlertTriangle, label: isAr ? "محاولات فاشلة" : "Failed Logins", value: data?.failedLogins24h, color: "text-destructive" },
            { icon: Users, label: isAr ? "جلسات نشطة" : "Active Sessions", value: data?.activeSessions, color: "text-chart-2" },
            { icon: Ban, label: isAr ? "IPs محظورة" : "Blocked IPs", value: data?.blockedIPs, color: "text-chart-4" },
            { icon: Lock, label: isAr ? "معلقين" : "Suspended", value: data?.suspendedUsers, color: "text-destructive" },
            { icon: ShieldCheck, label: isAr ? "تغيير أدوار" : "Role Changes", value: data?.roleChanges7d, color: "text-chart-3" },
          ].map((m, i) => (
            <div key={i} className="text-center p-2 rounded-xl bg-muted/30">
              <m.icon className={`h-3.5 w-3.5 mx-auto mb-1 ${m.color}`} />
              <p className="text-sm font-bold">{m.value}</p>
              <p className="text-[9px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Failed Login Rate */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">{isAr ? "معدل محاولات الدخول الفاشلة" : "Failed Login Rate"}</span>
            <span className="font-medium">
              {data?.totalEvents24h ? Math.round(((data?.failedLogins24h || 0) / data.totalEvents24h) * 100) : 0}%
            </span>
          </div>
          <Progress
            value={data?.totalEvents24h ? ((data?.failedLogins24h || 0) / data.totalEvents24h) * 100 : 0}
            className="h-1.5"
          />
        </div>

        {/* Recent Events */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{isAr ? "آخر الأحداث" : "Recent Events"}</p>
          {data?.recentEvents.map((evt: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-muted/20">
              <span className="truncate">{evt.event_type.replace(/_/g, " ")}</span>
              <Badge variant={evt.severity === "critical" ? "destructive" : "secondary"} className="text-[9px] px-1 py-0">
                {evt.severity}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
