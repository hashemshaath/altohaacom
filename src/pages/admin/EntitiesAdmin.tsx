import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Building2, Eye, EyeOff, ShieldCheck, Search, Users, Settings2, Languages, Upload, Image, X, Loader2 } from "lucide-react";
import { EntitySubModulesPanel } from "@/components/entities/EntitySubModulesPanel";
import type { Database } from "@/integrations/supabase/types";

type EntityType = Database["public"]["Enums"]["entity_type"];
type EntityScope = Database["public"]["Enums"]["entity_scope"];
type EntityStatus = Database["public"]["Enums"]["entity_status"];

const typeOptions: { value: EntityType; en: string; ar: string }[] = [
  { value: "culinary_association", en: "Culinary Association", ar: "جمعية طهي" },
  { value: "government_entity", en: "Government Entity", ar: "جهة حكومية" },
  { value: "private_association", en: "Private Association", ar: "جمعية خاصة" },
  { value: "culinary_academy", en: "Culinary Academy", ar: "أكاديمية طهي" },
  { value: "industry_body", en: "Industry Body", ar: "هيئة صناعية" },
  { value: "university", en: "University", ar: "جامعة" },
  { value: "college", en: "College", ar: "كلية" },
  { value: "training_center", en: "Training Center", ar: "مركز تدريب" },
];

const scopeOptions: { value: EntityScope; en: string; ar: string }[] = [
  { value: "local", en: "Local", ar: "محلي" },
  { value: "national", en: "National", ar: "وطني" },
  { value: "regional", en: "Regional", ar: "إقليمي" },
  { value: "international", en: "International", ar: "دولي" },
];

const statusOptions: EntityStatus[] = ["pending", "active", "suspended", "archived"];

interface FormData {
  name: string; name_ar: string; abbreviation: string; abbreviation_ar: string;
  description: string; description_ar: string;
  type: EntityType; scope: EntityScope; status: EntityStatus;
  is_visible: boolean; is_verified: boolean;
  country: string; city: string; address: string; address_ar: string; postal_code: string;
  email: string; phone: string; fax: string; website: string;
  logo_url: string; cover_image_url: string;
  president_name: string; president_name_ar: string;
  secretary_name: string; secretary_name_ar: string;
  founded_year: number | undefined; member_count: number | undefined;
  mission: string; mission_ar: string;
  username: string;
  registration_number: string; license_number: string;
  internal_notes: string;
  services_input: string; specializations_input: string; tags_input: string;
}

const emptyForm: FormData = {
  name: "", name_ar: "", abbreviation: "", abbreviation_ar: "",
  description: "", description_ar: "",
  type: "culinary_association", scope: "local", status: "pending",
  is_visible: false, is_verified: false,
  country: "", city: "", address: "", address_ar: "", postal_code: "",
  email: "", phone: "", fax: "", website: "",
  logo_url: "", cover_image_url: "",
  president_name: "", president_name_ar: "",
  secretary_name: "", secretary_name_ar: "",
  founded_year: undefined, member_count: undefined,
  mission: "", mission_ar: "",
  username: "",
  registration_number: "", license_number: "",
  internal_notes: "",
  services_input: "", specializations_input: "", tags_input: "",
};

// Bilingual field pairs for translation
const bilingualPairs: { en: keyof FormData; ar: keyof FormData; label_en: string; label_ar: string }[] = [
  { en: "name", ar: "name_ar", label_en: "Name", label_ar: "الاسم" },
  { en: "abbreviation", ar: "abbreviation_ar", label_en: "Abbreviation", label_ar: "الاختصار" },
  { en: "description", ar: "description_ar", label_en: "Description", label_ar: "الوصف" },
  { en: "address", ar: "address_ar", label_en: "Address", label_ar: "العنوان" },
  { en: "president_name", ar: "president_name_ar", label_en: "President Name", label_ar: "اسم الرئيس" },
  { en: "secretary_name", ar: "secretary_name_ar", label_en: "Secretary Name", label_ar: "اسم الأمين العام" },
  { en: "mission", ar: "mission_ar", label_en: "Mission", label_ar: "الرسالة" },
];

