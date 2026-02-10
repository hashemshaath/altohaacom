import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Plus, Trash2, CheckCircle, XCircle, Shield } from "lucide-react";
import {
  useCompanyRoles,
  useAssignCompanyRole,
  useToggleCompanyRole,
  useRemoveCompanyRole,
  COMPANY_ROLES,
} from "@/hooks/useCompanyRoles";
import { format } from "date-fns";

interface CompanyRolesPanelProps {
  companyId: string;
}

export function CompanyRolesPanel({ companyId }: CompanyRolesPanelProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { data: roles = [], isLoading } = useCompanyRoles(companyId);
  const assignMutation = useAssignCompanyRole(companyId);
  const toggleMutation = useToggleCompanyRole();
  const removeMutation = useRemoveCompanyRole();
  const [newRole, setNewRole] = useState("");

  const assignedRoleValues = roles.map(r => r.role);
  const availableRoles = COMPANY_ROLES.filter(r => !assignedRoleValues.includes(r.value));

  const getRoleBadge = (role: string) => {
    const r = COMPANY_ROLES.find(cr => cr.value === role);
    return (
      <Badge className={r?.color || "bg-muted text-muted-foreground"}>
        {r ? (language === "ar" ? r.labelAr : r.label) : role}
      </Badge>
    );
  };

  const handleAssign = () => {
    if (!newRole) return;
    assignMutation.mutate(newRole, {
      onSuccess: () => {
        setNewRole("");
        toast({ title: language === "ar" ? "تم تعيين الدور" : "Role assigned" });
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: language === "ar" ? "فشل التعيين" : "Assignment failed",
          description: err.message?.includes("duplicate")
            ? (language === "ar" ? "هذا الدور معيّن مسبقاً" : "Already assigned")
            : err.message,
        });
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {language === "ar" ? "أدوار الشركة" : "Company Roles"}
        </h3>
      </div>

      {/* Assign new role */}
      <Card>
        <CardContent className="flex items-end gap-3 pt-6">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">
              {language === "ar" ? "إضافة دور جديد" : "Add New Role"}
            </label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder={language === "ar" ? "اختر دور" : "Select role"} />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {language === "ar" ? r.labelAr : r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAssign} disabled={!newRole || assignMutation.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            {language === "ar" ? "تعيين" : "Assign"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing roles */}
      <div className="grid gap-3 sm:grid-cols-2">
        {roles.map(role => (
          <Card key={role.id} className={!role.is_active ? "opacity-60" : ""}>
            <CardContent className="flex items-center justify-between pt-4 pb-4">
              <div className="flex items-center gap-3">
                {getRoleBadge(role.role)}
                <div>
                  <Badge variant={role.is_active ? "default" : "secondary"} className="text-[10px]">
                    {role.is_active
                      ? (language === "ar" ? "نشط" : "Active")
                      : (language === "ar" ? "غير نشط" : "Inactive")}
                  </Badge>
                  {role.assigned_at && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(role.assigned_at), "MMM dd, yyyy")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    toggleMutation.mutate(
                      { id: role.id, is_active: !role.is_active, companyId },
                      {
                        onSuccess: () =>
                          toast({ title: language === "ar" ? "تم التحديث" : "Updated" }),
                      }
                    )
                  }
                >
                  {role.is_active ? (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-chart-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    removeMutation.mutate(
                      { id: role.id, companyId },
                      {
                        onSuccess: () =>
                          toast({ title: language === "ar" ? "تم الحذف" : "Role removed" }),
                      }
                    )
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {roles.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <Shield className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>{language === "ar" ? "لا توجد أدوار معيّنة" : "No roles assigned"}</p>
        </div>
      )}
    </div>
  );
}
