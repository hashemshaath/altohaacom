import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, Save, X, User, GripVertical } from "lucide-react";
import { AITextOptimizer } from "@/components/admin/AITextOptimizer";

interface Props {
  exhibitionId: string;
}

const ROLE_PRESETS = [
  { en: "Director", ar: "المدير" },
  { en: "Coordinator", ar: "المنسق" },
  { en: "PR Manager", ar: "مدير العلاقات العامة" },
  { en: "Technical Director", ar: "المدير الفني" },
  { en: "Operations Manager", ar: "مدير العمليات" },
  { en: "Media Officer", ar: "مسؤول الإعلام" },
  { en: "Registration Officer", ar: "مسؤول التسجيل" },
  { en: "Sponsorship Manager", ar: "مدير الرعايات" },
];

interface OfficialForm {
  full_name: string;
  full_name_ar: string;
  role_title: string;
  role_title_ar: string;
  email: string;
  phone: string;
}

const emptyOfficial: OfficialForm = {
  full_name: "", full_name_ar: "", role_title: "", role_title_ar: "", email: "", phone: "",
};

export function ExhibitionOfficialsPanel({ exhibitionId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => isAr ? ar : en;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<OfficialForm>(emptyOfficial);
  const [saving, setSaving] = useState(false);

  const { data: officials = [], isLoading } = useQuery({
    queryKey: ["exhibition-officials", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_officials")
        .select("id, exhibition_id, full_name, full_name_ar, role_title, role_title_ar, email, phone, avatar_url, user_id, sort_order, created_at")
        .eq("exhibition_id", exhibitionId)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!exhibitionId,
  });

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.role_title.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("exhibition_officials").insert({
        exhibition_id: exhibitionId,
        full_name: form.full_name,
        full_name_ar: form.full_name_ar || null,
        role_title: form.role_title,
        role_title_ar: form.role_title_ar || null,
        email: form.email || null,
        phone: form.phone || null,
        sort_order: officials.length,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["exhibition-officials", exhibitionId] });
      toast({ title: t("Official added", "تمت إضافة المسؤول") });
      setForm(emptyOfficial);
      setShowForm(false);
    } catch (err: any) {
      toast({ title: t("Error", "خطأ"), description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exhibition_officials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-officials", exhibitionId] });
      toast({ title: t("Removed", "تم الحذف") });
    },
  });

  if (!exhibitionId) {
    return (
      <p className="text-xs text-muted-foreground italic">
        {t("Save the exhibition first to add officials.", "احفظ الفعالية أولاً لإضافة المسؤولين.")}
      </p>
    );
  }

  const update = (key: keyof OfficialForm, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-3">
      {/* List */}
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : officials.length > 0 ? (
        <div className="space-y-2">
          {officials.map(off => (
            <div key={off.id} className="flex items-center gap-3 rounded-xl border p-2.5 bg-muted/20">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{isAr ? (off.full_name_ar || off.full_name) : off.full_name}</p>
                  <Badge variant="secondary" className="text-[9px] h-4 shrink-0">
                    {isAr ? (off.role_title_ar || off.role_title) : off.role_title}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {[off.email, off.phone].filter(Boolean).join(" • ")}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                onClick={() => deleteMutation.mutate(off.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {/* Add form */}
      {showForm ? (
        <div className="rounded-xl border p-3 space-y-3 bg-muted/10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">{t("Add Official", "إضافة مسؤول")}</p>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowForm(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t("Name (EN)", "الاسم (إنجليزي)")} *</Label>
                <AITextOptimizer text={form.full_name} lang="en" onTranslated={v => update("full_name_ar", v)} compact />
              </div>
              <Input value={form.full_name} onChange={e => update("full_name", e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t("Name (AR)", "الاسم (عربي)")}</Label>
                <AITextOptimizer text={form.full_name_ar} lang="ar" onTranslated={v => update("full_name", v)} compact />
              </div>
              <Input value={form.full_name_ar} onChange={e => update("full_name_ar", e.target.value)} className="h-8 text-sm" dir="rtl" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t("Role (EN)", "الدور (إنجليزي)")} *</Label>
                <AITextOptimizer text={form.role_title} lang="en" onTranslated={v => update("role_title_ar", v)} compact />
              </div>
              <Input
                value={form.role_title}
                onChange={e => update("role_title", e.target.value)}
                className="h-8 text-sm"
                list="role-presets-en"
              />
              <datalist id="role-presets-en">
                {ROLE_PRESETS.map(r => <option key={r.en} value={r.en} />)}
              </datalist>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t("Role (AR)", "الدور (عربي)")}</Label>
                <AITextOptimizer text={form.role_title_ar} lang="ar" onTranslated={v => update("role_title", v)} compact />
              </div>
              <Input
                value={form.role_title_ar}
                onChange={e => update("role_title_ar", e.target.value)}
                className="h-8 text-sm"
                dir="rtl"
                list="role-presets-ar"
              />
              <datalist id="role-presets-ar">
                {ROLE_PRESETS.map(r => <option key={r.ar} value={r.ar} />)}
              </datalist>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">{t("Email", "البريد الإلكتروني")}</Label>
              <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("Phone", "الهاتف")}</Label>
              <Input value={form.phone} onChange={e => update("phone", e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowForm(false)}>
              {t("Cancel", "إلغاء")}
            </Button>
            <Button size="sm" className="flex-1 gap-1" onClick={handleSave} disabled={!form.full_name.trim() || !form.role_title.trim() || saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {t("Add", "إضافة")}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" />
          {t("Add Official", "إضافة مسؤول")}
        </Button>
      )}
    </div>
  );
}
