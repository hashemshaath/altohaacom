import { useState, useCallback, memo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCountries } from "@/hooks/useCountries";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityFormGuard } from "@/components/admin/EntityFormGuard";
import { AITextOptimizer } from "@/components/admin/AITextOptimizer";
import { OrganizerSearchSelector, type OrganizerValue } from "@/components/admin/OrganizerSearchSelector";
import { ExhibitionMediaUploader } from "@/components/admin/ExhibitionMediaUploader";
import { ExhibitionOfficialsPanel } from "@/components/admin/ExhibitionOfficialsPanel";
import { ExhibitionDocumentsPanel } from "@/components/admin/ExhibitionDocumentsPanel";
import {
  Landmark, Calendar, MapPin, Building, Ticket, Tag, Globe, Save, X,
  Loader2, Trophy, GraduationCap, Mic, Image, Users, FileText, Layers,
  ChevronLeft, CheckCircle2, Info,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ExhibitionStatus = Database["public"]["Enums"]["exhibition_status"];
type ExhibitionType = Database["public"]["Enums"]["exhibition_type"];
type ExhibitionInsert = Database["public"]["Tables"]["exhibitions"]["Insert"];

const statusOptions: { value: ExhibitionStatus; en: string; ar: string }[] = [
  { value: "pending", en: "Pending Approval", ar: "بانتظار الموافقة" },
  { value: "draft", en: "Draft", ar: "مسودة" },
  { value: "upcoming", en: "Upcoming", ar: "قادمة" },
  { value: "active", en: "Active", ar: "نشطة" },
  { value: "completed", en: "Completed", ar: "مكتملة" },
  { value: "cancelled", en: "Cancelled", ar: "ملغاة" },
];

const typeOptions: { value: ExhibitionType; en: string; ar: string }[] = [
  { value: "exhibition", en: "Exhibition", ar: "معرض" },
  { value: "conference", en: "Conference", ar: "مؤتمر" },
  { value: "summit", en: "Summit", ar: "قمة" },
  { value: "workshop", en: "Workshop", ar: "ورشة عمل" },
  { value: "food_festival", en: "Food Festival", ar: "مهرجان طعام" },
  { value: "trade_show", en: "Trade Show", ar: "معرض تجاري" },
  { value: "competition_event", en: "Competition Event", ar: "حدث تنافسي" },
];

const emptyForm: Partial<ExhibitionInsert> = {
  title: "", title_ar: "", slug: "", description: "", description_ar: "",
  type: "exhibition", status: "draft",
  start_date: "", end_date: "",
  venue: "", venue_ar: "", city: "", country: "",
  is_virtual: false, virtual_link: "",
  organizer_name: "", organizer_name_ar: "",
  organizer_email: "", organizer_phone: "", organizer_website: "",
  registration_url: "", website_url: "", map_url: "",
  ticket_price: "", ticket_price_ar: "", is_free: false,
  max_attendees: undefined, is_featured: false,
  cover_image_url: "",
};

interface ExhibitionEditFormProps {
  exhibition?: any; // existing exhibition data for editing
  onClose: () => void;
}

export const ExhibitionEditForm = memo(function ExhibitionEditForm({ exhibition, onClose }: ExhibitionEditFormProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const editingId = exhibition?.id || null;

  const { data: countries } = useCountries();

  // Series list
  const { data: seriesList } = useQuery({
    queryKey: ["event-series-select"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("event_series").select("id, name, name_ar, series_type, default_venue, default_venue_ar, default_city, default_country, default_organizer_name, default_organizer_name_ar, default_organizer_email, cover_image_url, tags, website_url").eq("is_active", true).order("name");
      return data as any[] || [];
    },
  });

  // Initialize form state from exhibition or empty
  const [form, setForm] = useState<Partial<ExhibitionInsert>>(() => {
    if (!exhibition) return emptyForm;
    return {
      title: exhibition.title, title_ar: exhibition.title_ar, slug: exhibition.slug,
      description: exhibition.description, description_ar: exhibition.description_ar,
      type: exhibition.type, status: exhibition.status,
      start_date: exhibition.start_date?.slice(0, 16), end_date: exhibition.end_date?.slice(0, 16),
      venue: exhibition.venue, venue_ar: exhibition.venue_ar, city: exhibition.city, country: exhibition.country,
      is_virtual: exhibition.is_virtual, virtual_link: exhibition.virtual_link,
      organizer_name: exhibition.organizer_name, organizer_name_ar: exhibition.organizer_name_ar,
      organizer_email: exhibition.organizer_email, organizer_phone: exhibition.organizer_phone,
      organizer_website: exhibition.organizer_website,
      registration_url: exhibition.registration_url, website_url: exhibition.website_url, map_url: exhibition.map_url,
      ticket_price: exhibition.ticket_price, ticket_price_ar: exhibition.ticket_price_ar,
      is_free: exhibition.is_free, max_attendees: exhibition.max_attendees, is_featured: exhibition.is_featured,
      cover_image_url: exhibition.cover_image_url,
      registration_deadline: exhibition.registration_deadline?.slice(0, 16),
    };
  });

  const [organizer, setOrganizer] = useState<OrganizerValue | null>(() => {
    if (!exhibition || (!exhibition.organizer_entity_id && !exhibition.organizer_company_id && !exhibition.organizer_user_id)) return null;
    return {
      type: exhibition.organizer_type || "custom",
      entityId: exhibition.organizer_entity_id || null,
      companyId: exhibition.organizer_company_id || null,
      userId: exhibition.organizer_user_id || null,
      name: exhibition.organizer_name || "",
      nameAr: exhibition.organizer_name_ar || "",
      email: exhibition.organizer_email || undefined,
      phone: exhibition.organizer_phone || undefined,
      website: exhibition.organizer_website || undefined,
      logoUrl: exhibition.organizer_logo_url || undefined,
      country: exhibition.country || undefined,
    };
  });

  const [currency, setCurrency] = useState(exhibition?.currency || "SAR");
  const [includesCompetitions, setIncludesCompetitions] = useState(exhibition?.includes_competitions || false);
  const [includesTraining, setIncludesTraining] = useState(exhibition?.includes_training || false);
  const [includesSeminars, setIncludesSeminars] = useState(exhibition?.includes_seminars || false);
  const [tagsInput, setTagsInput] = useState((exhibition?.tags || []).join(", "));
  const [audienceInput, setAudienceInput] = useState((exhibition?.target_audience || []).join(", "));
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(exhibition?.series_id || null);
  const [editionYear, setEditionYear] = useState<number | null>(exhibition?.edition_year || null);
  const [activeTab, setActiveTab] = useState("basic");

  const updateField = useCallback((key: string, value: any) => setForm(prev => ({ ...prev, [key]: value })), []);

  // Completeness score
  const completeness = (() => {
    let filled = 0;
    let total = 10;
    if (form.title) filled++;
    if (form.title_ar) filled++;
    if (form.description) filled++;
    if (form.start_date) filled++;
    if (form.end_date) filled++;
    if (form.venue || form.is_virtual) filled++;
    if (form.city || form.is_virtual) filled++;
    if (form.organizer_name || organizer) filled++;
    if (form.cover_image_url) filled++;
    if (form.type) filled++;
    return Math.round((filled / total) * 100);
  })();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = form.slug || form.title?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "";
      const payload: any = {
        ...form,
        slug,
        organizer_name: organizer?.name || form.organizer_name || null,
        organizer_name_ar: organizer?.nameAr || form.organizer_name_ar || null,
        organizer_email: organizer?.email || form.organizer_email || null,
        organizer_phone: organizer?.phone || form.organizer_phone || null,
        organizer_website: organizer?.website || form.organizer_website || null,
        organizer_logo_url: organizer?.logoUrl || null,
        organizer_type: organizer?.type || "custom",
        organizer_entity_id: organizer?.entityId || null,
        organizer_company_id: organizer?.companyId || null,
        organizer_user_id: organizer?.userId || null,
        currency,
        includes_competitions: includesCompetitions,
        includes_training: includesTraining,
        includes_seminars: includesSeminars,
        tags: tagsInput ? tagsInput.split(",").map(t => t.trim()) : [],
        target_audience: audienceInput ? audienceInput.split(",").map(t => t.trim()) : [],
        created_by: user?.id,
        series_id: selectedSeriesId || null,
        edition_year: editionYear || null,
      };

      if (editingId) {
        const { error } = await supabase.from("exhibitions").update(payload).eq("id", editingId);
        if (error) throw error;
        return { slug, id: editingId, isNew: false };
      } else {
        const { data, error } = await supabase.from("exhibitions").insert(payload).select("id, slug").single();
        if (error) throw error;
        return { slug: data.slug, id: data.id, isNew: true };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] });
      toast({ title: editingId ? t("Exhibition updated", "تم تحديث الفعالية") : t("Exhibition created", "تم إنشاء الفعالية") });
      if (result.isNew && (includesCompetitions || includesTraining || includesSeminars)) {
        onClose();
        navigate(`/exhibitions/${result.slug}`);
      } else {
        onClose();
      }
    },
    onError: (err: Error) => {
      toast({ title: t("Error", "خطأ"), description: err.message, variant: "destructive" });
    },
  });

  const TabLabel = ({ icon: Icon, label, badge }: { icon: any; label: string; badge?: string }) => (
    <span className="flex items-center gap-1.5 text-xs">
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
      {badge && <Badge variant="secondary" className="h-4 px-1 text-[9px]">{badge}</Badge>}
    </span>
  );

  return (
    <Card className="border-primary/20 overflow-hidden">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-card px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-sm font-bold truncate">
              {editingId ? t("Edit Event", "تعديل الفعالية") : t("Create New Event", "إنشاء فعالية جديدة")}
            </h2>
            {editingId && form.title && (
              <p className="text-xs text-muted-foreground truncate">{form.title}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Completeness indicator */}
          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-muted/60 px-2.5 py-1.5">
            <CheckCircle2 className={`h-3.5 w-3.5 ${completeness === 100 ? "text-chart-2" : "text-muted-foreground"}`} />
            <span className="text-[10px] font-semibold">{completeness}%</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="me-1.5 h-3.5 w-3.5" />
            {t("Cancel", "إلغاء")}
          </Button>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title || !form.start_date || !form.end_date}>
            {saveMutation.isPending ? (
              <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="me-1.5 h-3.5 w-3.5" />
            )}
            {editingId ? t("Update", "تحديث") : t("Create", "إنشاء")}
          </Button>
        </div>
      </div>

      <CardContent className="p-0">
        <EntityFormGuard
          entity={{ name: (form.title as string) || "", name_ar: (form.title_ar as string) || "", website: (form.website_url as string) || "", city: (form.city as string) || "", country: (form.country as string) || "" }}
          tables={["exhibitions", "organizers", "companies"]}
          excludeId={editingId || undefined}
          translationFields={[
            { en: (form.title as string) || null, ar: (form.title_ar as string) || null, key: "title" },
            { en: (form.description as string) || null, ar: (form.description_ar as string) || null, key: "description" },
          ]}
          translationContext="exhibition / food event / trade show"
          onTranslated={(u) => setForm(f => ({ ...f, ...u }))}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b bg-muted/20 px-4">
            <TabsList className="h-10 w-full justify-start bg-transparent gap-0 p-0 rounded-none">
              <TabsTrigger value="basic" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3">
                <TabLabel icon={Landmark} label={t("Basic Info", "المعلومات")} />
              </TabsTrigger>
              <TabsTrigger value="datetime" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3">
                <TabLabel icon={Calendar} label={t("Date & Type", "التاريخ")} />
              </TabsTrigger>
              <TabsTrigger value="location" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3">
                <TabLabel icon={MapPin} label={t("Location", "الموقع")} />
              </TabsTrigger>
              <TabsTrigger value="organizer" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3">
                <TabLabel icon={Building} label={t("Organizer", "المنظم")} />
              </TabsTrigger>
              <TabsTrigger value="tickets" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3">
                <TabLabel icon={Ticket} label={t("Tickets", "التذاكر")} />
              </TabsTrigger>
              <TabsTrigger value="media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3">
                <TabLabel icon={Image} label={t("Media", "الوسائط")} />
              </TabsTrigger>
              <TabsTrigger value="team" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3">
                <TabLabel icon={Users} label={t("Team", "الفريق")} />
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Tab: Basic Info ── */}
          <TabsContent value="basic" className="p-4 space-y-5 mt-0">
            {/* Series & Edition */}
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                {t("Event Series & Edition", "سلسلة الفعالية والإصدار")}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label className="text-xs">{t("Event Series", "سلسلة الفعاليات")}</Label>
                  <Select value={selectedSeriesId || "none"} onValueChange={v => {
                    const sid = v === "none" ? null : v;
                    setSelectedSeriesId(sid);
                    if (sid && !editingId) {
                      const series = seriesList?.find(s => s.id === sid);
                      if (series) {
                        if (series.default_venue) updateField("venue", series.default_venue);
                        if (series.default_venue_ar) updateField("venue_ar", series.default_venue_ar);
                        if (series.default_city) updateField("city", series.default_city);
                        if (series.default_country) updateField("country", series.default_country);
                        if (series.default_organizer_name) updateField("organizer_name", series.default_organizer_name);
                        if (series.default_organizer_name_ar) updateField("organizer_name_ar", series.default_organizer_name_ar);
                        if (series.default_organizer_email) updateField("organizer_email", series.default_organizer_email);
                        if (series.cover_image_url) updateField("cover_image_url", series.cover_image_url);
                        if (series.tags) setTagsInput(series.tags.join(", "));
                      }
                    }
                  }}>
                    <SelectTrigger className="h-9"><SelectValue placeholder={t("No series", "بدون سلسلة")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("No series (standalone)", "بدون سلسلة (مستقل)")}</SelectItem>
                      {seriesList?.map(s => (
                        <SelectItem key={s.id} value={s.id}>{isAr && s.name_ar ? s.name_ar : s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t("Edition Year", "سنة الإصدار")}</Label>
                  <Input className="h-9" type="number" value={editionYear || ""} onChange={e => setEditionYear(e.target.value ? parseInt(e.target.value) : null)} placeholder={new Date().getFullYear().toString()} min={2000} max={2100} />
                </div>
                {selectedSeriesId && editionYear && (
                  <div className="flex items-end">
                    <Badge variant="outline" className="text-xs gap-1">
                      <Info className="h-3 w-3" />
                      {form.title || "..."} +{editionYear}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Title fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">{t("Title (English)", "العنوان (إنجليزي)")} <span className="text-destructive">*</span></Label>
                  <AITextOptimizer text={form.title || ""} lang="en" onOptimized={v => updateField("title", v)} onTranslated={v => updateField("title_ar", v)} />
                </div>
                <Input className="h-9" value={form.title || ""} onChange={e => updateField("title", e.target.value)} placeholder={t("Event title in English", "عنوان الفعالية بالإنجليزية")} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">{t("Title (Arabic)", "العنوان (عربي)")}</Label>
                  <AITextOptimizer text={form.title_ar || ""} lang="ar" onOptimized={v => updateField("title_ar", v)} onTranslated={v => updateField("title", v)} />
                </div>
                <Input className="h-9" value={form.title_ar || ""} onChange={e => updateField("title_ar", e.target.value)} dir="rtl" />
              </div>
            </div>

            {/* Slug */}
            <div className="max-w-md">
              <Label className="text-xs">{t("URL Slug", "الرابط المختصر")}</Label>
              <Input className="h-9 font-mono text-xs" value={form.slug || ""} onChange={e => updateField("slug", e.target.value)} placeholder="auto-generated-from-title" />
            </div>

            {/* Descriptions */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">{t("Description (English)", "الوصف (إنجليزي)")}</Label>
                  <AITextOptimizer text={form.description || ""} lang="en" onOptimized={v => updateField("description", v)} onTranslated={v => updateField("description_ar", v)} />
                </div>
                <Textarea className="min-h-[100px] text-sm" value={form.description || ""} onChange={e => updateField("description", e.target.value)} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">{t("Description (Arabic)", "الوصف (عربي)")}</Label>
                  <AITextOptimizer text={form.description_ar || ""} lang="ar" onOptimized={v => updateField("description_ar", v)} onTranslated={v => updateField("description", v)} />
                </div>
                <Textarea className="min-h-[100px] text-sm" value={form.description_ar || ""} onChange={e => updateField("description_ar", e.target.value)} dir="rtl" />
              </div>
            </div>

            {/* Tags & Options */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs">{t("Tags (comma-separated)", "الوسوم (مفصولة بفاصلة)")}</Label>
                <Input className="h-9" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="food, beverages, cooking" />
              </div>
              <div>
                <Label className="text-xs">{t("Target Audience", "الجمهور المستهدف")}</Label>
                <Input className="h-9" value={audienceInput} onChange={e => setAudienceInput(e.target.value)} placeholder="Chefs, Restaurant Owners" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.is_featured || false} onCheckedChange={v => updateField("is_featured", v)} />
              <Label className="text-xs">{t("Featured Event", "فعالية مميزة")}</Label>
            </div>
          </TabsContent>

          {/* ── Tab: Date & Type ── */}
          <TabsContent value="datetime" className="p-4 space-y-5 mt-0">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-xs">{t("Type", "النوع")}</Label>
                <Select value={form.type || "exhibition"} onValueChange={v => updateField("type", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{t("Status", "الحالة")}</Label>
                <Select value={form.status || "draft"} onValueChange={v => updateField("status", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{t("Currency", "العملة")}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {countries?.filter(c => c.currency_code).map(c => (
                      <SelectItem key={c.code} value={c.currency_code!}>{c.currency_code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-xs">{t("Start Date", "تاريخ البدء")} <span className="text-destructive">*</span></Label>
                <Input className="h-9" type="datetime-local" value={form.start_date || ""} onChange={e => updateField("start_date", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">{t("End Date", "تاريخ الانتهاء")} <span className="text-destructive">*</span></Label>
                <Input className="h-9" type="datetime-local" value={form.end_date || ""} onChange={e => updateField("end_date", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">{t("Registration Deadline", "آخر موعد للتسجيل")}</Label>
                <Input className="h-9" type="datetime-local" value={(form as any).registration_deadline || ""} onChange={e => updateField("registration_deadline", e.target.value)} />
              </div>
            </div>

            {/* Event Content Types */}
            <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" />
                {t("Event Content", "محتوى الفعالية")}
              </p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={includesCompetitions} onCheckedChange={(v) => setIncludesCompetitions(!!v)} />
                  <Trophy className="h-4 w-4 text-chart-4" />
                  <span className="text-xs">{t("Competitions", "مسابقات")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={includesTraining} onCheckedChange={(v) => setIncludesTraining(!!v)} />
                  <GraduationCap className="h-4 w-4 text-chart-2" />
                  <span className="text-xs">{t("Training / Workshops", "تدريب / ورش عمل")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={includesSeminars} onCheckedChange={(v) => setIncludesSeminars(!!v)} />
                  <Mic className="h-4 w-4 text-chart-1" />
                  <span className="text-xs">{t("Seminars / Talks", "ندوات / محاضرات")}</span>
                </label>
              </div>
            </div>

            {/* Links */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs">{t("Registration URL", "رابط التسجيل")}</Label>
                <Input className="h-9" value={form.registration_url || ""} onChange={e => updateField("registration_url", e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label className="text-xs">{t("Website URL", "رابط الموقع")}</Label>
                <Input className="h-9" value={form.website_url || ""} onChange={e => updateField("website_url", e.target.value)} placeholder="https://..." />
              </div>
            </div>
          </TabsContent>

          {/* ── Tab: Location ── */}
          <TabsContent value="location" className="p-4 space-y-5 mt-0">
            <div className="flex items-center gap-3 mb-2">
              <Switch checked={form.is_virtual || false} onCheckedChange={v => updateField("is_virtual", v)} />
              <Label className="flex items-center gap-1.5 text-xs">
                <Globe className="h-3.5 w-3.5" />
                {t("Virtual Event", "حدث افتراضي")}
              </Label>
            </div>

            {form.is_virtual ? (
              <div className="max-w-md">
                <Label className="text-xs">{t("Virtual Event Link", "رابط الحدث الافتراضي")}</Label>
                <Input className="h-9" value={form.virtual_link || ""} onChange={e => updateField("virtual_link", e.target.value)} placeholder="https://zoom.us/..." />
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs">{t("Venue (English)", "المكان (إنجليزي)")}</Label>
                      <AITextOptimizer text={form.venue || ""} lang="en" onTranslated={v => updateField("venue_ar", v)} compact />
                    </div>
                    <Input className="h-9" value={form.venue || ""} onChange={e => updateField("venue", e.target.value)} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs">{t("Venue (Arabic)", "المكان (عربي)")}</Label>
                      <AITextOptimizer text={form.venue_ar || ""} lang="ar" onTranslated={v => updateField("venue", v)} compact />
                    </div>
                    <Input className="h-9" value={form.venue_ar || ""} onChange={e => updateField("venue_ar", e.target.value)} dir="rtl" />
                  </div>
                  <div>
                    <Label className="text-xs">{t("City", "المدينة")}</Label>
                    <Input className="h-9" value={form.city || ""} onChange={e => updateField("city", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">{t("Country", "الدولة")}</Label>
                    <Input className="h-9" value={form.country || ""} onChange={e => updateField("country", e.target.value)} />
                  </div>
                </div>
                <div className="max-w-md">
                  <Label className="text-xs">{t("Map URL", "رابط الخريطة")}</Label>
                  <Input className="h-9" value={form.map_url || ""} onChange={e => updateField("map_url", e.target.value)} placeholder="https://maps.google.com/..." />
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Tab: Organizer ── */}
          <TabsContent value="organizer" className="p-4 space-y-5 mt-0">
            <OrganizerSearchSelector
              value={organizer}
              onChange={(val) => {
                setOrganizer(val);
                if (val) {
                  updateField("organizer_name", val.name);
                  updateField("organizer_name_ar", val.nameAr);
                  updateField("organizer_email", val.email || "");
                  updateField("organizer_phone", val.phone || "");
                  updateField("organizer_website", val.website || "");
                  if (val.country) {
                    const c = countries?.find(co => co.code === val.country || co.name === val.country);
                    if (c?.currency_code) setCurrency(c.currency_code);
                  }
                }
              }}
              label={t("Search & Select Organizer", "البحث واختيار الجهة المنظمة")}
            />
            {organizer && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label className="text-xs">{t("Email", "البريد الإلكتروني")}</Label>
                  <Input className="h-9" type="email" value={form.organizer_email || ""} onChange={e => updateField("organizer_email", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">{t("Phone", "رقم الهاتف")}</Label>
                  <Input className="h-9" value={form.organizer_phone || ""} onChange={e => updateField("organizer_phone", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">{t("Website", "الموقع الإلكتروني")}</Label>
                  <Input className="h-9" value={form.organizer_website || ""} onChange={e => updateField("organizer_website", e.target.value)} placeholder="https://..." />
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Tab: Tickets ── */}
          <TabsContent value="tickets" className="p-4 space-y-5 mt-0">
            <div className="flex items-center gap-3 mb-2">
              <Switch checked={form.is_free || false} onCheckedChange={v => updateField("is_free", v)} />
              <Label className="text-xs">{t("Free Entry", "دخول مجاني")}</Label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {!form.is_free && (
                <>
                  <div>
                    <Label className="text-xs">{t("Ticket Price (English)", "سعر التذكرة (إنجليزي)")}</Label>
                    <Input className="h-9" value={form.ticket_price || ""} onChange={e => updateField("ticket_price", e.target.value)} placeholder={`${currency} 50`} />
                  </div>
                  <div>
                    <Label className="text-xs">{t("Ticket Price (Arabic)", "سعر التذكرة (عربي)")}</Label>
                    <Input className="h-9" value={form.ticket_price_ar || ""} onChange={e => updateField("ticket_price_ar", e.target.value)} dir="rtl" />
                  </div>
                </>
              )}
              <div>
                <Label className="text-xs">{t("Maximum Attendees", "الحد الأقصى للحضور")}</Label>
                <Input className="h-9" type="number" value={form.max_attendees || ""} onChange={e => updateField("max_attendees", parseInt(e.target.value) || undefined)} />
              </div>
            </div>
          </TabsContent>

          {/* ── Tab: Media ── */}
          <TabsContent value="media" className="p-4 space-y-5 mt-0">
            <div className="max-w-md">
              <Label className="text-xs">{t("Cover Image URL", "رابط صورة الغلاف")}</Label>
              <Input className="h-9" value={form.cover_image_url || ""} onChange={e => updateField("cover_image_url", e.target.value)} placeholder="https://example.com/image.jpg" />
            </div>

            {form.cover_image_url && (
              <div className="rounded-xl border overflow-hidden max-w-sm">
                <img src={form.cover_image_url} alt="Cover" className="w-full h-40 object-cover" />
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Image className="h-3.5 w-3.5" />
                {t("Media Library", "مكتبة الوسائط")}
              </p>
              <ExhibitionMediaUploader
                exhibitionId={editingId || ""}
                coverImageUrl={form.cover_image_url || undefined}
                onCoverChange={url => updateField("cover_image_url", url)}
              />
            </div>

            {/* Documents */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {t("Documents & AI Knowledge Base", "المستندات وقاعدة معارف الذكاء الاصطناعي")}
              </p>
              <ExhibitionDocumentsPanel exhibitionId={editingId || ""} />
            </div>
          </TabsContent>

          {/* ── Tab: Team ── */}
          <TabsContent value="team" className="p-4 space-y-5 mt-0">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {t("Officials & Team", "المسؤولون وفريق العمل")}
              </p>
              <ExhibitionOfficialsPanel exhibitionId={editingId || ""} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});
