import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Star, Award, Building, Search } from "lucide-react";

const TIER_OPTIONS = [
  { value: "strategic_partner", en: "Strategic Partner", ar: "شريك استراتيجي" },
  { value: "platinum", en: "Platinum Partner", ar: "الشريك البلاتيني" },
  { value: "gold", en: "Gold Sponsor", ar: "الراعي الذهبي" },
  { value: "silver", en: "Silver Sponsor", ar: "الراعي الفضي" },
  { value: "participant", en: "Participant", ar: "مشارك" },
  { value: "organizer", en: "Organizer", ar: "الجهة المنظمة" },
  { value: "official_contractor", en: "Official Contractor", ar: "المقاول الرسمي" },
  { value: "official_shipping", en: "Official Shipping Provider", ar: "مزوّد الشحن الرسمي" },
  { value: "supporter", en: "Supporter", ar: "داعم" },
  { value: "media_partner", en: "Media Partner", ar: "الشريك الإعلامي" },
  { value: "partner", en: "Partner", ar: "شريك" },
];

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

export const ExhibitionSponsorsPanel = memo(function ExhibitionSponsorsPanel({ exhibitionId, isAr }: Props) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", name_ar: "", tier: "gold", logo_url: "", website_url: "", company_id: "" });
  const [companySearch, setCompanySearch] = useState("");

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
    enabled: showForm,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("exhibition_sponsors").insert({
        exhibition_id: exhibitionId,
        name: form.name,
        name_ar: form.name_ar || null,
        tier: form.tier,
        logo_url: form.logo_url || null,
        website_url: form.website_url || null,
        company_id: form.company_id || null,
        sort_order: (sponsors?.length || 0) + 1,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-sponsors-admin", exhibitionId] });
      toast({ title: isAr ? "تمت الإضافة" : "Sponsor added" });
      setShowForm(false);
      setForm({ name: "", name_ar: "", tier: "gold", logo_url: "", website_url: "", company_id: "" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exhibition_sponsors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-sponsors-admin", exhibitionId] });
      toast({ title: isAr ? "تم الحذف" : "Sponsor removed" });
    },
  });

  const selectCompany = (c: any) => {
    setForm(f => ({
      ...f,
      company_id: c.id,
      name: c.name || f.name,
      name_ar: c.name_ar || f.name_ar,
      logo_url: c.logo_url || f.logo_url,
      website_url: c.website || f.website_url,
    }));
    setCompanySearch("");
  };

  const tierLabel = (tier: string) => {
    const t = TIER_OPTIONS.find(o => o.value === tier);
    return t ? (isAr ? t.ar : t.en) : tier;
  };

  if (!exhibitionId) return <p className="text-sm text-muted-foreground">{isAr ? "احفظ المعرض أولاً" : "Save the exhibition first"}</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{sponsors?.length || 0} {isAr ? "راعي/شريك" : "sponsors/partners"}</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="me-1 h-3.5 w-3.5" />{isAr ? "إضافة" : "Add Sponsor"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 space-y-3 bg-muted/30">
          <div>
            <Label className="text-xs">{isAr ? "بحث شركة (اختياري)" : "Search Company (optional)"}</Label>
            <div className="relative">
              <Search className="absolute start-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="h-9 ps-8" value={companySearch} onChange={e => setCompanySearch(e.target.value)} placeholder={isAr ? "ابحث عن شركة..." : "Search companies..."} />
            </div>
            {companySearch && companies && companies.length > 0 && (
              <div className="mt-1 border rounded-lg bg-popover max-h-32 overflow-y-auto">
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
            <div><Label className="text-xs">{isAr ? "الاسم (EN)" : "Name (EN)"}</Label><Input className="h-9" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label className="text-xs">{isAr ? "الاسم (AR)" : "Name (AR)"}</Label><Input className="h-9" value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} dir="rtl" /></div>
            <div>
              <Label className="text-xs">{isAr ? "الفئة" : "Tier"}</Label>
              <Select value={form.tier} onValueChange={v => setForm(f => ({ ...f, tier: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{TIER_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{isAr ? o.ar : o.en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">{isAr ? "رابط الشعار" : "Logo URL"}</Label><Input className="h-9" value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => addMutation.mutate()} disabled={!form.name || addMutation.isPending}>
              {addMutation.isPending ? (isAr ? "جاري الإضافة..." : "Adding...") : (isAr ? "إضافة" : "Add")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
          </div>
        </Card>
      )}

      {sponsors && sponsors.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "الراعي/الشريك" : "Sponsor/Partner"}</TableHead>
                <TableHead>{isAr ? "الفئة" : "Tier"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sponsors.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {s.logo_url ? <img src={s.logo_url} className="h-6 w-6 rounded object-contain" /> : <Building className="h-4 w-4 text-muted-foreground" />}
                      <span>{isAr && s.name_ar ? s.name_ar : s.name}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{tierLabel(s.tier || "")}</Badge></TableCell>
                  <TableCell><Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "غير نشط" : "Inactive")}</Badge></TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : !showForm && (
        <div className="py-8 text-center">
          <Award className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{isAr ? "لا يوجد رعاة أو شركاء بعد" : "No sponsors or partners yet"}</p>
        </div>
      )}
    </div>
  );
});
