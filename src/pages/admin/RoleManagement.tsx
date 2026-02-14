import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePermissions, useRolePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Shield, ChefHat, Award, Users, Hand, Heart, Headphones, Eye, Save, Loader2, Lock } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_META: Record<AppRole, { icon: typeof Shield; color: string }> = {
  chef: { icon: ChefHat, color: "bg-chart-2/10 text-chart-2" },
  judge: { icon: Award, color: "bg-chart-3/10 text-chart-3" },
  student: { icon: Users, color: "bg-primary/10 text-primary" },
  organizer: { icon: Shield, color: "bg-destructive/10 text-destructive" },
  volunteer: { icon: Hand, color: "bg-chart-5/10 text-chart-5" },
  sponsor: { icon: Heart, color: "bg-chart-1/10 text-chart-1" },
  assistant: { icon: Headphones, color: "bg-accent text-accent-foreground" },
  supervisor: { icon: Eye, color: "bg-chart-4/10 text-chart-4" },
};

const ALL_ROLES: AppRole[] = ["chef", "judge", "student", "organizer", "volunteer", "sponsor", "assistant", "supervisor"];

export default function RoleManagement() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeRole, setActiveRole] = useState<AppRole>("chef");
  const [saving, setSaving] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [lastSyncedRole, setLastSyncedRole] = useState<string | null>(null);

  const { data: permissions = [] } = usePermissions();
  const { data: rolePerms = [], isLoading } = useRolePermissions(activeRole);

  // Sync selectedPerms when role data loads
  if (!isLoading && lastSyncedRole !== activeRole) {
    const ids = new Set(rolePerms.map((rp: any) => rp.permission_id as string));
    setSelectedPerms(ids);
    setLastSyncedRole(activeRole);
  }

  const handleRoleChange = (role: AppRole) => {
    setActiveRole(role);
    setLastSyncedRole(null);
  };

  const togglePerm = (permId: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing
      await supabase.from("role_permissions").delete().eq("role", activeRole);
      // Insert new
      if (selectedPerms.size > 0) {
        const inserts = Array.from(selectedPerms).map((pid) => ({
          role: activeRole,
          permission_id: pid,
        }));
        const { error } = await supabase.from("role_permissions").insert(inserts);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["rolePermissions"] });
      toast({ title: isAr ? "تم حفظ الصلاحيات" : "Permissions saved" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by category
  const grouped = permissions.reduce<Record<string, typeof permissions>>((acc, p) => {
    const cat = p.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const RoleIcon = ROLE_META[activeRole]?.icon || Shield;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="flex items-center gap-4 p-5 md:p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold">{t("rolePermissions")}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isAr ? "تعيين وإدارة صلاحيات كل دور" : "Assign and manage permissions per role"}
            </p>
          </div>
        </div>
      </Card>

      <Tabs value={activeRole} onValueChange={(v) => handleRoleChange(v as AppRole)}>
        <TabsList className="flex-wrap h-auto gap-1">
          {ALL_ROLES.map((role) => {
            const meta = ROLE_META[role];
            const Icon = meta.icon;
            return (
              <TabsTrigger key={role} value={role} className="gap-1.5 text-xs">
                <Icon className="h-3.5 w-3.5" />
                {t(role as any)}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {ALL_ROLES.map((role) => (
          <TabsContent key={role} value={role} className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${ROLE_META[role].color}`}>
                    <RoleIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{t(role as any)}</CardTitle>
                    <CardDescription className="text-xs">
                      {isAr ? "إدارة الصلاحيات لهذا الدور" : "Manage permissions for this role"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  Object.entries(grouped).map(([category, perms]) => (
                    <div key={category}>
                      <div className="mb-2 flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        <h3 className="text-sm font-semibold capitalize">{category}</h3>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 transition-colors hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={selectedPerms.has(perm.id)}
                              onCheckedChange={() => togglePerm(perm.id)}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium leading-tight">
                                {isAr ? perm.name_ar || perm.name : perm.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{perm.code}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      <Separator className="mt-3" />
                    </div>
                  ))
                )}

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {isAr ? "حفظ" : "Save Permissions"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current permission summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {isAr ? "الصلاحيات المعيّنة" : "Assigned Permissions"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {permissions
                    .filter((p) => selectedPerms.has(p.id))
                    .map((p) => (
                      <Badge key={p.id} variant="secondary" className="text-xs">
                        {isAr ? p.name_ar || p.name : p.name}
                      </Badge>
                    ))}
                  {selectedPerms.size === 0 && (
                    <p className="text-xs text-muted-foreground">
                      {isAr ? "لا توجد صلاحيات" : "No permissions assigned"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
