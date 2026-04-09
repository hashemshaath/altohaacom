import { useState, useCallback, useRef, useEffect, memo, useMemo, type ReactNode } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Building2, Save, X, Loader2, ChevronLeft, CheckCircle2, Image as ImageIcon,
  Mail, Phone, Globe, MapPin, Calendar, Shield, Star, Upload,
  Twitter, Facebook, Linkedin, Instagram, AlertCircle, Languages,
  StickyNote, BarChart3, Eye, Activity, Briefcase, Clock,
  ExternalLink, Info, Copy, Users, Trash2, Plus, RefreshCw,
  Undo2, Youtube, MessageCircle, MapPinned, Navigation, TrendingUp,
  Zap, History, ChevronRight, Hash, FileCheck, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

/* ─── Types ─── */
interface OrganizerForm {
  name: string; name_ar: string; slug: string;
  description: string; description_ar: string;
  logo_url: string; cover_image_url: string;
  email: string; phone: string; fax: string; website: string;
  address: string; address_ar: string;
  city: string; city_ar: string;
  country: string; country_ar: string; country_code: string;
  district: string; district_ar: string;
  street: string; street_ar: string;
  postal_code: string; building_number: string; additional_number: string;
  unit_number: string; short_address: string;
  national_address: string; national_address_ar: string;
  latitude: string; longitude: string; google_maps_url: string;
  status: string; is_verified: boolean; is_featured: boolean;
  services: string; targeted_sectors: string; founded_year: string;
  registration_number: string; license_number: string; vat_number: string;
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
  logo_url: "", cover_image_url: "", email: "", phone: "", fax: "", website: "",
  address: "", address_ar: "", city: "", city_ar: "", country: "", country_ar: "",
  country_code: "", district: "", district_ar: "", street: "", street_ar: "",
  postal_code: "", building_number: "", additional_number: "", unit_number: "", short_address: "",
  national_address: "", national_address_ar: "",
  latitude: "", longitude: "", google_maps_url: "",
  status: "active", is_verified: false, is_featured: false,
  services: "", targeted_sectors: "", founded_year: "",
  registration_number: "", license_number: "", vat_number: "",
  social_twitter: "", social_facebook: "", social_linkedin: "", social_instagram: "",
  social_youtube: "", social_tiktok: "", social_whatsapp: "", social_snapchat: "",
  admin_notes: "", gallery_urls: [], key_contacts: [],
};

