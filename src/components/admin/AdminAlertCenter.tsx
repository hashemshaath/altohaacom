import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle, Bell, TrendingDown, Users, Shield,
  Clock, ArrowRight, CheckCircle2, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  link?: string;
  timestamp: Date;
}

export const AdminAlertCenter = memo(function AdminAlertCenter() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["admin-smart-alerts"],
    queryFn: async () => {
      const now = new Date();
      const alerts: Alert[] = [];

      // Check for critical security events (last 24h)
      const { count: criticalEvents } = await supabase
        .from("security_events")
        .select("*", { count: "exact", head: true })
        .eq("severity", "critical")
        .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

      if ((criticalEvents || 0) > 0) {
        alerts.push({
          id: "security-critical",
          severity: "critical",
          title: `${criticalEvents} critical security events`,
          titleAr: `${criticalEvents} أحداث أمنية حرجة`,
          description: "Review security events immediately",
          descriptionAr: "راجع الأحداث الأمنية فوراً",
          link: "/admin/security",
          timestamp: now,
        });
      }

      // Check for failed notification queue items
      const { count: failedNotifs } = await supabase
        .from("notification_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed");

      if ((failedNotifs || 0) > 5) {
        alerts.push({
          id: "notif-failures",
          severity: "warning",
          title: `${failedNotifs} failed notifications`,
          titleAr: `${failedNotifs} إشعارات فاشلة`,
          description: "Check notification queue for errors",
          descriptionAr: "تحقق من طابور الإشعارات",
          link: "/admin/notifications",
          timestamp: now,
        });
      }

      // Check for suspended users in last 7 days
      const { count: newSuspended } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("account_status", "suspended")
        .gte("suspended_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if ((newSuspended || 0) > 0) {
        alerts.push({
          id: "suspended-users",
          severity: "info",
          title: `${newSuspended} users suspended this week`,
          titleAr: `${newSuspended} مستخدمين معلقين هذا الأسبوع`,
          description: "Review suspended accounts",
          descriptionAr: "راجع الحسابات المعلقة",
          link: "/admin/users",
          timestamp: now,
        });
      }

      // Check for expiring memberships (next 7 days)
      const { count: expiringCards } = await supabase
        .from("membership_cards")
        .select("*", { count: "exact", head: true })
        .eq("card_status", "active")
        .lte("expires_at", new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .gte("expires_at", now.toISOString());

      if ((expiringCards || 0) > 0) {
        alerts.push({
          id: "expiring-memberships",
          severity: "warning",
          title: `${expiringCards} memberships expiring soon`,
          titleAr: `${expiringCards} عضويات ستنتهي قريباً`,
          description: "Members may need renewal reminders",
          descriptionAr: "قد يحتاج الأعضاء لتذكير بالتجديد",
          link: "/admin/memberships",
          timestamp: now,
        });
      }

      return alerts.sort((a, b) => {
        const order = { critical: 0, warning: 1, info: 2 };
        return order[a.severity] - order[b.severity];
      });
    },
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });

  const severityConfig = {
    critical: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
    warning: { icon: AlertTriangle, color: "text-chart-4", bg: "bg-chart-4/10", border: "border-chart-4/20" },
    info: { icon: Bell, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-4/10">
            <Bell className="h-3.5 w-3.5 text-chart-4" />
          </div>
          {isAr ? "تنبيهات ذكية" : "Smart Alerts"}
          {alerts.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-chart-2" />
            <p className="text-sm font-medium text-chart-2">
              {isAr ? "لا توجد تنبيهات ✨" : "No alerts ✨"}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[250px]">
            <div className="space-y-1.5">
              {alerts.map((alert) => {
                const config = severityConfig[alert.severity];
                const Icon = config.icon;
                return (
                  <Link key={alert.id} to={alert.link || "#"}>
                    <div className={cn(
                      "flex items-start gap-2.5 rounded-xl border p-2.5 transition-all hover:bg-accent/30 hover:shadow-sm",
                      config.border
                    )}>
                      <div className={cn("flex h-7 w-7 items-center justify-center rounded-xl shrink-0", config.bg)}>
                        <Icon className={cn("h-3.5 w-3.5", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">
                          {isAr ? alert.titleAr : alert.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {isAr ? alert.descriptionAr : alert.description}
                        </p>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
});
