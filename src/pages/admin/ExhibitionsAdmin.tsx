import { useState } from "react";
import { BulkImportPanel } from "@/components/admin/BulkImportPanel";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCountries } from "@/hooks/useCountries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, Landmark, Calendar, MapPin, Building, Ticket, Tag, Globe, Save, X, Loader2, Search, Trophy, GraduationCap, Mic, Image, Users, FileText, Bot, Copy, FileSpreadsheet } from "lucide-react";
import { AITextOptimizer } from "@/components/admin/AITextOptimizer";
import { OrganizerSearchSelector, type OrganizerValue } from "@/components/admin/OrganizerSearchSelector";
import { ExhibitionMediaUploader } from "@/components/admin/ExhibitionMediaUploader";
import { ExhibitionOfficialsPanel } from "@/components/admin/ExhibitionOfficialsPanel";
import { ExhibitionDocumentsPanel } from "@/components/admin/ExhibitionDocumentsPanel";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type ExhibitionStatus = Database["public"]["Enums"]["exhibition_status"];
type ExhibitionType = Database["public"]["Enums"]["exhibition_type"];
type ExhibitionInsert = Database["public"]["Tables"]["exhibitions"]["Insert"];

const statusOptions: { value: ExhibitionStatus; en: string; ar: string }[] = [
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

const statusColorMap: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  upcoming: "bg-chart-4/10 text-chart-4",
  active: "bg-chart-2/10 text-chart-2",
  completed: "bg-chart-1/10 text-chart-1",
  cancelled: "bg-destructive/10 text-destructive",
};

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

