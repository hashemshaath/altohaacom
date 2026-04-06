import { useState, useCallback, useRef, useEffect, memo, type ReactNode } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";
import { useEntityDedup } from "@/hooks/useEntityDedup";
import { DeduplicationPanel } from "@/components/admin/DeduplicationPanel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2, Save, X, Loader2, ChevronLeft, CheckCircle2, Image as ImageIcon,
  Mail, Phone, Globe, MapPin, Calendar, Shield, Star, Upload,
  Twitter, Facebook, Linkedin, Instagram, AlertCircle, Languages,
  Hash, StickyNote, BarChart3, Link as LinkIcon, Eye, Activity,
  Briefcase, Target, Clock, Copy, ExternalLink, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
interface OrganizerForm {
  name: string; name_ar: string; slug: string;
  description: string; description_ar: string;
  logo_url: string; cover_image_url: string;
  email: string; phone: string; website: string;
  address: string; address_ar: string;
  city: string; city_ar: string;
  country: string; country_ar: string; country_code: string;
  status: string; is_verified: boolean; is_featured: boolean;
  services: string; targeted_sectors: string; founded_year: string;
  social_twitter: string; social_facebook: string;
  social_linkedin: string; social_instagram: string;
  admin_notes: string;
}

const emptyForm: OrganizerForm = {
  name: "", name_ar: "", slug: "", description: "", description_ar: "",
  logo_url: "", cover_image_url: "", email: "", phone: "", website: "",
  address: "", address_ar: "", city: "", city_ar: "", country: "", country_ar: "",
  country_code: "", status: "active", is_verified: false, is_featured: false,
  services: "", targeted_sectors: "", founded_year: "",
  social_twitter: "", social_facebook: "", social_linkedin: "", social_instagram: "",
  admin_notes: "",
};

/* ─── Section Definitions ─── */
interface SectionDef {
  id: string; icon: any; en: string; ar: string; desc_en: string; desc_ar: string;
}

const SECTIONS: SectionDef[] = [
  { id: "identity", icon: Building2, en: "Identity", ar: "الهوية", desc_en: "Name, slug & descriptions", desc_ar: "الاسم والوصف" },
  { id: "images", icon: ImageIcon, en: "Images", ar: "الصور", desc_en: "Logo & cover image", desc_ar: "الشعار وصورة الغلاف" },
  { id: "contact", icon: Mail, en: "Contact", ar: "التواصل", desc_en: "Email, phone & website", desc_ar: "البريد والهاتف" },
  { id: "location", icon: MapPin, en: "Location", ar: "الموقع", desc_en: "Address, city & country", desc_ar: "العنوان والمدينة" },
  { id: "details", icon: Briefcase, en: "Details", ar: "التفاصيل", desc_en: "Services, sectors & founding", desc_ar: "الخدمات والقطاعات" },
  { id: "social", icon: Globe, en: "Social Links", ar: "التواصل الاجتماعي", desc_en: "Social media profiles", desc_ar: "حسابات التواصل" },
  { id: "settings", icon: Shield, en: "Settings", ar: "الإعدادات", desc_en: "Status, verification & featuring", desc_ar: "الحالة والتوثيق" },
  { id: "exhibitions", icon: BarChart3, en: "Exhibitions", ar: "المعارض", desc_en: "Linked events & stats", desc_ar: "الفعاليات المرتبطة" },
  { id: "notes", icon: StickyNote, en: "Admin Notes", ar: "ملاحظات", desc_en: "Internal notes & metadata", desc_ar: "ملاحظات داخلية" },
];

