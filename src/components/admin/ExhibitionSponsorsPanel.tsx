import { useState, memo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Award, Building, Search, Pencil, X, Check, AlertTriangle, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const TIER_OPTIONS = [
  { value: "strategic_partner", en: "Strategic Partner", ar: "شريك استراتيجي", color: "bg-chart-1/10 text-chart-1 border-chart-1/20" },
  { value: "platinum", en: "Platinum Partner", ar: "الشريك البلاتيني", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200" },
  { value: "gold", en: "Gold Sponsor", ar: "الراعي الذهبي", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200" },
  { value: "silver", en: "Silver Sponsor", ar: "الراعي الفضي", color: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200" },
  { value: "participant", en: "Participant", ar: "مشارك", color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200" },
  { value: "organizer", en: "Organizer", ar: "الجهة المنظمة", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200" },
  { value: "official_contractor", en: "Official Contractor", ar: "المقاول الرسمي", color: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200" },
  { value: "official_shipping", en: "Official Shipping", ar: "مزوّد الشحن الرسمي", color: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200" },
  { value: "supporter", en: "Supporter", ar: "داعم", color: "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200" },
  { value: "media_partner", en: "Media Partner", ar: "الشريك الإعلامي", color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200" },
  { value: "partner", en: "Partner", ar: "شريك", color: "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200" },
];

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

const emptyForm = { name: "", name_ar: "", tier: "gold", logo_url: "", website_url: "", company_id: "" };

export const ExhibitionSponsorsPanel = memo(function ExhibitionSponsorsPanel({ exhibitionId, isAr }: Props) {
  const queryClient = useQueryClient();
  const t = (en: string, ar: string) => isAr ? ar : en;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [companySearch, setCompanySearch] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: sponsors } = useQuery({
    queryKey: ["exhibition-sponsors-admin", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_sponsors")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!exhibitionId,
  });

  const { data: companies } = useQuery({
    queryKey: ["companies-search-sponsors", companySearch],
    queryFn: async () => {
      let q = supabase.from("companies").select("id, name, name_ar, logo_url, website").limit(10);
      if (companySearch) q = q.ilike("name", `%${companySearch}%`);
      const { data } = await q;
      return data || [];
    },
    enabled: showForm || !!editingId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Duplicate check
      const existing = sponsors?.find(s =>
        s.id !== editingId &&
        s.name.toLowerCase() === form.name.toLowerCase() &&
        s.tier === form.tier
      );
      if (existing) throw new Error(t("This sponsor already exists with the same tier", "هذا الراعي موجود بالفعل بنفس الفئة"));

      if (editingId) {
        const { error } = await supabase.from("exhibition_sponsors").update({
          name: form.name, name_ar: form.name_ar || null,
          tier: form.tier, logo_url: form.logo_url || null,
          website_url: form.website_url || null, company_id: form.company_id || null,
        }).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("exhibition_sponsors").insert({
          exhibition_id: exhibitionId,
          name: form.name, name_ar: form.name_ar || null,
          tier: form.tier, logo_url: form.logo_url || null,
          website_url: form.website_url || null, company_id: form.company_id || null,
          sort_order: (sponsors?.length || 0) + 1, is_active: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-sponsors-admin", exhibitionId] });
      toast({ title: editingId ? t("Sponsor updated", "تم تحديث الراعي") : t("Sponsor added", "تمت الإضافة") });
      resetForm();
    },
    onError: (err: Error) => toast({ title: t("Error", "خطأ"), description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exhibition_sponsors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-sponsors-admin", exhibitionId] });
      toast({ title: t("Sponsor removed", "تم الحذف") });
      setDeleteConfirmId(null);
    },
  });

  const resetForm = useCallback(() => {
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
    setCompanySearch("");
  }, []);

  const startEdit = useCallback((s: any) => {
    setForm({
      name: s.name || "", name_ar: s.name_ar || "",
      tier: s.tier || "gold", logo_url: s.logo_url || "",
      website_url: s.website_url || "", company_id: s.company_id || "",
    });
    setEditingId(s.id);
    setShowForm(true);
  }, []);

  const selectCompany = (c: any) => {
    setForm(f => ({
      ...f, company_id: c.id,
      name: c.name || f.name, name_ar: c.name_ar || f.name_ar,
      logo_url: c.logo_url || f.logo_url, website_url: c.website || f.website_url,
    }));
    setCompanySearch("");
  };

  const tierInfo = (tier: string) => TIER_OPTIONS.find(o => o.value === tier) || TIER_OPTIONS[2];

  if (!exhibitionId) return <p className="text-sm text-muted-foreground">{t("Save the exhibition first", "احفظ المعرض أولاً")}</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">{sponsors?.length || 0} {t("sponsors/partners", "راعي/شريك")}</p>
        {!showForm && (
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs rounded-xl" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-3.5 w-3.5" />{t("Add Sponsor", "إضافة راعي")}
          </Button>
        )}
      </div>

      {/* ── Inline Add/Edit Form ── */}
      {showForm && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-4 space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              {editingId ? <Pencil className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              {editingId ? t("Edit Sponsor", "تعديل الراعي") : t("Add New Sponsor", "إضافة راعي جديد")}
            </p>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={resetForm}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Company search */}
          <div>
            <Label className="text-[12px] text-muted-foreground">{t("Link to existing company (optional)", "ربط بشركة موجودة (اختياري)")}</Label>
            <div className="relative mt-1">
              <Search className="absolute start-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="h-8 ps-8 text-xs" value={companySearch} onChange={e => setCompanySearch(e.target.value)} placeholder={t("Search companies...", "ابحث عن شركة...")} />
            </div>
            {companySearch && companies && companies.length > 0 && (
              <div className="mt-1 rounded-lg border bg-popover max-h-28 overflow-y-auto">
                {companies.map(c => (
                  <button key={c.id} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-start" onClick={() => selectCompany(c)}>
                    {c.logo_url && <img src={c.logo_url} className="h-5 w-5 rounded object-contain" />}
                    <span>{isAr && c.name_ar ? c.name_ar : c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div><Label className="text-[12px]">{t("Name (EN)", "الاسم (EN)")} *</Label><Input className="h-8 text-xs" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label className="text-[12px]">{t("Name (AR)", "الاسم (AR)")}</Label><Input className="h-8 text-xs" value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} dir="rtl" /></div>
            <div>
              <Label className="text-[12px]">{t("Tier", "الفئة")}</Label>
              <Select value={form.tier} onValueChange={v => setForm(f => ({ ...f, tier: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{TIER_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{isAr ? o.ar : o.en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-[12px]">{t("Logo URL", "رابط الشعار")}</Label><Input className="h-8 text-xs" value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} /></div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
              <Check className="h-3.5 w-3.5" />
              {saveMutation.isPending ? "..." : editingId ? t("Update", "تحديث") : t("Add", "إضافة")}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 rounded-xl text-xs" onClick={resetForm}>{t("Cancel", "إلغاء")}</Button>
          </div>
        </div>
      )}

      {/* ── Sponsors Grid ── */}
      {sponsors && sponsors.length > 0 ? (
        <div className="grid gap-2">
          {sponsors.map(s => {
            const tier = tierInfo(s.tier || "");
            const isDeleting = deleteConfirmId === s.id;
            return (
              <div key={s.id} className={cn(
                "group flex items-center gap-3 rounded-xl border p-3 transition-all duration-200",
                isDeleting ? "border-destructive/30 bg-destructive/5" : "border-border/50 hover:border-border hover:shadow-sm"
              )}>
                {s.logo_url ? (
                  <img src={s.logo_url} className="h-9 w-9 rounded-lg object-contain bg-muted p-0.5 shrink-0" />
                ) : (
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{isAr && s.name_ar ? s.name_ar : s.name}</p>
                  <Badge className={cn("text-[12px] h-4 border mt-0.5", tier.color)}>{isAr ? tier.ar : tier.en}</Badge>
                </div>

                {isDeleting ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in-0 duration-200">
                    <span className="text-[12px] text-destructive font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {t("Delete?", "حذف؟")}
                    </span>
                    <Button size="icon" variant="destructive" className="h-7 w-7 rounded-lg" onClick={() => deleteMutation.mutate(s.id)} disabled={deleteMutation.isPending}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => setDeleteConfirmId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => startEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:text-destructive" onClick={() => setDeleteConfirmId(s.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : !showForm && (
        <div className="py-10 text-center rounded-xl border border-dashed border-border/60">
          <Award className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
          <p className="text-xs text-muted-foreground">{t("No sponsors or partners yet", "لا يوجد رعاة أو شركاء بعد")}</p>
          <Button size="sm" variant="link" className="mt-1 text-xs h-7" onClick={() => setShowForm(true)}>
            {t("Add the first sponsor", "أضف أول راعي")}
          </Button>
        </div>
      )}
    </div>
  );
});
