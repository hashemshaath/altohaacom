import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Building2, Pencil } from "lucide-react";
import { format } from "date-fns";

interface Props {
  userId: string;
  isAdmin?: boolean;
}

const emptyForm = {
  organization_name: "", organization_name_ar: "", membership_type: "member",
  membership_number: "", role_in_organization: "", role_in_organization_ar: "",
  joined_date: "", expiry_date: "", is_active: true, notes: "",
};

export default function JudgeMembershipsPanel({ userId, isAdmin }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: memberships, isLoading } = useQuery({
    queryKey: ["judge-memberships", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("judge_memberships")
        .select("*")
        .eq("user_id", userId)
        .order("is_active", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: userId,
        organization_name: form.organization_name,
        organization_name_ar: form.organization_name_ar || null,
        membership_type: form.membership_type || null,
        membership_number: form.membership_number || null,
        role_in_organization: form.role_in_organization || null,
        role_in_organization_ar: form.role_in_organization_ar || null,
        joined_date: form.joined_date || null,
        expiry_date: form.expiry_date || null,
        is_active: form.is_active,
        notes: form.notes || null,
      };
      if (editingId) {
        const { error } = await supabase.from("judge_memberships").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("judge_memberships").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judge-memberships", userId] });
      toast({ title: editingId ? (isAr ? "تم التحديث" : "Updated") : (isAr ? "تم الإضافة" : "Added") });
      resetForm();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("judge_memberships").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judge-memberships", userId] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); };

  const startEdit = (m: any) => {
    setForm({
      organization_name: m.organization_name || "",
      organization_name_ar: m.organization_name_ar || "",
      membership_type: m.membership_type || "member",
      membership_number: m.membership_number || "",
      role_in_organization: m.role_in_organization || "",
      role_in_organization_ar: m.role_in_organization_ar || "",
      joined_date: m.joined_date || "",
      expiry_date: m.expiry_date || "",
      is_active: m.is_active ?? true,
      notes: m.notes || "",
    });
    setEditingId(m.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{isAr ? "العضويات والمنظمات" : "Organization Memberships"}</h3>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? (isAr ? "إغلاق" : "Close") : <><Plus className="me-2 h-4 w-4" />{isAr ? "إضافة عضوية" : "Add Membership"}</>}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>{isAr ? "اسم المنظمة (EN)" : "Organization Name (EN)"} *</Label><Input value={form.organization_name} onChange={e => setForm(p => ({ ...p, organization_name: e.target.value }))} /></div>
              <div><Label>{isAr ? "اسم المنظمة (AR)" : "Organization Name (AR)"}</Label><Input value={form.organization_name_ar} onChange={e => setForm(p => ({ ...p, organization_name_ar: e.target.value }))} dir="rtl" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>{isAr ? "نوع العضوية" : "Membership Type"}</Label>
                <Select value={form.membership_type} onValueChange={v => setForm(p => ({ ...p, membership_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">{isAr ? "عضو" : "Member"}</SelectItem>
                    <SelectItem value="board_member">{isAr ? "عضو مجلس إدارة" : "Board Member"}</SelectItem>
                    <SelectItem value="president">{isAr ? "رئيس" : "President"}</SelectItem>
                    <SelectItem value="advisor">{isAr ? "مستشار" : "Advisor"}</SelectItem>
                    <SelectItem value="honorary">{isAr ? "فخري" : "Honorary"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{isAr ? "رقم العضوية" : "Membership #"}</Label><Input value={form.membership_number} onChange={e => setForm(p => ({ ...p, membership_number: e.target.value }))} /></div>
              <div><Label>{isAr ? "الدور" : "Role"}</Label><Input value={form.role_in_organization} onChange={e => setForm(p => ({ ...p, role_in_organization: e.target.value }))} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><Label>{isAr ? "تاريخ الانضمام" : "Joined Date"}</Label><Input type="date" value={form.joined_date} onChange={e => setForm(p => ({ ...p, joined_date: e.target.value }))} /></div>
              <div><Label>{isAr ? "تاريخ الانتهاء" : "Expiry Date"}</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} /></div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
                <Label>{isAr ? "نشطة" : "Active"}</Label>
              </div>
            </div>
            <div><Label>{isAr ? "ملاحظات" : "Notes"}</Label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
            <div className="flex gap-2">
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.organization_name}>
                {saveMutation.isPending ? "..." : editingId ? (isAr ? "تحديث" : "Update") : (isAr ? "إضافة" : "Add")}
              </Button>
              <Button variant="outline" onClick={resetForm}>{isAr ? "إلغاء" : "Cancel"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="grid gap-4 sm:grid-cols-2">
        {isLoading ? (
          <p className="text-muted-foreground col-span-2 text-center py-8">{isAr ? "جاري التحميل..." : "Loading..."}</p>
        ) : memberships?.length === 0 ? (
          <p className="text-muted-foreground col-span-2 text-center py-8">{isAr ? "لا توجد عضويات" : "No memberships recorded"}</p>
        ) : (
          memberships?.map(m => (
            <Card key={m.id} className={!m.is_active ? "opacity-60" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{isAr && m.organization_name_ar ? m.organization_name_ar : m.organization_name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="secondary">{m.membership_type}</Badge>
                        {m.is_active ? <Badge variant="outline" className="text-chart-3">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                      </div>
                      {m.role_in_organization && <p className="text-sm text-muted-foreground mt-1">{m.role_in_organization}</p>}
                      {m.membership_number && <p className="text-xs text-muted-foreground mt-1">#{m.membership_number}</p>}
                      {m.joined_date && <p className="text-xs text-muted-foreground">Since {format(new Date(m.joined_date), "yyyy")}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(m)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(m.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
