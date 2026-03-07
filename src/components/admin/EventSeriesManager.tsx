import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Pencil, Trash2, ChevronDown, Layers, Calendar, Copy, Loader2, X,
  Landmark, Trophy, Shuffle,
} from "lucide-react";

interface SeriesRow {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string | null;
  description: string | null;
  description_ar: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  series_type: string;
  default_venue: string | null;
  default_venue_ar: string | null;
  default_city: string | null;
  default_country: string | null;
  default_organizer_name: string | null;
  default_organizer_name_ar: string | null;
  default_organizer_email: string | null;
  default_organizer_phone: string | null;
  default_organizer_website: string | null;
  website_url: string | null;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
}

const emptyForm = {
  name: "", name_ar: "", description: "", description_ar: "",
  series_type: "exhibition" as string,
  default_venue: "", default_venue_ar: "", default_city: "", default_country: "",
  default_organizer_name: "", default_organizer_name_ar: "",
  default_organizer_email: "", default_organizer_phone: "", default_organizer_website: "",
  logo_url: "", cover_image_url: "", website_url: "", tags_input: "",
};

const typeIcons: Record<string, typeof Landmark> = {
  exhibition: Landmark,
  competition: Trophy,
  mixed: Shuffle,
};

interface Props {
  onCreateEdition?: (series: SeriesRow, year: number) => void;
}

