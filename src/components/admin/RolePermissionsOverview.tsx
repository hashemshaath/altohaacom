import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, Users, Lock, Key, AlertTriangle, CheckCircle } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export function RolePermissionsOverview() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["role-permissions-overview"],
    queryFn: async () => {
      const [
        { data: roleData },
        { data: permData },
        { data: overrideData },
        { count: securityEvents24h },
        { count: activeSessions },
      ] = await Promise.all([
        supabase.from("user_roles").select("role").limit(1000),
        supabase.from("role_permissions").select("role, permission_id").limit(1000),
        supabase.from("user_permission_overrides").select("id, granted").limit(1000),
        supabase.from("security_events").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 86400000).toISOString()),
        supabase.from("user_sessions").select("*", { count: "exact", head: true }).eq("is_active", true),
      ]);

      // Role distribution
      const roleCounts: Record<string, number> = {};
      roleData?.forEach(r => { roleCounts[r.role] = (roleCounts[r.role] || 0) + 1; });
      const totalRoleAssignments = roleData?.length || 0;

      // Permissions per role
      const permPerRole: Record<string, number> = {};
      permData?.forEach(p => { permPerRole[p.role] = (permPerRole[p.role] || 0) + 1; });

      // Overrides
      const grantedOverrides = overrideData?.filter(o => o.granted).length || 0;
      const revokedOverrides = (overrideData?.length || 0) - grantedOverrides;

      return {
        roleCounts,
        permPerRole,
        totalRoleAssignments,
        grantedOverrides,
        revokedOverrides,
        securityEvents24h: securityEvents24h || 0,
        activeSessions: activeSessions || 0,
      };
    },
    staleTime: 30000,
  });

  if (!data) return null;

  const maxRole = Math.max(...Object.values(data.roleCounts), 1);

  const roleColors: Record<string, string> = {
    supervisor: "text-destructive",
    organizer: "text-chart-4",
    judge: "text-chart-2",
    chef: "text-primary",
    student: "text-chart-3",
    volunteer: "text-chart-5",
    sponsor: "text-chart-1",
    assistant: "text-muted-foreground",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-destructive" />
          {isAr ? "نظرة عامة على الأدوار والصلاحيات" : "Roles & Permissions Overview"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-4">
        {/* Security stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: Users, label: isAr ? "تعيينات الأدوار" : "Role Assignments", value: data.totalRoleAssignments, color: "text-primary" },
            { icon: Lock, label: isAr ? "جلسات نشطة" : "Active Sessions", value: data.activeSessions, color: "text-chart-2" },
            { icon: AlertTriangle, label: isAr ? "أحداث أمنية (24س)" : "Security Events (24h)", value: data.securityEvents24h, color: data.securityEvents24h > 10 ? "text-destructive" : "text-chart-3" },
            { icon: Key, label: isAr ? "استثناءات" : "Overrides", value: data.grantedOverrides + data.revokedOverrides, color: "text-chart-4" },
          ].map((s, i) => (
            <div key={i} className="p-2 rounded-xl bg-muted/30 flex items-center gap-2">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <div>
                <AnimatedCounter value={s.value} className="text-sm font-bold" />
                <p className="text-[9px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Role distribution */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">{isAr ? "توزيع الأدوار" : "Role Distribution"}</p>
          <div className="space-y-1.5">
            {Object.entries(data.roleCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([role, count]) => (
                <div key={role} className="flex items-center gap-2">
                  <span className={`text-xs font-medium w-20 truncate ${roleColors[role] || "text-muted-foreground"}`}>{role}</span>
                  <Progress value={(count / maxRole) * 100} className="h-1.5 flex-1" />
                  <span className="text-[10px] text-muted-foreground w-8 text-end">{count}</span>
                  {data.permPerRole[role] && (
                    <Badge variant="outline" className="text-[8px] px-1">{data.permPerRole[role]} {isAr ? "صلاحية" : "perms"}</Badge>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Overrides summary */}
        {(data.grantedOverrides > 0 || data.revokedOverrides > 0) && (
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-chart-2">
              <CheckCircle className="h-3 w-3" /> {data.grantedOverrides} {isAr ? "ممنوحة" : "granted"}
            </span>
            <span className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-3 w-3" /> {data.revokedOverrides} {isAr ? "مسحوبة" : "revoked"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
