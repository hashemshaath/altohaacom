import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, UserCheck, UserX, Shield, KeyRound, Edit, Ban, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const ACTION_CONFIG: Record<string, { icon: typeof Activity; color: string; label: string; labelAr: string }> = {
  update_profile: { icon: Edit, color: "text-primary", label: "Profile Updated", labelAr: "تحديث الملف" },
  update_roles: { icon: Shield, color: "text-chart-3", label: "Roles Changed", labelAr: "تغيير الأدوار" },
  active_user: { icon: UserCheck, color: "text-chart-5", label: "Activated", labelAr: "تفعيل" },
  suspended_user: { icon: Ban, color: "text-destructive", label: "Suspended", labelAr: "إيقاف" },
  banned_user: { icon: UserX, color: "text-destructive", label: "Banned", labelAr: "حظر" },
  reset_password: { icon: KeyRound, color: "text-chart-4", label: "Password Reset", labelAr: "إعادة تعيين كلمة المرور" },
};

export const UserActivityTimeline = memo(function UserActivityTimeline() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: actions = [] } = useQuery({
    queryKey: ["userActivityTimeline"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_actions")
        .select("id, action_type, created_at, details, admin_id, target_user_id")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set([
        ...(data?.map(a => a.admin_id) || []),
        ...(data?.map(a => a.target_user_id).filter(Boolean) || []),
      ])];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map(a => ({
        ...a,
        admin: profileMap.get(a.admin_id),
        target: a.target_user_id ? profileMap.get(a.target_user_id) : null,
      }));
    },
    refetchInterval: useVisibleRefetchInterval(60000),
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          {isAr ? "سجل نشاط الإدارة" : "Admin Activity Timeline"}
          <Badge variant="secondary" className="ms-auto text-[10px]">
            {actions.length} {isAr ? "إجراء" : "actions"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px]">
          <div className="space-y-1">
            {actions.map((action) => {
              const config = ACTION_CONFIG[action.action_type] || {
                icon: Activity, color: "text-muted-foreground",
                label: action.action_type, labelAr: action.action_type,
              };
              const Icon = config.icon;
              const adminName = action.admin?.full_name || action.admin?.username || "Admin";
              const targetName = action.target?.full_name || action.target?.username || "";
              const timeAgo = formatDistanceToNow(new Date(action.created_at), {
                addSuffix: true,
                locale: isAr ? ar : undefined,
              });

              return (
                <div key={action.id} className="flex items-start gap-3 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors">
                  <div className={`mt-0.5 p-1.5 rounded-full bg-muted ${config.color}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed">
                      <span className="font-medium">{adminName}</span>
                      {" "}
                      <span className="text-muted-foreground">
                        {isAr ? config.labelAr : config.label}
                      </span>
                      {targetName && (
                        <>
                          {" → "}
                          <span className="font-medium">{targetName}</span>
                        </>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {timeAgo}
                    </p>
                  </div>
                </div>
              );
            })}
            {actions.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                {isAr ? "لا توجد إجراءات حديثة" : "No recent actions"}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
