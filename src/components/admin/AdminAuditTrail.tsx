import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Clock, UserCog, Key, AlertTriangle, CheckCircle2, Ban, Eye } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

const actionIcons: Record<string, { icon: React.ElementType; color: string }> = {
  role_change: { icon: UserCog, color: "text-primary" },
  permission_override: { icon: Key, color: "text-chart-4" },
  user_suspend: { icon: Ban, color: "text-destructive" },
  user_unsuspend: { icon: CheckCircle2, color: "text-chart-2" },
  profile_update: { icon: Eye, color: "text-chart-5" },
  login_as_user: { icon: Shield, color: "text-chart-3" },
};

export function AdminAuditTrail() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-trail"],
    queryFn: async () => {
      const { data: actions } = await supabase
        .from("admin_actions")
        .select("id, action_type, admin_id, target_user_id, details, created_at")
        .order("created_at", { ascending: false })
        .limit(30);

      if (!actions?.length) return { actions: [], adminNames: {} };

      // Get admin names
      const adminIds = [...new Set(actions.map((a: any) => a.admin_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username")
        .in("user_id", adminIds);

      const adminNames: Record<string, string> = {};
      (profiles || []).forEach((p: any) => {
        adminNames[p.user_id] = p.full_name || p.username || "Admin";
      });

      return { actions: actions || [], adminNames };
    },
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          {isAr ? "سجل المراجعة والصلاحيات" : "Audit Trail & Permissions Log"}
          <Badge variant="outline" className="text-[9px] ms-2">{data?.actions.length || 0}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {!data?.actions.length ? (
            <p className="text-xs text-muted-foreground text-center py-8">{isAr ? "لا توجد إجراءات مسجلة" : "No actions recorded"}</p>
          ) : (
            <div className="space-y-1">
              {data.actions.map((action: any) => {
                const { icon: Icon, color } = actionIcons[action.action_type] || { icon: AlertTriangle, color: "text-muted-foreground" };
                const adminName = data.adminNames[action.admin_id] || "Admin";
                const details = action.details as Record<string, any> | null;

                return (
                  <div key={action.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className={cn("h-7 w-7 rounded-full bg-muted/60 flex items-center justify-center shrink-0 mt-0.5")}>
                      <Icon className={cn("h-3.5 w-3.5", color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold">{adminName}</span>
                        <Badge variant="outline" className="text-[8px] capitalize">{action.action_type.replace(/_/g, " ")}</Badge>
                      </div>
                      {details?.reason && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {isAr ? "السبب:" : "Reason:"} {details.reason}
                        </p>
                      )}
                      {details?.role && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {isAr ? "الدور:" : "Role:"} <span className="font-medium capitalize">{details.role}</span>
                        </p>
                      )}
                      <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDistanceToNow(new Date(action.created_at), { addSuffix: true, locale: isAr ? ar : enUS })}
                      </p>
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
