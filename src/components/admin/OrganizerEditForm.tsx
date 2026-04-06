import { useState, useCallback, useRef, useEffect, memo, type ReactNode } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";
import { useEntityDedup } from "@/hooks/useEntityDedup";
import { useFormAutoSave } from "@/hooks/useFormAutoSave";
import { DeduplicationPanel } from "@/components/admin/DeduplicationPanel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Building2, Save, X, Loader2, ChevronLeft, CheckCircle2, Image as ImageIcon,
  Mail, Phone, Globe, MapPin, Calendar, Shield, Star, Upload,
  Twitter, Facebook, Linkedin, Instagram, AlertCircle, Languages,
  StickyNote, BarChart3, Eye, Activity, Briefcase, Target, Clock,
  ExternalLink, Info, Copy, Users, Trash2, Plus, RefreshCw, Link as LinkIcon,
  Undo2, Youtube, MessageCircle, MapPinned, Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

/* ─── Types ─── */
interface OrganizerForm {
  name: string; name_ar: string; slug: string;
  description: string; description_ar: string;
  logo_url: string; cover_image_url: string;
  email: string; phone: string; website: string;
  address: string; address_ar: string;
  city: string; city_ar: string;
  country: string; country_ar: string; country_code: string;
  district: string; district_ar: string;
  street: string; street_ar: string;
  postal_code: string; building_number: string; additional_number: string;
  national_address: string; national_address_ar: string;
  latitude: string; longitude: string; google_maps_url: string;
  status: string; is_verified: boolean; is_featured: boolean;
  services: string; targeted_sectors: string; founded_year: string;
  social_twitter: string; social_facebook: string;
  social_linkedin: string; social_instagram: string;
  social_youtube: string; social_tiktok: string;
  social_whatsapp: string; social_snapchat: string;
  admin_notes: string;
  gallery_urls: string[];
  key_contacts: KeyContact[];
}

interface KeyContact {
  name: string; name_ar: string; role: string; role_ar: string; email: string; phone: string;
}

const emptyContact: KeyContact = { name: "", name_ar: "", role: "", role_ar: "", email: "", phone: "" };

const emptyForm: OrganizerForm = {
  name: "", name_ar: "", slug: "", description: "", description_ar: "",
  logo_url: "", cover_image_url: "", email: "", phone: "", website: "",
  address: "", address_ar: "", city: "", city_ar: "", country: "", country_ar: "",
  country_code: "", district: "", district_ar: "", street: "", street_ar: "",
  postal_code: "", building_number: "", additional_number: "",
  national_address: "", national_address_ar: "",
  latitude: "", longitude: "", google_maps_url: "",
  status: "active", is_verified: false, is_featured: false,
  services: "", targeted_sectors: "", founded_year: "",
  social_twitter: "", social_facebook: "", social_linkedin: "", social_instagram: "",
  social_youtube: "", social_tiktok: "", social_whatsapp: "", social_snapchat: "",
  admin_notes: "", gallery_urls: [], key_contacts: [],
};

/* ─── Tab Definitions ─── */
const TABS = [
  { id: "identity", icon: Building2, en: "Identity", ar: "الهوية" },
  { id: "images", icon: ImageIcon, en: "Media", ar: "الوسائط" },
  { id: "contact", icon: Mail, en: "Contact", ar: "التواصل" },
  { id: "location", icon: MapPin, en: "Location", ar: "الموقع" },
  { id: "team", icon: Users, en: "Team", ar: "الفريق" },
  { id: "details", icon: Briefcase, en: "Details", ar: "التفاصيل" },
  { id: "social", icon: Globe, en: "Social", ar: "اجتماعي" },
  { id: "settings", icon: Shield, en: "Settings", ar: "إعدادات" },
  { id: "exhibitions", icon: BarChart3, en: "Events", ar: "المعارض" },
  { id: "notes", icon: StickyNote, en: "Notes", ar: "ملاحظات" },
];

/* ─── Helpers ─── */
const SectionHeader = memo(({ icon: Icon, title, desc, actions }: { icon: any; title: string; desc: string; actions?: ReactNode }) => (
  <div className="flex items-center justify-between gap-3 mb-5">
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
));
SectionHeader.displayName = "SectionHeader";