/* ─── Helpers ─── */
const SectionHeader = memo(({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
      <Icon className="h-4.5 w-4.5 text-primary" />
    </div>
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  </div>
));
SectionHeader.displayName = "SectionHeader";

const FieldGroup = memo(({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium">
      {label}{required && <span className="text-destructive ms-0.5">*</span>}
    </Label>
    {children}
    {error && <p className="text-[11px] text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
));
FieldGroup.displayName = "FieldGroup";

/* ─── Progress Ring ─── */
function ProgressRing({ pct }: { pct: number }) {
  const r = 16, c = 2 * Math.PI * r;
  return (
    <svg width="42" height="42" className="shrink-0 -rotate-90">
      <circle cx="21" cy="21" r={r} fill="none" strokeWidth="3" className="stroke-muted/30" />
      <circle cx="21" cy="21" r={r} fill="none" strokeWidth="3" className="stroke-primary transition-all duration-500"
        strokeDasharray={c} strokeDashoffset={c - (c * pct / 100)} strokeLinecap="round" />
      <text x="21" y="21" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-[10px] font-bold rotate-90 origin-center">{pct}%</text>
    </svg>
  );
}

/* ─── Main Component ─── */
interface OrganizerEditFormProps {
  organizerId?: string | null;
  onClose: () => void;
}

export default function OrganizerEditForm({ organizerId, onClose }: OrganizerEditFormProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const [form, setForm] = useState<OrganizerForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState("identity");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  // Dedup
  const { checking, duplicates, checkEntity, clearDuplicates } = useEntityDedup({
    tables: ["organizers", "companies", "culinary_entities", "establishments"],
    excludeId: organizerId || undefined,
  });

  // Auto-translate
  const { autoTranslateFields } = useAutoTranslate();
  const [translating, setTranslating] = useState(false);

  // Load existing data
  const { data: orgData, isLoading } = useQuery({
    queryKey: ["admin-organizer-edit", organizerId],
    queryFn: async () => {
      if (!organizerId) return null;
      const { data, error } = await supabase.from("organizers")
        .select("*").eq("id", organizerId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!organizerId,
  });

  // Load linked exhibitions
  const { data: linkedExhibitions } = useQuery({
    queryKey: ["organizer-exhibitions", organizerId],
    queryFn: async () => {
      if (!organizerId) return [];
      const { data } = await supabase.from("exhibitions")
        .select("id, title, title_ar, slug, type, status, start_date, end_date, edition_year, cover_image_url")
        .or(`organizer_id.eq.${organizerId},organizer_entity_id.eq.${organizerId}`)
        .order("start_date", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!organizerId,
  });

  // Populate form from data
  useEffect(() => {
    if (!orgData) return;
    const social = (orgData.social_links as Record<string, string>) || {};
    setForm({
      name: orgData.name || "", name_ar: orgData.name_ar || "", slug: orgData.slug || "",
      description: orgData.description || "", description_ar: orgData.description_ar || "",
      logo_url: orgData.logo_url || "", cover_image_url: orgData.cover_image_url || "",
      email: orgData.email || "", phone: orgData.phone || "", website: orgData.website || "",
      address: orgData.address || "", address_ar: orgData.address_ar || "",
      city: orgData.city || "", city_ar: orgData.city_ar || "",
      country: orgData.country || "", country_ar: orgData.country_ar || "",
      country_code: orgData.country_code || "",
      status: orgData.status || "active",
      is_verified: orgData.is_verified || false, is_featured: orgData.is_featured || false,
      services: (orgData.services as string[] || []).join(", "),
      targeted_sectors: (orgData.targeted_sectors as string[] || []).join(", "),
      founded_year: orgData.founded_year?.toString() || "",
      social_twitter: social.twitter || "", social_facebook: social.facebook || "",
      social_linkedin: social.linkedin || "", social_instagram: social.instagram || "",
      admin_notes: "",
    });
  }, [orgData]);

  // Dedup check
  useEffect(() => {
    if (!form.name && !form.email) return;
    const timer = setTimeout(() => {
      checkEntity({ name: form.name, name_ar: form.name_ar, email: form.email, phone: form.phone, website: form.website, city: form.city, country: form.country });
    }, 800);
    return () => clearTimeout(timer);
  }, [form.name, form.email, form.website]);

  // Validation
  const validateForm = useCallback((f: OrganizerForm): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!f.name.trim()) errors.name = isAr ? "الاسم مطلوب" : "Name is required";
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errors.email = isAr ? "بريد غير صالح" : "Invalid email";
    if (f.website && !/^https?:\/\/.+/.test(f.website)) errors.website = isAr ? "رابط غير صالح" : "Invalid URL";
    if (f.founded_year && (parseInt(f.founded_year) < 1900 || parseInt(f.founded_year) > new Date().getFullYear()))
      errors.founded_year = isAr ? "سنة غير صالحة" : "Invalid year";
    if (f.country_code && f.country_code.length !== 2) errors.country_code = isAr ? "رمز من حرفين" : "2-letter code";
    return errors;
  }, [isAr]);

  // Image upload
  const handleImageUpload = useCallback(async (file: File, type: "logo" | "cover") => {
    const setter = type === "logo" ? setUploadingLogo : setUploadingCover;
    setter(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `organizers/${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("company-media").upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("company-media").getPublicUrl(path);
      setForm(f => ({ ...f, [type === "logo" ? "logo_url" : "cover_image_url"]: urlData.publicUrl }));
      toast.success(isAr ? "تم الرفع بنجاح" : "Uploaded successfully");
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : "") || (isAr ? "فشل الرفع" : "Upload failed"));
    } finally { setter(false); }
  }, [isAr]);

  // Auto-translate
  const handleAutoTranslate = useCallback(async () => {
    setTranslating(true);
    try {
      const updates = await autoTranslateFields([
        { en: form.name, ar: form.name_ar, key: "name" },
        { en: form.description, ar: form.description_ar, key: "description" },
        { en: form.address, ar: form.address_ar, key: "address" },
        { en: form.city, ar: form.city_ar, key: "city" },
        { en: form.country, ar: form.country_ar, key: "country" },
      ], "event organizer / exhibition management");
      if (Object.keys(updates).length > 0) {
        setForm(f => ({ ...f, ...updates }));
        toast.success(isAr ? "تمت الترجمة التلقائية" : "Auto-translated");
      } else {
        toast.info(isAr ? "لا حاجة للترجمة" : "Nothing to translate");
      }
    } catch { toast.error(isAr ? "فشلت الترجمة" : "Translation failed"); }
    finally { setTranslating(false); }
  }, [form, autoTranslateFields, isAr]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (f: OrganizerForm) => {
      const socialLinks: Record<string, string> = {};
      if (f.social_twitter) socialLinks.twitter = f.social_twitter;
      if (f.social_facebook) socialLinks.facebook = f.social_facebook;
      if (f.social_linkedin) socialLinks.linkedin = f.social_linkedin;
      if (f.social_instagram) socialLinks.instagram = f.social_instagram;
      const payload = {
        name: f.name, name_ar: f.name_ar || null,
        slug: f.slug || f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, ""),
        description: f.description || null, description_ar: f.description_ar || null,
        logo_url: f.logo_url || null, cover_image_url: f.cover_image_url || null,
        email: f.email || null, phone: f.phone || null, website: f.website || null,
        address: f.address || null, address_ar: f.address_ar || null,
        city: f.city || null, city_ar: f.city_ar || null,
        country: f.country || null, country_ar: f.country_ar || null,
        country_code: f.country_code || null,
        status: f.status, is_verified: f.is_verified, is_featured: f.is_featured,
        services: f.services ? f.services.split(",").map(s => s.trim()).filter(Boolean) : null,
        targeted_sectors: f.targeted_sectors ? f.targeted_sectors.split(",").map(s => s.trim()).filter(Boolean) : null,
        founded_year: f.founded_year ? parseInt(f.founded_year) : null,
        social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      };
      if (organizerId) {
        const { error } = await supabase.from("organizers").update(payload).eq("id", organizerId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("organizers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-organizers"] });
      qc.invalidateQueries({ queryKey: ["admin-organizer-edit", organizerId] });
      setLastSaved(new Date());
      toast.success(organizerId ? (isAr ? "تم التحديث" : "Updated") : (isAr ? "تمت الإضافة" : "Created"));
      if (!organizerId) onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSave = useCallback(() => {
    const errors = validateForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error(isAr ? "يرجى تصحيح الأخطاء" : "Please fix errors");
      return;
    }
    saveMutation.mutate(form);
  }, [form, validateForm, saveMutation, isAr]);

  // Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  // Section status
  const getSectionStatus = useCallback((id: string): "complete" | "partial" | "empty" => {
    switch (id) {
      case "identity": return form.name && form.description ? "complete" : form.name ? "partial" : "empty";
      case "images": return form.logo_url && form.cover_image_url ? "complete" : form.logo_url || form.cover_image_url ? "partial" : "empty";
      case "contact": return form.email && form.phone ? "complete" : form.email || form.phone || form.website ? "partial" : "empty";
      case "location": return form.city && form.country ? "complete" : form.city || form.country ? "partial" : "empty";
      case "details": return form.services && form.founded_year ? "complete" : form.services || form.founded_year ? "partial" : "empty";
      case "social": {
        const has = [form.social_twitter, form.social_facebook, form.social_linkedin, form.social_instagram].filter(Boolean).length;
        return has >= 2 ? "complete" : has > 0 ? "partial" : "empty";
      }
      case "settings": return "complete";
      case "exhibitions": return (linkedExhibitions?.length || 0) > 0 ? "complete" : "empty";
      case "notes": return form.admin_notes ? "complete" : "empty";
      default: return "empty";
    }
  }, [form, linkedExhibitions]);

  const completePct = Math.round(
    (SECTIONS.filter(s => getSectionStatus(s.id) === "complete").length / SECTIONS.length) * 100
  );

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const statusDot = (s: "complete" | "partial" | "empty") =>
    s === "complete" ? "bg-chart-2" : s === "partial" ? "bg-amber-500" : "bg-muted-foreground/30";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/60 -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-xl shrink-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {form.logo_url ? (
              <img src={form.logo_url} alt="" className="h-9 w-9 rounded-xl object-cover shrink-0 border" />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate">{form.name || (isAr ? "منظم جديد" : "New Organizer")}</h2>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                {organizerId && orgData?.organizer_number && (
                  <Badge variant="outline" className="text-[9px] h-4 font-mono px-1.5">{orgData.organizer_number}</Badge>
                )}
                {form.status && (
                  <Badge variant={form.status === "active" ? "default" : "secondary"} className="text-[9px] h-4 capitalize">{form.status}</Badge>
                )}
                {form.is_verified && <CheckCircle2 className="h-3 w-3 text-primary" />}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-[10px] text-muted-foreground hidden md:block">
                <Clock className="h-3 w-3 inline me-1" />
                {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <ProgressRing pct={completePct} />
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={handleAutoTranslate} disabled={translating}>
              <Languages className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{translating ? "..." : isAr ? "ترجمة" : "Translate"}</span>
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!form.name || saveMutation.isPending || uploadingLogo || uploadingCover} className="gap-1.5">
              {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {isAr ? "حفظ" : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Dedup Warnings ── */}
      <DeduplicationPanel duplicates={duplicates} checking={checking} onDismiss={clearDuplicates} compact />

      {/* ── Layout: Sidebar + Content ── */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-24 space-y-0.5">
            {SECTIONS.map(s => {
              const status = getSectionStatus(s.id);
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-start transition-all duration-200 group",
                    active ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn("h-2 w-2 rounded-full shrink-0 transition-colors", statusDot(status))} />
                  <s.icon className="h-3.5 w-3.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs block truncate">{isAr ? s.ar : s.en}</span>
                    <span className="text-[9px] text-muted-foreground block truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {isAr ? s.desc_ar : s.desc_en}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-8 pb-16">

          {/* ─ Identity ─ */}
          <section ref={el => { sectionRefs.current.identity = el; }} id="section-identity">
            <SectionHeader icon={Building2} title={isAr ? "الهوية" : "Identity"} desc={isAr ? "الاسم والوصف" : "Name, slug & descriptions"} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldGroup label={isAr ? "الاسم (EN)" : "Name (EN)"} required error={formErrors.name}>
                <Input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(e2 => ({ ...e2, name: "" })); }} />
              </FieldGroup>
              <FieldGroup label={isAr ? "الاسم (AR)" : "Name (AR)"}>
                <Input value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} dir="rtl" />
              </FieldGroup>
            </div>
            <div className="mt-4">
              <FieldGroup label="Slug">
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder={isAr ? "يُولَّد تلقائياً" : "auto-generated"} className="font-mono text-xs" />
              </FieldGroup>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FieldGroup label={isAr ? "الوصف (EN)" : "Description (EN)"}>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} />
                <p className="text-[10px] text-muted-foreground">{form.description.length}/500</p>
              </FieldGroup>
              <FieldGroup label={isAr ? "الوصف (AR)" : "Description (AR)"}>
                <Textarea value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} rows={4} dir="rtl" />
                <p className="text-[10px] text-muted-foreground">{form.description_ar.length}/500</p>
              </FieldGroup>
            </div>
          </section>

          <Separator />

          {/* ─ Images ─ */}
          <section ref={el => { sectionRefs.current.images = el; }} id="section-images">
            <SectionHeader icon={ImageIcon} title={isAr ? "الصور" : "Images"} desc={isAr ? "الشعار وصورة الغلاف" : "Logo & cover image"} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo */}
              <div className="space-y-3">
                <Label className="text-xs font-medium">{isAr ? "الشعار" : "Logo"}</Label>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, "logo"); }} />
                {form.logo_url ? (
                  <div className="rounded-2xl border bg-muted/20 p-4 flex items-center gap-4">
                    <img src={form.logo_url} alt="Logo" className="h-20 w-20 rounded-xl object-cover shrink-0 border" loading="lazy" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-[10px] text-muted-foreground truncate">{form.logo_url.split("/").pop()}</p>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => logoRef.current?.click()}>
                          {isAr ? "تغيير" : "Change"}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => setForm(f => ({ ...f, logo_url: "" }))}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
                    className="w-full rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/40 transition-all p-8 flex flex-col items-center gap-2 text-muted-foreground hover:bg-muted/30">
                    {uploadingLogo ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                    <span className="text-xs">{uploadingLogo ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "رفع شعار" : "Upload Logo")}</span>
                  </button>
                )}
                <Input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder={isAr ? "أو الصق رابط" : "Or paste URL"} className="text-xs h-8" />
              </div>

              {/* Cover */}
              <div className="space-y-3">
                <Label className="text-xs font-medium">{isAr ? "صورة الغلاف" : "Cover Image"}</Label>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, "cover"); }} />
                {form.cover_image_url ? (
                  <div className="relative group rounded-2xl border overflow-hidden">
                    <img src={form.cover_image_url} alt="Cover" className="w-full h-32 object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button type="button" variant="secondary" size="sm" className="h-8" onClick={() => coverRef.current?.click()}>
                        {isAr ? "تغيير" : "Change"}
                      </Button>
                      <Button type="button" variant="destructive" size="sm" className="h-8" onClick={() => setForm(f => ({ ...f, cover_image_url: "" }))}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => coverRef.current?.click()} disabled={uploadingCover}
                    className="w-full rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/40 transition-all p-8 flex flex-col items-center gap-2 text-muted-foreground hover:bg-muted/30">
                    {uploadingCover ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
                    <span className="text-xs">{uploadingCover ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "رفع غلاف" : "Upload Cover")}</span>
                  </button>
                )}
                <Input value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))} placeholder={isAr ? "أو الصق رابط" : "Or paste URL"} className="text-xs h-8" />
              </div>
            </div>
          </section>

          <Separator />

          {/* ─ Contact ─ */}
          <section ref={el => { sectionRefs.current.contact = el; }} id="section-contact">
            <SectionHeader icon={Mail} title={isAr ? "التواصل" : "Contact"} desc={isAr ? "البريد والهاتف والموقع" : "Email, phone & website"} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldGroup label={isAr ? "البريد الإلكتروني" : "Email"} error={formErrors.email}>
                <Input value={form.email} onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setFormErrors(e2 => ({ ...e2, email: "" })); }} type="email" startIcon={<Mail className="h-4 w-4" />} />
              </FieldGroup>
              <FieldGroup label={isAr ? "الهاتف" : "Phone"}>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} dir="ltr" startIcon={<Phone className="h-4 w-4" />} />
              </FieldGroup>
              <FieldGroup label={isAr ? "الموقع الإلكتروني" : "Website"} error={formErrors.website}>
                <Input value={form.website} onChange={e => { setForm(f => ({ ...f, website: e.target.value })); setFormErrors(e2 => ({ ...e2, website: "" })); }} placeholder="https://..." startIcon={<Globe className="h-4 w-4" />} />
              </FieldGroup>
            </div>
          </section>

          <Separator />

          {/* ─ Location ─ */}
          <section ref={el => { sectionRefs.current.location = el; }} id="section-location">
            <SectionHeader icon={MapPin} title={isAr ? "الموقع" : "Location"} desc={isAr ? "العنوان والمدينة والدولة" : "Address, city & country"} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldGroup label={isAr ? "العنوان (EN)" : "Address (EN)"}>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </FieldGroup>
              <FieldGroup label={isAr ? "العنوان (AR)" : "Address (AR)"}>
                <Input value={form.address_ar} onChange={e => setForm(f => ({ ...f, address_ar: e.target.value }))} dir="rtl" />
              </FieldGroup>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <FieldGroup label={isAr ? "المدينة" : "City"}>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </FieldGroup>
              <FieldGroup label={isAr ? "المدينة (AR)" : "City (AR)"}>
                <Input value={form.city_ar} onChange={e => setForm(f => ({ ...f, city_ar: e.target.value }))} dir="rtl" />
              </FieldGroup>
              <FieldGroup label={isAr ? "الدولة" : "Country"}>
                <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
              </FieldGroup>
              <FieldGroup label={isAr ? "رمز الدولة" : "Code"} error={formErrors.country_code}>
                <Input value={form.country_code} onChange={e => { setForm(f => ({ ...f, country_code: e.target.value.toUpperCase() })); setFormErrors(e2 => ({ ...e2, country_code: "" })); }} maxLength={2} placeholder="SA" />
              </FieldGroup>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FieldGroup label={isAr ? "الدولة (AR)" : "Country (AR)"}>
                <Input value={form.country_ar} onChange={e => setForm(f => ({ ...f, country_ar: e.target.value }))} dir="rtl" />
              </FieldGroup>
            </div>
          </section>

          <Separator />

          {/* ─ Details ─ */}
          <section ref={el => { sectionRefs.current.details = el; }} id="section-details">
            <SectionHeader icon={Briefcase} title={isAr ? "التفاصيل" : "Details"} desc={isAr ? "الخدمات والقطاعات وسنة التأسيس" : "Services, sectors & founding year"} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldGroup label={isAr ? "سنة التأسيس" : "Founded Year"} error={formErrors.founded_year}>
                <Input value={form.founded_year} onChange={e => { setForm(f => ({ ...f, founded_year: e.target.value })); setFormErrors(e2 => ({ ...e2, founded_year: "" })); }} type="number" placeholder="2010" startIcon={<Calendar className="h-4 w-4" />} />
              </FieldGroup>
              <FieldGroup label={isAr ? "الخدمات" : "Services"}>
                <Input value={form.services} onChange={e => setForm(f => ({ ...f, services: e.target.value }))} placeholder={isAr ? "مفصولة بفاصلة" : "Comma-separated"} startIcon={<Briefcase className="h-4 w-4" />} />
              </FieldGroup>
              <FieldGroup label={isAr ? "القطاعات المستهدفة" : "Targeted Sectors"}>
                <Input value={form.targeted_sectors} onChange={e => setForm(f => ({ ...f, targeted_sectors: e.target.value }))} placeholder={isAr ? "مفصولة بفاصلة" : "Comma-separated"} startIcon={<Target className="h-4 w-4" />} />
              </FieldGroup>
            </div>
            {/* Tags preview */}
            {(form.services || form.targeted_sectors) && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {form.services.split(",").filter(Boolean).map((s, i) => (
                  <Badge key={`s-${i}`} variant="secondary" className="text-[10px]">{s.trim()}</Badge>
                ))}
                {form.targeted_sectors.split(",").filter(Boolean).map((s, i) => (
                  <Badge key={`t-${i}`} variant="outline" className="text-[10px]">{s.trim()}</Badge>
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* ─ Social Links ─ */}
          <section ref={el => { sectionRefs.current.social = el; }} id="section-social">
            <SectionHeader icon={Globe} title={isAr ? "التواصل الاجتماعي" : "Social Links"} desc={isAr ? "حسابات التواصل الاجتماعي" : "Social media profiles"} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldGroup label="Twitter / X">
                <Input value={form.social_twitter} onChange={e => setForm(f => ({ ...f, social_twitter: e.target.value }))} placeholder="https://twitter.com/..." startIcon={<Twitter className="h-4 w-4" />} />
              </FieldGroup>
              <FieldGroup label="Facebook">
                <Input value={form.social_facebook} onChange={e => setForm(f => ({ ...f, social_facebook: e.target.value }))} placeholder="https://facebook.com/..." startIcon={<Facebook className="h-4 w-4" />} />
              </FieldGroup>
              <FieldGroup label="LinkedIn">
                <Input value={form.social_linkedin} onChange={e => setForm(f => ({ ...f, social_linkedin: e.target.value }))} placeholder="https://linkedin.com/..." startIcon={<Linkedin className="h-4 w-4" />} />
              </FieldGroup>
              <FieldGroup label="Instagram">
                <Input value={form.social_instagram} onChange={e => setForm(f => ({ ...f, social_instagram: e.target.value }))} placeholder="https://instagram.com/..." startIcon={<Instagram className="h-4 w-4" />} />
              </FieldGroup>
            </div>
          </section>

          <Separator />

          {/* ─ Settings ─ */}
          <section ref={el => { sectionRefs.current.settings = el; }} id="section-settings">
            <SectionHeader icon={Shield} title={isAr ? "الإعدادات" : "Settings"} desc={isAr ? "الحالة والتوثيق والتمييز" : "Status, verification & featuring"} />
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <Label className="text-xs">{isAr ? "الحالة" : "Status"}</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
                    <SelectItem value="inactive">{isAr ? "غير نشط" : "Inactive"}</SelectItem>
                    <SelectItem value="pending">{isAr ? "قيد المراجعة" : "Pending"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_verified} onCheckedChange={v => setForm(f => ({ ...f, is_verified: v }))} />
                <Label className="text-xs flex items-center gap-1"><Shield className="h-3.5 w-3.5" />{isAr ? "موثق" : "Verified"}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_featured} onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))} />
                <Label className="text-xs flex items-center gap-1"><Star className="h-3.5 w-3.5" />{isAr ? "مميز" : "Featured"}</Label>
              </div>
            </div>
          </section>

          <Separator />

          {/* ─ Exhibitions ─ */}
          <section ref={el => { sectionRefs.current.exhibitions = el; }} id="section-exhibitions">
            <SectionHeader icon={BarChart3} title={isAr ? "المعارض المرتبطة" : "Linked Exhibitions"} desc={isAr ? "الفعاليات المرتبطة بهذا المنظم" : "Events linked to this organizer"} />
            {!organizerId ? (
              <Card className="rounded-2xl border-dashed">
                <CardContent className="p-6 text-center">
                  <Info className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">{isAr ? "احفظ المنظم أولاً لربط المعارض" : "Save the organizer first to link exhibitions"}</p>
                </CardContent>
              </Card>
            ) : linkedExhibitions && linkedExhibitions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {linkedExhibitions.map(ex => (
                  <Card key={ex.id} className="rounded-2xl hover:shadow-md transition-all group">
                    <CardContent className="p-3 flex items-center gap-3">
                      {ex.cover_image_url ? (
                        <img src={ex.cover_image_url} alt="" className="h-12 w-16 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="h-12 w-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{ex.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[9px] h-4 capitalize">{ex.type}</Badge>
                          <Badge variant={ex.status === "active" ? "default" : "secondary"} className="text-[9px] h-4 capitalize">{ex.status}</Badge>
                          {ex.edition_year && <span className="text-[9px] text-muted-foreground">{ex.edition_year}</span>}
                        </div>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="rounded-2xl border-dashed">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">{isAr ? "لا توجد معارض مرتبطة" : "No linked exhibitions"}</p>
                </CardContent>
              </Card>
            )}
            {organizerId && orgData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {[
                  { label: isAr ? "المعارض" : "Events", value: orgData.total_exhibitions || 0, icon: Building2 },
                  { label: isAr ? "المشاهدات" : "Views", value: (orgData.total_views || 0).toLocaleString(), icon: Eye },
                  { label: isAr ? "التقييم" : "Rating", value: orgData.average_rating || "—", icon: Star },
                  { label: isAr ? "المتابعون" : "Followers", value: orgData.follower_count || 0, icon: Activity },
                ].map(s => (
                  <Card key={s.label} className="rounded-2xl">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <s.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{s.value}</p>
                        <p className="text-[9px] text-muted-foreground">{s.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* ─ Admin Notes ─ */}
          <section ref={el => { sectionRefs.current.notes = el; }} id="section-notes">
            <SectionHeader icon={StickyNote} title={isAr ? "ملاحظات إدارية" : "Admin Notes"} desc={isAr ? "ملاحظات داخلية وبيانات وصفية" : "Internal notes & record metadata"} />
            <FieldGroup label={isAr ? "ملاحظات خاصة" : "Private Notes"}>
              <Textarea value={form.admin_notes} onChange={e => setForm(f => ({ ...f, admin_notes: e.target.value }))} rows={3} placeholder={isAr ? "ملاحظات داخلية للفريق..." : "Internal team notes..."} />
            </FieldGroup>
            {organizerId && orgData && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "ID", value: organizerId.slice(0, 8) + "..." },
                  { label: isAr ? "رقم المنظم" : "Number", value: orgData.organizer_number || "—" },
                  { label: isAr ? "تاريخ الإنشاء" : "Created", value: orgData.created_at ? new Date(orgData.created_at).toLocaleDateString() : "—" },
                  { label: isAr ? "آخر حفظ" : "Last Saved", value: lastSaved ? lastSaved.toLocaleTimeString() : "—" },
                ].map(m => (
                  <div key={m.label} className="rounded-xl bg-muted/40 p-3">
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                    <p className="text-xs font-medium font-mono mt-0.5">{m.value}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