export default function ExhibitionsAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [showForm, setShowForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ExhibitionInsert>>(emptyForm);
  const [tagsInput, setTagsInput] = useState("");
  const [audienceInput, setAudienceInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [organizerFilter, setOrganizerFilter] = useState<string>("all");
  const [currency, setCurrency] = useState("USD");
  const [includesCompetitions, setIncludesCompetitions] = useState(false);
  const [includesTraining, setIncludesTraining] = useState(false);
  const [includesSeminars, setIncludesSeminars] = useState(false);
  const { data: countries } = useCountries();

  const t = (en: string, ar: string) => isAr ? ar : en;

  const [organizer, setOrganizer] = useState<OrganizerValue | null>(null);

  const { data: exhibitions, isLoading } = useQuery({
    queryKey: ["admin-exhibitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibitions")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Derive unique values for filters
  const uniqueYears = [...new Set(exhibitions?.map(e => new Date(e.start_date).getFullYear().toString()) || [])].sort((a, b) => Number(b) - Number(a));
  const uniqueCities = [...new Set(exhibitions?.map(e => e.city).filter(Boolean) || [])].sort();
  const uniqueOrganizers = [...new Set(exhibitions?.map(e => e.organizer_name).filter(Boolean) || [])].sort();

  const filteredExhibitions = exhibitions?.filter((ex) => {
    const matchesSearch = !searchQuery || 
      ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.title_ar && ex.title_ar.includes(searchQuery)) ||
      (ex.organizer_name && ex.organizer_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || ex.status === statusFilter;
    const matchesType = typeFilter === "all" || ex.type === typeFilter;
    const matchesYear = yearFilter === "all" || new Date(ex.start_date).getFullYear().toString() === yearFilter;
    const matchesCity = cityFilter === "all" || ex.city === cityFilter;
    const matchesOrganizer = organizerFilter === "all" || ex.organizer_name === organizerFilter;
    return matchesSearch && matchesStatus && matchesType && matchesYear && matchesCity && matchesOrganizer;
  });

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
      
      // Redirect to the exhibition detail page if it includes sub-content
      if (result.isNew && (includesCompetitions || includesTraining || includesSeminars)) {
        resetForm();
        navigate(`/exhibitions/${result.slug}`);
      } else {
        resetForm();
      }
    },
    onError: (err: any) => {
      toast({ title: t("Error", "خطأ"), description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exhibitions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] });
      toast({ title: t("Exhibition deleted", "تم حذف الفعالية") });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (ex: any) => {
      const { id, created_at, updated_at, view_count, slug, ...rest } = ex;
      const newSlug = (slug || "") + "-copy-" + Date.now().toString(36);
      const payload = {
        ...rest,
        title: (rest.title || "") + " (Copy)",
        title_ar: rest.title_ar ? rest.title_ar + " (نسخة)" : null,
        slug: newSlug,
        status: "draft" as ExhibitionStatus,
        view_count: 0,
        created_by: user?.id,
      };
      const { error } = await supabase.from("exhibitions").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] });
      toast({ title: t("Exhibition duplicated", "تم تكرار الفعالية") });
    },
    onError: (err: any) => {
      toast({ title: t("Error", "خطأ"), description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setForm(emptyForm);
    setTagsInput("");
    setAudienceInput("");
    setOrganizer(null);
    setCurrency("USD");
    setIncludesCompetitions(false);
    setIncludesTraining(false);
    setIncludesSeminars(false);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (ex: any) => {
    setForm({
      title: ex.title, title_ar: ex.title_ar, slug: ex.slug,
      description: ex.description, description_ar: ex.description_ar,
      type: ex.type, status: ex.status,
      start_date: ex.start_date?.slice(0, 16), end_date: ex.end_date?.slice(0, 16),
      venue: ex.venue, venue_ar: ex.venue_ar, city: ex.city, country: ex.country,
      is_virtual: ex.is_virtual, virtual_link: ex.virtual_link,
      organizer_name: ex.organizer_name, organizer_name_ar: ex.organizer_name_ar,
      organizer_email: ex.organizer_email, organizer_phone: ex.organizer_phone,
      organizer_website: ex.organizer_website,
      registration_url: ex.registration_url, website_url: ex.website_url, map_url: ex.map_url,
      ticket_price: ex.ticket_price, ticket_price_ar: ex.ticket_price_ar,
      is_free: ex.is_free, max_attendees: ex.max_attendees, is_featured: ex.is_featured,
      cover_image_url: ex.cover_image_url,
      registration_deadline: ex.registration_deadline?.slice(0, 16),
    });
    // Restore organizer from saved data
    if (ex.organizer_entity_id || ex.organizer_company_id || ex.organizer_user_id) {
      setOrganizer({
        type: ex.organizer_type || "custom",
        entityId: ex.organizer_entity_id || null,
        companyId: ex.organizer_company_id || null,
        userId: ex.organizer_user_id || null,
        name: ex.organizer_name || "",
        nameAr: ex.organizer_name_ar || "",
        email: ex.organizer_email || undefined,
        phone: ex.organizer_phone || undefined,
        website: ex.organizer_website || undefined,
        logoUrl: ex.organizer_logo_url || undefined,
        country: ex.country || undefined,
      });
    } else {
      setOrganizer(null);
    }
    setCurrency(ex.currency || "USD");
    setIncludesCompetitions(ex.includes_competitions || false);
    setIncludesTraining(ex.includes_training || false);
    setIncludesSeminars(ex.includes_seminars || false);
    setTagsInput((ex.tags || []).join(", "));
    setAudienceInput((ex.target_audience || []).join(", "));
    setEditingId(ex.id);
    setShowForm(true);
  };

  const updateField = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const getTypeName = (type: string) => {
    const opt = typeOptions.find(o => o.value === type);
    return opt ? (isAr ? opt.ar : opt.en) : type;
  };

  const getStatusName = (status: string) => {
    const opt = statusOptions.find(o => o.value === status);
    return opt ? (isAr ? opt.ar : opt.en) : status;
  };

  const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold sm:text-2xl">
              {t("Exhibitions & Events", "إدارة المعارض والفعاليات")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("Create, manage, and monitor all exhibitions, conferences, and events", "إنشاء وإدارة ومراقبة جميع المعارض والمؤتمرات والفعاليات")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowBulkImport(!showBulkImport); if (showForm) setShowForm(false); }}>
            <FileSpreadsheet className="me-2 h-4 w-4" />
            {t("Bulk Import", "استيراد جماعي")}
          </Button>
          <Button onClick={() => { resetForm(); setShowForm(!showForm); if (showBulkImport) setShowBulkImport(false); }} size="sm">
            {showForm ? <><X className="me-2 h-4 w-4" />{t("Close", "إغلاق")}</> : <><Plus className="me-2 h-4 w-4" />{t("Add Event", "إضافة فعالية")}</>}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {exhibitions && exhibitions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t("Total", "الإجمالي"), value: exhibitions.length, color: "text-foreground" },
            { label: t("Active", "نشطة"), value: exhibitions.filter(e => e.status === "active").length, color: "text-chart-2" },
            { label: t("Upcoming", "قادمة"), value: exhibitions.filter(e => e.status === "upcoming").length, color: "text-chart-4" },
            { label: t("Draft", "مسودة"), value: exhibitions.filter(e => e.status === "draft").length, color: "text-muted-foreground" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/40">
              <CardContent className="p-3 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bulk Import */}
      {showBulkImport && (
        <BulkImportPanel entityType="exhibition" onImportComplete={() => { setShowBulkImport(false); queryClient.invalidateQueries({ queryKey: ["admin-exhibitions"] }); }} />
      )}

      {/* Inline Form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              {editingId ? t("Edit Event", "تعديل الفعالية") : t("Create New Event", "إنشاء فعالية جديدة")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Section: Basic Info */}
            <div>
              <SectionHeader icon={Landmark} title={t("Basic Information", "المعلومات الأساسية")} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between">
                    <Label>{t("Title (English)", "العنوان (إنجليزي)")}</Label>
                    <AITextOptimizer text={form.title || ""} lang="en" onOptimized={v => updateField("title", v)} onTranslated={v => updateField("title_ar", v)} />
                  </div>
                  <Input value={form.title || ""} onChange={e => updateField("title", e.target.value)} placeholder={t("Event title in English", "عنوان الفعالية بالإنجليزية")} />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label>{t("Title (Arabic)", "العنوان (عربي)")}</Label>
                    <AITextOptimizer text={form.title_ar || ""} lang="ar" onOptimized={v => updateField("title_ar", v)} onTranslated={v => updateField("title", v)} />
                  </div>
                  <Input value={form.title_ar || ""} onChange={e => updateField("title_ar", e.target.value)} dir="rtl" placeholder={t("Event title in Arabic", "عنوان الفعالية بالعربية")} />
                </div>
                <div>
                  <Label>{t("URL Slug", "الرابط المختصر")}</Label>
                  <Input value={form.slug || ""} onChange={e => updateField("slug", e.target.value)} placeholder={t("auto-generated-from-title", "يُنشأ تلقائياً من العنوان")} className="font-mono text-xs" />
                </div>
                <div>
                  <Label>{t("Cover Image URL (or use Media Library below)", "رابط صورة الغلاف (أو استخدم مكتبة الوسائط أدناه)")}</Label>
                  <Input value={form.cover_image_url || ""} onChange={e => updateField("cover_image_url", e.target.value)} placeholder="https://example.com/image.jpg" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label>{t("Description (English)", "الوصف (إنجليزي)")}</Label>
                    <AITextOptimizer text={form.description || ""} lang="en" onOptimized={v => updateField("description", v)} onTranslated={v => updateField("description_ar", v)} />
                  </div>
                  <Textarea value={form.description || ""} onChange={e => updateField("description", e.target.value)} rows={3} placeholder={t("Event description", "وصف الفعالية")} />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label>{t("Description (Arabic)", "الوصف (عربي)")}</Label>
                    <AITextOptimizer text={form.description_ar || ""} lang="ar" onOptimized={v => updateField("description_ar", v)} onTranslated={v => updateField("description", v)} />
                  </div>
                  <Textarea value={form.description_ar || ""} onChange={e => updateField("description_ar", e.target.value)} rows={3} dir="rtl" placeholder={t("Event description in Arabic", "وصف الفعالية بالعربية")} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Section: Type, Status, Dates */}
            <div>
              <SectionHeader icon={Calendar} title={t("Type, Status & Schedule", "النوع والحالة والجدول الزمني")} />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>{t("Event Type", "نوع الفعالية")}</Label>
                  <Select value={form.type} onValueChange={v => updateField("type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {typeOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("Status", "الحالة")}</Label>
                  <Select value={form.status} onValueChange={v => updateField("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("Start Date", "تاريخ البدء")}</Label>
                  <Input type="datetime-local" value={form.start_date || ""} onChange={e => updateField("start_date", e.target.value)} />
                </div>
                <div>
                  <Label>{t("End Date", "تاريخ الانتهاء")}</Label>
                  <Input type="datetime-local" value={form.end_date || ""} onChange={e => updateField("end_date", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 mt-4">
                <div>
                  <Label>{t("Registration Deadline", "آخر موعد للتسجيل")}</Label>
                  <Input type="datetime-local" value={(form as any).registration_deadline || ""} onChange={e => updateField("registration_deadline", e.target.value)} />
                </div>
                <div>
                  <Label>{t("Registration URL", "رابط التسجيل")}</Label>
                  <Input value={form.registration_url || ""} onChange={e => updateField("registration_url", e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <Label>{t("Website URL", "رابط الموقع الإلكتروني")}</Label>
                  <Input value={form.website_url || ""} onChange={e => updateField("website_url", e.target.value)} placeholder="https://..." />
                </div>
              </div>
            </div>

            <Separator />

            {/* Section: Location */}
            <div>
              <SectionHeader icon={MapPin} title={t("Location", "الموقع")} />
              <div className="flex items-center gap-3 mb-4">
                <Switch checked={form.is_virtual || false} onCheckedChange={v => updateField("is_virtual", v)} />
                <Label className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  {t("Virtual Event", "حدث افتراضي")}
                </Label>
              </div>
              {form.is_virtual ? (
                <div className="max-w-md">
                  <Label>{t("Virtual Event Link", "رابط الحدث الافتراضي")}</Label>
                  <Input value={form.virtual_link || ""} onChange={e => updateField("virtual_link", e.target.value)} placeholder="https://zoom.us/..." />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>{t("Venue (English)", "المكان (إنجليزي)")}</Label>
                      <AITextOptimizer text={form.venue || ""} lang="en" onTranslated={v => updateField("venue_ar", v)} compact />
                    </div>
                    <Input value={form.venue || ""} onChange={e => updateField("venue", e.target.value)} placeholder={t("Venue name", "اسم المكان")} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>{t("Venue (Arabic)", "المكان (عربي)")}</Label>
                      <AITextOptimizer text={form.venue_ar || ""} lang="ar" onTranslated={v => updateField("venue", v)} compact />
                    </div>
                    <Input value={form.venue_ar || ""} onChange={e => updateField("venue_ar", e.target.value)} dir="rtl" placeholder={t("Venue name in Arabic", "اسم المكان بالعربية")} />
                  </div>
                  <div>
                    <Label>{t("City", "المدينة")}</Label>
                    <Input value={form.city || ""} onChange={e => updateField("city", e.target.value)} />
                  </div>
                  <div>
                    <Label>{t("Country", "الدولة")}</Label>
                    <Input value={form.country || ""} onChange={e => updateField("country", e.target.value)} />
                  </div>
                </div>
              )}
              {!form.is_virtual && (
                <div className="mt-4 max-w-md">
                  <Label>{t("Map URL", "رابط الخريطة")}</Label>
                  <Input value={form.map_url || ""} onChange={e => updateField("map_url", e.target.value)} placeholder="https://maps.google.com/..." />
                </div>
              )}
            </div>

            <Separator />

            {/* Section: Organizer */}
            <div>
              <SectionHeader icon={Building} title={t("Organizer Information", "الجهة المنظمة")} />
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
                    // Auto-set currency from country
                    if (val.country) {
                      const c = countries?.find(co => co.code === val.country || co.name === val.country);
                      if (c?.currency_code) setCurrency(c.currency_code);
                    }
                  }
                }}
                label={t("Search & Select Organizer", "البحث واختيار الجهة المنظمة")}
              />
              {/* Manual contact override */}
              {organizer && (
                <div className="grid gap-4 sm:grid-cols-3 mt-4">
                  <div>
                    <Label>{t("Email", "البريد الإلكتروني")}</Label>
                    <Input type="email" value={form.organizer_email || ""} onChange={e => updateField("organizer_email", e.target.value)} />
                  </div>
                  <div>
                    <Label>{t("Phone", "رقم الهاتف")}</Label>
                    <Input value={form.organizer_phone || ""} onChange={e => updateField("organizer_phone", e.target.value)} />
                  </div>
                  <div>
                    <Label>{t("Website", "الموقع الإلكتروني")}</Label>
                    <Input value={form.organizer_website || ""} onChange={e => updateField("organizer_website", e.target.value)} placeholder="https://..." />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Section: Currency */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>{t("Currency", "العملة")}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {countries?.filter(c => c.currency_code).map(c => (
                      <SelectItem key={c.code} value={c.currency_code!}>
                        {c.currency_code} — {isAr ? (c.name_ar || c.name) : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Section: Event Content Types */}
            <div>
              <SectionHeader icon={Trophy} title={t("Event Content", "محتوى الفعالية")} />
              <p className="text-xs text-muted-foreground mb-3">
                {t("Select what this event includes. After creation, you'll be redirected to complete the details.", "حدد ما تتضمنه الفعالية. بعد الإنشاء سيتم توجيهك لإكمال التفاصيل.")}
              </p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={includesCompetitions} onCheckedChange={(v) => setIncludesCompetitions(!!v)} />
                  <Trophy className="h-4 w-4 text-chart-4" />
                  <span className="text-sm">{t("Competitions", "مسابقات")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={includesTraining} onCheckedChange={(v) => setIncludesTraining(!!v)} />
                  <GraduationCap className="h-4 w-4 text-chart-2" />
                  <span className="text-sm">{t("Training / Workshops", "تدريب / ورش عمل")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={includesSeminars} onCheckedChange={(v) => setIncludesSeminars(!!v)} />
                  <Mic className="h-4 w-4 text-chart-1" />
                  <span className="text-sm">{t("Seminars / Talks", "ندوات / محاضرات")}</span>
                </label>
              </div>
            </div>

            <Separator />

            {/* Section: Tickets */}
            <div>
              <SectionHeader icon={Ticket} title={t("Tickets & Registration", "التذاكر والتسجيل")} />
              <div className="flex items-center gap-3 mb-4">
                <Switch checked={form.is_free || false} onCheckedChange={v => updateField("is_free", v)} />
                <Label>{t("Free Entry", "دخول مجاني")}</Label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {!form.is_free && (
                  <>
                    <div>
                      <Label>{t("Ticket Price (English)", "سعر التذكرة (إنجليزي)")}</Label>
                      <Input value={form.ticket_price || ""} onChange={e => updateField("ticket_price", e.target.value)} placeholder="$50 USD" />
                    </div>
                    <div>
                      <Label>{t("Ticket Price (Arabic)", "سعر التذكرة (عربي)")}</Label>
                      <Input value={form.ticket_price_ar || ""} onChange={e => updateField("ticket_price_ar", e.target.value)} dir="rtl" placeholder="٥٠ دولار" />
                    </div>
                  </>
                )}
                <div>
                  <Label>{t("Maximum Attendees", "الحد الأقصى للحضور")}</Label>
                  <Input type="number" value={form.max_attendees || ""} onChange={e => updateField("max_attendees", parseInt(e.target.value) || undefined)} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Section: Tags & Options */}
            <div>
              <SectionHeader icon={Tag} title={t("Tags & Options", "الوسوم والخيارات")} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>{t("Tags (comma-separated)", "الوسوم (مفصولة بفاصلة)")}</Label>
                  <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder={t("food, beverages, cooking", "طعام، مشروبات، طبخ")} />
                </div>
                <div>
                  <Label>{t("Target Audience (comma-separated)", "الجمهور المستهدف (مفصول بفاصلة)")}</Label>
                  <Input value={audienceInput} onChange={e => setAudienceInput(e.target.value)} placeholder={t("Chefs, Restaurant Owners", "طهاة، أصحاب مطاعم")} />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Switch checked={form.is_featured || false} onCheckedChange={v => updateField("is_featured", v)} />
                <Label>{t("Featured Event", "فعالية مميزة")}</Label>
              </div>
            </div>

            <Separator />

            {/* Section: Media Library */}
            <div>
              <SectionHeader icon={Image} title={t("Media Library", "مكتبة الوسائط")} />
              <p className="text-xs text-muted-foreground mb-3">
                {t("Upload logos, cover images, and gallery photos for this exhibition.", "ارفع الشعارات وصور الغلاف ومعرض الصور لهذه الفعالية.")}
              </p>
              <ExhibitionMediaUploader
                exhibitionId={editingId || ""}
                coverImageUrl={form.cover_image_url || undefined}
                onCoverChange={url => updateField("cover_image_url", url)}
              />
            </div>

            <Separator />

            {/* Section: Officials & Team */}
            <div>
              <SectionHeader icon={Users} title={t("Officials & Team", "المسؤولون وفريق العمل")} />
              <p className="text-xs text-muted-foreground mb-3">
                {t("Add event officials, their roles, and contact details.", "أضف مسؤولي الفعالية وأدوارهم وبيانات الاتصال.")}
              </p>
              <ExhibitionOfficialsPanel exhibitionId={editingId || ""} />
            </div>

            <Separator />

            {/* Section: Documents & AI Knowledge */}
            <div>
              <SectionHeader icon={FileText} title={t("Documents & AI Knowledge Base", "المستندات وقاعدة معارف الذكاء الاصطناعي")} />
              <p className="text-xs text-muted-foreground mb-3">
                {t(
                  "Upload rules, guidelines, and reference files. Mark files as 'Feed to AI' to enable the AI support center to answer exhibition questions.",
                  "ارفع القواعد والإرشادات والملفات المرجعية. حدد الملفات لـ 'تغذية الذكاء الاصطناعي' لتمكين مركز الدعم من الإجابة على أسئلة المعرض."
                )}
              </p>
              <ExhibitionDocumentsPanel exhibitionId={editingId || ""} />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title || !form.start_date || !form.end_date}>
                {saveMutation.isPending ? (
                  <><Loader2 className="me-2 h-4 w-4 animate-spin" />{t("Saving...", "جاري الحفظ...")}</>
                ) : (
                  <><Save className="me-2 h-4 w-4" />{editingId ? t("Update Event", "تحديث الفعالية") : t("Create Event", "إنشاء الفعالية")}</>
                )}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="me-2 h-4 w-4" />
                {t("Cancel", "إلغاء")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t("Search by name, organizer...", "بحث بالاسم، المنظم...")}
            className="ps-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t("Status", "الحالة")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Statuses", "جميع الحالات")}</SelectItem>
            {statusOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t("Type", "النوع")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Types", "جميع الأنواع")}</SelectItem>
            {typeOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder={t("Year", "السنة")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Years", "جميع السنوات")}</SelectItem>
            {uniqueYears.map(y => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t("City", "المدينة")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Cities", "جميع المدن")}</SelectItem>
            {uniqueCities.map(c => (
              <SelectItem key={c!} value={c!}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={organizerFilter} onValueChange={setOrganizerFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("Organizer", "المنظم")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Organizers", "جميع المنظمين")}</SelectItem>
            {uniqueOrganizers.map(o => (
              <SelectItem key={o!} value={o!}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">{t("Event", "الفعالية")}</TableHead>
                <TableHead className="font-semibold">{t("Organizer", "المنظم")}</TableHead>
                <TableHead className="font-semibold">{t("Type", "النوع")}</TableHead>
                <TableHead className="font-semibold">{t("Status", "الحالة")}</TableHead>
                <TableHead className="font-semibold">{t("Date", "التاريخ")}</TableHead>
                <TableHead className="font-semibold">{t("Location", "الموقع")}</TableHead>
                <TableHead className="text-end font-semibold">{t("Actions", "الإجراءات")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">{t("Loading events...", "جاري تحميل الفعاليات...")}</p>
                  </TableCell>
                </TableRow>
              ) : filteredExhibitions?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Landmark className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">{t("No events found", "لا توجد فعاليات")}</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredExhibitions?.map((ex) => {
                  const orgLogoUrl = (ex as any).organizer_logo_url || ex.logo_url;
                  return (
                  <TableRow key={ex.id} className="group hover:bg-muted/20 transition-colors duration-150">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {ex.cover_image_url && (
                          <img src={ex.cover_image_url} alt="" className="h-10 w-14 rounded-md object-cover shrink-0" />
                        )}
                        <div className="min-w-0">
                          <Link to={`/exhibitions/${ex.slug}`} className="font-semibold text-sm truncate block group-hover:text-primary transition-colors hover:underline">
                            {isAr && ex.title_ar ? ex.title_ar : ex.title}
                            <span className="text-primary ms-1 font-bold">{new Date(ex.start_date).getFullYear()}</span>
                          </Link>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {orgLogoUrl ? (
                          <img src={orgLogoUrl} alt="" className="h-7 w-7 rounded object-contain shrink-0 bg-muted p-0.5" />
                        ) : ex.organizer_name ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 shrink-0">
                            <Building className="h-3.5 w-3.5 text-primary" />
                          </div>
                        ) : null}
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {ex.organizer_name ? (isAr && ex.organizer_name_ar ? ex.organizer_name_ar : ex.organizer_name) : "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">{getTypeName(ex.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] border-0 ${statusColorMap[ex.status] || ""}`}>
                        {getStatusName(ex.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(ex.start_date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {ex.is_virtual ? (
                        <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{t("Virtual", "افتراضي")}</span>
                      ) : (
                        <span>{ex.city || ""}{ex.country ? `, ${ex.country}` : ""}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" asChild className="h-8 w-8">
                          <Link to={`/exhibitions/${ex.slug}`} title={t("View", "عرض")}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => startEdit(ex)} className="h-8 w-8" title={t("Edit", "تعديل")}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => duplicateMutation.mutate(ex)} className="h-8 w-8" title={t("Duplicate", "تكرار")}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(ex.id)} className="h-8 w-8 text-destructive hover:text-destructive" title={t("Delete", "حذف")}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
