import { useState, useEffect, useRef, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAllCountries } from "@/hooks/useCountries";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { countryFlag } from "@/lib/countryFlag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, Save, X, Edit, Sparkles, Upload, Image, CheckCircle,
  Globe, Mail, Phone, MapPin, FileText, CreditCard, Shield, Send,
  Star, ExternalLink, Navigation,
} from "lucide-react";

type CompanyType = "sponsor" | "supplier" | "partner" | "vendor";

const companyTypes: { value: CompanyType; label: string; labelAr: string }[] = [
  { value: "sponsor", label: "Sponsor", labelAr: "راعي" },
  { value: "supplier", label: "Supplier", labelAr: "مورد" },
  { value: "partner", label: "Partner", labelAr: "شريك" },
  { value: "vendor", label: "Vendor", labelAr: "بائع" },
];

interface CompanyEditPanelProps {
  companyId: string;
  companyDetails: any;
}

export const CompanyEditPanel = memo(function CompanyEditPanel({ companyId, companyDetails }: CompanyEditPanelProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: allCountries = [] } = useAllCountries();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const [form, setForm] = useState({
    name: "", name_ar: "", type: "supplier" as CompanyType,
    registration_number: "", tax_number: "", email: "", phone: "", website: "",
    address: "", address_ar: "", city: "", country: "", country_code: "",
    postal_code: "", description: "", description_ar: "",
    credit_limit: 0, payment_terms: 30, currency: "SAR",
    logo_url: "",
    status: "pending" as string,
    // Location fields
    neighborhood: "", neighborhood_ar: "",
    street: "", street_ar: "",
    national_address: "", national_address_ar: "",
    latitude: "" as string | number, longitude: "" as string | number,
    google_maps_url: "",
    rating: "" as string | number, total_reviews: "" as string | number,
    import_source: "",
    phone_secondary: "", fax: "",
  });

  // Media query for logo selection
  const { data: mediaItems = [] } = useQuery({
    queryKey: ["company-media-logos", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_media").select("id, company_id, file_url, file_name, category, media_type, created_at")
        .eq("company_id", companyId).in("category", ["logo", "product_images"]).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: showMediaPicker,
  });

  useEffect(() => {
    if (companyDetails) {
      setForm({
        name: companyDetails.name || "",
        name_ar: companyDetails.name_ar || "",
        type: companyDetails.type || "supplier",
        registration_number: companyDetails.registration_number || "",
        tax_number: companyDetails.tax_number || "",
        email: companyDetails.email || "",
        phone: companyDetails.phone || "",
        website: companyDetails.website || "",
        address: companyDetails.address || "",
        address_ar: companyDetails.address_ar || "",
        city: companyDetails.city || "",
        country: companyDetails.country || "",
        country_code: companyDetails.country_code || "",
        postal_code: companyDetails.postal_code || "",
        description: companyDetails.description || "",
        description_ar: companyDetails.description_ar || "",
        credit_limit: companyDetails.credit_limit || 0,
        payment_terms: companyDetails.payment_terms || 30,
        currency: companyDetails.currency || "SAR",
        logo_url: companyDetails.logo_url || "",
        status: companyDetails.status || "pending",
        neighborhood: companyDetails.neighborhood || "",
        neighborhood_ar: companyDetails.neighborhood_ar || "",
        street: companyDetails.street || "",
        street_ar: companyDetails.street_ar || "",
        national_address: companyDetails.national_address || "",
        national_address_ar: companyDetails.national_address_ar || "",
        latitude: companyDetails.latitude ?? "",
        longitude: companyDetails.longitude ?? "",
        google_maps_url: companyDetails.google_maps_url || "",
        rating: companyDetails.rating ?? "",
        total_reviews: companyDetails.total_reviews ?? "",
        import_source: companyDetails.import_source || "",
        phone_secondary: companyDetails.phone_secondary || "",
        fax: companyDetails.fax || "",
      });
    }
  }, [companyDetails]);

  // Completion percentage
  const completionFields = [
    "name", "name_ar", "email", "phone", "website", "address", "address_ar",
    "city", "country_code", "description", "description_ar", "registration_number",
    "tax_number", "logo_url", "type", "neighborhood", "street",
  ];
  const filledFields = completionFields.filter(f => !!(form as any)[f]);
  const completionPct = Math.round((filledFields.length / completionFields.length) * 100);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const { status, import_source, ...rest } = data;
      const { error } = await supabase.from("companies").update({
        ...rest,
        status: status as any,
        country_code: rest.country_code || null,
        credit_limit: Number(rest.credit_limit) || 0,
        payment_terms: Number(rest.payment_terms) || 30,
        logo_url: rest.logo_url || null,
        latitude: rest.latitude ? Number(rest.latitude) : null,
        longitude: rest.longitude ? Number(rest.longitude) : null,
        rating: rest.rating ? Number(rest.rating) : null,
        total_reviews: rest.total_reviews ? Number(rest.total_reviews) : null,
        neighborhood: rest.neighborhood || null,
        neighborhood_ar: rest.neighborhood_ar || null,
        street: rest.street || null,
        street_ar: rest.street_ar || null,
        national_address: rest.national_address || null,
        national_address_ar: rest.national_address_ar || null,
        google_maps_url: rest.google_maps_url || null,
        phone_secondary: rest.phone_secondary || null,
        fax: rest.fax || null,
      }).eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setEditing(false);
      toast({ title: isAr ? "تم حفظ التعديلات" : "Changes saved" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: isAr ? "فشل الحفظ" : "Save failed", description: e.message }),
  });

  const handleAITranslate = async (text: string, sourceLang: "ar" | "en", setter: (val: string) => void) => {
    if (!text.trim()) return;
    setAiLoading(true);
    try {
      const targetLang = sourceLang === "ar" ? "en" : "ar";
      const { data, error } = await supabase.functions.invoke("ai-translate-seo", {
        body: { text, source_lang: sourceLang, target_lang: targetLang, optimize_seo: true },
      });
      if (error) throw error;
      if (data?.translated) setter(data.translated);
    } catch {
      toast({ variant: "destructive", title: isAr ? "خدمة الترجمة غير متاحة" : "Translation unavailable" });
    }
    setAiLoading(false);
  };

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${companyId}/logo/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("company-media").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("company-media").getPublicUrl(path);
      setForm(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      const user = (await supabase.auth.getUser()).data.user;
      await supabase.from("company_media").insert({
        company_id: companyId, category: "logo", file_url: urlData.publicUrl,
        filename: file.name, file_type: file.type, file_size: file.size, uploaded_by: user?.id || null,
      });
      toast({ title: isAr ? "تم رفع الشعار" : "Logo uploaded" });
    } catch (e: any) {
      toast({ variant: "destructive", title: isAr ? "فشل الرفع" : "Upload failed", description: e.message });
    }
    setLogoUploading(false);
  };

  const AIBtn = ({ onClick }: { onClick: () => void }) => (
    <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={aiLoading} className="gap-1 h-7 text-xs">
      <Sparkles className="h-3 w-3" />
      {aiLoading ? "..." : isAr ? "ترجمة" : "Translate"}
    </Button>
  );

  const BilingualField = ({
    labelEn, labelAr, valueEn, valueAr,
    onChangeEn, onChangeAr, multiline = false,
  }: {
    labelEn: string; labelAr: string;
    valueEn: string; valueAr: string;
    onChangeEn: (v: string) => void; onChangeAr: (v: string) => void;
    multiline?: boolean;
  }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">{isAr ? labelAr : labelEn} (EN)</Label>
          {editing && valueAr && <AIBtn onClick={() => handleAITranslate(valueAr, "ar", onChangeEn)} />}
        </div>
        {multiline ? (
          <Textarea value={valueEn} onChange={e => onChangeEn(e.target.value)} disabled={!editing} className="min-h-[60px]" />
        ) : (
          <Input value={valueEn} onChange={e => onChangeEn(e.target.value)} disabled={!editing} />
        )}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">{isAr ? labelAr : labelEn} (AR)</Label>
          {editing && valueEn && <AIBtn onClick={() => handleAITranslate(valueEn, "en", onChangeAr)} />}
        </div>
        {multiline ? (
          <Textarea value={valueAr} onChange={e => onChangeAr(e.target.value)} disabled={!editing} dir="rtl" className="min-h-[60px]" />
        ) : (
          <Input value={valueAr} onChange={e => onChangeAr(e.target.value)} disabled={!editing} dir="rtl" />
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Edit/Save + Status + Completion */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {!editing ? (
              <Button onClick={() => setEditing(true)} variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />{isAr ? "تعديل البيانات" : "Edit Details"}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending} className="gap-2">
                  <Save className="h-4 w-4" />{isAr ? "حفظ" : "Save"}
                </Button>
                <Button variant="outline" onClick={() => { setEditing(false); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center gap-3">
          <Label className="text-sm">{isAr ? "الحالة" : "Status"}</Label>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.status === "active"}
              onCheckedChange={(checked) => {
                const newStatus = checked ? "active" : "inactive";
                setForm(prev => ({ ...prev, status: newStatus }));
                if (!editing) {
                  supabase.from("companies").update({ status: newStatus }).eq("id", companyId).then(() => {
                    queryClient.invalidateQueries({ queryKey: ["company", companyId] });
                    queryClient.invalidateQueries({ queryKey: ["companies"] });
                    toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
                  });
                }
              }}
            />
            <Badge className={form.status === "active" ? "bg-chart-5/10 text-chart-5 border-chart-5/20" : form.status === "pending" ? "bg-chart-4/10 text-chart-4 border-chart-4/20" : "bg-muted-foreground/10 text-muted-foreground"}>
              {form.status === "active" ? (isAr ? "نشط" : "Active") : form.status === "pending" ? (isAr ? "قيد الانتظار" : "Pending") : (isAr ? "غير نشط" : "Inactive")}
            </Badge>
          </div>
        </div>
      </div>

      {/* Import Source Badge */}
      {form.import_source && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1">
            <Sparkles className="h-3 w-3" />
            {form.import_source === 'smart_import' ? (isAr ? 'مستورد عبر الاستيراد الذكي' : 'Imported via Smart Import') : form.import_source}
          </Badge>
        </div>
      )}

      {/* Completion Progress */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{isAr ? "نسبة اكتمال البيانات" : "Data Completion"}</span>
            <span className="text-sm font-bold">{completionPct}%</span>
          </div>
          <Progress value={completionPct} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {filledFields.length}/{completionFields.length} {isAr ? "حقل مكتمل" : "fields completed"}
          </p>
        </CardContent>
      </Card>

      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Image className="h-4 w-4 text-primary" />
            {isAr ? "شعار الشركة" : "Company Logo"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="relative h-24 w-24 shrink-0 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground/40" />
              )}
            </div>
            {editing && (
              <div className="flex flex-col gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]); }} />
                <Button variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={logoUploading}>
                  <Upload className="h-3.5 w-3.5" />
                  {logoUploading ? "..." : isAr ? "رفع من الجهاز" : "Upload from Device"}
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowMediaPicker(!showMediaPicker)}>
                  <Image className="h-3.5 w-3.5" />
                  {isAr ? "اختيار من الوسائط" : "Select from Media"}
                </Button>
                {form.logo_url && (
                  <Button variant="ghost" size="sm" className="gap-2 text-destructive" onClick={() => setForm(prev => ({ ...prev, logo_url: "" }))}>
                    <X className="h-3.5 w-3.5" />{isAr ? "إزالة" : "Remove"}
                  </Button>
                )}
              </div>
            )}
          </div>

          {showMediaPicker && (
            <div className="mt-4 border rounded-xl p-3">
              <p className="text-sm font-medium mb-2">{isAr ? "اختر من مكتبة الوسائط" : "Select from Media Library"}</p>
              {mediaItems.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {mediaItems.filter((m: any) => m.file_type?.startsWith("image")).map((m: any) => (
                    <button key={m.id} className="rounded-xl border-2 border-transparent hover:border-primary overflow-hidden aspect-square"
                      onClick={() => { setForm(prev => ({ ...prev, logo_url: m.file_url })); setShowMediaPicker(false); }}>
                      <img src={m.file_url} alt={m.filename} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{isAr ? "لا توجد صور في مكتبة الوسائط" : "No images in media library"}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            {isAr ? "معلومات الشركة" : "Company Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BilingualField
            labelEn="Company Name" labelAr="اسم الشركة"
            valueEn={form.name} valueAr={form.name_ar}
            onChangeEn={v => setForm(p => ({ ...p, name: v }))} onChangeAr={v => setForm(p => ({ ...p, name_ar: v }))}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "النوع" : "Type"}</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as CompanyType }))} disabled={!editing}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {companyTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{isAr ? t.labelAr : t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "رقم الشركة" : "Company Number"}</Label>
              <Input value={companyDetails?.company_number || ""} disabled className="font-mono" />
            </div>
          </div>

          <BilingualField
            labelEn="Description" labelAr="الوصف"
            valueEn={form.description} valueAr={form.description_ar}
            onChangeEn={v => setForm(p => ({ ...p, description: v }))} onChangeAr={v => setForm(p => ({ ...p, description_ar: v }))}
            multiline
          />
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4 text-primary" />
            {isAr ? "معلومات الاتصال" : "Contact Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} disabled={!editing} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الهاتف" : "Phone"}</Label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} disabled={!editing} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "هاتف ثانوي" : "Secondary Phone"}</Label>
              <Input value={form.phone_secondary} onChange={e => setForm(p => ({ ...p, phone_secondary: e.target.value }))} disabled={!editing} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الفاكس" : "Fax"}</Label>
              <Input value={form.fax} onChange={e => setForm(p => ({ ...p, fax: e.target.value }))} disabled={!editing} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الموقع الإلكتروني" : "Website"}</Label>
              <Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} disabled={!editing} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address & Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" />
            {isAr ? "العنوان والموقع" : "Address & Location"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BilingualField
            labelEn="Address" labelAr="العنوان"
            valueEn={form.address} valueAr={form.address_ar}
            onChangeEn={v => setForm(p => ({ ...p, address: v }))} onChangeAr={v => setForm(p => ({ ...p, address_ar: v }))}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "المدينة" : "City"}</Label>
              <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} disabled={!editing} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الدولة" : "Country"}</Label>
              {editing ? (
                <CountrySelector value={form.country_code} onChange={v => {
                  const c = allCountries.find(ct => ct.code === v);
                  setForm(p => ({ ...p, country_code: v, country: c?.name || v }));
                }} />
              ) : (
                <Input value={form.country_code ? `${countryFlag(form.country_code)} ${form.country || form.country_code}` : form.country} disabled />
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الرمز البريدي" : "Postal Code"}</Label>
              <Input value={form.postal_code} onChange={e => setForm(p => ({ ...p, postal_code: e.target.value }))} disabled={!editing} />
            </div>
          </div>

          {/* Neighborhood & Street */}
          <Separator />
          <BilingualField
            labelEn="Neighborhood" labelAr="الحي"
            valueEn={form.neighborhood} valueAr={form.neighborhood_ar}
            onChangeEn={v => setForm(p => ({ ...p, neighborhood: v }))} onChangeAr={v => setForm(p => ({ ...p, neighborhood_ar: v }))}
          />
          <BilingualField
            labelEn="Street" labelAr="الشارع"
            valueEn={form.street} valueAr={form.street_ar}
            onChangeEn={v => setForm(p => ({ ...p, street: v }))} onChangeAr={v => setForm(p => ({ ...p, street_ar: v }))}
          />

          {/* National Address */}
          <Separator />
          <BilingualField
            labelEn="National Address" labelAr="العنوان الوطني"
            valueEn={form.national_address} valueAr={form.national_address_ar}
            onChangeEn={v => setForm(p => ({ ...p, national_address: v }))} onChangeAr={v => setForm(p => ({ ...p, national_address_ar: v }))}
          />

          {/* Coordinates & Google Maps */}
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "خط العرض" : "Latitude"}</Label>
              <Input value={String(form.latitude)} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))} disabled={!editing} className="font-mono" placeholder="24.7136" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "خط الطول" : "Longitude"}</Label>
              <Input value={String(form.longitude)} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))} disabled={!editing} className="font-mono" placeholder="46.6753" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "رابط خرائط جوجل" : "Google Maps URL"}</Label>
              <div className="flex gap-2">
                <Input value={form.google_maps_url} onChange={e => setForm(p => ({ ...p, google_maps_url: e.target.value }))} disabled={!editing} className="flex-1" />
                {form.google_maps_url && (
                  <a href={form.google_maps_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" type="button"><ExternalLink className="h-4 w-4" /></Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating & Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4 text-primary" />
            {isAr ? "التقييم والمراجعات" : "Rating & Reviews"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "التقييم" : "Rating"}</Label>
              <div className="flex items-center gap-2">
                <Input type="number" step="0.1" min="0" max="5" value={String(form.rating)} onChange={e => setForm(p => ({ ...p, rating: e.target.value }))} disabled={!editing} className="w-24" />
                {form.rating && <span className="text-muted-foreground text-xs">/ 5</span>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "عدد التقييمات" : "Total Reviews"}</Label>
              <Input type="number" value={String(form.total_reviews)} onChange={e => setForm(p => ({ ...p, total_reviews: e.target.value }))} disabled={!editing} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            {isAr ? "معلومات التسجيل" : "Registration Info"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "رقم السجل التجاري" : "Registration Number"}</Label>
              <Input value={form.registration_number} onChange={e => setForm(p => ({ ...p, registration_number: e.target.value }))} disabled={!editing} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الرقم الضريبي" : "Tax Number"}</Label>
              <Input value={form.tax_number} onChange={e => setForm(p => ({ ...p, tax_number: e.target.value }))} disabled={!editing} className="font-mono" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" />
            {isAr ? "الإعدادات المالية" : "Financial Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "حد الائتمان" : "Credit Limit"}</Label>
              <Input type="number" value={form.credit_limit} onChange={e => setForm(p => ({ ...p, credit_limit: Number(e.target.value) }))} disabled={!editing} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "شروط الدفع (أيام)" : "Payment Terms (days)"}</Label>
              <Input type="number" value={form.payment_terms} onChange={e => setForm(p => ({ ...p, payment_terms: Number(e.target.value) }))} disabled={!editing} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "العملة" : "Currency"}</Label>
              <Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))} disabled={!editing}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                  <SelectItem value="KWD">KWD</SelectItem>
                  <SelectItem value="BHD">BHD</SelectItem>
                  <SelectItem value="QAR">QAR</SelectItem>
                  <SelectItem value="OMR">OMR</SelectItem>
                  <SelectItem value="TND">TND</SelectItem>
                  <SelectItem value="EGP">EGP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
