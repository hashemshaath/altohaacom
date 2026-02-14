import { useState } from "react";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyPagePermissions } from "@/hooks/useCompanyPermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, MapPin, Phone, Mail, Star, User, Plus, Pencil, Trash2, Save,
} from "lucide-react";

interface BranchForm {
  name: string;
  name_ar: string;
  address: string;
  address_ar: string;
  city: string;
  country: string;
  postal_code: string;
  phone: string;
  email: string;
  manager_name: string;
  manager_phone: string;
  manager_email: string;
  is_headquarters: boolean;
  is_active: boolean;
}

const emptyForm: BranchForm = {
  name: "", name_ar: "", address: "", address_ar: "", city: "", country: "",
  postal_code: "", phone: "", email: "", manager_name: "", manager_phone: "",
  manager_email: "", is_headquarters: false, is_active: true,
};

export default function CompanyBranches() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { companyId } = useCompanyAccess();
  const { toast } = useToast();
  const qc = useQueryClient();
  const permissions = useCompanyPagePermissions();
  const canEdit = permissions.canEditProfile;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm);

  const { data: branches, isLoading } = useQuery({
    queryKey: ["companyBranches", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_branches")
        .select("*")
        .eq("company_id", companyId)
        .order("is_headquarters", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const saveBranch = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company");
      const payload = {
        company_id: companyId,
        name: form.name,
        name_ar: form.name_ar || null,
        address: form.address || null,
        address_ar: form.address_ar || null,
        city: form.city || null,
        country: form.country || null,
        postal_code: form.postal_code || null,
        phone: form.phone || null,
        email: form.email || null,
        manager_name: form.manager_name || null,
        manager_phone: form.manager_phone || null,
        manager_email: form.manager_email || null,
        is_headquarters: form.is_headquarters,
        is_active: form.is_active,
      };

      if (editingId) {
        const { error } = await supabase.from("company_branches").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company_branches").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companyBranches"] });
      toast({ title: isAr ? "تم الحفظ بنجاح" : "Saved successfully" });
      closeDialog();
    },
    onError: (err: any) => toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message }),
  });

  const deleteBranch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_branches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companyBranches"] });
      toast({ title: isAr ? "تم الحذف" : "Branch deleted" });
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (branch: any) => {
    setEditingId(branch.id);
    setForm({
      name: branch.name || "",
      name_ar: branch.name_ar || "",
      address: branch.address || "",
      address_ar: branch.address_ar || "",
      city: branch.city || "",
      country: branch.country || "",
      postal_code: branch.postal_code || "",
      phone: branch.phone || "",
      email: branch.email || "",
      manager_name: branch.manager_name || "",
      manager_phone: branch.manager_phone || "",
      manager_email: branch.manager_email || "",
      is_headquarters: branch.is_headquarters || false,
      is_active: branch.is_active !== false,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const updateField = (field: keyof BranchForm, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {isAr ? "الفروع" : "Branches"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isAr ? "فروع الشركة ومقرها الرئيسي" : "Company branches and headquarters"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && branches && (
            <Badge variant="secondary" className="text-sm">
              {branches.length} {isAr ? "فرع" : "branches"}
            </Badge>
          )}
          {canEdit && (
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {isAr ? "إضافة فرع" : "Add Branch"}
            </Button>
          )}
        </div>
      </div>

      {/* Branch Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {editingId ? (isAr ? "تعديل الفرع" : "Edit Branch") : (isAr ? "فرع جديد" : "New Branch")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isAr ? "الاسم (EN)" : "Name (EN)"} *</Label>
                <Input value={form.name} onChange={e => updateField("name", e.target.value)} />
              </div>
              <div>
                <Label>{isAr ? "الاسم (AR)" : "Name (AR)"}</Label>
                <Input value={form.name_ar} onChange={e => updateField("name_ar", e.target.value)} dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isAr ? "العنوان (EN)" : "Address (EN)"}</Label>
                <Input value={form.address} onChange={e => updateField("address", e.target.value)} />
              </div>
              <div>
                <Label>{isAr ? "العنوان (AR)" : "Address (AR)"}</Label>
                <Input value={form.address_ar} onChange={e => updateField("address_ar", e.target.value)} dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>{isAr ? "المدينة" : "City"}</Label>
                <Input value={form.city} onChange={e => updateField("city", e.target.value)} />
              </div>
              <div>
                <Label>{isAr ? "الدولة" : "Country"}</Label>
                <Input value={form.country} onChange={e => updateField("country", e.target.value)} />
              </div>
              <div>
                <Label>{isAr ? "الرمز البريدي" : "Postal Code"}</Label>
                <Input value={form.postal_code} onChange={e => updateField("postal_code", e.target.value)} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isAr ? "الهاتف" : "Phone"}</Label>
                <Input value={form.phone} onChange={e => updateField("phone", e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                <Input value={form.email} onChange={e => updateField("email", e.target.value)} dir="ltr" type="email" />
              </div>
            </div>
            <Separator />
            <p className="text-sm font-medium">{isAr ? "مدير الفرع" : "Branch Manager"}</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>{isAr ? "الاسم" : "Name"}</Label>
                <Input value={form.manager_name} onChange={e => updateField("manager_name", e.target.value)} />
              </div>
              <div>
                <Label>{isAr ? "الهاتف" : "Phone"}</Label>
                <Input value={form.manager_phone} onChange={e => updateField("manager_phone", e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label>{isAr ? "البريد" : "Email"}</Label>
                <Input value={form.manager_email} onChange={e => updateField("manager_email", e.target.value)} dir="ltr" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Switch checked={form.is_headquarters} onCheckedChange={v => updateField("is_headquarters", v)} />
                <Label>{isAr ? "مقر رئيسي" : "Headquarters"}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_active} onCheckedChange={v => updateField("is_active", v)} />
                <Label>{isAr ? "نشط" : "Active"}</Label>
              </div>
            </div>
            <Button className="w-full gap-2" onClick={() => saveBranch.mutate()} disabled={!form.name || saveBranch.isPending}>
              <Save className="h-4 w-4" />
              {saveBranch.isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : branches && branches.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {branches.map((branch, index) => (
            <Card
              key={branch.id}
              className={`group animate-fade-in overflow-hidden hover:shadow-md transition-shadow ${
                branch.is_headquarters ? "border-s-[3px] border-s-primary" : ""
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      branch.is_headquarters ? "bg-primary/10" : "bg-muted"
                    }`}>
                      {branch.is_headquarters ? (
                        <Star className="h-5 w-5 text-primary" />
                      ) : (
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {isAr ? branch.name_ar || branch.name : branch.name}
                      </CardTitle>
                      {branch.name_ar && !isAr && (
                        <p className="text-xs text-muted-foreground">{branch.name_ar}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {branch.is_headquarters && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0">
                        {isAr ? "مقر رئيسي" : "HQ"}
                      </Badge>
                    )}
                    <Badge variant={branch.is_active !== false ? "secondary" : "outline"} className="shrink-0">
                      {branch.is_active !== false ? (isAr ? "نشط" : "Active") : (isAr ? "غير نشط" : "Inactive")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <Separator />
                {(branch.address || branch.city || branch.country) && (
                  <div className="flex items-start gap-2.5 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>{[isAr ? branch.address_ar || branch.address : branch.address, branch.city, branch.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {branch.phone && (
                  <a href={`tel:${branch.phone}`} className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{branch.phone}</span>
                  </a>
                )}
                {branch.email && (
                  <a href={`mailto:${branch.email}`} className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>{branch.email}</span>
                  </a>
                )}
                {branch.manager_name && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{branch.manager_name}</span>
                  </div>
                )}

                {canEdit && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={() => openEdit(branch)}>
                      <Pencil className="h-3 w-3" />
                      {isAr ? "تعديل" : "Edit"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{isAr ? "حذف الفرع" : "Delete Branch"}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {isAr ? "هل أنت متأكد من حذف هذا الفرع؟" : "Are you sure you want to delete this branch?"}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteBranch.mutate(branch.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isAr ? "حذف" : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {isAr ? "لا توجد فروع" : "No branches found"}
            </p>
            {canEdit && (
              <Button variant="outline" className="mt-3 gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                {isAr ? "إضافة أول فرع" : "Add first branch"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
