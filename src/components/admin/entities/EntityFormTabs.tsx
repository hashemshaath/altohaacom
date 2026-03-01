import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { ChefSearchSelector } from "@/components/admin/ChefSearchSelector";
import { EntityLeadershipPanel } from "@/components/entities/EntityLeadershipPanel";
import { Image, Languages, Loader2, MapPin, Search, Upload, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type EntityType = Database["public"]["Enums"]["entity_type"];
type EntityScope = Database["public"]["Enums"]["entity_scope"];
type EntityStatus = Database["public"]["Enums"]["entity_status"];

export interface EntityFormData {
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
  latitude: string; longitude: string;
}

export const emptyForm: EntityFormData = {
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
  latitude: "", longitude: "",
};

export const typeOptions: { value: EntityType; en: string; ar: string }[] = [
  { value: "culinary_association", en: "Culinary Association", ar: "جمعية طهي" },
  { value: "government_entity", en: "Government Entity", ar: "جهة حكومية" },
  { value: "private_association", en: "Private Association", ar: "جمعية خاصة" },
  { value: "culinary_academy", en: "Culinary Academy", ar: "أكاديمية طهي" },
  { value: "industry_body", en: "Industry Body", ar: "هيئة صناعية" },
  { value: "university", en: "University", ar: "جامعة" },
  { value: "college", en: "College", ar: "كلية" },
  { value: "training_center", en: "Training Center", ar: "مركز تدريب" },
];

export const scopeOptions: { value: EntityScope; en: string; ar: string }[] = [
  { value: "local", en: "Local", ar: "محلي" },
  { value: "national", en: "National", ar: "وطني" },
  { value: "regional", en: "Regional", ar: "إقليمي" },
  { value: "international", en: "International", ar: "دولي" },
];

export const statusOptions: EntityStatus[] = ["pending", "active", "suspended", "archived"];

const statusLabels: Record<string, { en: string; ar: string }> = {
  pending: { en: "Pending", ar: "قيد المراجعة" },
  active: { en: "Active", ar: "نشط" },
  suspended: { en: "Suspended", ar: "موقوف" },
  archived: { en: "Archived", ar: "مؤرشف" },
};

const requiredFields: (keyof EntityFormData)[] = ["name", "name_ar", "description", "description_ar", "type", "email", "phone", "country", "city", "logo_url"];

interface Props {
  form: EntityFormData;
  editingId: string | null;
  selectedManager: string;
  isSaving: boolean;
  onUpdate: (key: keyof EntityFormData, value: any) => void;
  onManagerChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function EntityFormTabs({ form, editingId, selectedManager, isSaving, onUpdate, onManagerChange, onSave, onCancel }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [translatingField, setTranslatingField] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState<"logo" | "cover" | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Validation
  const errors: Partial<Record<keyof EntityFormData, string>> = {};
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = isAr ? "بريد إلكتروني غير صالح" : "Invalid email";
  if (form.website && !/^https?:\/\/.+/.test(form.website) && form.website.length > 0) errors.website = isAr ? "يجب أن يبدأ بـ http:// أو https://" : "Must start with http:// or https://";
  if (form.phone && !/^[+\d\s()-]{6,20}$/.test(form.phone)) errors.phone = isAr ? "رقم هاتف غير صالح" : "Invalid phone number";

  const completionPercent = Math.round((requiredFields.filter(f => {
    const v = form[f];
    return v !== undefined && v !== null && v !== "";
  }).length / requiredFields.length) * 100);

  const { data: managers } = useQuery({
    queryKey: ["admin-users-for-manager"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name").order("full_name");
      if (error) throw error;
      return data;
    },
  });

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

  const handleTranslate = async (sourceField: keyof EntityFormData, targetField: keyof EntityFormData, direction: "en_to_ar" | "ar_to_en") => {
    const sourceText = form[sourceField] as string;
    if (!sourceText?.trim()) return;
    setTranslatingField(String(sourceField));
    try {
      const { data, error } = await supabase.functions.invoke("ai-translate-seo", {
        body: { text: sourceText, source_lang: direction === "en_to_ar" ? "en" : "ar", target_lang: direction === "en_to_ar" ? "ar" : "en", optimize_seo: true },
      });
      if (error) throw error;
      if (data?.translated) {
        onUpdate(targetField, data.translated);
        toast({ title: isAr ? "تمت الترجمة + SEO" : "Translated + SEO optimized" });
      }
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setTranslatingField(null);
    }
  };

  const handleSeoOptimize = async (field: keyof EntityFormData) => {
    const text = form[field] as string;
    if (!text?.trim()) return;
    setTranslatingField(`seo-${String(field)}`);
    try {
      const isArabicField = String(field).endsWith("_ar");
      const { data, error } = await supabase.functions.invoke("ai-translate-seo", {
        body: { text, source_lang: isArabicField ? "ar" : "en", optimize_only: true },
      });
      if (error) throw error;
      if (data?.optimized) {
        onUpdate(field, data.optimized);
        toast({ title: isAr ? "تم تحسين النص" : "Text optimized for SEO" });
      }
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setTranslatingField(null);
    }
  };

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
      onUpdate(field, urlData.publicUrl);
      toast({ title: isAr ? "تم الرفع" : "Upload successful" });
    } catch (err: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    } finally {
      setter(false);
    }
  };

  const TranslateBtn = ({ enField, arField }: { enField: keyof EntityFormData; arField: keyof EntityFormData }) => {
    const anyLoading = !!translatingField;
    return (
      <div className="flex flex-wrap items-center gap-1">
        <Button type="button" size="sm" variant="secondary" disabled={anyLoading || !(form[enField] as string)?.trim()}
          onClick={() => handleSeoOptimize(enField)} className="h-7 gap-1 text-xs">
          {translatingField === `seo-${String(enField)}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />} SEO EN
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled={anyLoading || !(form[arField] as string)?.trim()}
          onClick={() => handleSeoOptimize(arField)} className="h-7 gap-1 text-xs">
          {translatingField === `seo-${String(arField)}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />} SEO AR
        </Button>
        <Separator orientation="vertical" className="h-5 mx-1" />
        <Button type="button" size="sm" variant="outline" disabled={anyLoading || !(form[enField] as string)?.trim()}
          onClick={() => handleTranslate(enField, arField, "en_to_ar")} className="h-7 gap-1 text-xs">
          {translatingField === String(enField) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />} EN → AR
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={anyLoading || !(form[arField] as string)?.trim()}
          onClick={() => handleTranslate(arField, enField, "ar_to_en")} className="h-7 gap-1 text-xs">
          {translatingField === String(arField) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />} AR → EN
        </Button>
      </div>
    );
  };

  const ImageUploader = ({ type, url, fieldKey }: { type: "logo" | "cover"; url: string; fieldKey: keyof EntityFormData }) => {
    const isUploading = type === "logo" ? uploadingLogo : uploadingCover;
    const inputRef = type === "logo" ? logoInputRef : coverInputRef;
    return (
      <div className="space-y-2">
        <Label>{type === "logo" ? (isAr ? "الشعار" : "Logo") : (isAr ? "صورة الغلاف" : "Cover Image")}</Label>
        {url && (
          <div className="relative inline-block">
            <img src={url} alt="" className={`rounded-xl border object-cover ${type === "logo" ? "h-20 w-20" : "h-32 w-full max-w-md"}`} />
            <Button size="icon" variant="destructive" className="absolute -top-2 -end-2 h-6 w-6" onClick={() => onUpdate(fieldKey, "")}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <input type="file" accept="image/*" ref={inputRef} className="hidden" onChange={e => {
            const f = e.target.files?.[0]; if (f) handleFileUpload(f, type); e.target.value = "";
          }} />
          <Button type="button" size="sm" variant="outline" disabled={isUploading} onClick={() => inputRef.current?.click()} className="gap-1">
            {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {isAr ? "رفع" : "Upload"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setShowMediaPicker(type)} className="gap-1">
            <Image className="h-3 w-3" /> {isAr ? "من المكتبة" : "From Media"}
          </Button>
        </div>
        <Input value={url} onChange={e => onUpdate(fieldKey, e.target.value)} placeholder={isAr ? "أو أدخل الرابط" : "Or enter URL"} className="text-xs" />
      </div>
    );
  };

  const FieldWithError = ({ fieldKey, children }: { fieldKey: keyof EntityFormData; children: React.ReactNode }) => (
    <div>
      {children}
      {errors[fieldKey] && <p className="text-xs text-destructive mt-1">{errors[fieldKey]}</p>}
    </div>
  );

  const isRequired = (field: keyof EntityFormData) => requiredFields.includes(field);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{editingId ? (isAr ? "تعديل الجهة" : "Edit Entity") : (isAr ? "تسجيل جهة جديدة" : "Register New Entity")}</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{completionPercent}%</span>
            <Progress value={completionPercent} className="h-2 w-28" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="basic">{isAr ? "الأساسية" : "Basic Info"}</TabsTrigger>
            <TabsTrigger value="media">{isAr ? "الوسائط" : "Media"}</TabsTrigger>
            <TabsTrigger value="contact">{isAr ? "الاتصال" : "Contact"}</TabsTrigger>
            <TabsTrigger value="leadership">{isAr ? "القيادة" : "Leadership"}</TabsTrigger>
            <TabsTrigger value="details">{isAr ? "التفاصيل" : "Details"}</TabsTrigger>
            <TabsTrigger value="management">{isAr ? "الإدارة" : "Management"}</TabsTrigger>
          </TabsList>

          {/* Basic Info */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>{isAr ? "الاسم (EN)" : "Name (EN)"} <span className="text-destructive">*</span></Label><Input value={form.name} onChange={e => onUpdate("name", e.target.value)} /></div>
              <div><Label>{isAr ? "الاسم (AR)" : "Name (AR)"} <span className="text-destructive">*</span></Label><Input value={form.name_ar} onChange={e => onUpdate("name_ar", e.target.value)} dir="rtl" /></div>
            </div>
            <TranslateBtn enField="name" arField="name_ar" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>{isAr ? "الاختصار (EN)" : "Abbreviation"}</Label><Input value={form.abbreviation} onChange={e => onUpdate("abbreviation", e.target.value)} placeholder="e.g. WACS" /></div>
              <div><Label>{isAr ? "الاختصار (AR)" : "Abbreviation (AR)"}</Label><Input value={form.abbreviation_ar} onChange={e => onUpdate("abbreviation_ar", e.target.value)} dir="rtl" /></div>
            </div>
            <TranslateBtn enField="abbreviation" arField="abbreviation_ar" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>{isAr ? "الوصف (EN)" : "Description (EN)"} <span className="text-destructive">*</span></Label><Textarea value={form.description} onChange={e => onUpdate("description", e.target.value)} rows={3} /></div>
              <div><Label>{isAr ? "الوصف (AR)" : "Description (AR)"} <span className="text-destructive">*</span></Label><Textarea value={form.description_ar} onChange={e => onUpdate("description_ar", e.target.value)} rows={3} dir="rtl" /></div>
            </div>
            <TranslateBtn enField="description" arField="description_ar" />
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <Label>{isAr ? "النوع" : "Type"} <span className="text-destructive">*</span></Label>
                <Select value={form.type} onValueChange={v => onUpdate("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{typeOptions.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? "النطاق" : "Scope"}</Label>
                <Select value={form.scope} onValueChange={v => onUpdate("scope", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{scopeOptions.map(s => <SelectItem key={s.value} value={s.value}>{isAr ? s.ar : s.en}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? "الحالة" : "Status"}</Label>
                <Select value={form.status} onValueChange={v => onUpdate("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s}>{isAr ? statusLabels[s]?.ar : statusLabels[s]?.en}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>{isAr ? "اسم المستخدم" : "Username"}</Label><Input value={form.username} onChange={e => onUpdate("username", e.target.value)} placeholder="e.g. wacs" /></div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.is_visible} onCheckedChange={v => onUpdate("is_visible", v)} /><Label>{isAr ? "مرئي للعامة" : "Publicly Visible"}</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_verified} onCheckedChange={v => onUpdate("is_verified", v)} /><Label>{isAr ? "موثق" : "Verified"}</Label></div>
            </div>
          </TabsContent>

          {/* Media */}
          <TabsContent value="media" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <ImageUploader type="logo" url={form.logo_url} fieldKey="logo_url" />
              <ImageUploader type="cover" url={form.cover_image_url} fieldKey="cover_image_url" />
            </div>
            {showMediaPicker && (
              <Card className="border-primary">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{isAr ? "مكتبة الوسائط" : "Media Library"}</CardTitle>
                    <Button size="icon" variant="ghost" onClick={() => setShowMediaPicker(null)}><X className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {mediaFiles && mediaFiles.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {mediaFiles.map(f => (
                        <button key={f.name} className="group relative overflow-hidden rounded border hover:ring-2 hover:ring-primary"
                          onClick={() => { onUpdate(showMediaPicker === "logo" ? "logo_url" : "cover_image_url", f.url); setShowMediaPicker(null); }}>
                          <img src={f.url} alt={f.name} className="h-16 w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">{isAr ? "لا توجد ملفات" : "No files"}</p>}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Contact & Location */}
          <TabsContent value="contact" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldWithError fieldKey="email">
                <Label>{isAr ? "البريد الإلكتروني" : "Email"} <span className="text-destructive">*</span></Label>
                <Input type="email" value={form.email} onChange={e => onUpdate("email", e.target.value)} className={errors.email ? "border-destructive" : ""} />
              </FieldWithError>
              <FieldWithError fieldKey="phone">
                <Label>{isAr ? "الهاتف" : "Phone"} <span className="text-destructive">*</span></Label>
                <Input value={form.phone} onChange={e => onUpdate("phone", e.target.value)} className={errors.phone ? "border-destructive" : ""} />
              </FieldWithError>
              <div><Label>{isAr ? "الفاكس" : "Fax"}</Label><Input value={form.fax} onChange={e => onUpdate("fax", e.target.value)} /></div>
              <FieldWithError fieldKey="website">
                <Label>{isAr ? "الموقع" : "Website"}</Label>
                <Input value={form.website} onChange={e => onUpdate("website", e.target.value)} placeholder="https://" className={errors.website ? "border-destructive" : ""} />
              </FieldWithError>
              <CountrySelector value={form.country} onChange={(code) => onUpdate("country", code)} label={isAr ? "الدولة" : "Country"} />
              <div><Label>{isAr ? "المدينة" : "City"} <span className="text-destructive">*</span></Label><Input value={form.city} onChange={e => onUpdate("city", e.target.value)} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>{isAr ? "العنوان (EN)" : "Address (EN)"}</Label><Input value={form.address} onChange={e => onUpdate("address", e.target.value)} /></div>
              <div><Label>{isAr ? "العنوان (AR)" : "Address (AR)"}</Label><Input value={form.address_ar} onChange={e => onUpdate("address_ar", e.target.value)} dir="rtl" /></div>
            </div>
            <TranslateBtn enField="address" arField="address_ar" />
            <div><Label>{isAr ? "الرمز البريدي" : "Postal Code"}</Label><Input value={form.postal_code} onChange={e => onUpdate("postal_code", e.target.value)} className="max-w-xs" /></div>
            <Separator />
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5 text-sm font-semibold"><MapPin className="h-4 w-4" />{isAr ? "الموقع على الخريطة" : "Map Location"}</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label className="text-xs">{isAr ? "خط العرض" : "Latitude"}</Label><Input value={form.latitude} onChange={e => onUpdate("latitude", e.target.value)} placeholder="e.g. 24.7136" dir="ltr" /></div>
                <div><Label className="text-xs">{isAr ? "خط الطول" : "Longitude"}</Label><Input value={form.longitude} onChange={e => onUpdate("longitude", e.target.value)} placeholder="e.g. 46.6753" dir="ltr" /></div>
              </div>
              {form.latitude && form.longitude && (
                <div className="space-y-2">
                  <iframe title="Google Maps" width="100%" height="250" className="rounded-xl border" loading="lazy"
                    src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=14&output=embed`} />
                  <a href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                    <MapPin className="h-3 w-3" />{isAr ? "فتح في خرائط جوجل" : "Open in Google Maps"}
                  </a>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Leadership */}
          <TabsContent value="leadership" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>{isAr ? "الرئيس" : "President"}</Label>
                <ChefSearchSelector value={form.president_name ? "temp" : undefined} valueName={form.president_name}
                  onChange={(_uid, name, nameAr) => { onUpdate("president_name", name); onUpdate("president_name_ar", nameAr); }}
                  onClear={() => { onUpdate("president_name", ""); onUpdate("president_name_ar", ""); }}
                  placeholder={isAr ? "ابحث عن الرئيس..." : "Search for president..."} />
              </div>
              <div>
                <Label>{isAr ? "الأمين العام" : "Secretary General"}</Label>
                <ChefSearchSelector value={form.secretary_name ? "temp" : undefined} valueName={form.secretary_name}
                  onChange={(_uid, name, nameAr) => { onUpdate("secretary_name", name); onUpdate("secretary_name_ar", nameAr); }}
                  onClear={() => { onUpdate("secretary_name", ""); onUpdate("secretary_name_ar", ""); }}
                  placeholder={isAr ? "ابحث عن الأمين..." : "Search for secretary..."} />
              </div>
            </div>
            {editingId ? (
              <>
                <Separator />
                <h3 className="text-sm font-semibold">{isAr ? "جميع المناصب" : "All Positions"}</h3>
                <EntityLeadershipPanel entityId={editingId} />
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center">
                <p className="text-sm text-muted-foreground">{isAr ? "احفظ الجهة أولاً لإدارة المناصب" : "Save entity first to manage positions"}</p>
              </div>
            )}
          </TabsContent>

          {/* Details */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>{isAr ? "سنة التأسيس" : "Founded Year"}</Label><Input type="number" value={form.founded_year || ""} onChange={e => onUpdate("founded_year", parseInt(e.target.value) || undefined)} /></div>
              <div><Label>{isAr ? "عدد الأعضاء" : "Member Count"}</Label><Input type="number" value={form.member_count || ""} onChange={e => onUpdate("member_count", parseInt(e.target.value) || undefined)} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>{isAr ? "الرسالة (EN)" : "Mission (EN)"}</Label><Textarea value={form.mission} onChange={e => onUpdate("mission", e.target.value)} rows={3} /></div>
              <div><Label>{isAr ? "الرسالة (AR)" : "Mission (AR)"}</Label><Textarea value={form.mission_ar} onChange={e => onUpdate("mission_ar", e.target.value)} rows={3} dir="rtl" /></div>
            </div>
            <TranslateBtn enField="mission" arField="mission_ar" />
            <div className="grid gap-4 sm:grid-cols-3">
              <div><Label>{isAr ? "الخدمات" : "Services"}</Label><Input value={form.services_input} onChange={e => onUpdate("services_input", e.target.value)} placeholder={isAr ? "مفصولة بفواصل" : "Comma-separated"} /></div>
              <div><Label>{isAr ? "التخصصات" : "Specializations"}</Label><Input value={form.specializations_input} onChange={e => onUpdate("specializations_input", e.target.value)} /></div>
              <div><Label>{isAr ? "الوسوم" : "Tags"}</Label><Input value={form.tags_input} onChange={e => onUpdate("tags_input", e.target.value)} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>{isAr ? "رقم التسجيل" : "Registration Number"}</Label><Input value={form.registration_number} onChange={e => onUpdate("registration_number", e.target.value)} /></div>
              <div><Label>{isAr ? "رقم الترخيص" : "License Number"}</Label><Input value={form.license_number} onChange={e => onUpdate("license_number", e.target.value)} /></div>
            </div>
          </TabsContent>

          {/* Management */}
          <TabsContent value="management" className="space-y-4">
            <div>
              <Label>{isAr ? "مدير الحساب" : "Account Manager"}</Label>
              <Select value={selectedManager} onValueChange={onManagerChange}>
                <SelectTrigger className="max-w-md"><SelectValue placeholder={isAr ? "اختر مدير حساب" : "Select manager"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{isAr ? "بدون" : "None"}</SelectItem>
                  {managers?.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name || m.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isAr ? "ملاحظات داخلية" : "Internal Notes"}</Label>
              <Textarea value={form.internal_notes} onChange={e => onUpdate("internal_notes", e.target.value)} rows={4} placeholder={isAr ? "ملاحظات للمشرفين فقط..." : "Admin-only notes..."} />
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        <div className="flex gap-3">
          <Button onClick={onSave} disabled={isSaving || !form.name || Object.keys(errors).length > 0}>
            {isSaving ? (isAr ? "جاري الحفظ..." : "Saving...") : editingId ? (isAr ? "تحديث" : "Update") : (isAr ? "تسجيل" : "Register")}
          </Button>
          <Button variant="outline" onClick={onCancel}>{isAr ? "إلغاء" : "Cancel"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