/* ─── Tab Definitions ─── */
const TABS = [
  { id: "identity", icon: Building2, en: "Information", ar: "المعلومات" },
  { id: "images", icon: ImageIcon, en: "Media", ar: "الوسائط" },
  { id: "contact", icon: Mail, en: "Contact", ar: "التواصل" },
  { id: "location", icon: MapPin, en: "Location", ar: "الموقع" },
  { id: "team", icon: Users, en: "Team", ar: "الفريق" },
  { id: "details", icon: Briefcase, en: "Details", ar: "التفاصيل" },
  { id: "social", icon: Globe, en: "Social", ar: "اجتماعي" },
  { id: "settings", icon: Shield, en: "Settings", ar: "إعدادات" },
  { id: "exhibitions", icon: Calendar, en: "Events", ar: "المعارض" },
  { id: "analytics", icon: TrendingUp, en: "Analytics", ar: "التحليلات" },
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

const FieldGroup = memo(({ label, required, error, hint, children, className }: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label className="text-xs font-medium">
      {label}{required && <span className="text-destructive ms-0.5">*</span>}
    </Label>
    {children}
    {error && <p className="text-[12px] text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
    {hint && !error && <p className="text-[12px] text-muted-foreground">{hint}</p>}
  </div>
));
FieldGroup.displayName = "FieldGroup";

/* ─── Bilingual Field ─── */
function BilingualField({ labelAr, labelEn, valueAr, valueEn, onChangeAr, onChangeEn, multiline, rows, translateField, context, placeholder_ar, placeholder_en }: {
  labelAr: string; labelEn: string; valueAr: string; valueEn: string;
  onChangeAr: (v: string) => void; onChangeEn: (v: string) => void;
  multiline?: boolean; rows?: number;
  translateField: (text: string, from: "en" | "ar", to: "en" | "ar", ctx?: string) => Promise<string | null>;
  context?: string; placeholder_ar?: string; placeholder_en?: string;
}) {
  const [tAr, setTAr] = useState(false);
  const [tEn, setTEn] = useState(false);

  const translateToEn = async () => {
    if (!valueAr?.trim()) return;
    setTEn(true);
    const result = await translateField(valueAr, "ar", "en", context);
    if (result) { onChangeEn(result); toast.success("Translated to English"); }
    setTEn(false);
  };
  const translateToAr = async () => {
    if (!valueEn?.trim()) return;
    setTAr(true);
    const result = await translateField(valueEn, "en", "ar", context);
    if (result) { onChangeAr(result); toast.success("تمت الترجمة للعربية"); }
    setTAr(false);
  };

  const InputComp = multiline ? Textarea : Input;
  const extraProps = multiline ? { rows: rows || 4 } : {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">{labelAr}</Label>
          {valueAr?.trim() && (
            <Button type="button" variant="ghost" size="sm" className="h-5 px-1.5 text-[12px] gap-1 text-primary" onClick={translateToEn} disabled={tEn}>
              {tEn ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />} AR → EN
            </Button>
          )}
        </div>
        <InputComp value={valueAr} onChange={(e: any) => onChangeAr(e.target.value)} dir="rtl" placeholder={placeholder_ar} {...extraProps} />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">{labelEn}</Label>
          {valueEn?.trim() && (
            <Button type="button" variant="ghost" size="sm" className="h-5 px-1.5 text-[12px] gap-1 text-primary" onClick={translateToAr} disabled={tAr}>
              {tAr ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />} EN → AR
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
            <text x="21" y="21" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-[12px] font-bold rotate-90 origin-center">{pct}%</text>
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

/* ─── Quick Nav Item ─── */
function QuickNavItem({ icon: Icon, label, status, active, onClick }: { icon: any; label: string; status: "complete" | "partial" | "empty"; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs transition-all",
      active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
    )}>
      <div className={cn(
        "h-1.5 w-1.5 rounded-full shrink-0",
        status === "complete" ? "bg-chart-2" : status === "partial" ? "bg-amber-500" : "bg-muted-foreground/30"
      )} />
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════ */
/* ═══ Main Component ═══ */
/* ═══════════════════════════════════════════════════ */
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
  const [showSideNav, setShowSideNav] = useState(true);
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

  // Load linked exhibitions with all editions
  const { data: linkedExhibitions } = useQuery({
    queryKey: ["organizer-exhibitions", organizerId, orgData?.name],
    queryFn: async () => {
      if (!organizerId) return [];
      const fields = "id, title, title_ar, slug, type, status, start_date, end_date, edition_year, edition_number, cover_image_url, view_count, series_id";
      const { data: byId } = await supabase.from("exhibitions")
        .select(fields)
        .or(`organizer_id.eq.${organizerId},organizer_entity_id.eq.${organizerId}`)
        .order("edition_year", { ascending: false }).limit(50);
      if (byId && byId.length > 0) return byId;
      if (orgData?.name) {
        const { data: byName } = await supabase.from("exhibitions")
          .select(fields)
          .or(`organizer_name.ilike.${orgData.name},organizer_name_ar.ilike.${orgData.name_ar || ""}`)
          .order("edition_year", { ascending: false }).limit(50);
        return byName || [];
      }
      return [];
    },
    enabled: !!organizerId,
  });

  // Load linked competitions
  const { data: linkedCompetitions } = useQuery({
    queryKey: ["organizer-competitions", organizerId],
    queryFn: async () => {
      if (!organizerId) return [];
      const { data } = await supabase.from("competitions")
        .select("id, title, title_ar, status, competition_start, competition_end, edition_year, competition_number, cover_image_url, country_code, slug")
        .eq("organizer_id", organizerId)
        .order("edition_year", { ascending: false }).limit(50);
      return data || [];
    },
    enabled: !!organizerId,
  });

  // Group exhibitions by base title (series)
  const exhibitionGroups = useMemo(() => {
    if (!linkedExhibitions?.length) return [];
    const groups: Record<string, typeof linkedExhibitions> = {};
    for (const ex of linkedExhibitions) {
      // Strip year from title to find base name
      const baseTitle = ex.title.replace(/\s*\d{4}\s*$/, "").trim() || ex.title;
      if (!groups[baseTitle]) groups[baseTitle] = [];
      groups[baseTitle].push(ex);
    }
    return Object.entries(groups).map(([baseName, editions]) => ({
      baseName,
      baseNameAr: editions[0]?.title_ar?.replace(/\s*[\u0660-\u0669\d]{4}\s*$/, "").trim() || editions[0]?.title_ar || baseName,
      editions: editions.sort((a, b) => (b.edition_year || 0) - (a.edition_year || 0)),
      coverImage: editions.find(e => e.cover_image_url)?.cover_image_url,
    }));
  }, [linkedExhibitions]);

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Populate form
  useEffect(() => {
    if (!orgData) return;
    const social = (orgData.social_links as Record<string, string>) || {};
    const contacts = (orgData.key_contacts as unknown as KeyContact[]) || [];
    const gallery = (orgData.gallery_urls as string[]) || [];
    const org = orgData as Record<string, unknown>;
    const populated: OrganizerForm = {
      name: orgData.name || "", name_ar: orgData.name_ar || "", slug: orgData.slug || "",
      description: orgData.description || "", description_ar: orgData.description_ar || "",
      logo_url: orgData.logo_url || "", cover_image_url: orgData.cover_image_url || "",
      email: orgData.email || "", phone: orgData.phone || "",
      fax: String(org.fax || ""), website: orgData.website || "",
      address: orgData.address || "", address_ar: orgData.address_ar || "",
      city: orgData.city || "", city_ar: orgData.city_ar || "",
      country: orgData.country || "", country_ar: orgData.country_ar || "",
      country_code: orgData.country_code || "",
      district: String(org.district || ""), district_ar: String(org.district_ar || ""),
      street: String(org.street || ""), street_ar: String(org.street_ar || ""),
      postal_code: String(org.postal_code || ""),
      building_number: String(org.building_number || ""),
      additional_number: String(org.additional_number || ""),
      unit_number: String(org.unit_number || ""),
      short_address: String(org.short_address || ""),
      national_address: String(org.national_address || ""),
      national_address_ar: String(org.national_address_ar || ""),
      latitude: org.latitude ? String(org.latitude) : "",
      longitude: org.longitude ? String(org.longitude) : "",
      google_maps_url: String(org.google_maps_url || ""),
      status: orgData.status || "active",
      is_verified: orgData.is_verified || false, is_featured: orgData.is_featured || false,
      services: (orgData.services as string[] || []).join(", "),
      targeted_sectors: (orgData.targeted_sectors as string[] || []).join(", "),
      founded_year: orgData.founded_year?.toString() || "",
      registration_number: (orgData as any).registration_number || "",
      license_number: (orgData as any).license_number || "",
      vat_number: (orgData as any).vat_number || "",
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
        email: f.email || null, phone: f.phone || null, fax: f.fax || null, website: f.website || null,
        address: f.address || null, address_ar: f.address_ar || null,
        city: f.city || null, city_ar: f.city_ar || null,
        country: f.country || null, country_ar: f.country_ar || null,
        country_code: f.country_code || null,
        district: f.district || null, district_ar: f.district_ar || null,
        street: f.street || null, street_ar: f.street_ar || null,
        postal_code: f.postal_code || null,
        building_number: f.building_number || null,
        additional_number: f.additional_number || null,
        unit_number: f.unit_number || null,
        short_address: f.short_address || null,
        national_address: f.national_address || null,
        national_address_ar: f.national_address_ar || null,
        latitude: f.latitude ? parseFloat(f.latitude) : null,
        longitude: f.longitude ? parseFloat(f.longitude) : null,
        google_maps_url: f.google_maps_url || null,
        status: f.status, is_verified: f.is_verified, is_featured: f.is_featured,
        services: f.services ? f.services.split(",").map(s => s.trim()).filter(Boolean) : null,
        targeted_sectors: f.targeted_sectors ? f.targeted_sectors.split(",").map(s => s.trim()).filter(Boolean) : null,
        founded_year: f.founded_year ? parseInt(f.founded_year) : null,
        registration_number: f.registration_number || null,
        license_number: f.license_number || null,
        vat_number: f.vat_number || null,
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

  // Section status
  const getTabStatus = useCallback((id: string): "complete" | "partial" | "empty" => {
    switch (id) {
      case "identity": return (form.name || form.name_ar) && (form.description || form.description_ar) ? "complete" : (form.name || form.name_ar) ? "partial" : "empty";
      case "images": return form.logo_url && form.cover_image_url ? "complete" : form.logo_url || form.cover_image_url || form.gallery_urls.length > 0 ? "partial" : "empty";
      case "contact": return form.email && form.phone ? "complete" : form.email || form.phone || form.website || form.fax ? "partial" : "empty";
      case "location": return (form.city || form.city_ar) && (form.country || form.country_ar) ? "complete" : (form.city || form.country || form.address || form.district) ? "partial" : "empty";
      case "team": return form.key_contacts.length > 0 && form.key_contacts[0]?.name ? "complete" : form.key_contacts.length > 0 ? "partial" : "empty";
      case "details": return form.services && form.founded_year && form.registration_number ? "complete" : form.services || form.founded_year || form.registration_number ? "partial" : "empty";
      case "social": {
        const has = [form.social_twitter, form.social_facebook, form.social_linkedin, form.social_instagram, form.social_youtube, form.social_tiktok].filter(Boolean).length;
        return has >= 3 ? "complete" : has > 0 ? "partial" : "empty";
      }
      case "settings": return "complete";
      case "exhibitions": return (linkedExhibitions?.length || 0) > 0 ? "complete" : "empty";
      case "analytics": return organizerId ? "complete" : "empty";
      case "notes": return form.admin_notes ? "complete" : "empty";
      default: return "empty";
    }
  }, [form, linkedExhibitions, organizerId]);

  const completePct = Math.round(
    (TABS.filter(t => getTabStatus(t.id) === "complete").length / TABS.length) * 100
  );

  // Contacts
  const addContact = () => setForm(f => ({ ...f, key_contacts: [...f.key_contacts, { ...emptyContact }] }));
  const removeContact = (i: number) => setForm(f => ({ ...f, key_contacts: f.key_contacts.filter((_, idx) => idx !== i) }));
  const updateContact = (i: number, field: keyof KeyContact, value: string) => {
    setForm(f => ({ ...f, key_contacts: f.key_contacts.map((c, idx) => idx === i ? { ...c, [field]: value } : c) }));
  };
  const removeGalleryImage = (i: number) => setForm(f => ({ ...f, gallery_urls: f.gallery_urls.filter((_, idx) => idx !== i) }));

  // Navigate tabs
  const goNextTab = () => {
    const idx = TABS.findIndex(t => t.id === activeTab);
    if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id);
  };
  const goPrevTab = () => {
    const idx = TABS.findIndex(t => t.id === activeTab);
    if (idx > 0) setActiveTab(TABS[idx - 1].id);
  };
  const currentTabIdx = TABS.findIndex(t => t.id === activeTab);

  const socialProfiles = [form.social_twitter, form.social_facebook, form.social_linkedin, form.social_instagram, form.social_youtube, form.social_tiktok, form.social_whatsapp, form.social_snapchat].filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">{isAr ? "جاري التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      {/* ══ Top Bar ══ */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/60 -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => hasUnsavedChanges ? setShowDiscardConfirm(true) : onClose()} className="h-8 w-8 rounded-xl shrink-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {form.logo_url ? (
              <img loading="lazy" decoding="async" src={form.logo_url} alt="" className="h-10 w-10 rounded-xl object-cover shrink-0 border shadow-sm" />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate">
                {isAr ? (form.name_ar || form.name || "منظم جديد") : (form.name || form.name_ar || "New Organizer")}
              </h2>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground flex-wrap">
                {organizerId && orgData?.organizer_number && (
                  <Badge variant="outline" className="text-[12px] h-4 font-mono px-1.5">{orgData.organizer_number}</Badge>
                )}
                <Badge variant={form.status === "active" ? "default" : form.status === "pending" ? "outline" : "secondary"} className="text-[12px] h-4 capitalize">{form.status}</Badge>
                {form.is_verified && <Badge variant="outline" className="text-[12px] h-4 px-1.5 gap-0.5 border-primary/30"><CheckCircle2 className="h-2.5 w-2.5 text-primary" />{isAr ? "موثق" : "Verified"}</Badge>}
                {form.is_featured && <Badge variant="outline" className="text-[12px] h-4 px-1.5 gap-0.5 border-amber-500/30"><Star className="h-2.5 w-2.5 text-amber-500" />{isAr ? "مميز" : "Featured"}</Badge>}
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-[12px] h-4 px-1.5 border-amber-500/50 text-amber-600 animate-pulse">
                    {isAr ? "غير محفوظ" : "Unsaved"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {lastSaved && (
              <span className="text-[12px] text-muted-foreground hidden lg:flex items-center gap-1">
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
              <span className="hidden sm:inline text-xs">{translating ? "..." : isAr ? "ترجمة" : "Translate"}</span>
            </Button>
            <Button size="sm" onClick={handleSave} disabled={(!form.name && !form.name_ar) || saveMutation.isPending} className="gap-1.5 h-8 min-w-[72px]">
              {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span className="text-xs">{isAr ? "حفظ" : "Save"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Dedup */}
      <DeduplicationPanel duplicates={duplicates} checking={checking} onDismiss={clearDuplicates} compact />

      {/* ══ Layout: Side Nav + Content ══ */}
      <div className="flex gap-0 mt-0">
        {/* Side Navigation */}
        <div className={cn(
          "shrink-0 border-e border-border/40 transition-all duration-300 hidden lg:block",
          showSideNav ? "w-48 pe-4 pt-5" : "w-0 pe-0 overflow-hidden"
        )}>
          {showSideNav && (
            <nav className="sticky top-20 space-y-0.5">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">{isAr ? "الأقسام" : "Sections"}</p>
              {TABS.map(tab => (
                <QuickNavItem
                  key={tab.id}
                  icon={tab.icon}
                  label={isAr ? tab.ar : tab.en}
                  status={getTabStatus(tab.id)}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
              <Separator className="my-3" />
              <div className="px-3 space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-muted-foreground">{isAr ? "الاكتمال" : "Complete"}</span>
                  <span className={cn("font-bold", completePct >= 80 ? "text-chart-2" : completePct >= 50 ? "text-amber-600" : "text-primary")}>{completePct}%</span>
                </div>
                <Progress value={completePct} className="h-1.5" />
                <div className="flex items-center gap-3 text-[12px] text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-chart-2" />{TABS.filter(t => getTabStatus(t.id) === "complete").length}</span>
                  <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-amber-500" />{TABS.filter(t => getTabStatus(t.id) === "partial").length}</span>
                  <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />{TABS.filter(t => getTabStatus(t.id) === "empty").length}</span>
                </div>
              </div>
            </nav>
          )}
        </div>

        {/* Main Content */}
        <div className={cn("flex-1 min-w-0", showSideNav ? "ps-0 lg:ps-6" : "ps-0")}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Mobile Tab Bar */}
            <div className="overflow-x-auto lg:hidden -mx-4 md:-mx-6 px-4 md:px-6 pt-4">
              <TabsList className="inline-flex h-10 gap-0.5 bg-muted/50 p-1 rounded-xl w-max">
                {TABS.map(tab => {
                  const status = getTabStatus(tab.id);
                  return (
                    <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs px-3 rounded-lg data-[state=active]:shadow-sm relative">
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        status === "complete" ? "bg-chart-2" : status === "partial" ? "bg-amber-500" : "bg-muted-foreground/30"
                      )} />
                      <tab.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden sm:inline">{isAr ? tab.ar : tab.en}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <div className="mt-5 pb-16">
              {/* ═══ Identity Tab ═══ */}
              <TabsContent value="identity" className="space-y-6 mt-0">
                <SectionHeader icon={Building2} title={isAr ? "معلومات المنظم" : "Organizer Information"} desc={isAr ? "الاسم والوصف والرابط المختصر" : "Name, description & URL slug"} />

                {/* Quick Summary Card for existing organizers */}
                {organizerId && orgData && (
                  <Card className="rounded-2xl bg-gradient-to-r from-primary/5 to-transparent border-primary/10">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {form.logo_url ? (
                          <img loading="lazy" decoding="async" src={form.logo_url} alt="" className="h-14 w-14 rounded-2xl object-cover border shadow-sm" />
                        ) : (
                          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base truncate">{isAr ? (form.name_ar || form.name) : (form.name || form.name_ar)}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {orgData.organizer_number && <span className="text-[12px] text-muted-foreground font-mono"><Hash className="h-3 w-3 inline" /> {orgData.organizer_number}</span>}
                            {form.city && <span className="text-[12px] text-muted-foreground"><MapPin className="h-3 w-3 inline" /> {isAr ? (form.city_ar || form.city) : form.city}</span>}
                            {form.founded_year && <span className="text-[12px] text-muted-foreground"><Calendar className="h-3 w-3 inline" /> {form.founded_year}</span>}
                          </div>
                        </div>
                        <div className="hidden sm:flex gap-2">
                          {[
                            { v: orgData.total_exhibitions || 0, l: isAr ? "معارض" : "Events" },
                            { v: (orgData.total_views || 0).toLocaleString(), l: isAr ? "مشاهدات" : "Views" },
                            { v: orgData.follower_count || 0, l: isAr ? "متابعون" : "Followers" },
                          ].map(s => (
                            <div key={s.l} className="text-center px-3">
                              <p className="text-sm font-bold">{s.v}</p>
                              <p className="text-[12px] text-muted-foreground">{s.l}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <BilingualField
                  labelAr="الاسم بالعربية *" labelEn="Name (EN)"
                  valueAr={form.name_ar} valueEn={form.name}
                  onChangeAr={v => setForm(f => ({ ...f, name_ar: v }))}
                  onChangeEn={v => { setForm(f => ({ ...f, name: v })); setFormErrors(e => ({ ...e, name: "" })); }}
                  translateField={translateField} context={translateCtx}
                  placeholder_ar="اسم المنظم بالعربية" placeholder_en="Organizer name in English"
                />
                {formErrors.name && <p className="text-[12px] text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.name}</p>}

                <FieldGroup label="Slug" hint={form.slug ? `${window.location.origin}/organizers/${form.slug}` : undefined}>
                  <div className="flex gap-2">
                    <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder={isAr ? "يُولَّد تلقائياً" : "auto-generated"} className="font-mono text-xs flex-1" dir="ltr" />
                    {(form.name || form.name_ar) && (
                      <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={() => setForm(f => ({ ...f, slug: generateSlug(f.name || f.name_ar) }))}>
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </FieldGroup>

                <BilingualField
                  labelAr="الوصف بالعربية" labelEn="Description (EN)"
                  valueAr={form.description_ar} valueEn={form.description}
                  onChangeAr={v => setForm(f => ({ ...f, description_ar: v }))}
                  onChangeEn={v => setForm(f => ({ ...f, description: v }))}
                  translateField={translateField} context={translateCtx}
                  multiline rows={5}
                  placeholder_ar="وصف المنظم بالعربية..." placeholder_en="Describe the organizer..."
                />

                {/* Character counts */}
                <div className="flex justify-between text-[12px] text-muted-foreground">
                  <span>{form.description_ar.length} {isAr ? "حرف (عربي)" : "chars (AR)"}</span>
                  <span>{form.description.length} {isAr ? "حرف (إنجليزي)" : "chars (EN)"}</span>
                </div>
              </TabsContent>

              {/* ═══ Images Tab ═══ */}
              <TabsContent value="images" className="space-y-6 mt-0">
                <SectionHeader icon={ImageIcon} title={isAr ? "الوسائط والصور" : "Media & Images"} desc={isAr ? "الشعار والغلاف ومعرض الصور" : "Logo, cover image & photo gallery"} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo */}
                  <Card className="rounded-2xl">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />{isAr ? "الشعار" : "Logo"}
                        </Label>
                        {form.logo_url && <Badge variant="outline" className="text-[12px] h-4"><FileCheck className="h-2.5 w-2.5 me-1" />{isAr ? "مرفوع" : "Uploaded"}</Badge>}
                      </div>
                      <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, "logo"); }} />
                      {form.logo_url ? (
                        <div className="flex items-center gap-4">
                          <img src={form.logo_url} alt="Logo" className="h-20 w-20 rounded-2xl object-cover shrink-0 border shadow-sm" loading="lazy" />
                          <div className="flex-1 min-w-0 space-y-2">
                            <p className="text-[12px] text-muted-foreground truncate">{form.logo_url.split("/").pop()}</p>
                            <div className="flex gap-2">
                              <Button type="button" variant="outline" size="sm" className="h-7 text-xs rounded-lg" onClick={() => logoRef.current?.click()}>{isAr ? "تغيير" : "Change"}</Button>
                              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive rounded-lg" onClick={() => setForm(f => ({ ...f, logo_url: "" }))}><X className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
                          className="w-full rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/40 transition-all p-6 flex flex-col items-center gap-2 text-muted-foreground hover:bg-muted/30 active:scale-[0.98]">
                          {uploadingLogo ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                          <span className="text-xs">{uploadingLogo ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "رفع شعار" : "Upload Logo")}</span>
                        </button>
                      )}
                      <Input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder={isAr ? "أو الصق رابط" : "Or paste URL"} className="text-xs h-8" dir="ltr" />
                    </CardContent>
                  </Card>

                  {/* Cover */}
                  <Card className="rounded-2xl">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium flex items-center gap-1.5">
                          <ImageIcon className="h-3.5 w-3.5 text-primary" />{isAr ? "صورة الغلاف" : "Cover Image"}
                        </Label>
                        {form.cover_image_url && <Badge variant="outline" className="text-[12px] h-4"><FileCheck className="h-2.5 w-2.5 me-1" />{isAr ? "مرفوع" : "Uploaded"}</Badge>}
                      </div>
                      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, "cover"); }} />
                      {form.cover_image_url ? (
                        <div className="relative group rounded-2xl border overflow-hidden">
                          <img src={form.cover_image_url} alt="Cover" className="w-full h-32 object-cover" loading="lazy" />
                          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button type="button" variant="secondary" size="sm" className="h-8 rounded-lg" onClick={() => coverRef.current?.click()}>{isAr ? "تغيير" : "Change"}</Button>
                            <Button type="button" variant="destructive" size="sm" className="h-8 rounded-lg" onClick={() => setForm(f => ({ ...f, cover_image_url: "" }))}><X className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => coverRef.current?.click()} disabled={uploadingCover}
                          className="w-full rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/40 transition-all p-6 flex flex-col items-center gap-2 text-muted-foreground hover:bg-muted/30 active:scale-[0.98]">
                          {uploadingCover ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
                          <span className="text-xs">{uploadingCover ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "رفع غلاف" : "Upload Cover")}</span>
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
                      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, "gallery"); }} />
                      <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-lg" onClick={() => galleryRef.current?.click()} disabled={uploadingGallery}>
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
                        <p className="text-[12px]">{isAr ? "لا توجد صور في المعرض" : "No gallery photos yet"}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ═══ Contact Tab ═══ */}
              <TabsContent value="contact" className="space-y-6 mt-0">
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

                {/* Contact Quick Preview */}
                {(form.email || form.phone || form.website) && (
                  <Card className="rounded-2xl bg-muted/30">
                    <CardContent className="p-4">
                      <p className="text-[12px] font-semibold text-muted-foreground uppercase mb-3">{isAr ? "معاينة سريعة" : "Quick Preview"}</p>
                      <div className="flex flex-wrap gap-3">
                        {form.email && (
                          <a href={`mailto:${form.email}`} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                            <Mail className="h-3.5 w-3.5" />{form.email}
                          </a>
                        )}
                        {form.phone && (
                          <a href={`tel:${form.phone}`} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                            <Phone className="h-3.5 w-3.5" />{form.phone}
                          </a>
                        )}
                        {form.website && (
                          <a href={form.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                            <Globe className="h-3.5 w-3.5" />{form.website.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ═══ Location Tab ═══ */}
              <TabsContent value="location" className="space-y-6 mt-0">
                <SectionHeader icon={MapPin} title={isAr ? "الموقع والعنوان" : "Location & Address"} desc={isAr ? "العنوان التفصيلي والعنوان الوطني السعودي" : "Detailed address & Saudi National Address"} />

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
                      <Input value={form.city_ar} onChange={e => setForm(f => ({ ...f, city_ar: e.target.value }))} dir="rtl" placeholder="الرياض" />
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <FieldGroup label={isAr ? "رقم المبنى" : "Building No."}>
                      <Input value={form.building_number} onChange={e => setForm(f => ({ ...f, building_number: e.target.value }))} dir="ltr" placeholder="8228" />
                    </FieldGroup>
                    <FieldGroup label={isAr ? "الرقم الإضافي" : "Additional No."}>
                      <Input value={form.additional_number} onChange={e => setForm(f => ({ ...f, additional_number: e.target.value }))} dir="ltr" placeholder="2121" />
                    </FieldGroup>
                    <FieldGroup label={isAr ? "رقم الوحدة" : "Unit No."}>
                      <Input value={form.unit_number} onChange={e => setForm(f => ({ ...f, unit_number: e.target.value }))} dir="ltr" placeholder="101" />
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

                <div>
                  <h4 className="text-xs font-semibold mb-3 flex items-center gap-2">
                    <Navigation className="h-3.5 w-3.5 text-primary" />
                    {isAr ? "العنوان الوطني السعودي" : "Saudi National Address"}
                  </h4>
                  <FieldGroup label={isAr ? "العنوان المختصر" : "Short Address"} hint={isAr ? "مثال: RAAA1234" : "e.g. RAAA1234"} className="mb-4">
                    <Input value={form.short_address} onChange={e => setForm(f => ({ ...f, short_address: e.target.value.toUpperCase() }))} dir="ltr" placeholder="RAAA1234" className="font-mono" />
                  </FieldGroup>
                  <BilingualField
                    labelAr="العنوان الوطني بالعربية" labelEn="National Address (EN)"
                    valueAr={form.national_address_ar} valueEn={form.national_address}
                    onChangeAr={v => setForm(f => ({ ...f, national_address_ar: v }))}
                    onChangeEn={v => setForm(f => ({ ...f, national_address: v }))}
                    translateField={translateField} context={translateCtx}
                  />
                </div>

                <Separator />

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
                  {form.latitude && form.longitude && (
                    <a href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                      <ExternalLink className="h-3 w-3" />{isAr ? "فتح في خرائط جوجل" : "Open in Google Maps"}
                    </a>
                  )}
                </div>
              </TabsContent>

              {/* ═══ Team Tab ═══ */}
              <TabsContent value="team" className="space-y-6 mt-0">
                <SectionHeader
                  icon={Users}
                  title={isAr ? "جهات الاتصال الرئيسية" : "Key Contacts"}
                  desc={isAr ? "أعضاء الفريق وجهات الاتصال" : "Team members & contact persons"}
                  actions={<Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-lg" onClick={addContact}><Plus className="h-3 w-3" />{isAr ? "إضافة" : "Add"}</Button>}
                />
                {form.key_contacts.length === 0 ? (
                  <Card className="rounded-2xl border-dashed">
                    <CardContent className="p-8 text-center">
                      <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground mb-3">{isAr ? "لا توجد جهات اتصال بعد" : "No contacts added yet"}</p>
                      <Button type="button" variant="outline" size="sm" className="gap-1 text-xs rounded-lg" onClick={addContact}>
                        <Plus className="h-3 w-3" />{isAr ? "إضافة جهة اتصال" : "Add Contact"}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {form.key_contacts.map((c, i) => (
                      <Card key={i} className="rounded-2xl hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Users className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <span className="text-xs font-medium">{c.name || c.name_ar || `${isAr ? "جهة اتصال" : "Contact"} ${i + 1}`}</span>
                              {c.role && <Badge variant="outline" className="text-[12px] h-4">{c.role}</Badge>}
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive rounded-lg" onClick={() => removeContact(i)}>
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
                              <Input value={c.role_ar} onChange={e => updateContact(i, "role_ar", e.target.value)} dir="rtl" className="h-9" />
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
                <SectionHeader icon={Briefcase} title={isAr ? "التفاصيل والخدمات" : "Details & Services"} desc={isAr ? "التسجيل والترخيص والخدمات" : "Registration, licensing & services"} />

                {/* Registration & Legal */}
                <Card className="rounded-2xl">
                  <CardContent className="p-4 space-y-4">
                    <h4 className="text-xs font-semibold flex items-center gap-2">
                      <FileCheck className="h-3.5 w-3.5 text-primary" />
                      {isAr ? "البيانات القانونية والتسجيل" : "Legal & Registration"}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FieldGroup label={isAr ? "سنة التأسيس" : "Founded Year"} error={formErrors.founded_year}>
                        <Input value={form.founded_year} onChange={e => { setForm(f => ({ ...f, founded_year: e.target.value })); setFormErrors(e2 => ({ ...e2, founded_year: "" })); }} type="number" placeholder="2010" dir="ltr" />
                      </FieldGroup>
                      <FieldGroup label={isAr ? "رقم السجل التجاري" : "Commercial Registration"}>
                        <Input value={form.registration_number} onChange={e => setForm(f => ({ ...f, registration_number: e.target.value }))} placeholder="1010XXXXXX" dir="ltr" className="font-mono" />
                      </FieldGroup>
                      <FieldGroup label={isAr ? "رقم الترخيص" : "License Number"}>
                        <Input value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} placeholder="XXXXXX" dir="ltr" className="font-mono" />
                      </FieldGroup>
                      <FieldGroup label={isAr ? "الرقم الضريبي (VAT)" : "VAT Number"}>
                        <Input value={form.vat_number} onChange={e => setForm(f => ({ ...f, vat_number: e.target.value }))} placeholder="3XXXXXXXXXX003" dir="ltr" className="font-mono" />
                      </FieldGroup>
                    </div>
                    {form.founded_year && (
                      <p className="text-[12px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {isAr ? `تأسست منذ ${new Date().getFullYear() - parseInt(form.founded_year)} سنة` : `Established ${new Date().getFullYear() - parseInt(form.founded_year)} years ago`}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Services & Sectors */}
                <Card className="rounded-2xl">
                  <CardContent className="p-4 space-y-4">
                    <h4 className="text-xs font-semibold flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-primary" />
                      {isAr ? "الخدمات والقطاعات" : "Services & Sectors"}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldGroup label={isAr ? "الخدمات المقدمة" : "Services Offered"} hint={isAr ? "مفصولة بفاصلة" : "Comma-separated"}>
                        <Textarea value={form.services} onChange={e => setForm(f => ({ ...f, services: e.target.value }))} placeholder={isAr ? "تنظيم معارض، إدارة مؤتمرات، تدريب..." : "Exhibition management, Conference organizing, Training..."} rows={3} />
                      </FieldGroup>
                      <FieldGroup label={isAr ? "القطاعات المستهدفة" : "Targeted Sectors"} hint={isAr ? "مفصولة بفاصلة" : "Comma-separated"}>
                        <Textarea value={form.targeted_sectors} onChange={e => setForm(f => ({ ...f, targeted_sectors: e.target.value }))} placeholder={isAr ? "أغذية ومشروبات، ضيافة، سياحة..." : "Food & Beverage, Hospitality, Tourism..."} rows={3} />
                      </FieldGroup>
                    </div>
                    {(form.services || form.targeted_sectors) && (
                      <div className="pt-2">
                        <p className="text-[12px] font-semibold text-muted-foreground uppercase mb-2">{isAr ? "العلامات" : "Tags Preview"}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {form.services.split(",").filter(Boolean).map((s, i) => (
                            <Badge key={`s-${i}`} variant="secondary" className="text-[12px]">{s.trim()}</Badge>
                          ))}
                          {form.targeted_sectors.split(",").filter(Boolean).map((s, i) => (
                            <Badge key={`t-${i}`} variant="outline" className="text-[12px]">{s.trim()}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ═══ Social Tab ═══ */}
              <TabsContent value="social" className="space-y-6 mt-0">
                <SectionHeader icon={Globe} title={isAr ? "حسابات التواصل الاجتماعي" : "Social Media Profiles"} desc={isAr ? "جميع حسابات التواصل الاجتماعي" : "All social media links"} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: "social_twitter", label: "Twitter / X", icon: Twitter, ph: "https://twitter.com/..." },
                    { key: "social_facebook", label: "Facebook", icon: Facebook, ph: "https://facebook.com/..." },
                    { key: "social_linkedin", label: "LinkedIn", icon: Linkedin, ph: "https://linkedin.com/..." },
                    { key: "social_instagram", label: "Instagram", icon: Instagram, ph: "https://instagram.com/..." },
                    { key: "social_youtube", label: "YouTube", icon: Youtube, ph: "https://youtube.com/..." },
                    { key: "social_tiktok", label: "TikTok", icon: Globe, ph: "https://tiktok.com/@..." },
                    { key: "social_whatsapp", label: "WhatsApp", icon: MessageCircle, ph: "+966..." },
                    { key: "social_snapchat", label: "Snapchat", icon: Globe, ph: "username" },
                  ].map(s => {
                    const val = form[s.key as keyof OrganizerForm] as string;
                    return (
                      <Card key={s.key} className={cn("rounded-xl transition-all", val ? "border-primary/20 bg-primary/[0.02]" : "")}>
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", val ? "bg-primary/10" : "bg-muted")}>
                            <s.icon className={cn("h-4 w-4", val ? "text-primary" : "text-muted-foreground")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Label className="text-[12px] font-medium text-muted-foreground">{s.label}</Label>
                            <Input
                              value={val}
                              onChange={e => setForm(f => ({ ...f, [s.key]: e.target.value }))}
                              placeholder={s.ph} dir="ltr" className="h-8 text-xs mt-1"
                            />
                          </div>
                          {val && <CheckCircle2 className="h-4 w-4 text-chart-2 shrink-0" />}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <Progress value={(socialProfiles / 8) * 100} className="h-1.5 w-20" />
                  {socialProfiles}/8 {isAr ? "حسابات مرتبطة" : "profiles linked"}
                </div>
              </TabsContent>

              {/* ═══ Settings Tab ═══ */}
              <TabsContent value="settings" className="space-y-6 mt-0">
                <SectionHeader icon={Shield} title={isAr ? "الإعدادات والحالة" : "Settings & Status"} desc={isAr ? "الحالة والتوثيق والتمييز" : "Status, verification & featuring"} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="rounded-2xl hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">{isAr ? "الحالة" : "Status"}</p>
                          <p className="text-[12px] text-muted-foreground">{isAr ? "حالة حساب المنظم" : "Account status"}</p>
                        </div>
                      </div>
                      <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                        <SelectTrigger className="w-28 h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
                          <SelectItem value="inactive">{isAr ? "غير نشط" : "Inactive"}</SelectItem>
                          <SelectItem value="pending">{isAr ? "قيد المراجعة" : "Pending"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">{isAr ? "التوثيق" : "Verified"}</p>
                          <p className="text-[12px] text-muted-foreground">{isAr ? "إظهار شارة التوثيق" : "Show verified badge"}</p>
                        </div>
                      </div>
                      <Switch checked={form.is_verified} onCheckedChange={v => setForm(f => ({ ...f, is_verified: v }))} />
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                          <Star className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">{isAr ? "مميز" : "Featured"}</p>
                          <p className="text-[12px] text-muted-foreground">{isAr ? "إبراز في الصفحة الرئيسية" : "Highlight on homepage"}</p>
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
                  icon={Calendar}
                  title={isAr ? "المعارض والفعاليات المرتبطة" : "Linked Exhibitions & Events"}
                  desc={isAr ? "الفعاليات المرتبطة بهذا المنظم" : "Events linked to this organizer"}
                  actions={organizerId ? (
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-lg" onClick={() => refreshStatsMutation.mutate()} disabled={refreshStatsMutation.isPending}>
                      {refreshStatsMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      {isAr ? "تحديث" : "Refresh"}
                    </Button>
                  ) : undefined}
                />
                {!organizerId ? (
                  <Card className="rounded-2xl border-dashed">
                    <CardContent className="p-8 text-center">
                      <Info className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">{isAr ? "احفظ المنظم أولاً لربط المعارض" : "Save organizer first to link exhibitions"}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {orgData && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                        {[
                          { label: isAr ? "المعارض" : "Exhibitions", value: linkedExhibitions?.length || 0, icon: Calendar },
                          { label: isAr ? "المسابقات" : "Competitions", value: linkedCompetitions?.length || 0, icon: Star },
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
                                <p className="text-[12px] text-muted-foreground">{s.label}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {exhibitionGroups.length > 0 ? (
                      <div className="space-y-3">
                        {exhibitionGroups.map(group => {
                          const isExpanded = expandedGroup === group.baseName;
                          return (
                            <Card key={group.baseName} className="rounded-2xl overflow-hidden">
                              <CardContent className="p-0">
                                {/* Group Header - clickable */}
                                <button
                                  type="button"
                                  onClick={() => setExpandedGroup(isExpanded ? null : group.baseName)}
                                  className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-start"
                                >
                                  {group.coverImage ? (
                                    <img loading="lazy" decoding="async" src={group.coverImage} alt="" className="h-14 w-20 rounded-xl object-cover shrink-0" />
                                  ) : (
                                    <div className="h-14 w-20 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                      <Building2 className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold truncate">{isAr ? group.baseNameAr : group.baseName}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <Badge variant="outline" className="text-[12px] h-4">
                                        {group.editions.length} {isAr ? "نسخة" : group.editions.length === 1 ? "edition" : "editions"}
                                      </Badge>
                                      {group.editions[0]?.edition_year && (
                                        <span className="text-[12px] text-muted-foreground">
                                          {group.editions[group.editions.length - 1]?.edition_year} — {group.editions[0]?.edition_year}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-90")} />
                                </button>

                                {/* Expanded Editions */}
                                {isExpanded && (
                                  <div className="border-t border-border/40 bg-muted/10">
                                    <div className="p-3 space-y-2">
                                      <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                        {isAr ? "النسخ المسجلة" : "Registered Editions"}
                                      </p>
                                      {group.editions.map(ed => (
                                        <Link key={ed.id} to={`/admin/exhibitions?edit=${ed.id}`} className="block">
                                          <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-background border border-transparent hover:border-border/50 transition-all group/ed cursor-pointer">
                                            {ed.cover_image_url ? (
                                              <img loading="lazy" decoding="async" src={ed.cover_image_url} alt="" className="h-10 w-14 rounded-lg object-cover shrink-0" />
                                            ) : (
                                              <div className="h-10 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                              </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-primary">{ed.edition_year || "—"}</span>
                                                {ed.edition_number && (
                                                  <span className="text-[12px] text-muted-foreground">
                                                    {isAr ? `النسخة ${ed.edition_number}` : `Edition #${ed.edition_number}`}
                                                  </span>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-1.5 mt-0.5">
                                                <Badge variant={ed.status === "active" ? "default" : ed.status === "completed" ? "secondary" : "outline"} className="text-[12px] h-3.5 capitalize">{ed.status}</Badge>
                                                {ed.start_date && <span className="text-[12px] text-muted-foreground">{new Date(ed.start_date).toLocaleDateString()}</span>}
                                                {ed.view_count ? <span className="text-[12px] text-muted-foreground flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{ed.view_count}</span> : null}
                                              </div>
                                            </div>
                                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover/ed:opacity-100 transition-opacity shrink-0" />
                                          </div>
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
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

              {/* ═══ Analytics Tab ═══ */}
              <TabsContent value="analytics" className="space-y-6 mt-0">
                <SectionHeader
                  icon={TrendingUp}
                  title={isAr ? "التحليلات والأداء" : "Analytics & Performance"}
                  desc={isAr ? "إحصائيات تفصيلية حول أداء المنظم" : "Detailed performance metrics and insights"}
                  actions={organizerId ? (
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-lg" onClick={() => refreshStatsMutation.mutate()} disabled={refreshStatsMutation.isPending}>
                      {refreshStatsMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      {isAr ? "تحديث" : "Refresh"}
                    </Button>
                  ) : undefined}
                />
                {!organizerId ? (
                  <Card className="rounded-2xl border-dashed">
                    <CardContent className="p-8 text-center">
                      <TrendingUp className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">{isAr ? "احفظ المنظم أولاً لعرض التحليلات" : "Save organizer first to view analytics"}</p>
                    </CardContent>
                  </Card>
                ) : orgData && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: isAr ? "المعارض" : "Total Events", value: orgData.total_exhibitions || 0, icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
                        { label: isAr ? "المشاهدات" : "Total Views", value: (orgData.total_views || 0).toLocaleString(), icon: Eye, color: "text-chart-2", bg: "bg-chart-2/10" },
                        { label: isAr ? "المتابعون" : "Followers", value: orgData.follower_count || 0, icon: Users, color: "text-purple-600", bg: "bg-purple-600/10" },
                        { label: isAr ? "التقييم" : "Avg Rating", value: orgData.average_rating || "—", icon: Star, color: "text-amber-600", bg: "bg-amber-600/10" },
                      ].map(s => (
                        <Card key={s.label} className="rounded-2xl group hover:shadow-md transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                                <s.icon className={cn("h-4 w-4", s.color)} />
                              </div>
                              <p className="text-[12px] text-muted-foreground">{s.label}</p>
                            </div>
                            <p className="text-2xl font-bold">{s.value}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Card className="rounded-2xl">
                      <CardContent className="p-4 space-y-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Activity className="h-4 w-4 text-primary" />
                          {isAr ? "مؤشرات المشاركة" : "Engagement Metrics"}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: isAr ? "متوسط المشاهدات / معرض" : "Avg Views/Event", value: orgData.total_exhibitions > 0 ? Math.round((orgData.total_views || 0) / orgData.total_exhibitions).toLocaleString() : "—" },
                            { label: isAr ? "نسبة المتابعة" : "Follow Rate", value: orgData.total_views > 0 ? `${((orgData.follower_count || 0) / orgData.total_views * 100).toFixed(1)}%` : "—" },
                            { label: isAr ? "سنوات الخبرة" : "Years Active", value: form.founded_year ? `${new Date().getFullYear() - parseInt(form.founded_year)}` : "—" },
                            { label: isAr ? "حسابات التواصل" : "Social Profiles", value: socialProfiles },
                          ].map(m => (
                            <div key={m.label} className="rounded-xl bg-muted/40 p-3">
                              <p className="text-[12px] text-muted-foreground mb-1">{m.label}</p>
                              <p className="text-lg font-bold">{m.value}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                      <CardContent className="p-4 space-y-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          {isAr ? "صحة الملف الشخصي" : "Profile Health"}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { label: isAr ? "الاسم ثنائي اللغة" : "Bilingual Name", ok: !!(form.name && form.name_ar) },
                            { label: isAr ? "الوصف ثنائي اللغة" : "Bilingual Description", ok: !!(form.description && form.description_ar) },
                            { label: isAr ? "الشعار" : "Logo Uploaded", ok: !!form.logo_url },
                            { label: isAr ? "صورة الغلاف" : "Cover Image", ok: !!form.cover_image_url },
                            { label: isAr ? "معلومات التواصل" : "Contact Info", ok: !!(form.email && form.phone) },
                            { label: isAr ? "الموقع" : "Location Set", ok: !!(form.city && form.country) },
                            { label: isAr ? "الموقع الإلكتروني" : "Website", ok: !!form.website },
                            { label: isAr ? "حسابات اجتماعية (3+)" : "Social Media (3+)", ok: socialProfiles >= 3 },
                            { label: isAr ? "معرض الصور" : "Photo Gallery", ok: form.gallery_urls.length > 0 },
                            { label: isAr ? "فريق العمل" : "Team Contacts", ok: form.key_contacts.length > 0 },
                          ].map(item => (
                            <div key={item.label} className={cn("flex items-center gap-2.5 p-2 rounded-lg", item.ok ? "bg-chart-2/5" : "bg-muted/30")}>
                              <div className={cn("h-5 w-5 rounded-full flex items-center justify-center shrink-0", item.ok ? "bg-chart-2/20" : "bg-muted")}>
                                {item.ok ? <CheckCircle2 className="h-3 w-3 text-chart-2" /> : <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
                              </div>
                              <span className={cn("text-xs", item.ok ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                      <CardContent className="p-4 space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <History className="h-4 w-4 text-primary" />
                          {isAr ? "السجل الزمني" : "Timeline"}
                        </h4>
                        <div className="space-y-2">
                          {[
                            { label: isAr ? "تاريخ الإنشاء" : "Created", value: orgData.created_at ? new Date(orgData.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" }) : "—" },
                            { label: isAr ? "آخر تحديث" : "Last Updated", value: orgData.updated_at ? new Date(orgData.updated_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" }) : "—" },
                            { label: isAr ? "سنة التأسيس" : "Founded", value: form.founded_year || "—" },
                          ].map(t => (
                            <div key={t.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                              <span className="text-xs text-muted-foreground">{t.label}</span>
                              <span className="text-xs font-medium">{t.value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              {/* ═══ Notes Tab ═══ */}
              <TabsContent value="notes" className="space-y-6 mt-0">
                <SectionHeader icon={StickyNote} title={isAr ? "ملاحظات إدارية" : "Admin Notes"} desc={isAr ? "ملاحظات داخلية وبيانات وصفية" : "Internal notes & record metadata"} />
                <FieldGroup label={isAr ? "ملاحظات خاصة" : "Private Notes"} hint={isAr ? "مرئية فقط لفريق الإدارة" : "Only visible to admin team"}>
                  <Textarea value={form.admin_notes} onChange={e => setForm(f => ({ ...f, admin_notes: e.target.value }))} rows={5} placeholder={isAr ? "ملاحظات داخلية للفريق..." : "Internal team notes..."} />
                </FieldGroup>
                {organizerId && orgData && (
                  <Card className="rounded-2xl">
                    <CardContent className="p-4">
                      <p className="text-[12px] font-semibold text-muted-foreground uppercase mb-3">{isAr ? "معلومات السجل" : "Record Info"}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "ID", value: organizerId.slice(0, 8) + "...", copyable: organizerId },
                          { label: isAr ? "رقم المنظم" : "Number", value: orgData.organizer_number || "—" },
                          { label: isAr ? "تاريخ الإنشاء" : "Created", value: orgData.created_at ? new Date(orgData.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US") : "—" },
                          { label: isAr ? "آخر حفظ" : "Last Saved", value: lastSaved ? lastSaved.toLocaleTimeString(isAr ? "ar-SA" : "en-US") : "—" },
                        ].map(m => (
                          <div key={m.label} className="rounded-xl bg-muted/40 p-3 group">
                            <p className="text-[12px] text-muted-foreground">{m.label}</p>
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
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ── Tab Navigation Footer ── */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-border/40">
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={goPrevTab} disabled={currentTabIdx === 0}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="text-xs">{currentTabIdx > 0 ? (isAr ? TABS[currentTabIdx - 1].ar : TABS[currentTabIdx - 1].en) : (isAr ? "السابق" : "Previous")}</span>
                </Button>
                <span className="text-[12px] text-muted-foreground">{currentTabIdx + 1} / {TABS.length}</span>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={goNextTab} disabled={currentTabIdx === TABS.length - 1}>
                  <span className="text-xs">{currentTabIdx < TABS.length - 1 ? (isAr ? TABS[currentTabIdx + 1].ar : TABS[currentTabIdx + 1].en) : (isAr ? "التالي" : "Next")}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Discard confirmation */}
      <ConfirmDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
        title={isAr ? "تجاهل التغييرات؟" : "Discard changes?"}
        description={isAr ? "لديك تغييرات غير محفوظة. هل تريد تجاهلها؟" : "You have unsaved changes. Discard them?"}
        confirmLabel={isAr ? "تجاهل" : "Discard"}
        cancelLabel={isAr ? "البقاء" : "Stay"}
        onConfirm={handleDiscard}
        variant="destructive"
      />
    </div>
  );
}