const FieldGroup = memo(({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium">
      {label}{required && <span className="text-destructive ms-0.5">*</span>}
    </Label>
    {children}
    {error && <p className="text-[11px] text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
    {hint && !error && <p className="text-[10px] text-muted-foreground">{hint}</p>}
  </div>
));
FieldGroup.displayName = "FieldGroup";

/* ─── Bilingual Field with per-field translate ─── */
function BilingualField({ labelAr, labelEn, valueAr, valueEn, onChangeAr, onChangeEn, multiline, rows, translateField, context, placeholder_ar, placeholder_en }: {
  labelAr: string; labelEn: string; valueAr: string; valueEn: string;
  onChangeAr: (v: string) => void; onChangeEn: (v: string) => void;
  multiline?: boolean; rows?: number;
  translateField: (text: string, from: "en" | "ar", to: "en" | "ar", ctx?: string) => Promise<string | null>;
  context?: string; placeholder_ar?: string; placeholder_en?: string;
}) {
  const [tAr, setTAr] = useState(false);
  const [tEn, setTEn] = useState(false);

  const translateToAr = async () => {
    if (!valueEn?.trim()) return;
    setTAr(true);
    const result = await translateField(valueEn, "en", "ar", context);
    if (result) { onChangeAr(result); toast.success("تمت الترجمة للعربية"); }
    setTAr(false);
  };
  const translateToEn = async () => {
    if (!valueAr?.trim()) return;
    setTEn(true);
    const result = await translateField(valueAr, "ar", "en", context);
    if (result) { onChangeEn(result); toast.success("Translated to English"); }
    setTEn(false);
  };

  const InputComp = multiline ? Textarea : Input;
  const extraProps = multiline ? { rows: rows || 4 } : {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Arabic First */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">{labelAr}</Label>
          {valueEn?.trim() && (
            <Button type="button" variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] gap-1 text-primary" onClick={translateToAr} disabled={tAr}>
              {tAr ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
              EN → AR
            </Button>
          )}
        </div>
        <InputComp value={valueAr} onChange={(e: any) => onChangeAr(e.target.value)} dir="rtl" placeholder={placeholder_ar} {...extraProps} />
      </div>
      {/* English */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">{labelEn}</Label>
          {valueAr?.trim() && (
            <Button type="button" variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] gap-1 text-primary" onClick={translateToEn} disabled={tEn}>
              {tEn ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
              AR → EN
            </Button>
          )}
        </div>
        <InputComp value={valueEn} onChange={(e: any) => onChangeEn(e.target.value)} dir="ltr" placeholder={placeholder_en} {...extraProps} />
      </div>
    </div>
  );
}

/* ─── Progress Ring ─── */
function ProgressRing({ pct }: { pct: number }) {
  const r = 16, c = 2 * Math.PI * r;
  const color = pct >= 80 ? "stroke-chart-2" : pct >= 50 ? "stroke-amber-500" : "stroke-primary";
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <svg width="42" height="42" className="shrink-0 -rotate-90 cursor-help">
            <circle cx="21" cy="21" r={r} fill="none" strokeWidth="3" className="stroke-muted/30" />
            <circle cx="21" cy="21" r={r} fill="none" strokeWidth="3" className={cn(color, "transition-all duration-500")}
              strokeDasharray={c} strokeDashoffset={c - (c * pct / 100)} strokeLinecap="round" />
            <text x="21" y="21" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-[10px] font-bold rotate-90 origin-center">{pct}%</text>
          </svg>
        </TooltipTrigger>
        <TooltipContent side="bottom"><p className="text-xs">{pct}% complete</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "").replace(/^-+/, "");
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
  const [initialForm, setInitialForm] = useState<OrganizerForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("identity");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const hasUnsavedChanges = JSON.stringify(form) !== JSON.stringify(initialForm);

  const { clearDraft } = useFormAutoSave({
    key: `organizer-${organizerId || "new"}`,
    values: form,
    enabled: hasUnsavedChanges,
  });

  const { checking, duplicates, checkEntity, clearDuplicates } = useEntityDedup({
    tables: ["organizers", "companies", "culinary_entities", "establishments"],
    excludeId: organizerId || undefined,
  });

  const { translateField, autoTranslateFields } = useAutoTranslate();
  const [translating, setTranslating] = useState(false);

  const translateCtx = "event organizer / exhibition management / Saudi Arabia";

  // Load existing data
  const { data: orgData, isLoading } = useQuery({
    queryKey: ["admin-organizer-edit", organizerId],
    queryFn: async () => {
      if (!organizerId) return null;
      const { data, error } = await supabase.from("organizers").select("*").eq("id", organizerId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!organizerId,
  });

  // Load linked exhibitions
  const { data: linkedExhibitions } = useQuery({
    queryKey: ["organizer-exhibitions", organizerId, orgData?.name],
    queryFn: async () => {
      if (!organizerId) return [];
      // First try by ID
      const { data: byId } = await supabase.from("exhibitions")
        .select("id, title, title_ar, slug, type, status, start_date, end_date, edition_year, cover_image_url")
        .or(`organizer_id.eq.${organizerId},organizer_entity_id.eq.${organizerId}`)
        .order("start_date", { ascending: false }).limit(20);
      if (byId && byId.length > 0) return byId;
      // Fallback: match by organizer name
      if (orgData?.name) {
        const { data: byName } = await supabase.from("exhibitions")
          .select("id, title, title_ar, slug, type, status, start_date, end_date, edition_year, cover_image_url")
          .or(`organizer_name.ilike.${orgData.name},organizer_name_ar.ilike.${orgData.name_ar || ""}`)
          .order("start_date", { ascending: false }).limit(20);
        return byName || [];
      }
      return [];
    },
    enabled: !!organizerId,
  });

  // Populate form
  useEffect(() => {
    if (!orgData) return;
    const social = (orgData.social_links as Record<string, string>) || {};
    const contacts = (orgData.key_contacts as unknown as KeyContact[]) || [];
    const gallery = (orgData.gallery_urls as string[]) || [];
    const populated: OrganizerForm = {
      name: orgData.name || "", name_ar: orgData.name_ar || "", slug: orgData.slug || "",
      description: orgData.description || "", description_ar: orgData.description_ar || "",
      logo_url: orgData.logo_url || "", cover_image_url: orgData.cover_image_url || "",
      email: orgData.email || "", phone: orgData.phone || "", website: orgData.website || "",
      address: orgData.address || "", address_ar: orgData.address_ar || "",
      city: orgData.city || "", city_ar: orgData.city_ar || "",
      country: orgData.country || "", country_ar: orgData.country_ar || "",
      country_code: orgData.country_code || "",
      district: (orgData as any).district || "", district_ar: (orgData as any).district_ar || "",
      street: (orgData as any).street || "", street_ar: (orgData as any).street_ar || "",
      postal_code: (orgData as any).postal_code || "",
      building_number: (orgData as any).building_number || "",
      additional_number: (orgData as any).additional_number || "",
      national_address: (orgData as any).national_address || "",
      national_address_ar: (orgData as any).national_address_ar || "",
      latitude: (orgData as any).latitude?.toString() || "",
      longitude: (orgData as any).longitude?.toString() || "",
      google_maps_url: (orgData as any).google_maps_url || "",
      status: orgData.status || "active",
      is_verified: orgData.is_verified || false, is_featured: orgData.is_featured || false,
      services: (orgData.services as string[] || []).join(", "),
      targeted_sectors: (orgData.targeted_sectors as string[] || []).join(", "),
      founded_year: orgData.founded_year?.toString() || "",
      social_twitter: social.twitter || "", social_facebook: social.facebook || "",
      social_linkedin: social.linkedin || "", social_instagram: social.instagram || "",
      social_youtube: social.youtube || "", social_tiktok: social.tiktok || "",
      social_whatsapp: social.whatsapp || "", social_snapchat: social.snapchat || "",
      admin_notes: "",
      gallery_urls: gallery,
      key_contacts: contacts.length > 0 ? contacts : [],
    };
    setForm(populated);
    setInitialForm(populated);
  }, [orgData]);

  // Dedup check
  useEffect(() => {
    if (!form.name && !form.email) return;
    const timer = setTimeout(() => {
      checkEntity({ name: form.name, name_ar: form.name_ar, email: form.email, phone: form.phone, website: form.website, city: form.city, country: form.country });
    }, 800);
    return () => clearTimeout(timer);
  }, [form.name, form.email, form.website]);

  // Auto-generate slug
  useEffect(() => {
    if (!organizerId && form.name && !form.slug) {
      setForm(f => ({ ...f, slug: generateSlug(f.name) }));
    }
  }, [form.name, organizerId]);

  const validateForm = useCallback((f: OrganizerForm): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!f.name.trim() && !f.name_ar.trim()) errors.name = isAr ? "الاسم مطلوب" : "Name is required";
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errors.email = isAr ? "بريد غير صالح" : "Invalid email";
    if (f.website && !/^https?:\/\/.+/.test(f.website)) errors.website = isAr ? "رابط غير صالح" : "Invalid URL";
    if (f.founded_year && (parseInt(f.founded_year) < 1900 || parseInt(f.founded_year) > new Date().getFullYear()))
      errors.founded_year = isAr ? "سنة غير صالحة" : "Invalid year";
    return errors;
  }, [isAr]);

  // Image upload
  const handleImageUpload = useCallback(async (file: File, type: "logo" | "cover" | "gallery") => {
    const setter = type === "logo" ? setUploadingLogo : type === "cover" ? setUploadingCover : setUploadingGallery;
    setter(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `organizers/${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("company-media").upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("company-media").getPublicUrl(path);
      if (type === "gallery") {
        setForm(f => ({ ...f, gallery_urls: [...f.gallery_urls, urlData.publicUrl] }));
      } else {
        setForm(f => ({ ...f, [type === "logo" ? "logo_url" : "cover_image_url"]: urlData.publicUrl }));
      }
      toast.success(isAr ? "تم الرفع بنجاح" : "Uploaded successfully");
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : "") || (isAr ? "فشل الرفع" : "Upload failed"));
    } finally { setter(false); }
  }, [isAr]);

  // Auto-translate all
  const handleAutoTranslate = useCallback(async () => {
    setTranslating(true);
    try {
      const updates = await autoTranslateFields([
        { en: form.name, ar: form.name_ar, key: "name" },
        { en: form.description, ar: form.description_ar, key: "description" },
        { en: form.address, ar: form.address_ar, key: "address" },
        { en: form.city, ar: form.city_ar, key: "city" },
        { en: form.country, ar: form.country_ar, key: "country" },
        { en: form.district, ar: form.district_ar, key: "district" },
        { en: form.street, ar: form.street_ar, key: "street" },
        { en: form.national_address, ar: form.national_address_ar, key: "national_address" },
      ], translateCtx);
      if (Object.keys(updates).length > 0) {
        setForm(f => ({ ...f, ...updates }));
        toast.success(isAr ? "تمت الترجمة التلقائية" : "Auto-translated");
      } else {
        toast.info(isAr ? "لا حاجة للترجمة" : "Nothing to translate");
      }
    } catch { toast.error(isAr ? "فشلت الترجمة" : "Translation failed"); }
    finally { setTranslating(false); }
  }, [form, autoTranslateFields, isAr]);

  // Save
  const saveMutation = useMutation({
    mutationFn: async (f: OrganizerForm) => {
      const socialLinks: Record<string, string> = {};
      if (f.social_twitter) socialLinks.twitter = f.social_twitter;
      if (f.social_facebook) socialLinks.facebook = f.social_facebook;
      if (f.social_linkedin) socialLinks.linkedin = f.social_linkedin;
      if (f.social_instagram) socialLinks.instagram = f.social_instagram;
      if (f.social_youtube) socialLinks.youtube = f.social_youtube;
      if (f.social_tiktok) socialLinks.tiktok = f.social_tiktok;
      if (f.social_whatsapp) socialLinks.whatsapp = f.social_whatsapp;
      if (f.social_snapchat) socialLinks.snapchat = f.social_snapchat;
      const payload: Record<string, any> = {
        name: f.name || f.name_ar, name_ar: f.name_ar || null,
        slug: f.slug || generateSlug(f.name || f.name_ar),
        description: f.description || null, description_ar: f.description_ar || null,
        logo_url: f.logo_url || null, cover_image_url: f.cover_image_url || null,
        email: f.email || null, phone: f.phone || null, website: f.website || null,
        address: f.address || null, address_ar: f.address_ar || null,
        city: f.city || null, city_ar: f.city_ar || null,
        country: f.country || null, country_ar: f.country_ar || null,
        country_code: f.country_code || null,
        district: f.district || null, district_ar: f.district_ar || null,
        street: f.street || null, street_ar: f.street_ar || null,
        postal_code: f.postal_code || null,
        building_number: f.building_number || null,
        additional_number: f.additional_number || null,
        national_address: f.national_address || null,
        national_address_ar: f.national_address_ar || null,
        latitude: f.latitude ? parseFloat(f.latitude) : null,
        longitude: f.longitude ? parseFloat(f.longitude) : null,
        google_maps_url: f.google_maps_url || null,
        status: f.status, is_verified: f.is_verified, is_featured: f.is_featured,
        services: f.services ? f.services.split(",").map(s => s.trim()).filter(Boolean) : null,
        targeted_sectors: f.targeted_sectors ? f.targeted_sectors.split(",").map(s => s.trim()).filter(Boolean) : null,
        founded_year: f.founded_year ? parseInt(f.founded_year) : null,
        social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
        gallery_urls: f.gallery_urls.length > 0 ? f.gallery_urls : null,
        key_contacts: f.key_contacts.length > 0 ? (f.key_contacts as unknown as any) : null,
      };
      if (organizerId) {
        const { error } = await supabase.from("organizers").update(payload).eq("id", organizerId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("organizers").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-organizers"] });
      qc.invalidateQueries({ queryKey: ["admin-organizer-edit", organizerId] });
      setLastSaved(new Date());
      setInitialForm(form);
      clearDraft();
      toast.success(organizerId ? (isAr ? "تم التحديث بنجاح" : "Updated successfully") : (isAr ? "تمت الإضافة بنجاح" : "Created successfully"));
      if (!organizerId) onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSave = useCallback(() => {
    const errors = validateForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error(isAr ? "يرجى تصحيح الأخطاء" : "Please fix errors");
      if (errors.name) setActiveTab("identity");
      else if (errors.email || errors.website) setActiveTab("contact");
      return;
    }
    saveMutation.mutate(form);
  }, [form, validateForm, saveMutation, isAr]);

  const handleDiscard = useCallback(() => {
    setForm(initialForm);
    setFormErrors({});
    setShowDiscardConfirm(false);
    toast.info(isAr ? "تم التراجع عن التغييرات" : "Changes discarded");
  }, [initialForm, isAr]);

  // Refresh stats
  const refreshStatsMutation = useMutation({
    mutationFn: async () => {
      if (!organizerId) return;
      const { error } = await supabase.rpc("refresh_organizer_stats", { p_organizer_id: organizerId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-organizer-edit", organizerId] });
      toast.success(isAr ? "تم تحديث الإحصائيات" : "Stats refreshed");
    },
  });

  // Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  // Section status for tab badges
  const getTabStatus = useCallback((id: string): "complete" | "partial" | "empty" => {
    switch (id) {
      case "identity": return (form.name || form.name_ar) && (form.description || form.description_ar) ? "complete" : (form.name || form.name_ar) ? "partial" : "empty";
      case "images": return form.logo_url && form.cover_image_url ? "complete" : form.logo_url || form.cover_image_url || form.gallery_urls.length > 0 ? "partial" : "empty";
      case "contact": return form.email && form.phone ? "complete" : form.email || form.phone || form.website ? "partial" : "empty";
      case "location": return (form.city || form.city_ar) && (form.country || form.country_ar) ? "complete" : (form.city || form.country || form.address || form.district) ? "partial" : "empty";
      case "team": return form.key_contacts.length > 0 && form.key_contacts[0]?.name ? "complete" : form.key_contacts.length > 0 ? "partial" : "empty";
      case "details": return form.services && form.founded_year ? "complete" : form.services || form.founded_year ? "partial" : "empty";
      case "social": {
        const has = [form.social_twitter, form.social_facebook, form.social_linkedin, form.social_instagram, form.social_youtube, form.social_tiktok].filter(Boolean).length;
        return has >= 3 ? "complete" : has > 0 ? "partial" : "empty";
      }
      case "settings": return "complete";
      case "exhibitions": return (linkedExhibitions?.length || 0) > 0 ? "complete" : "empty";
      case "notes": return form.admin_notes ? "complete" : "empty";
      default: return "empty";
    }
  }, [form, linkedExhibitions]);

  const completePct = Math.round(
    (TABS.filter(t => getTabStatus(t.id) === "complete").length / TABS.length) * 100
  );

  const statusDot = (s: "complete" | "partial" | "empty") =>
    s === "complete" ? "bg-chart-2" : s === "partial" ? "bg-amber-500" : "bg-muted-foreground/30";

  // Contacts
  const addContact = () => setForm(f => ({ ...f, key_contacts: [...f.key_contacts, { ...emptyContact }] }));
  const removeContact = (i: number) => setForm(f => ({ ...f, key_contacts: f.key_contacts.filter((_, idx) => idx !== i) }));
  const updateContact = (i: number, field: keyof KeyContact, value: string) => {
    setForm(f => ({ ...f, key_contacts: f.key_contacts.map((c, idx) => idx === i ? { ...c, [field]: value } : c) }));
  };
  const removeGalleryImage = (i: number) => setForm(f => ({ ...f, gallery_urls: f.gallery_urls.filter((_, idx) => idx !== i) }));

  if (isLoading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/60 -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => hasUnsavedChanges ? setShowDiscardConfirm(true) : onClose()} className="h-8 w-8 rounded-xl shrink-0">
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
              <h2 className="text-sm font-bold truncate">
                {isAr ? (form.name_ar || form.name || "منظم جديد") : (form.name || form.name_ar || "New Organizer")}
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                {organizerId && orgData?.organizer_number && (
                  <Badge variant="outline" className="text-[9px] h-4 font-mono px-1.5">{orgData.organizer_number}</Badge>
                )}
                {form.status && (
                  <Badge variant={form.status === "active" ? "default" : "secondary"} className="text-[9px] h-4 capitalize">{form.status}</Badge>
                )}
                {form.is_verified && <CheckCircle2 className="h-3 w-3 text-primary" />}
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-amber-500/50 text-amber-600">
                    {isAr ? "غير محفوظ" : "Unsaved"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-[10px] text-muted-foreground hidden md:flex items-center gap-1">
                <Clock className="h-3 w-3" />{lastSaved.toLocaleTimeString()}
              </span>
            )}
            <ProgressRing pct={completePct} />
            {organizerId && orgData?.slug && (
              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" asChild>
                  <Link to={`/organizers/${orgData.slug}`} target="_blank"><ExternalLink className="h-3.5 w-3.5" /></Link>
                </Button>
              </TooltipTrigger><TooltipContent><p className="text-xs">{isAr ? "عرض الصفحة العامة" : "View public page"}</p></TooltipContent></Tooltip></TooltipProvider>
            )}
            {hasUnsavedChanges && (
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-8" onClick={() => setShowDiscardConfirm(true)}>
                <Undo2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">{isAr ? "تراجع" : "Discard"}</span>
              </Button>
            )}
            <Button variant="secondary" size="sm" className="gap-1.5 h-8" onClick={handleAutoTranslate} disabled={translating}>
              <Languages className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">{translating ? "..." : isAr ? "ترجمة الكل" : "Translate All"}</span>
            </Button>
            <Button size="sm" onClick={handleSave} disabled={(!form.name && !form.name_ar) || saveMutation.isPending} className="gap-1.5 h-8">
              {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span className="text-xs">{isAr ? "حفظ" : "Save"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Dedup */}
      <DeduplicationPanel duplicates={duplicates} checking={checking} onDismiss={clearDuplicates} compact />

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto -mx-4 md:-mx-6 px-4 md:px-6">
          <TabsList className="inline-flex h-10 gap-0.5 bg-muted/50 p-1 rounded-xl w-max">
            {TABS.map(tab => {
              const status = getTabStatus(tab.id);
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs px-3 rounded-lg data-[state=active]:shadow-sm relative">
                  <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusDot(status))} />
                  <tab.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">{isAr ? tab.ar : tab.en}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="mt-6 pb-16">
          {/* ═══ Identity Tab ═══ */}
          <TabsContent value="identity" className="space-y-6 mt-0">
            <SectionHeader icon={Building2} title={isAr ? "هوية المنظم" : "Organizer Identity"} desc={isAr ? "الاسم والوصف والرابط المختصر" : "Name, description & URL slug"} />

            <BilingualField
              labelAr="الاسم بالعربية *" labelEn="Name (EN)"
              valueAr={form.name_ar} valueEn={form.name}
              onChangeAr={v => setForm(f => ({ ...f, name_ar: v }))}
              onChangeEn={v => { setForm(f => ({ ...f, name: v })); setFormErrors(e => ({ ...e, name: "" })); }}
              translateField={translateField} context={translateCtx}
              placeholder_ar="اسم المنظم بالعربية" placeholder_en="Organizer name in English"
            />
            {formErrors.name && <p className="text-[11px] text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.name}</p>}

            <div className="mt-4">
              <FieldGroup label="Slug" hint={form.slug ? `${window.location.origin}/organizers/${form.slug}` : undefined}>
                <div className="flex gap-2">
                  <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder={isAr ? "يُولَّد تلقائياً" : "auto-generated"} className="font-mono text-xs flex-1" dir="ltr" />
                  {(form.name || form.name_ar) && (
                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => setForm(f => ({ ...f, slug: generateSlug(f.name || f.name_ar) }))}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </FieldGroup>
            </div>

            <BilingualField
              labelAr="الوصف بالعربية" labelEn="Description (EN)"
              valueAr={form.description_ar} valueEn={form.description}
              onChangeAr={v => setForm(f => ({ ...f, description_ar: v }))}
              onChangeEn={v => setForm(f => ({ ...f, description: v }))}
              translateField={translateField} context={translateCtx}
              multiline rows={4}
              placeholder_ar="وصف المنظم بالعربية..." placeholder_en="Describe the organizer..."
            />
          </TabsContent>

          {/* ═══ Images Tab ═══ */}
          <TabsContent value="images" className="space-y-6 mt-0">
            <SectionHeader icon={ImageIcon} title={isAr ? "الوسائط والصور" : "Media & Images"} desc={isAr ? "الشعار والغلاف ومعرض الصور" : "Logo, cover image & photo gallery"} />

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
                        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => logoRef.current?.click()}>{isAr ? "تغيير" : "Change"}</Button>
                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => setForm(f => ({ ...f, logo_url: "" }))}><X className="h-3.5 w-3.5" /></Button>
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
                <Input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder={isAr ? "أو الصق رابط" : "Or paste URL"} className="text-xs h-8" dir="ltr" />
              </div>

              {/* Cover */}
              <div className="space-y-3">
                <Label className="text-xs font-medium">{isAr ? "صورة الغلاف" : "Cover Image"}</Label>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, "cover"); }} />
                {form.cover_image_url ? (
                  <div className="relative group rounded-2xl border overflow-hidden">
                    <img src={form.cover_image_url} alt="Cover" className="w-full h-32 object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button type="button" variant="secondary" size="sm" className="h-8" onClick={() => coverRef.current?.click()}>{isAr ? "تغيير" : "Change"}</Button>
                      <Button type="button" variant="destructive" size="sm" className="h-8" onClick={() => setForm(f => ({ ...f, cover_image_url: "" }))}><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => coverRef.current?.click()} disabled={uploadingCover}
                    className="w-full rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/40 transition-all p-8 flex flex-col items-center gap-2 text-muted-foreground hover:bg-muted/30">
                    {uploadingCover ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
                    <span className="text-xs">{uploadingCover ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "رفع غلاف" : "Upload Cover")}</span>
                  </button>
                )}
                <Input value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))} placeholder={isAr ? "أو الصق رابط" : "Or paste URL"} className="text-xs h-8" dir="ltr" />
              </div>
            </div>

            {/* Gallery */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs font-medium">{isAr ? "معرض الصور" : "Photo Gallery"} <span className="text-muted-foreground">({form.gallery_urls.length})</span></Label>
                <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, "gallery"); }} />
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => galleryRef.current?.click()} disabled={uploadingGallery}>
                  {uploadingGallery ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  {isAr ? "إضافة صورة" : "Add Photo"}
                </Button>
              </div>
              {form.gallery_urls.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {form.gallery_urls.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl border overflow-hidden">
                      <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      <button type="button" onClick={() => removeGalleryImage(i)}
                        className="absolute top-1 end-1 h-6 w-6 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-border/40 p-6 text-center text-muted-foreground/60">
                  <ImageIcon className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-[10px]">{isAr ? "لا توجد صور في المعرض" : "No gallery photos yet"}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ═══ Contact Tab ═══ */}
          <TabsContent value="contact" className="space-y-6 mt-0">
            <SectionHeader icon={Mail} title={isAr ? "معلومات التواصل" : "Contact Information"} desc={isAr ? "البريد الإلكتروني والهاتف والموقع" : "Email, phone & website"} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldGroup label={isAr ? "البريد الإلكتروني" : "Email"} error={formErrors.email}>
                <Input value={form.email} onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setFormErrors(e2 => ({ ...e2, email: "" })); }} type="email" dir="ltr" />
              </FieldGroup>
              <FieldGroup label={isAr ? "الهاتف" : "Phone"}>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} dir="ltr" placeholder="+966..." />
              </FieldGroup>
              <FieldGroup label={isAr ? "الموقع الإلكتروني" : "Website"} error={formErrors.website}>
                <Input value={form.website} onChange={e => { setForm(f => ({ ...f, website: e.target.value })); setFormErrors(e2 => ({ ...e2, website: "" })); }} placeholder="https://..." dir="ltr" />
              </FieldGroup>
            </div>
          </TabsContent>

          {/* ═══ Location Tab ═══ */}
          <TabsContent value="location" className="space-y-6 mt-0">
            <SectionHeader icon={MapPin} title={isAr ? "الموقع والعنوان" : "Location & Address"} desc={isAr ? "العنوان التفصيلي والعنوان الوطني السعودي" : "Detailed address & Saudi National Address"} />

            {/* Country & City */}
            <BilingualField
              labelAr="الدولة بالعربية" labelEn="Country (EN)"
              valueAr={form.country_ar} valueEn={form.country}
              onChangeAr={v => setForm(f => ({ ...f, country_ar: v }))}
              onChangeEn={v => setForm(f => ({ ...f, country: v }))}
              translateField={translateField} context={translateCtx}
              placeholder_ar="المملكة العربية السعودية" placeholder_en="Saudi Arabia"
            />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <FieldGroup label={isAr ? "المدينة بالعربية" : "City (AR)"}>
                  <Input value={form.city_ar} onChange={e => setForm(f => ({ ...f, city_ar: e.target.value }))} dir="rtl" placeholder={isAr ? "الرياض" : "الرياض"} />
                </FieldGroup>
              </div>
              <div className="md:col-span-2">
                <FieldGroup label={isAr ? "المدينة (EN)" : "City (EN)"}>
                  <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} dir="ltr" placeholder="Riyadh" />
                </FieldGroup>
              </div>
              <FieldGroup label={isAr ? "رمز الدولة" : "Code"}>
                <Input value={form.country_code} onChange={e => setForm(f => ({ ...f, country_code: e.target.value.toUpperCase() }))} maxLength={2} placeholder="SA" dir="ltr" />
              </FieldGroup>
            </div>

            <Separator />

            {/* Detailed Address */}
            <div>
              <h4 className="text-xs font-semibold mb-3 flex items-center gap-2">
                <MapPinned className="h-3.5 w-3.5 text-primary" />
                {isAr ? "العنوان التفصيلي" : "Detailed Address"}
              </h4>
              <BilingualField
                labelAr="الحي بالعربية" labelEn="District (EN)"
                valueAr={form.district_ar} valueEn={form.district}
                onChangeAr={v => setForm(f => ({ ...f, district_ar: v }))}
                onChangeEn={v => setForm(f => ({ ...f, district: v }))}
                translateField={translateField} context={translateCtx}
                placeholder_ar="حي العليا" placeholder_en="Al Olaya"
              />
              <div className="mt-4">
                <BilingualField
                  labelAr="الشارع بالعربية" labelEn="Street (EN)"
                  valueAr={form.street_ar} valueEn={form.street}
                  onChangeAr={v => setForm(f => ({ ...f, street_ar: v }))}
                  onChangeEn={v => setForm(f => ({ ...f, street: v }))}
                  translateField={translateField} context={translateCtx}
                  placeholder_ar="شارع الملك فهد" placeholder_en="King Fahd Road"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <FieldGroup label={isAr ? "رقم المبنى" : "Building No."}>
                  <Input value={form.building_number} onChange={e => setForm(f => ({ ...f, building_number: e.target.value }))} dir="ltr" placeholder="8228" />
                </FieldGroup>
                <FieldGroup label={isAr ? "الرقم الإضافي" : "Additional No."}>
                  <Input value={form.additional_number} onChange={e => setForm(f => ({ ...f, additional_number: e.target.value }))} dir="ltr" placeholder="2121" />
                </FieldGroup>
                <FieldGroup label={isAr ? "الرمز البريدي" : "Postal Code"}>
                  <Input value={form.postal_code} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} dir="ltr" placeholder="12345" />
                </FieldGroup>
              </div>
              <div className="mt-4">
                <BilingualField
                  labelAr="العنوان الكامل بالعربية" labelEn="Full Address (EN)"
                  valueAr={form.address_ar} valueEn={form.address}
                  onChangeAr={v => setForm(f => ({ ...f, address_ar: v }))}
                  onChangeEn={v => setForm(f => ({ ...f, address: v }))}
                  translateField={translateField} context={translateCtx}
                />
              </div>
            </div>

            <Separator />

            {/* Saudi National Address */}
            <div>
              <h4 className="text-xs font-semibold mb-3 flex items-center gap-2">
                <Navigation className="h-3.5 w-3.5 text-primary" />
                {isAr ? "العنوان الوطني السعودي" : "Saudi National Address"}
              </h4>
              <BilingualField
                labelAr="العنوان الوطني بالعربية" labelEn="National Address (EN)"
                valueAr={form.national_address_ar} valueEn={form.national_address}
                onChangeAr={v => setForm(f => ({ ...f, national_address_ar: v }))}
                onChangeEn={v => setForm(f => ({ ...f, national_address: v }))}
                translateField={translateField} context={translateCtx}
                placeholder_ar="AAAA1234 - 8228 شارع الملك فهد، حي العليا، الرياض 12345" placeholder_en="AAAA1234 - 8228 King Fahd Rd, Al Olaya, Riyadh 12345"
              />
            </div>

            <Separator />

            {/* GPS & Maps */}
            <div>
              <h4 className="text-xs font-semibold mb-3 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-primary" />
                {isAr ? "الإحداثيات والخريطة" : "GPS & Map"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FieldGroup label={isAr ? "خط العرض" : "Latitude"}>
                  <Input value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} dir="ltr" placeholder="24.7136" />
                </FieldGroup>
                <FieldGroup label={isAr ? "خط الطول" : "Longitude"}>
                  <Input value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} dir="ltr" placeholder="46.6753" />
                </FieldGroup>
                <FieldGroup label={isAr ? "رابط خرائط جوجل" : "Google Maps URL"}>
                  <Input value={form.google_maps_url} onChange={e => setForm(f => ({ ...f, google_maps_url: e.target.value }))} dir="ltr" placeholder="https://maps.google.com/..." />
                </FieldGroup>
              </div>
            </div>
          </TabsContent>

          {/* ═══ Team Tab ═══ */}
          <TabsContent value="team" className="space-y-6 mt-0">
            <SectionHeader
              icon={Users}
              title={isAr ? "جهات الاتصال الرئيسية" : "Key Contacts"}
              desc={isAr ? "أعضاء الفريق وجهات الاتصال" : "Team members & contact persons"}
              actions={
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addContact}>
                  <Plus className="h-3 w-3" />{isAr ? "إضافة" : "Add"}
                </Button>
              }
            />
            {form.key_contacts.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border/40 p-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{isAr ? "لا توجد جهات اتصال بعد" : "No contacts added yet"}</p>
                <Button type="button" variant="outline" size="sm" className="mt-3 gap-1 text-xs" onClick={addContact}>
                  <Plus className="h-3 w-3" />{isAr ? "إضافة جهة اتصال" : "Add Contact"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {form.key_contacts.map((c, i) => (
                  <Card key={i} className="rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-[10px]">{isAr ? `جهة اتصال ${i + 1}` : `Contact ${i + 1}`}</Badge>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeContact(i)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <FieldGroup label={isAr ? "الاسم بالعربية" : "Name (AR)"}>
                          <Input value={c.name_ar} onChange={e => updateContact(i, "name_ar", e.target.value)} dir="rtl" className="h-9" />
                        </FieldGroup>
                        <FieldGroup label={isAr ? "الاسم (EN)" : "Name (EN)"}>
                          <Input value={c.name} onChange={e => updateContact(i, "name", e.target.value)} className="h-9" />
                        </FieldGroup>
                        <FieldGroup label={isAr ? "المنصب بالعربية" : "Role (AR)"}>
                          <Input value={c.role_ar} onChange={e => updateContact(i, "role_ar", e.target.value)} dir="rtl" className="h-9" placeholder={isAr ? "مدير" : "مدير"} />
                        </FieldGroup>
                        <FieldGroup label={isAr ? "المنصب (EN)" : "Role (EN)"}>
                          <Input value={c.role} onChange={e => updateContact(i, "role", e.target.value)} className="h-9" placeholder="Director" />
                        </FieldGroup>
                        <FieldGroup label={isAr ? "البريد" : "Email"}>
                          <Input value={c.email} onChange={e => updateContact(i, "email", e.target.value)} type="email" className="h-9" dir="ltr" />
                        </FieldGroup>
                        <FieldGroup label={isAr ? "الهاتف" : "Phone"}>
                          <Input value={c.phone} onChange={e => updateContact(i, "phone", e.target.value)} dir="ltr" className="h-9" />
                        </FieldGroup>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ═══ Details Tab ═══ */}
          <TabsContent value="details" className="space-y-6 mt-0">
            <SectionHeader icon={Briefcase} title={isAr ? "التفاصيل والخدمات" : "Details & Services"} desc={isAr ? "الخدمات والقطاعات وسنة التأسيس" : "Services, sectors & founding year"} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldGroup label={isAr ? "سنة التأسيس" : "Founded Year"} error={formErrors.founded_year}>
                <Input value={form.founded_year} onChange={e => { setForm(f => ({ ...f, founded_year: e.target.value })); setFormErrors(e2 => ({ ...e2, founded_year: "" })); }} type="number" placeholder="2010" dir="ltr" />
              </FieldGroup>
              <FieldGroup label={isAr ? "الخدمات" : "Services"} hint={isAr ? "مفصولة بفاصلة" : "Comma-separated"}>
                <Input value={form.services} onChange={e => setForm(f => ({ ...f, services: e.target.value }))} placeholder={isAr ? "معارض، تدريب..." : "Exhibitions, Training..."} />
              </FieldGroup>
              <FieldGroup label={isAr ? "القطاعات المستهدفة" : "Targeted Sectors"} hint={isAr ? "مفصولة بفاصلة" : "Comma-separated"}>
                <Input value={form.targeted_sectors} onChange={e => setForm(f => ({ ...f, targeted_sectors: e.target.value }))} placeholder={isAr ? "أغذية ومشروبات..." : "Food & Beverage..."} />
              </FieldGroup>
            </div>
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
            {form.founded_year && (
              <p className="text-[10px] text-muted-foreground mt-2">
                {isAr ? `تأسست منذ ${new Date().getFullYear() - parseInt(form.founded_year)} سنة` : `Established ${new Date().getFullYear() - parseInt(form.founded_year)} years ago`}
              </p>
            )}
          </TabsContent>

          {/* ═══ Social Tab ═══ */}
          <TabsContent value="social" className="space-y-6 mt-0">
            <SectionHeader icon={Globe} title={isAr ? "حسابات التواصل الاجتماعي" : "Social Media Profiles"} desc={isAr ? "جميع حسابات التواصل الاجتماعي" : "All social media links"} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "social_twitter", label: "Twitter / X", icon: Twitter, ph: "https://twitter.com/..." },
                { key: "social_facebook", label: "Facebook", icon: Facebook, ph: "https://facebook.com/..." },
                { key: "social_linkedin", label: "LinkedIn", icon: Linkedin, ph: "https://linkedin.com/..." },
                { key: "social_instagram", label: "Instagram", icon: Instagram, ph: "https://instagram.com/..." },
                { key: "social_youtube", label: "YouTube", icon: Youtube, ph: "https://youtube.com/..." },
                { key: "social_tiktok", label: "TikTok", icon: Globe, ph: "https://tiktok.com/@..." },
                { key: "social_whatsapp", label: "WhatsApp", icon: MessageCircle, ph: "+966..." },
                { key: "social_snapchat", label: "Snapchat", icon: Globe, ph: "username" },
              ].map(s => (
                <FieldGroup key={s.key} label={s.label}>
                  <Input
                    value={form[s.key as keyof OrganizerForm] as string}
                    onChange={e => setForm(f => ({ ...f, [s.key]: e.target.value }))}
                    placeholder={s.ph} dir="ltr"
                  />
                </FieldGroup>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {[form.social_twitter, form.social_facebook, form.social_linkedin, form.social_instagram, form.social_youtube, form.social_tiktok, form.social_whatsapp, form.social_snapchat].filter(Boolean).length}/8 {isAr ? "حسابات مرتبطة" : "profiles linked"}
            </p>
          </TabsContent>

          {/* ═══ Settings Tab ═══ */}
          <TabsContent value="settings" className="space-y-6 mt-0">
            <SectionHeader icon={Shield} title={isAr ? "الإعدادات" : "Settings"} desc={isAr ? "الحالة والتوثيق والتمييز" : "Status, verification & featuring"} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="rounded-2xl">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium">{isAr ? "الحالة" : "Status"}</p>
                      <p className="text-[10px] text-muted-foreground">{isAr ? "حالة حساب المنظم" : "Account status"}</p>
                    </div>
                  </div>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
                      <SelectItem value="inactive">{isAr ? "غير نشط" : "Inactive"}</SelectItem>
                      <SelectItem value="pending">{isAr ? "قيد المراجعة" : "Pending"}</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs font-medium">{isAr ? "التوثيق" : "Verified"}</p>
                      <p className="text-[10px] text-muted-foreground">{isAr ? "إظهار شارة التوثيق" : "Show verified badge"}</p>
                    </div>
                  </div>
                  <Switch checked={form.is_verified} onCheckedChange={v => setForm(f => ({ ...f, is_verified: v }))} />
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-xs font-medium">{isAr ? "مميز" : "Featured"}</p>
                      <p className="text-[10px] text-muted-foreground">{isAr ? "إبراز في الصفحة الرئيسية" : "Highlight on homepage"}</p>
                    </div>
                  </div>
                  <Switch checked={form.is_featured} onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═══ Exhibitions Tab ═══ */}
          <TabsContent value="exhibitions" className="space-y-6 mt-0">
            <SectionHeader
              icon={BarChart3}
              title={isAr ? "المعارض والفعاليات المرتبطة" : "Linked Exhibitions & Events"}
              desc={isAr ? "الفعاليات المرتبطة بهذا المنظم" : "Events linked to this organizer"}
              actions={organizerId ? (
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => refreshStatsMutation.mutate()} disabled={refreshStatsMutation.isPending}>
                  {refreshStatsMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  {isAr ? "تحديث الإحصائيات" : "Refresh Stats"}
                </Button>
              ) : undefined}
            />
            {!organizerId ? (
              <Card className="rounded-2xl border-dashed">
                <CardContent className="p-8 text-center">
                  <Info className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">{isAr ? "احفظ المنظم أولاً لربط المعارض" : "Save the organizer first to link exhibitions"}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {orgData && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: isAr ? "المعارض" : "Events", value: orgData.total_exhibitions || 0, icon: Building2 },
                      { label: isAr ? "المشاهدات" : "Views", value: (orgData.total_views || 0).toLocaleString(), icon: Eye },
                      { label: isAr ? "التقييم" : "Rating", value: orgData.average_rating || "—", icon: Star },
                      { label: isAr ? "المتابعون" : "Followers", value: orgData.follower_count || 0, icon: Activity },
                    ].map(s => (
                      <Card key={s.label} className="rounded-2xl group hover:shadow-md transition-all">
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

                {linkedExhibitions && linkedExhibitions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {linkedExhibitions.map(ex => (
                      <Link key={ex.id} to={`/admin/exhibitions?edit=${ex.id}`} className="block">
                      <Card className="rounded-2xl hover:shadow-md transition-all group cursor-pointer">
                        <CardContent className="p-3 flex items-center gap-3">
                          {ex.cover_image_url ? (
                            <img src={ex.cover_image_url} alt="" className="h-14 w-20 rounded-xl object-cover shrink-0" />
                          ) : (
                            <div className="h-14 w-20 rounded-xl bg-muted flex items-center justify-center shrink-0">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">{isAr ? (ex.title_ar || ex.title) : ex.title}</p>
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
                    <CardContent className="p-8 text-center">
                      <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">{isAr ? "لا توجد معارض مرتبطة" : "No linked exhibitions"}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ═══ Notes Tab ═══ */}
          <TabsContent value="notes" className="space-y-6 mt-0">
            <SectionHeader icon={StickyNote} title={isAr ? "ملاحظات إدارية" : "Admin Notes"} desc={isAr ? "ملاحظات داخلية وبيانات وصفية" : "Internal notes & record metadata"} />
            <FieldGroup label={isAr ? "ملاحظات خاصة" : "Private Notes"} hint={isAr ? "مرئية فقط لفريق الإدارة" : "Only visible to admin team"}>
              <Textarea value={form.admin_notes} onChange={e => setForm(f => ({ ...f, admin_notes: e.target.value }))} rows={4} placeholder={isAr ? "ملاحظات داخلية للفريق..." : "Internal team notes..."} />
            </FieldGroup>
            {organizerId && orgData && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "ID", value: organizerId.slice(0, 8) + "...", copyable: organizerId },
                  { label: isAr ? "رقم المنظم" : "Number", value: orgData.organizer_number || "—" },
                  { label: isAr ? "تاريخ الإنشاء" : "Created", value: orgData.created_at ? new Date(orgData.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US") : "—" },
                  { label: isAr ? "آخر حفظ" : "Last Saved", value: lastSaved ? lastSaved.toLocaleTimeString(isAr ? "ar-SA" : "en-US") : "—" },
                ].map(m => (
                  <div key={m.label} className="rounded-xl bg-muted/40 p-3 group">
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <p className="text-xs font-medium font-mono truncate">{m.value}</p>
                      {"copyable" in m && m.copyable && (
                        <button type="button" onClick={() => { navigator.clipboard.writeText(m.copyable as string); toast.info("Copied!"); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Discard confirmation */}
      <ConfirmDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
        title={isAr ? "تراجع عن التغييرات؟" : "Discard changes?"}
        description={isAr ? "سيتم فقدان جميع التغييرات غير المحفوظة" : "All unsaved changes will be lost"}
        confirmLabel={isAr ? "تراجع" : "Discard"}
        variant="destructive"
        onConfirm={() => { handleDiscard(); onClose(); }}
      />
    </div>
  );
}