export default function EntitiesAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [managingEntity, setManagingEntity] = useState<{ id: string; name: string } | null>(null);
  const [translatingField, setTranslatingField] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState<"logo" | "cover" | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { data: entities, isLoading } = useQuery({
    queryKey: ["admin-entities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("culinary_entities")
        .select("*, entity_followers(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: managers } = useQuery({
    queryKey: ["admin-users-for-manager"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch media from company-media bucket for picker
  const { data: mediaFiles } = useQuery({
    queryKey: ["entity-media-files"],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("company-media").list("entities", { limit: 100 });
      if (error) return [];
      return data?.map(f => ({
        name: f.name,
        url: supabase.storage.from("company-media").getPublicUrl(`entities/${f.name}`).data.publicUrl,
      })) || [];
    },
    enabled: showMediaPicker !== null,
  });

  const [selectedManager, setSelectedManager] = useState<string>("");

  const generateEntityNumber = (type: EntityType) => {
    const prefixes: Record<EntityType, string> = {
      culinary_association: "CA", government_entity: "GE", private_association: "PA",
      culinary_academy: "ACM", industry_body: "IB", university: "UNI", college: "COL", training_center: "TC",
    };
    const prefix = prefixes[type];
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    const random = Math.random().toString(36).toUpperCase().slice(2, 5);
    return `${prefix}-${timestamp}${random}`;
  };

  // AI Translate + SEO
  const handleTranslate = async (sourceField: keyof FormData, targetField: keyof FormData, direction: "en_to_ar" | "ar_to_en") => {
    const sourceText = form[sourceField] as string;
    if (!sourceText?.trim()) {
      toast({ title: isAr ? "لا يوجد نص للترجمة" : "No text to translate", variant: "destructive" });
      return;
    }
    setTranslatingField(String(sourceField));
    try {
      const { data, error } = await supabase.functions.invoke("ai-translate-seo", {
        body: {
          text: sourceText,
          source_lang: direction === "en_to_ar" ? "en" : "ar",
          target_lang: direction === "en_to_ar" ? "ar" : "en",
          optimize_seo: true,
        },
      });
      if (error) throw error;
      if (data?.translated) {
        setForm(prev => ({ ...prev, [targetField]: data.translated }));
        toast({ title: isAr ? "تمت الترجمة" : "Translation complete" });
      }
    } catch (err: any) {
      toast({ title: isAr ? "خطأ في الترجمة" : "Translation error", description: err.message, variant: "destructive" });
    } finally {
      setTranslatingField(null);
    }
  };

  // File upload handler
  const handleFileUpload = async (file: File, type: "logo" | "cover") => {
    const setter = type === "logo" ? setUploadingLogo : setUploadingCover;
    setter(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `entities/${Date.now()}-${type}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("company-media").upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("company-media").getPublicUrl(path);
      const field = type === "logo" ? "logo_url" : "cover_image_url";
      setForm(prev => ({ ...prev, [field]: urlData.publicUrl }));
      toast({ title: isAr ? "تم الرفع بنجاح" : "Upload successful" });
    } catch (err: any) {
      toast({ title: isAr ? "خطأ في الرفع" : "Upload error", description: err.message, variant: "destructive" });
    } finally {
      setter(false);
    }
  };

  // Completion percentage
  const requiredFields: (keyof FormData)[] = ["name", "name_ar", "description", "description_ar", "type", "email", "phone", "country", "city", "logo_url"];
  const completionPercent = Math.round((requiredFields.filter(f => {
    const v = form[f];
    return v !== undefined && v !== null && v !== "";
  }).length / requiredFields.length) * 100);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const payload = {
        name: form.name,
        name_ar: form.name_ar || null,
        abbreviation: form.abbreviation || null,
        abbreviation_ar: form.abbreviation_ar || null,
        description: form.description || null,
        description_ar: form.description_ar || null,
        type: form.type,
        scope: form.scope,
        status: form.status,
        is_visible: form.is_visible,
        is_verified: form.is_verified,
        country: form.country || null,
        city: form.city || null,
        address: form.address || null,
        address_ar: form.address_ar || null,
        postal_code: form.postal_code || null,
        email: form.email || null,
        phone: form.phone || null,
        fax: form.fax || null,
        website: form.website || null,
        logo_url: form.logo_url || null,
        cover_image_url: form.cover_image_url || null,
        president_name: form.president_name || null,
        president_name_ar: form.president_name_ar || null,
        secretary_name: form.secretary_name || null,
        secretary_name_ar: form.secretary_name_ar || null,
        founded_year: form.founded_year || null,
        member_count: form.member_count || null,
        mission: form.mission || null,
        mission_ar: form.mission_ar || null,
        username: form.username || null,
        registration_number: form.registration_number || null,
        license_number: form.license_number || null,
        internal_notes: form.internal_notes || null,
        services: form.services_input ? form.services_input.split(",").map(s => s.trim()) : [],
        specializations: form.specializations_input ? form.specializations_input.split(",").map(s => s.trim()) : [],
        tags: form.tags_input ? form.tags_input.split(",").map(s => s.trim()) : [],
        account_manager_id: selectedManager || null,
        slug,
        created_by: user?.id,
      };

      if (editingId) {
        const { error } = await supabase.from("culinary_entities").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const entityNumber = generateEntityNumber(form.type);
        const { error } = await supabase.from("culinary_entities").insert({
          ...payload,
          entity_number: entityNumber,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-entities"] });
      toast({ title: editingId ? (isAr ? "تم تحديث الجهة" : "Entity updated") : (isAr ? "تم إنشاء الجهة" : "Entity created") });
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("culinary_entities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-entities"] });
      toast({ title: isAr ? "تم حذف الجهة" : "Entity deleted" });
    },
  });

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const { error } = await supabase.from("culinary_entities").update({ is_visible: visible }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-entities"] }),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedManager("");
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (entity: any) => {
    setForm({
      name: entity.name || "", name_ar: entity.name_ar || "",
      abbreviation: entity.abbreviation || "", abbreviation_ar: entity.abbreviation_ar || "",
      description: entity.description || "", description_ar: entity.description_ar || "",
      type: entity.type, scope: entity.scope, status: entity.status,
      is_visible: entity.is_visible, is_verified: entity.is_verified || false,
      country: entity.country || "", city: entity.city || "",
      address: entity.address || "", address_ar: entity.address_ar || "",
      postal_code: entity.postal_code || "",
      email: entity.email || "", phone: entity.phone || "",
      fax: entity.fax || "", website: entity.website || "",
      logo_url: entity.logo_url || "", cover_image_url: entity.cover_image_url || "",
      president_name: entity.president_name || "", president_name_ar: entity.president_name_ar || "",
      secretary_name: entity.secretary_name || "", secretary_name_ar: entity.secretary_name_ar || "",
      founded_year: entity.founded_year || undefined,
      member_count: entity.member_count || undefined,
      mission: entity.mission || "", mission_ar: entity.mission_ar || "",
      username: entity.username || "",
      registration_number: entity.registration_number || "",
      license_number: entity.license_number || "",
      internal_notes: entity.internal_notes || "",
      services_input: (entity.services || []).join(", "),
      specializations_input: (entity.specializations || []).join(", "),
      tags_input: (entity.tags || []).join(", "),
    });
    setSelectedManager(entity.account_manager_id || "");
    setEditingId(entity.id);
    setShowForm(true);
  };

  const updateField = (key: keyof FormData, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const filtered = entities?.filter(e => {
    const matchesSearch = (e.name + (e.name_ar || "") + (e.entity_number || "")).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || e.type === filterType;
    const matchesStatus = filterStatus === "all" || e.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: entities?.length || 0,
    active: entities?.filter(e => e.status === "active").length || 0,
    pending: entities?.filter(e => e.status === "pending").length || 0,
    visible: entities?.filter(e => e.is_visible).length || 0,
  };

  // Translate button component
  const TranslateBtn = ({ enField, arField }: { enField: keyof FormData; arField: keyof FormData }) => {
    const isLoading = translatingField === String(enField) || translatingField === String(arField);
    return (
      <div className="flex items-center gap-1">
        <Button
          type="button" size="sm" variant="outline"
          disabled={isLoading || !(form[enField] as string)?.trim()}
          onClick={() => handleTranslate(enField, arField, "en_to_ar")}
          className="h-7 gap-1 text-xs"
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
          EN → AR
        </Button>
        <Button
          type="button" size="sm" variant="outline"
          disabled={isLoading || !(form[arField] as string)?.trim()}
          onClick={() => handleTranslate(arField, enField, "ar_to_en")}
          className="h-7 gap-1 text-xs"
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
          AR → EN
        </Button>
      </div>
    );
  };

  // Image upload component
  const ImageUploader = ({ type, url, fieldKey }: { type: "logo" | "cover"; url: string; fieldKey: keyof FormData }) => {
    const isUploading = type === "logo" ? uploadingLogo : uploadingCover;
    const inputRef = type === "logo" ? logoInputRef : coverInputRef;
    return (
      <div className="space-y-2">
        <Label>{type === "logo" ? (isAr ? "الشعار" : "Logo") : (isAr ? "صورة الغلاف" : "Cover Image")}</Label>
        {url && (
          <div className="relative inline-block">
            <img src={url} alt="" className={`rounded border object-cover ${type === "logo" ? "h-20 w-20" : "h-32 w-full max-w-md"}`} />
            <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => updateField(fieldKey, "")}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <input type="file" accept="image/*" ref={inputRef} className="hidden" onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleFileUpload(f, type);
            e.target.value = "";
          }} />
          <Button type="button" size="sm" variant="outline" disabled={isUploading} onClick={() => inputRef.current?.click()} className="gap-1">
            {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {isAr ? "رفع من الجهاز" : "Upload"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setShowMediaPicker(type)} className="gap-1">
            <Image className="h-3 w-3" />
            {isAr ? "اختيار من الوسائط" : "From Media"}
          </Button>
        </div>
        <Input value={url} onChange={e => updateField(fieldKey, e.target.value)} placeholder={isAr ? "أو أدخل الرابط" : "Or enter URL"} className="text-xs" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {isAr ? "سجل الجهات والجمعيات" : "Culinary Entities Registry"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isAr ? "إدارة الجمعيات والجهات الحكومية والخاصة المتعلقة بالطهي" : "Manage culinary associations, government & private entities"}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? (isAr ? "إغلاق" : "Close") : <><Plus className="me-2 h-4 w-4" />{isAr ? "إضافة جهة" : "Add Entity"}</>}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: isAr ? "الإجمالي" : "Total", value: stats.total, color: "text-foreground" },
          { label: isAr ? "نشطة" : "Active", value: stats.active, color: "text-chart-3" },
          { label: isAr ? "قيد المراجعة" : "Pending", value: stats.pending, color: "text-chart-4" },
          { label: isAr ? "مرئية" : "Visible", value: stats.visible, color: "text-primary" },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Inline Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingId ? (isAr ? "تعديل الجهة" : "Edit Entity") : (isAr ? "تسجيل جهة جديدة" : "Register New Entity")}</CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{isAr ? "اكتمال البيانات" : "Completion"}: {completionPercent}%</span>
                <Progress value={completionPercent} className="h-2 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="flex-wrap">
                <TabsTrigger value="basic">{isAr ? "الأساسية" : "Basic Info"}</TabsTrigger>
                <TabsTrigger value="media">{isAr ? "الوسائط" : "Media"}</TabsTrigger>
                <TabsTrigger value="contact">{isAr ? "الاتصال والموقع" : "Contact & Location"}</TabsTrigger>
                <TabsTrigger value="leadership">{isAr ? "القيادة" : "Leadership"}</TabsTrigger>
                <TabsTrigger value="details">{isAr ? "التفاصيل" : "Details"}</TabsTrigger>
                <TabsTrigger value="management">{isAr ? "الإدارة" : "Management"}</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>{isAr ? "الاسم (EN)" : "Name (EN)"} *</Label><Input value={form.name} onChange={e => updateField("name", e.target.value)} /></div>
                  <div><Label>{isAr ? "الاسم (AR)" : "Name (AR)"}</Label><Input value={form.name_ar} onChange={e => updateField("name_ar", e.target.value)} dir="rtl" /></div>
                </div>
                <TranslateBtn enField="name" arField="name_ar" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>{isAr ? "الاختصار (EN)" : "Abbreviation (EN)"}</Label><Input value={form.abbreviation} onChange={e => updateField("abbreviation", e.target.value)} placeholder="e.g. WACS" /></div>
                  <div><Label>{isAr ? "الاختصار (AR)" : "Abbreviation (AR)"}</Label><Input value={form.abbreviation_ar} onChange={e => updateField("abbreviation_ar", e.target.value)} dir="rtl" /></div>
                </div>
                <TranslateBtn enField="abbreviation" arField="abbreviation_ar" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>{isAr ? "الوصف (EN)" : "Description (EN)"}</Label><Textarea value={form.description} onChange={e => updateField("description", e.target.value)} rows={3} /></div>
                  <div><Label>{isAr ? "الوصف (AR)" : "Description (AR)"}</Label><Textarea value={form.description_ar} onChange={e => updateField("description_ar", e.target.value)} rows={3} dir="rtl" /></div>
                </div>
                <TranslateBtn enField="description" arField="description_ar" />

                <div className="grid gap-4 sm:grid-cols-4">
                  <div>
                    <Label>{isAr ? "النوع" : "Type"} *</Label>
                    <Select value={form.type} onValueChange={v => updateField("type", v as EntityType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{typeOptions.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{isAr ? "النطاق" : "Scope"}</Label>
                    <Select value={form.scope} onValueChange={v => updateField("scope", v as EntityScope)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{scopeOptions.map(s => <SelectItem key={s.value} value={s.value}>{isAr ? s.ar : s.en}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{isAr ? "الحالة" : "Status"}</Label>
                    <Select value={form.status} onValueChange={v => updateField("status", v as EntityStatus)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>{isAr ? "اسم المستخدم" : "Username"}</Label><Input value={form.username} onChange={e => updateField("username", e.target.value)} placeholder="e.g. wacs" /></div>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2"><Switch checked={form.is_visible} onCheckedChange={v => updateField("is_visible", v)} /><Label>{isAr ? "مرئي للعامة" : "Publicly Visible"}</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={form.is_verified} onCheckedChange={v => updateField("is_verified", v)} /><Label>{isAr ? "موثق" : "Verified"}</Label></div>
                </div>
              </TabsContent>

              {/* Media Tab */}
              <TabsContent value="media" className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <ImageUploader type="logo" url={form.logo_url} fieldKey="logo_url" />
                  <ImageUploader type="cover" url={form.cover_image_url} fieldKey="cover_image_url" />
                </div>

                {/* Media Picker Modal */}
                {showMediaPicker && (
                  <Card className="border-primary">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{isAr ? "اختر من مكتبة الوسائط" : "Select from Media Library"}</CardTitle>
                        <Button size="icon" variant="ghost" onClick={() => setShowMediaPicker(null)}><X className="h-4 w-4" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {mediaFiles && mediaFiles.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                          {mediaFiles.map(f => (
                            <button
                              key={f.name}
                              className="group relative overflow-hidden rounded border hover:ring-2 hover:ring-primary"
                              onClick={() => {
                                const field = showMediaPicker === "logo" ? "logo_url" : "cover_image_url";
                                updateField(field as keyof FormData, f.url);
                                setShowMediaPicker(null);
                                toast({ title: isAr ? "تم الاختيار" : "Selected" });
                              }}
                            >
                              <img src={f.url} alt={f.name} className="h-16 w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{isAr ? "لا توجد ملفات في المكتبة" : "No files in library"}</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Contact Tab */}
              <TabsContent value="contact" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div><Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label><Input type="email" value={form.email} onChange={e => updateField("email", e.target.value)} /></div>
                  <div><Label>{isAr ? "الهاتف" : "Phone"}</Label><Input value={form.phone} onChange={e => updateField("phone", e.target.value)} /></div>
                  <div><Label>{isAr ? "الفاكس" : "Fax"}</Label><Input value={form.fax} onChange={e => updateField("fax", e.target.value)} /></div>
                  <div><Label>{isAr ? "الموقع الإلكتروني" : "Website"}</Label><Input value={form.website} onChange={e => updateField("website", e.target.value)} /></div>
                  <div><Label>{isAr ? "الدولة" : "Country"}</Label><Input value={form.country} onChange={e => updateField("country", e.target.value)} /></div>
                  <div><Label>{isAr ? "المدينة" : "City"}</Label><Input value={form.city} onChange={e => updateField("city", e.target.value)} /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>{isAr ? "العنوان (EN)" : "Address (EN)"}</Label><Input value={form.address} onChange={e => updateField("address", e.target.value)} /></div>
                  <div><Label>{isAr ? "العنوان (AR)" : "Address (AR)"}</Label><Input value={form.address_ar} onChange={e => updateField("address_ar", e.target.value)} dir="rtl" /></div>
                </div>
                <TranslateBtn enField="address" arField="address_ar" />
                <div><Label>{isAr ? "الرمز البريدي" : "Postal Code"}</Label><Input value={form.postal_code} onChange={e => updateField("postal_code", e.target.value)} className="max-w-xs" /></div>
              </TabsContent>

              {/* Leadership Tab */}
              <TabsContent value="leadership" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>{isAr ? "اسم الرئيس (EN)" : "President Name (EN)"}</Label><Input value={form.president_name} onChange={e => updateField("president_name", e.target.value)} /></div>
                  <div><Label>{isAr ? "اسم الرئيس (AR)" : "President Name (AR)"}</Label><Input value={form.president_name_ar} onChange={e => updateField("president_name_ar", e.target.value)} dir="rtl" /></div>
                </div>
                <TranslateBtn enField="president_name" arField="president_name_ar" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>{isAr ? "اسم الأمين العام (EN)" : "Secretary Name (EN)"}</Label><Input value={form.secretary_name} onChange={e => updateField("secretary_name", e.target.value)} /></div>
                  <div><Label>{isAr ? "اسم الأمين العام (AR)" : "Secretary Name (AR)"}</Label><Input value={form.secretary_name_ar} onChange={e => updateField("secretary_name_ar", e.target.value)} dir="rtl" /></div>
                </div>
                <TranslateBtn enField="secretary_name" arField="secretary_name_ar" />
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>{isAr ? "سنة التأسيس" : "Founded Year"}</Label><Input type="number" value={form.founded_year || ""} onChange={e => updateField("founded_year", parseInt(e.target.value) || undefined)} /></div>
                  <div><Label>{isAr ? "عدد الأعضاء" : "Member Count"}</Label><Input type="number" value={form.member_count || ""} onChange={e => updateField("member_count", parseInt(e.target.value) || undefined)} /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>{isAr ? "الرسالة (EN)" : "Mission (EN)"}</Label><Textarea value={form.mission} onChange={e => updateField("mission", e.target.value)} rows={3} /></div>
                  <div><Label>{isAr ? "الرسالة (AR)" : "Mission (AR)"}</Label><Textarea value={form.mission_ar} onChange={e => updateField("mission_ar", e.target.value)} rows={3} dir="rtl" /></div>
                </div>
                <TranslateBtn enField="mission" arField="mission_ar" />
                <div className="grid gap-4 sm:grid-cols-3">
                  <div><Label>{isAr ? "الخدمات (مفصولة بفواصل)" : "Services (comma-separated)"}</Label><Input value={form.services_input} onChange={e => updateField("services_input", e.target.value)} /></div>
                  <div><Label>{isAr ? "التخصصات" : "Specializations"}</Label><Input value={form.specializations_input} onChange={e => updateField("specializations_input", e.target.value)} /></div>
                  <div><Label>{isAr ? "الوسوم" : "Tags"}</Label><Input value={form.tags_input} onChange={e => updateField("tags_input", e.target.value)} /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>{isAr ? "رقم التسجيل" : "Registration Number"}</Label><Input value={form.registration_number} onChange={e => updateField("registration_number", e.target.value)} /></div>
                  <div><Label>{isAr ? "رقم الترخيص" : "License Number"}</Label><Input value={form.license_number} onChange={e => updateField("license_number", e.target.value)} /></div>
                </div>
              </TabsContent>

              {/* Management Tab */}
              <TabsContent value="management" className="space-y-4">
                <div>
                  <Label>{isAr ? "مدير الحساب" : "Account Manager"}</Label>
                  <Select value={selectedManager} onValueChange={setSelectedManager}>
                    <SelectTrigger className="max-w-md"><SelectValue placeholder={isAr ? "اختر مدير حساب" : "Select account manager"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{isAr ? "بدون مدير" : "No manager"}</SelectItem>
                      {managers?.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.full_name || m.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isAr ? "ملاحظات داخلية" : "Internal Notes"}</Label>
                  <Textarea value={form.internal_notes} onChange={e => updateField("internal_notes", e.target.value)} rows={4} placeholder={isAr ? "ملاحظات للفريق فقط..." : "Notes visible to admins only..."} />
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-6" />

            <div className="flex gap-3">
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name}>
                {saveMutation.isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : editingId ? (isAr ? "تحديث" : "Update") : (isAr ? "تسجيل" : "Register")}
              </Button>
              <Button variant="outline" onClick={resetForm}>{isAr ? "إلغاء" : "Cancel"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={isAr ? "بحث بالاسم أو الرقم..." : "Search by name or number..."} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="ps-10" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "جميع الأنواع" : "All Types"}</SelectItem>
            {typeOptions.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "جميع الحالات" : "All Status"}</SelectItem>
            {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "الرقم" : "#"}</TableHead>
                <TableHead>{isAr ? "الجهة" : "Entity"}</TableHead>
                <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                <TableHead>{isAr ? "النطاق" : "Scope"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead>{isAr ? "الرؤية" : "Visibility"}</TableHead>
                <TableHead>{isAr ? "المتابعون" : "Followers"}</TableHead>
                <TableHead className="text-end">{isAr ? "الإجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">{isAr ? "جاري التحميل..." : "Loading..."}</TableCell></TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد جهات مسجلة" : "No entities registered"}</TableCell></TableRow>
              ) : (
                filtered?.map(entity => {
                  const typeLabel = typeOptions.find(t => t.value === entity.type);
                  const scopeLabel = scopeOptions.find(s => s.value === entity.scope);
                  return (
                    <TableRow key={entity.id}>
                      <TableCell className="font-mono text-xs">{entity.entity_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {entity.logo_url ? (
                            <img src={entity.logo_url} alt="" className="h-8 w-8 rounded object-cover" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10"><Building2 className="h-4 w-4 text-primary" /></div>
                          )}
                          <div>
                            <p className="font-medium">{isAr && entity.name_ar ? entity.name_ar : entity.name}</p>
                            {entity.username && <p className="text-xs text-muted-foreground">@{entity.username}</p>}
                            {entity.city && <p className="text-xs text-muted-foreground">{entity.city}{entity.country ? `, ${entity.country}` : ""}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{isAr ? typeLabel?.ar : typeLabel?.en}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{isAr ? scopeLabel?.ar : scopeLabel?.en}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={entity.status === "active" ? "default" : "secondary"}>
                          {entity.is_verified && <ShieldCheck className="me-1 h-3 w-3" />}
                          {entity.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon" variant="ghost"
                          onClick={() => toggleVisibility.mutate({ id: entity.id, visible: !entity.is_visible })}
                        >
                          {entity.is_visible ? <Eye className="h-4 w-4 text-chart-3" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {(entity as any).entity_followers?.length || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" title={isAr ? "إدارة" : "Manage"} onClick={() => setManagingEntity({ id: entity.id, name: isAr && entity.name_ar ? entity.name_ar : entity.name })}><Settings2 className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => startEdit(entity)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(entity.id)}><Trash2 className="h-4 w-4" /></Button>
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

      {/* Entity Sub-Modules Management Panel */}
      {managingEntity && (
        <EntitySubModulesPanel
          entityId={managingEntity.id}
          entityName={managingEntity.name}
          onClose={() => setManagingEntity(null)}
        />
      )}
    </div>
  );
}