export function EventSeriesManager({ onCreateEdition }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => isAr ? ar : en;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: seriesList, isLoading } = useQuery({
    queryKey: ["event-series"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("event_series")
        .select("id, name, name_ar, description, description_ar, series_type, logo_url, cover_image_url, default_venue, default_venue_ar, default_city, default_country, default_organizer_name, default_organizer_name_ar, default_organizer_email, default_organizer_phone, default_organizer_website, website_url, tags, is_active, created_at")
        .order("name");
      if (error) throw error;
      return data as SeriesRow[];
    },
  });

  // Get edition counts per series
  const { data: editionCounts } = useQuery({
    queryKey: ["event-series-edition-counts"],
    queryFn: async () => {
      const [exh, comp] = await Promise.all([
        (supabase as any).from("exhibitions").select("series_id, edition_year").not("series_id", "is", null),
        (supabase as any).from("competitions").select("series_id, edition_year").not("series_id", "is", null),
      ]);
      const counts: Record<string, { exhibitions: number; competitions: number; years: number[] }> = {};
      (exh.data || []).forEach((r: any) => {
        if (!counts[r.series_id]) counts[r.series_id] = { exhibitions: 0, competitions: 0, years: [] };
        counts[r.series_id].exhibitions++;
        if (r.edition_year && !counts[r.series_id].years.includes(r.edition_year)) counts[r.series_id].years.push(r.edition_year);
      });
      (comp.data || []).forEach((r: any) => {
        if (!counts[r.series_id]) counts[r.series_id] = { exhibitions: 0, competitions: 0, years: [] };
        counts[r.series_id].competitions++;
        if (r.edition_year && !counts[r.series_id].years.includes(r.edition_year)) counts[r.series_id].years.push(r.edition_year);
      });
      return counts;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name,
        name_ar: form.name_ar || null,
        description: form.description || null,
        description_ar: form.description_ar || null,
        series_type: form.series_type,
        default_venue: form.default_venue || null,
        default_venue_ar: form.default_venue_ar || null,
        default_city: form.default_city || null,
        default_country: form.default_country || null,
        default_organizer_name: form.default_organizer_name || null,
        default_organizer_name_ar: form.default_organizer_name_ar || null,
        default_organizer_email: form.default_organizer_email || null,
        default_organizer_phone: form.default_organizer_phone || null,
        default_organizer_website: form.default_organizer_website || null,
        logo_url: form.logo_url || null,
        cover_image_url: form.cover_image_url || null,
        website_url: form.website_url || null,
        tags: form.tags_input ? form.tags_input.split(",").map(s => s.trim()).filter(Boolean) : null,
        created_by: user?.id,
      };
      if (editingId) {
        const { error } = await (supabase as any).from("event_series").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("event_series").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-series"] });
      toast({ title: editingId ? t("Series updated", "تم تحديث السلسلة") : t("Series created", "تم إنشاء السلسلة") });
      resetForm();
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("event_series").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-series"] });
      toast({ title: t("Series deleted", "تم حذف السلسلة") });
    },
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (s: SeriesRow) => {
    setForm({
      name: s.name, name_ar: s.name_ar || "", description: s.description || "",
      description_ar: s.description_ar || "", series_type: s.series_type,
      default_venue: s.default_venue || "", default_venue_ar: s.default_venue_ar || "",
      default_city: s.default_city || "", default_country: s.default_country || "",
      default_organizer_name: s.default_organizer_name || "",
      default_organizer_name_ar: s.default_organizer_name_ar || "",
      default_organizer_email: s.default_organizer_email || "",
      default_organizer_phone: s.default_organizer_phone || "",
      default_organizer_website: s.default_organizer_website || "",
      logo_url: s.logo_url || "", cover_image_url: s.cover_image_url || "",
      website_url: s.website_url || "", tags_input: (s.tags || []).join(", "),
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleCreateEdition = (s: SeriesRow) => {
    const counts = editionCounts?.[s.id];
    const lastYear = counts?.years?.sort((a, b) => b - a)[0];
    const nextYear = lastYear ? lastYear + 1 : new Date().getFullYear();
    onCreateEdition?.(s, nextYear);
  };

  const upd = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const TypeIcon = typeIcons[form.series_type] || Layers;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{t("Event Series (Recurring Brands)", "سلاسل الفعاليات (العلامات المتكررة)")}</CardTitle>
          </div>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm ? <><X className="me-1 h-3.5 w-3.5" />{t("Close", "إغلاق")}</> : <><Plus className="me-1 h-3.5 w-3.5" />{t("New Series", "سلسلة جديدة")}</>}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t(
            "Define recurring event brands (e.g. Foodex, SIAL). Each series auto-generates yearly editions with +YEAR suffix.",
            "حدد العلامات التجارية المتكررة للفعاليات (مثل فودكس، سيال). كل سلسلة تولّد إصدارات سنوية تلقائياً بلاحقة +السنة."
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form */}
        {showForm && (
          <Card className="border-primary/20 p-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>{t("Series Name (EN)", "اسم السلسلة (إنجليزي)")}</Label>
                <Input value={form.name} onChange={e => upd("name", e.target.value)} placeholder="e.g. Foodex" />
              </div>
              <div>
                <Label>{t("Series Name (AR)", "اسم السلسلة (عربي)")}</Label>
                <Input value={form.name_ar} onChange={e => upd("name_ar", e.target.value)} dir="rtl" placeholder="مثال: فودكس" />
              </div>
              <div>
                <Label>{t("Type", "النوع")}</Label>
                <Select value={form.series_type} onValueChange={v => upd("series_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exhibition">{t("Exhibition / Event", "معرض / فعالية")}</SelectItem>
                    <SelectItem value="competition">{t("Competition", "مسابقة")}</SelectItem>
                    <SelectItem value="mixed">{t("Mixed (Exhibition + Competitions)", "مختلط (معرض + مسابقات)")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("Website", "الموقع الإلكتروني")}</Label>
                <Input value={form.website_url} onChange={e => upd("website_url", e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>{t("Description (EN)", "الوصف (إنجليزي)")}</Label>
                <Textarea value={form.description} onChange={e => upd("description", e.target.value)} rows={2} />
              </div>
              <div>
                <Label>{t("Description (AR)", "الوصف (عربي)")}</Label>
                <Textarea value={form.description_ar} onChange={e => upd("description_ar", e.target.value)} rows={2} dir="rtl" />
              </div>
            </div>

            {/* Defaults */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                  <ChevronDown className="h-3 w-3" />
                  {t("Default Organizer & Venue (template for editions)", "المنظم والمكان الافتراضيان (قالب للإصدارات)")}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div><Label>{t("Default Venue", "المكان الافتراضي")}</Label><Input value={form.default_venue} onChange={e => upd("default_venue", e.target.value)} /></div>
                  <div><Label>{t("Default City", "المدينة")}</Label><Input value={form.default_city} onChange={e => upd("default_city", e.target.value)} /></div>
                  <div><Label>{t("Default Country", "الدولة")}</Label><Input value={form.default_country} onChange={e => upd("default_country", e.target.value)} /></div>
                  <div><Label>{t("Organizer Name", "اسم المنظم")}</Label><Input value={form.default_organizer_name} onChange={e => upd("default_organizer_name", e.target.value)} /></div>
                  <div><Label>{t("Organizer Email", "بريد المنظم")}</Label><Input value={form.default_organizer_email} onChange={e => upd("default_organizer_email", e.target.value)} /></div>
                  <div><Label>{t("Organizer Phone", "هاتف المنظم")}</Label><Input value={form.default_organizer_phone} onChange={e => upd("default_organizer_phone", e.target.value)} /></div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>{t("Logo URL", "رابط الشعار")}</Label><Input value={form.logo_url} onChange={e => upd("logo_url", e.target.value)} /></div>
                  <div><Label>{t("Cover Image URL", "رابط صورة الغلاف")}</Label><Input value={form.cover_image_url} onChange={e => upd("cover_image_url", e.target.value)} /></div>
                </div>
                <div>
                  <Label>{t("Tags (comma separated)", "الوسوم (مفصولة بفاصلة)")}</Label>
                  <Input value={form.tags_input} onChange={e => upd("tags_input", e.target.value)} placeholder="food, expo, culinary" />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : null}
                {editingId ? t("Update", "تحديث") : t("Create Series", "إنشاء سلسلة")}
              </Button>
              <Button size="sm" variant="outline" onClick={resetForm}>{t("Cancel", "إلغاء")}</Button>
            </div>
          </Card>
        )}

        {/* List */}
        {isLoading ? (
          <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
        ) : !seriesList?.length ? (
          <div className="py-8 text-center">
            <Layers className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">{t("No series yet. Create one to start managing recurring events.", "لا توجد سلاسل بعد. أنشئ واحدة لبدء إدارة الفعاليات المتكررة.")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Series", "السلسلة")}</TableHead>
                  <TableHead>{t("Type", "النوع")}</TableHead>
                  <TableHead>{t("Editions", "الإصدارات")}</TableHead>
                  <TableHead>{t("Years", "السنوات")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {seriesList.map(s => {
                  const counts = editionCounts?.[s.id];
                  const Icon = typeIcons[s.series_type] || Layers;
                  const years = counts?.years?.sort((a, b) => b - a) || [];
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {s.logo_url ? (
                            <img src={s.logo_url} alt="" className="h-8 w-8 rounded object-contain bg-muted p-0.5" loading="lazy" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 shrink-0">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold">{isAr && s.name_ar ? s.name_ar : s.name}</p>
                            {s.default_city && <p className="text-[10px] text-muted-foreground">{s.default_city}{s.default_country ? `, ${s.default_country}` : ""}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Icon className="h-2.5 w-2.5" />
                          {s.series_type === "exhibition" ? t("Exhibition", "معرض") : s.series_type === "competition" ? t("Competition", "مسابقة") : t("Mixed", "مختلط")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 text-xs">
                          {(counts?.exhibitions || 0) > 0 && (
                            <Badge variant="outline" className="text-[10px]"><Landmark className="h-2.5 w-2.5 me-1" />{counts!.exhibitions}</Badge>
                          )}
                          {(counts?.competitions || 0) > 0 && (
                            <Badge variant="outline" className="text-[10px]"><Trophy className="h-2.5 w-2.5 me-1" />{counts!.competitions}</Badge>
                          )}
                          {!counts && <span className="text-muted-foreground">0</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {years.map(y => (
                            <Badge key={y} variant="secondary" className="text-[10px] font-bold">+{y}</Badge>
                          ))}
                          {years.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {onCreateEdition && (
                            <Button size="sm" variant="outline" onClick={() => handleCreateEdition(s)} className="h-7 text-xs gap-1">
                              <Calendar className="h-3 w-3" />
                              {t("New Edition", "إصدار جديد")}
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => startEdit(s)} className="h-7 w-7">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(s.id)} className="h-7 w-7 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
