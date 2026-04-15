import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Image as ImageIcon, Mail, Phone, Globe, MapPin, MapPinned, Navigation,
  Upload, Loader2, X, Plus, FileCheck, Sparkles, ExternalLink, Calendar,
  Shield, Star, CheckCircle2, Activity, Users, Trash2,
  Twitter, Facebook, Linkedin, Instagram, Youtube, MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader, BilingualField, FieldGroup } from "./OrganizerFormHelpers";
import type { OrganizerForm } from "./useOrganizerEditForm";

interface TabProps {
  form: OrganizerForm;
  setForm: React.Dispatch<React.SetStateAction<OrganizerForm>>;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isAr: boolean;
  d: any; // hook return
}

// ═══ Images Tab ═══
export const ImagesTab = memo(function ImagesTab({ form, setForm, isAr, d }: TabProps) {
  return (
    <div className="space-y-6">
      <SectionHeader icon={ImageIcon} title={isAr ? "الوسائط والصور" : "Media & Images"} desc={isAr ? "الشعار والغلاف ومعرض الصور" : "Logo, cover image & photo gallery"} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo */}
        <Card className="rounded-2xl">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" />{isAr ? "الشعار" : "Logo"}</Label>
              {form.logo_url && <Badge variant="outline" className="text-[12px] h-4"><FileCheck className="h-2.5 w-2.5 me-1" />{isAr ? "مرفوع" : "Uploaded"}</Badge>}
            </div>
            <input ref={d.logoRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) d.handleImageUpload(file, "logo"); }} />
            {form.logo_url ? (
              <div className="flex items-center gap-4">
                <img src={form.logo_url} alt="Logo" className="h-20 w-20 rounded-2xl object-cover shrink-0 border shadow-sm" loading="lazy" />
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-[12px] text-muted-foreground truncate">{form.logo_url.split("/").pop()}</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs rounded-lg" onClick={() => d.logoRef.current?.click()}>{isAr ? "تغيير" : "Change"}</Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive rounded-lg" onClick={() => setForm(f => ({ ...f, logo_url: "" }))}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => d.logoRef.current?.click()} disabled={d.uploadingLogo}
                className="w-full rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/40 transition-all p-6 flex flex-col items-center gap-2 text-muted-foreground hover:bg-muted/30 active:scale-[0.98]">
                {d.uploadingLogo ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                <span className="text-xs">{d.uploadingLogo ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "رفع شعار" : "Upload Logo")}</span>
              </button>
            )}
            <Input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder={isAr ? "أو الصق رابط" : "Or paste URL"} className="text-xs h-8" dir="ltr" />
          </CardContent>
        </Card>

        {/* Cover */}
        <Card className="rounded-2xl">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5 text-primary" />{isAr ? "صورة الغلاف" : "Cover Image"}</Label>
              {form.cover_image_url && <Badge variant="outline" className="text-[12px] h-4"><FileCheck className="h-2.5 w-2.5 me-1" />{isAr ? "مرفوع" : "Uploaded"}</Badge>}
            </div>
            <input ref={d.coverRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) d.handleImageUpload(file, "cover"); }} />
            {form.cover_image_url ? (
              <div className="relative group rounded-2xl border overflow-hidden">
                <img src={form.cover_image_url} alt="Cover" className="w-full h-32 object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button type="button" variant="secondary" size="sm" className="h-8 rounded-lg" onClick={() => d.coverRef.current?.click()}>{isAr ? "تغيير" : "Change"}</Button>
                  <Button type="button" variant="destructive" size="sm" className="h-8 rounded-lg" onClick={() => setForm(f => ({ ...f, cover_image_url: "" }))}><X className="h-4 w-4" /></Button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => d.coverRef.current?.click()} disabled={d.uploadingCover}
                className="w-full rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/40 transition-all p-6 flex flex-col items-center gap-2 text-muted-foreground hover:bg-muted/30 active:scale-[0.98]">
                {d.uploadingCover ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
                <span className="text-xs">{d.uploadingCover ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "رفع غلاف" : "Upload Cover")}</span>
              </button>
            )}
            <Input value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))} placeholder={isAr ? "أو الصق رابط" : "Or paste URL"} className="text-xs h-8" dir="ltr" />
          </CardContent>
        </Card>
      </div>

      {/* Gallery */}
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-xs font-medium">{isAr ? "معرض الصور" : "Photo Gallery"} <Badge variant="outline" className="text-[12px] h-4 ms-1">{form.gallery_urls.length}</Badge></Label>
            <input ref={d.galleryRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) d.handleImageUpload(file, "gallery"); }} />
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-lg" onClick={() => d.galleryRef.current?.click()} disabled={d.uploadingGallery}>
              {d.uploadingGallery ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              {isAr ? "إضافة صورة" : "Add Photo"}
            </Button>
          </div>
          {form.gallery_urls.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {form.gallery_urls.map((url, i) => (
                <div key={i} className="relative group aspect-square rounded-xl border overflow-hidden">
                  <img src={url} alt={`Gallery image ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  <button type="button" aria-label={`Remove image ${i + 1}`} onClick={() => d.removeGalleryImage(i)}
                    className="absolute top-1 end-1 h-6 w-6 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-border/40 p-6 text-center text-muted-foreground/60">
              <ImageIcon className="h-6 w-6 mx-auto mb-1" />
              <p className="text-[12px]">{isAr ? "لا توجد صور في المعرض" : "No gallery photos yet"}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

// ═══ Contact Tab ═══
export const ContactTab = memo(function ContactTab({ form, setForm, formErrors, setFormErrors, isAr }: TabProps) {
  return (
    <div className="space-y-6">
      <SectionHeader icon={Mail} title={isAr ? "معلومات التواصل" : "Contact Information"} desc={isAr ? "البريد الإلكتروني والهاتف والموقع" : "Email, phone & website"} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FieldGroup label={isAr ? "البريد الإلكتروني" : "Email"} error={formErrors.email}>
          <Input value={form.email} onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setFormErrors(e2 => ({ ...e2, email: "" })); }} type="email" dir="ltr" placeholder="info@example.com" />
        </FieldGroup>
        <FieldGroup label={isAr ? "الهاتف" : "Phone"}>
          <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} dir="ltr" placeholder="+966..." />
        </FieldGroup>
        <FieldGroup label={isAr ? "الفاكس" : "Fax"}>
          <Input value={form.fax} onChange={e => setForm(f => ({ ...f, fax: e.target.value }))} dir="ltr" placeholder="+966..." />
        </FieldGroup>
        <FieldGroup label={isAr ? "الموقع الإلكتروني" : "Website"} error={formErrors.website}>
          <Input value={form.website} onChange={e => { setForm(f => ({ ...f, website: e.target.value })); setFormErrors(e2 => ({ ...e2, website: "" })); }} placeholder="https://..." dir="ltr" />
        </FieldGroup>
      </div>
      {(form.email || form.phone || form.website) && (
        <Card className="rounded-2xl bg-muted/30">
          <CardContent className="p-4">
            <p className="text-[12px] font-semibold text-muted-foreground uppercase mb-3">{isAr ? "معاينة سريعة" : "Quick Preview"}</p>
            <div className="flex flex-wrap gap-3">
              {form.email && <a href={`mailto:${form.email}`} className="flex items-center gap-1.5 text-xs text-primary hover:underline"><Mail className="h-3.5 w-3.5" />{form.email}</a>}
              {form.phone && <a href={`tel:${form.phone}`} className="flex items-center gap-1.5 text-xs text-primary hover:underline"><Phone className="h-3.5 w-3.5" />{form.phone}</a>}
              {form.website && <a href={form.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline"><Globe className="h-3.5 w-3.5" />{form.website.replace(/^https?:\/\//, "")}</a>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

// ═══ Location Tab ═══
export const LocationTab = memo(function LocationTab({ form, setForm, isAr, d }: TabProps) {
  return (
    <div className="space-y-6">
      <SectionHeader icon={MapPin} title={isAr ? "الموقع والعنوان" : "Location & Address"} desc={isAr ? "العنوان التفصيلي والعنوان الوطني السعودي" : "Detailed address & Saudi National Address"} />
      <BilingualField labelAr="الدولة بالعربية" labelEn="Country (EN)" valueAr={form.country_ar} valueEn={form.country} onChangeAr={v => setForm(f => ({ ...f, country_ar: v }))} onChangeEn={v => setForm(f => ({ ...f, country: v }))} translateField={d.translateField} context={d.translateCtx} placeholder_ar="المملكة العربية السعودية" placeholder_en="Saudi Arabia" />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2"><FieldGroup label={isAr ? "المدينة بالعربية" : "City (AR)"}><Input value={form.city_ar} onChange={e => setForm(f => ({ ...f, city_ar: e.target.value }))} dir="rtl" placeholder="الرياض" /></FieldGroup></div>
        <div className="md:col-span-2"><FieldGroup label={isAr ? "المدينة (EN)" : "City (EN)"}><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} dir="ltr" placeholder="Riyadh" /></FieldGroup></div>
        <FieldGroup label={isAr ? "رمز الدولة" : "Code"}><Input value={form.country_code} onChange={e => setForm(f => ({ ...f, country_code: e.target.value.toUpperCase() }))} maxLength={2} placeholder="SA" dir="ltr" /></FieldGroup>
      </div>
      <Separator />
      <div>
        <h4 className="text-xs font-semibold mb-3 flex items-center gap-2"><MapPinned className="h-3.5 w-3.5 text-primary" />{isAr ? "العنوان التفصيلي" : "Detailed Address"}</h4>
        <BilingualField labelAr="الحي بالعربية" labelEn="District (EN)" valueAr={form.district_ar} valueEn={form.district} onChangeAr={v => setForm(f => ({ ...f, district_ar: v }))} onChangeEn={v => setForm(f => ({ ...f, district: v }))} translateField={d.translateField} context={d.translateCtx} placeholder_ar="حي العليا" placeholder_en="Al Olaya" />
        <div className="mt-4">
          <BilingualField labelAr="الشارع بالعربية" labelEn="Street (EN)" valueAr={form.street_ar} valueEn={form.street} onChangeAr={v => setForm(f => ({ ...f, street_ar: v }))} onChangeEn={v => setForm(f => ({ ...f, street: v }))} translateField={d.translateField} context={d.translateCtx} placeholder_ar="شارع الملك فهد" placeholder_en="King Fahd Road" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <FieldGroup label={isAr ? "رقم المبنى" : "Building No."}><Input value={form.building_number} onChange={e => setForm(f => ({ ...f, building_number: e.target.value }))} dir="ltr" placeholder="8228" /></FieldGroup>
          <FieldGroup label={isAr ? "الرقم الإضافي" : "Additional No."}><Input value={form.additional_number} onChange={e => setForm(f => ({ ...f, additional_number: e.target.value }))} dir="ltr" placeholder="2121" /></FieldGroup>
          <FieldGroup label={isAr ? "رقم الوحدة" : "Unit No."}><Input value={form.unit_number} onChange={e => setForm(f => ({ ...f, unit_number: e.target.value }))} dir="ltr" placeholder="101" /></FieldGroup>
          <FieldGroup label={isAr ? "الرمز البريدي" : "Postal Code"}><Input value={form.postal_code} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} dir="ltr" placeholder="12345" /></FieldGroup>
        </div>
        <div className="mt-4">
          <BilingualField labelAr="العنوان الكامل بالعربية" labelEn="Full Address (EN)" valueAr={form.address_ar} valueEn={form.address} onChangeAr={v => setForm(f => ({ ...f, address_ar: v }))} onChangeEn={v => setForm(f => ({ ...f, address: v }))} translateField={d.translateField} context={d.translateCtx} />
        </div>
      </div>
      <Separator />
      <div>
        <h4 className="text-xs font-semibold mb-3 flex items-center gap-2"><Navigation className="h-3.5 w-3.5 text-primary" />{isAr ? "العنوان الوطني السعودي" : "Saudi National Address"}</h4>
        <FieldGroup label={isAr ? "العنوان المختصر" : "Short Address"} hint={isAr ? "مثال: RAAA1234" : "e.g. RAAA1234"} className="mb-4">
          <Input value={form.short_address} onChange={e => setForm(f => ({ ...f, short_address: e.target.value.toUpperCase() }))} dir="ltr" placeholder="RAAA1234" className="font-mono" />
        </FieldGroup>
        <BilingualField labelAr="العنوان الوطني بالعربية" labelEn="National Address (EN)" valueAr={form.national_address_ar} valueEn={form.national_address} onChangeAr={v => setForm(f => ({ ...f, national_address_ar: v }))} onChangeEn={v => setForm(f => ({ ...f, national_address: v }))} translateField={d.translateField} context={d.translateCtx} />
      </div>
      <Separator />
      <div>
        <h4 className="text-xs font-semibold mb-3 flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-primary" />{isAr ? "الإحداثيات والخريطة" : "GPS & Map"}</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FieldGroup label={isAr ? "خط العرض" : "Latitude"}><Input value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} dir="ltr" placeholder="24.7136" /></FieldGroup>
          <FieldGroup label={isAr ? "خط الطول" : "Longitude"}><Input value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} dir="ltr" placeholder="46.6753" /></FieldGroup>
          <FieldGroup label={isAr ? "رابط خرائط جوجل" : "Google Maps URL"}><Input value={form.google_maps_url} onChange={e => setForm(f => ({ ...f, google_maps_url: e.target.value }))} dir="ltr" placeholder="https://maps.google.com/..." /></FieldGroup>
        </div>
        {form.latitude && form.longitude && (
          <a href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
            <ExternalLink className="h-3 w-3" />{isAr ? "فتح في خرائط جوجل" : "Open in Google Maps"}
          </a>
        )}
      </div>
    </div>
  );
});

// ═══ Team Tab ═══
export const TeamTab = memo(function TeamTab({ form, isAr, d }: TabProps) {
  return (
    <div className="space-y-6">
      <SectionHeader icon={Users} title={isAr ? "جهات الاتصال الرئيسية" : "Key Contacts"} desc={isAr ? "أعضاء الفريق وجهات الاتصال" : "Team members & contact persons"}
        actions={<Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-lg" onClick={d.addContact}><Plus className="h-3 w-3" />{isAr ? "إضافة" : "Add"}</Button>}
      />
      {form.key_contacts.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="p-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-3">{isAr ? "لا توجد جهات اتصال بعد" : "No contacts added yet"}</p>
            <Button type="button" variant="outline" size="sm" className="gap-1 text-xs rounded-lg" onClick={d.addContact}><Plus className="h-3 w-3" />{isAr ? "إضافة جهة اتصال" : "Add Contact"}</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {form.key_contacts.map((c, i) => (
            <Card key={i} className="rounded-2xl hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="h-3.5 w-3.5 text-primary" /></div>
                    <span className="text-xs font-medium">{c.name || c.name_ar || `${isAr ? "جهة اتصال" : "Contact"} ${i + 1}`}</span>
                    {c.role && <Badge variant="outline" className="text-[12px] h-4">{c.role}</Badge>}
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive rounded-lg" onClick={() => d.removeContact(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <FieldGroup label={isAr ? "الاسم بالعربية" : "Name (AR)"}><Input value={c.name_ar} onChange={e => d.updateContact(i, "name_ar", e.target.value)} dir="rtl" className="h-9" /></FieldGroup>
                  <FieldGroup label={isAr ? "الاسم (EN)" : "Name (EN)"}><Input value={c.name} onChange={e => d.updateContact(i, "name", e.target.value)} className="h-9" /></FieldGroup>
                  <FieldGroup label={isAr ? "المنصب بالعربية" : "Role (AR)"}><Input value={c.role_ar} onChange={e => d.updateContact(i, "role_ar", e.target.value)} dir="rtl" className="h-9" /></FieldGroup>
                  <FieldGroup label={isAr ? "المنصب (EN)" : "Role (EN)"}><Input value={c.role} onChange={e => d.updateContact(i, "role", e.target.value)} className="h-9" placeholder="Director" /></FieldGroup>
                  <FieldGroup label={isAr ? "البريد" : "Email"}><Input value={c.email} onChange={e => d.updateContact(i, "email", e.target.value)} type="email" className="h-9" dir="ltr" /></FieldGroup>
                  <FieldGroup label={isAr ? "الهاتف" : "Phone"}><Input value={c.phone} onChange={e => d.updateContact(i, "phone", e.target.value)} dir="ltr" className="h-9" /></FieldGroup>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});

// ═══ Social Tab ═══
export const SocialTab = memo(function SocialTab({ form, setForm, isAr, d }: TabProps) {
  const socialFields = [
    { key: "social_twitter", label: "Twitter / X", icon: Twitter, ph: "https://twitter.com/..." },
    { key: "social_facebook", label: "Facebook", icon: Facebook, ph: "https://facebook.com/..." },
    { key: "social_linkedin", label: "LinkedIn", icon: Linkedin, ph: "https://linkedin.com/..." },
    { key: "social_instagram", label: "Instagram", icon: Instagram, ph: "https://instagram.com/..." },
    { key: "social_youtube", label: "YouTube", icon: Youtube, ph: "https://youtube.com/..." },
    { key: "social_tiktok", label: "TikTok", icon: Globe, ph: "https://tiktok.com/@..." },
    { key: "social_whatsapp", label: "WhatsApp", icon: MessageCircle, ph: "+966..." },
    { key: "social_snapchat", label: "Snapchat", icon: Globe, ph: "username" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon={Globe} title={isAr ? "حسابات التواصل الاجتماعي" : "Social Media Profiles"} desc={isAr ? "جميع حسابات التواصل الاجتماعي" : "All social media links"} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {socialFields.map(s => {
          const val = form[s.key as keyof OrganizerForm] as string;
          return (
            <Card key={s.key} className={cn("rounded-xl transition-all", val ? "border-primary/20 bg-primary/[0.02]" : "")}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", val ? "bg-primary/10" : "bg-muted")}>
                  <s.icon className={cn("h-4 w-4", val ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-[12px] font-medium text-muted-foreground">{s.label}</Label>
                  <Input value={val} onChange={e => setForm(f => ({ ...f, [s.key]: e.target.value }))} placeholder={s.ph} dir="ltr" className="h-8 text-xs mt-1" />
                </div>
                {val && <CheckCircle2 className="h-4 w-4 text-chart-2 shrink-0" />}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <Progress value={(d.socialProfiles / 8) * 100} className="h-1.5 w-20" />
        {d.socialProfiles}/8 {isAr ? "حسابات مرتبطة" : "profiles linked"}
      </div>
    </div>
  );
});

// ═══ Settings Tab ═══
export const SettingsTab = memo(function SettingsTab({ form, setForm, isAr }: TabProps) {
  return (
    <div className="space-y-6">
      <SectionHeader icon={Shield} title={isAr ? "الإعدادات والحالة" : "Settings & Status"} desc={isAr ? "الحالة والتوثيق والتمييز" : "Status, verification & featuring"} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl hover:shadow-sm transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center"><Activity className="h-4 w-4 text-muted-foreground" /></div>
              <div>
                <Label className="text-xs font-medium">{isAr ? "الحالة" : "Status"}</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-8 w-28 mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="text-xs">{isAr ? "نشط" : "Active"}</SelectItem>
                    <SelectItem value="pending" className="text-xs">{isAr ? "قيد المراجعة" : "Pending"}</SelectItem>
                    <SelectItem value="inactive" className="text-xs">{isAr ? "غير نشط" : "Inactive"}</SelectItem>
                    <SelectItem value="suspended" className="text-xs">{isAr ? "معلق" : "Suspended"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl hover:shadow-sm transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", form.is_verified ? "bg-primary/10" : "bg-muted")}>
                <CheckCircle2 className={cn("h-4 w-4", form.is_verified ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div>
                <Label className="text-xs font-medium">{isAr ? "موثق" : "Verified"}</Label>
                <p className="text-[12px] text-muted-foreground">{isAr ? "جهة موثقة رسمياً" : "Officially verified"}</p>
              </div>
            </div>
            <Switch checked={form.is_verified} onCheckedChange={v => setForm(f => ({ ...f, is_verified: v }))} />
          </CardContent>
        </Card>
        <Card className="rounded-2xl hover:shadow-sm transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", form.is_featured ? "bg-amber-500/10" : "bg-muted")}>
                <Star className={cn("h-4 w-4", form.is_featured ? "text-amber-500" : "text-muted-foreground")} />
              </div>
              <div>
                <Label className="text-xs font-medium">{isAr ? "مميز" : "Featured"}</Label>
                <p className="text-[12px] text-muted-foreground">{isAr ? "يظهر في الواجهة" : "Appears prominently"}</p>
              </div>
            </div>
            <Switch checked={form.is_featured} onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
