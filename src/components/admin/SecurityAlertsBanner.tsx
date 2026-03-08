import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, AlertTriangle, Ban, Lock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { subDays } from "date-fns";

export const SecurityAlertsBanner = memo(function SecurityAlertsBanner() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["security-alerts-banner"],
    queryFn: async () => {
      const oneDayAgo = subDays(new Date(), 1).toISOString();
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();

      const [criticalRes, blockedRes, failedLoginsRes] = await Promise.all([
        supabase.from("security_events").select("id", { count: "exact", head: true }).eq("severity", "critical").gte("created_at", sevenDaysAgo),
        supabase.from("ip_blocklist").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("security_events").select("id", { count: "exact", head: true }).eq("event_type", "login_failed").gte("created_at", oneDayAgo),
      ]);

      return {
        criticalEvents: criticalRes.count || 0,
        blockedIPs: blockedRes.count || 0,
        failedLogins: failedLoginsRes.count || 0,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  if (!data || (data.criticalEvents === 0 && data.blockedIPs === 0 && data.failedLogins < 5)) {
    return null;
  }

  const alerts = [
    data.criticalEvents > 0 && {
      icon: ShieldAlert,
      text: isAr ? `${data.criticalEvents} حدث أمني حرج` : `${data.criticalEvents} critical events`,
      color: "text-destructive",
    },
    data.failedLogins >= 5 && {
      icon: Lock,
      text: isAr ? `${data.failedLogins} محاولة دخول فاشلة` : `${data.failedLogins} failed logins`,
      color: "text-chart-4",
    },
    data.blockedIPs > 0 && {
      icon: Ban,
      text: isAr ? `${data.blockedIPs} عنوان محظور` : `${data.blockedIPs} blocked IPs`,
      color: "text-chart-4",
    },
  ].filter(Boolean) as { icon: any; text: string; color: string }[];

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="p-3 flex items-center gap-3 flex-wrap">
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {alerts.map((a, i) => (
            <Badge key={i} variant="outline" className="text-xs gap-1">
              <a.icon className={`h-3 w-3 ${a.color}`} />
              {a.text}
            </Badge>
          ))}
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs">
          <Link to="/admin/security">
            {isAr ? "مركز الأمان" : "Security Center"}
            <ArrowRight className="ms-1 h-3 w-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
});
