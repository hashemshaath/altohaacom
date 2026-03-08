import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, CheckCircle, XCircle, Tags, Tag, Save, X } from "lucide-react";
import {
  useCompanyRoles,
  useAssignCompanyRole,
  useToggleCompanyRole,
  useRemoveCompanyRole,
} from "@/hooks/useCompanyRoles";
import { format } from "date-fns";

interface Props {
  companyId: string;
}

export function CompanyClassificationsPanel({ companyId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading } = useCompanyRoles(companyId);
  const assignMutation = useAssignCompanyRole(companyId);
  const toggleMutation = useToggleCompanyRole();
  const removeMutation = useRemoveCompanyRole();

  const [newRole, setNewRole] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customForm, setCustomForm] = useState({ name: "", name_ar: "", color: "bg-primary/10 text-primary border-primary/20" });

  // Fetch all classifications from DB
  const { data: classifications = [] } = useQuery({
    queryKey: ["company-classifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_classifications")
        .select("id, name, name_ar, description, color, icon, is_active, is_system, sort_order, created_by, created_at")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const addClassificationMutation = useMutation({
    mutationFn: async (form: typeof customForm) => {
      const user = (await supabase.auth.getUser()).data.user;
      const { error } = await supabase.from("company_classifications").insert({
        name: form.name,
        name_ar: form.name_ar || null,
        color: form.color,
        is_system: false,
        created_by: user?.id || null,
        sort_order: classifications.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-classifications"] });
      setShowAddCustom(false);
      setCustomForm({ name: "", name_ar: "", color: "bg-primary/10 text-primary border-primary/20" });
      toast({ title: isAr ? "تم إضافة التصنيف" : "Classification added" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: isAr ? "فشل الإضافة" : "Failed", description: e.message }),
  });

  const deleteClassificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_classifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-classifications"] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  const assignedRoleValues = roles.map(r => r.role);
  const availableClassifications = classifications.filter(
    (c: any) => !assignedRoleValues.includes(c.name.toLowerCase())
  );

  const getClassColor = (roleName: string) => {
    const cls = classifications.find((c: any) => c.name.toLowerCase() === roleName.toLowerCase());
    return cls?.color || "bg-muted text-muted-foreground";
  };

  const getClassLabel = (roleName: string) => {
    const cls = classifications.find((c: any) => c.name.toLowerCase() === roleName.toLowerCase());
    if (cls) return isAr ? (cls.name_ar || cls.name) : cls.name;
    return roleName;
  };

  const handleAssign = (value: string) => {
    if (!value) return;
    assignMutation.mutate(value.toLowerCase(), {
      onSuccess: () => {
        setNewRole("");
        toast({ title: isAr ? "تم تعيين التصنيف" : "Classification assigned" });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: isAr ? "فشل التعيين" : "Failed", description: err.message });
      },
    });
  };

  const COLOR_OPTIONS = [
    { value: "bg-chart-4/10 text-chart-4 border-chart-4/20", label: "Gold" },
    { value: "bg-primary/10 text-primary border-primary/20", label: "Primary" },
    { value: "bg-chart-3/10 text-chart-3 border-chart-3/20", label: "Green" },
    { value: "bg-chart-5/10 text-chart-5 border-chart-5/20", label: "Teal" },
    { value: "bg-chart-1/10 text-chart-1 border-chart-1/20", label: "Orange" },
    { value: "bg-chart-2/10 text-chart-2 border-chart-2/20", label: "Blue" },
    { value: "bg-destructive/10 text-destructive border-destructive/20", label: "Red" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Tags className="h-5 w-5 text-primary" />
          {isAr ? "تصنيفات الشركة" : "Company Classifications"}
        </h3>
        <Button variant="outline" size="sm" onClick={() => setShowAddCustom(!showAddCustom)}>
          {showAddCustom ? <><X className="h-4 w-4 me-1" />{isAr ? "إلغاء" : "Cancel"}</> : <><Plus className="h-4 w-4 me-1" />{isAr ? "تصنيف جديد" : "New Classification"}</>}
        </Button>
      </div>

      {/* Add custom classification form */}
      {showAddCustom && (
        <Card className="border-primary/30">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isAr ? "الاسم (EN)" : "Name (EN)"} *</Label>
                <Input value={customForm.name} onChange={e => setCustomForm({ ...customForm, name: e.target.value })} placeholder="e.g. Equipment Provider" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "الاسم (AR)" : "Name (AR)"}</Label>
                <Input value={customForm.name_ar} onChange={e => setCustomForm({ ...customForm, name_ar: e.target.value })} dir="rtl" placeholder="مثال: مزود معدات" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "اللون" : "Color"}</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCustomForm({ ...customForm, color: c.value })}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${c.value} ${customForm.color === c.value ? "ring-2 ring-primary ring-offset-2" : ""}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={() => addClassificationMutation.mutate(customForm)} disabled={!customForm.name || addClassificationMutation.isPending}>
              <Save className="h-4 w-4 me-2" />{isAr ? "حفظ" : "Save"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Available classifications to assign */}
      <Card>
        <CardContent className="pt-6">
          <Label className="mb-3 block">{isAr ? "تعيين تصنيف" : "Assign Classification"}</Label>
          <div className="flex flex-wrap gap-2">
            {availableClassifications.map((cls: any) => (
              <button
                key={cls.id}
                type="button"
                onClick={() => handleAssign(cls.name)}
                disabled={assignMutation.isPending}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all hover:ring-2 hover:ring-primary/30 ${cls.color}`}
              >
                <Plus className="h-3 w-3 inline me-1" />
                {isAr ? (cls.name_ar || cls.name) : cls.name}
              </button>
            ))}
            {availableClassifications.length === 0 && (
              <p className="text-sm text-muted-foreground">{isAr ? "تم تعيين جميع التصنيفات" : "All classifications assigned"}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active classifications */}
      <div className="grid gap-3 sm:grid-cols-2">
        {roles.map(role => (
          <Card key={role.id} className={!role.is_active ? "opacity-60" : ""}>
            <CardContent className="flex items-center justify-between pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Badge className={getClassColor(role.role)}>
                  <Tag className="h-3 w-3 me-1" />
                  {getClassLabel(role.role)}
                </Badge>
                <div>
                  <Badge variant={role.is_active ? "default" : "secondary"} className="text-[10px]">
                    {role.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "غير نشط" : "Inactive")}
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
                  variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => toggleMutation.mutate(
                    { id: role.id, is_active: !role.is_active, companyId },
                    { onSuccess: () => toast({ title: isAr ? "تم التحديث" : "Updated" }) }
                  )}
                >
                  {role.is_active ? <XCircle className="h-4 w-4 text-muted-foreground" /> : <CheckCircle className="h-4 w-4 text-chart-5" />}
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => removeMutation.mutate(
                    { id: role.id, companyId },
                    { onSuccess: () => toast({ title: isAr ? "تم الحذف" : "Removed" }) }
                  )}
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
          <Tags className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>{isAr ? "لا توجد تصنيفات معيّنة" : "No classifications assigned"}</p>
        </div>
      )}

      {/* All classifications management */}
      <Card>
        <CardContent className="pt-6">
          <Label className="mb-3 block text-sm font-semibold">{isAr ? "جميع التصنيفات المتاحة" : "All Available Classifications"}</Label>
          <div className="flex flex-wrap gap-2">
            {classifications.map((cls: any) => (
              <div key={cls.id} className="flex items-center gap-1">
                <Badge className={cls.color}>
                  {isAr ? (cls.name_ar || cls.name) : cls.name}
                </Badge>
                {!cls.is_system && (
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => deleteClassificationMutation.mutate(cls.id)}>
                    <X className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
