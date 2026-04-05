import { useState, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePermissions, useRolePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Lock, Users, Grid3X3, ShieldCheck, UserCog, AlertTriangle, Activity } from "lucide-react";

import { type AppRole, ALL_ROLES } from "@/components/admin/roles/types";
import RoleStatsCards from "@/components/admin/roles/RoleStatsCards";
import MatrixTab from "@/components/admin/roles/MatrixTab";
import PermissionsTab from "@/components/admin/roles/PermissionsTab";
import UsersTab from "@/components/admin/roles/UsersTab";
import OverridesTab from "@/components/admin/roles/OverridesTab";
import ActivityTab from "@/components/admin/roles/ActivityTab";

export default function RoleManagement() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);

  const [activeTab, setActiveTab] = useState("overview");
  const [activeRole, setActiveRole] = useState<AppRole>("chef");

  const { data: permissions = [] } = usePermissions();
  const { data: rolePerms = [], isLoading: rolePermsLoading } = useRolePermissions(activeRole);
  const { data: allRolePerms = [] } = useRolePermissions();

  const { data: roleStats = [] } = useQuery({
    queryKey: ["roleStats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((r) => { counts[r.role] = (counts[r.role] || 0) + 1; });
      return ALL_ROLES.map((role) => ({ role, count: counts[role] || 0 }));
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: overridesCount = 0 } = useQuery({
    queryKey: ["permissionOverridesCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("user_permission_overrides")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
    staleTime: 1000 * 60,
  });

  const securityScore = useMemo(() => {
    const totalRoles = ALL_ROLES.length;
    const rolesWithPerms = ALL_ROLES.filter(r => allRolePerms.some((rp) => rp.role === r)).length;
    const score = Math.round((rolesWithPerms / totalRoles) * 100) - Math.min(overridesCount * 2, 20);
    return Math.max(0, Math.min(100, score));
  }, [allRolePerms, overridesCount]);

  const totalPerms = permissions.length;
  const totalUsers = useMemo(() => roleStats.reduce((s, r) => s + r.count, 0), [roleStats]);

  const handleSelectRole = (role: AppRole) => {
    setActiveTab("permissions");
    setActiveRole(role);
  };

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <AdminPageHeader
        icon={Shield}
        title={t("Roles & Permissions", "الأدوار والصلاحيات")}
        description={t("Full control center for roles, permissions, and overrides", "مركز التحكم الكامل في الأدوار والصلاحيات والاستثناءات")}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={securityScore >= 80 ? "default" : securityScore >= 50 ? "secondary" : "destructive"} className="gap-1.5 px-3 py-1">
              <Shield className="h-3 w-3" />
              {securityScore}% {t("Secure", "أمان")}
            </Badge>
            <Badge variant="outline" className="gap-1.5 px-3 py-1">
              <Lock className="h-3 w-3" />
              {totalPerms} {t("Perms", "صلاحية")}
            </Badge>
            <Badge variant="outline" className="gap-1.5 px-3 py-1">
              <Users className="h-3 w-3" />
              {totalUsers} {t("Assigned", "معيّن")}
            </Badge>
          </div>
        }
      />

      <RoleStatsCards
        roleStats={roleStats}
        allRolePerms={allRolePerms}
        totalPerms={totalPerms}
        activeRole={activeRole}
        activeTab={activeTab}
        isAr={isAr}
        onSelect={handleSelectRole}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap gap-1 rounded-2xl border border-border/40 bg-muted/30 backdrop-blur p-1.5">
          <TabsTrigger value="overview" className="gap-1.5 text-xs rounded-xl data-[state=active]:shadow-sm">
            <Grid3X3 className="h-3.5 w-3.5" />
            {t("Matrix", "المصفوفة")}
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1.5 text-xs rounded-xl data-[state=active]:shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("Permissions", "الصلاحيات")}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs rounded-xl data-[state=active]:shadow-sm">
            <UserCog className="h-3.5 w-3.5" />
            {t("Assign Roles", "تعيين الأدوار")}
          </TabsTrigger>
          <TabsTrigger value="overrides" className="gap-1.5 text-xs rounded-xl data-[state=active]:shadow-sm">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t("Overrides", "الاستثناءات")}
            {overridesCount > 0 && <Badge variant="destructive" className="text-[10px] h-4 px-1 ms-1">{overridesCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5 text-xs rounded-xl data-[state=active]:shadow-sm">
            <Activity className="h-3.5 w-3.5" />
            {t("Activity", "سجل النشاط")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <MatrixTab permissions={permissions} allRolePerms={allRolePerms} isAr={isAr} t={t} />
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <PermissionsTab
            permissions={permissions}
            rolePerms={rolePerms}
            allRolePerms={allRolePerms}
            rolePermsLoading={rolePermsLoading}
            activeRole={activeRole}
            isAr={isAr}
            t={t}
            onRoleChange={setActiveRole}
          />
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <UsersTab isAr={isAr} t={t} />
        </TabsContent>

        <TabsContent value="overrides" className="mt-4">
          <OverridesTab isAr={isAr} t={t} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ActivityTab isAr={isAr} t={t} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
