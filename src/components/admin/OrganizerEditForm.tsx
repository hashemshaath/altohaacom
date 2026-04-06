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
import {
  Building2, Save, X, Loader2, ChevronLeft, CheckCircle2, Image as ImageIcon,
  Mail, Phone, Globe, MapPin, Calendar, Shield, Star, Upload,
  Twitter, Facebook, Linkedin, Instagram, AlertCircle, Languages,
  StickyNote, BarChart3, Eye, Activity, Briefcase, Target, Clock,
  ExternalLink, Info, Copy, Users, Trash2, Plus, RefreshCw, Link as LinkIcon,
  Undo2, Youtube, MessageCircle,
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
  country_code: "", status: "active", is_verified: false, is_featured: false,
  services: "", targeted_sectors: "", founded_year: "",
  social_twitter: "", social_facebook: "", social_linkedin: "", social_instagram: "",
  social_youtube: "", social_tiktok: "", social_whatsapp: "", social_snapchat: "",
  admin_notes: "", gallery_urls: [], key_contacts: [],
};

/* ─── Section Definitions ─── */
interface SectionDef { id: string; icon: any; en: string; ar: string; desc_en: string; desc_ar: string; }

const SECTIONS: SectionDef[] = [
  { id: "identity", icon: Building2, en: "Identity", ar: "الهوية", desc_en: "Name, slug & descriptions", desc_ar: "الاسم والوصف" },
  { id: "images", icon: ImageIcon, en: "Images & Gallery", ar: "الصور والمعرض", desc_en: "Logo, cover & gallery", desc_ar: "الشعار والغلاف والمعرض" },
  { id: "contact", icon: Mail, en: "Contact", ar: "التواصل", desc_en: "Email, phone & website", desc_ar: "البريد والهاتف" },
  { id: "location", icon: MapPin, en: "Location", ar: "الموقع", desc_en: "Address, city & country", desc_ar: "العنوان والمدينة" },
  { id: "team", icon: Users, en: "Key Contacts", ar: "جهات الاتصال", desc_en: "Team members & contacts", desc_ar: "أعضاء الفريق" },
  { id: "details", icon: Briefcase, en: "Details", ar: "التفاصيل", desc_en: "Services, sectors & founding", desc_ar: "الخدمات والقطاعات" },
  { id: "social", icon: Globe, en: "Social Links", ar: "التواصل الاجتماعي", desc_en: "Social media profiles", desc_ar: "حسابات التواصل" },
  { id: "settings", icon: Shield, en: "Settings", ar: "الإعدادات", desc_en: "Status, verification & featuring", desc_ar: "الحالة والتوثيق" },
  { id: "exhibitions", icon: BarChart3, en: "Exhibitions", ar: "المعارض", desc_en: "Linked events & stats", desc_ar: "الفعاليات المرتبطة" },
  { id: "notes", icon: StickyNote, en: "Admin Notes", ar: "ملاحظات", desc_en: "Internal notes & metadata", desc_ar: "ملاحظات داخلية" },
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
        <TooltipContent side="bottom"><p className="text-xs">Profile completeness: {pct}%</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* Auto-generate slug from name */
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
  const [activeSection, setActiveSection] = useState("identity");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // Unsaved changes detection
  const hasUnsavedChanges = JSON.stringify(form) !== JSON.stringify(initialForm);

  // Auto-save draft
  const { clearDraft, lastSaved: draftSaved } = useFormAutoSave({
    key: `organizer-${organizerId || "new"}`,
    values: form,
    enabled: hasUnsavedChanges,
  });

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
    const contacts = (orgData.key_contacts as KeyContact[]) || [];
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

  // Intersection Observer for active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("section-", "");
            setActiveSection(id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );
    Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [isLoading]);

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
      if (f.social_youtube) socialLinks.youtube = f.social_youtube;
      if (f.social_tiktok) socialLinks.tiktok = f.social_tiktok;
      if (f.social_whatsapp) socialLinks.whatsapp = f.social_whatsapp;
      if (f.social_snapchat) socialLinks.snapchat = f.social_snapchat;
      const payload = {
        name: f.name, name_ar: f.name_ar || null,
        slug: f.slug || generateSlug(f.name),
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
        gallery_urls: f.gallery_urls.length > 0 ? f.gallery_urls : null,
        key_contacts: f.key_contacts.length > 0 ? f.key_contacts : null,
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
      setInitialForm(form);
      clearDraft();
      toast.success(organizerId ? (isAr ? "تم التحديث" : "Updated successfully") : (isAr ? "تمت الإضافة" : "Created successfully"));
      if (!organizerId) onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSave = useCallback(() => {
    const errors = validateForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error(isAr ? "يرجى تصحيح الأخطاء" : "Please fix errors");
      // Scroll to first error section
      if (errors.name) scrollToSection("identity");
      else if (errors.email || errors.website) scrollToSection("contact");
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
  const getSectionStatus = useCallback((id: string): "complete" | "partial" | "empty" => {
    switch (id) {
      case "identity": return form.name && form.description ? "complete" : form.name ? "partial" : "empty";
      case "images": return form.logo_url && form.cover_image_url ? "complete" : form.logo_url || form.cover_image_url || form.gallery_urls.length > 0 ? "partial" : "empty";
      case "contact": return form.email && form.phone ? "complete" : form.email || form.phone || form.website ? "partial" : "empty";
      case "location": return form.city && form.country ? "complete" : form.city || form.country ? "partial" : "empty";
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
    (SECTIONS.filter(s => getSectionStatus(s.id) === "complete").length / SECTIONS.length) * 100
  );

  const scrollToSection = useCallback((id: string) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const statusDot = (s: "complete" | "partial" | "empty") =>
    s === "complete" ? "bg-chart-2" : s === "partial" ? "bg-amber-500" : "bg-muted-foreground/30";

  // Key contacts helpers
  const addContact = () => setForm(f => ({ ...f, key_contacts: [...f.key_contacts, { ...emptyContact }] }));
  const removeContact = (i: number) => setForm(f => ({ ...f, key_contacts: f.key_contacts.filter((_, idx) => idx !== i) }));
  const updateContact = (i: number, field: keyof KeyContact, value: string) => {
    setForm(f => ({
      ...f,
      key_contacts: f.key_contacts.map((c, idx) => idx === i ? { ...c, [field]: value } : c),
    }));
  };

  // Gallery helpers
  const removeGalleryImage = (i: number) => setForm(f => ({ ...f, gallery_urls: f.gallery_urls.filter((_, idx) => idx !== i) }));

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
              <h2 className="text-sm font-bold truncate">{form.name || (isAr ? "منظم جديد" : "New Organizer")}</h2>
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
                <Clock className="h-3 w-3" />
                {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <ProgressRing pct={completePct} />

            {/* Quick Actions */}
            {organizerId && orgData?.slug && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" asChild>
                      <Link to={`/organizers/${orgData.slug}`} target="_blank"><ExternalLink className="h-3.5 w-3.5" /></Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">{isAr ? "عرض الصفحة العامة" : "View public page"}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
            <Button size="sm" onClick={handleSave} disabled={!form.name || saveMutation.isPending || uploadingLogo || uploadingCover} className="gap-1.5 h-8">
              {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span className="text-xs">{isAr ? "حفظ" : "Save"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Dedup Warnings ── */}
      <DeduplicationPanel duplicates={duplicates} checking={checking} onDismiss={clearDuplicates} compact />

      {/* ── Layout: Sidebar + Content ── */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block w-52 shrink-0">
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
                  <span className="text-xs truncate">{isAr ? s.ar : s.en}</span>
                </button>
              );
            })}
            {/* Keyboard shortcut hint */}
            <div className="pt-4 px-3">
              <p className="text-[9px] text-muted-foreground/60">
                <kbd className="px-1 py-0.5 rounded bg-muted text-[8px] font-mono">⌘S</kbd> {isAr ? "للحفظ" : "to save"}
              </p>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-8 pb-16">

          {/* ─ Identity ─ */}
          <section ref={el => { sectionRefs.current.identity = el; }} id="section-identity">
            <SectionHeader icon={Building2} title={isAr ? "الهوية" : "Identity"} desc={isAr ? "الاسم والوصف والرابط" : "Name, slug & descriptions"} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldGroup label={isAr ? "الاسم (EN)" : "Name (EN)"} required error={formErrors.name}>
                <Input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(e2 => ({ ...e2, name: "" })); }} placeholder={isAr ? "اسم المنظم" : "Organizer name"} />
              </FieldGroup>
              <FieldGroup label={isAr ? "الاسم (AR)" : "Name (AR)"}>
                <Input value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} dir="rtl" placeholder={isAr ? "الاسم بالعربية" : "Arabic name"} />
              </FieldGroup>
            </div>
            <div className="mt-4">
              <FieldGroup label="Slug" hint={form.slug ? `${window.location.origin}/organizers/${form.slug}` : undefined}>
                <div className="flex gap-2">
                  <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder={isAr ? "يُولَّد تلقائياً" : "auto-generated"} className="font-mono text-xs flex-1" />
                  {form.name && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => setForm(f => ({ ...f, slug: generateSlug(f.name) }))}>
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">{isAr ? "إعادة توليد" : "Regenerate"}</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </FieldGroup>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FieldGroup label={isAr ? "الوصف (EN)" : "Description (EN)"} hint={`${form.description.length}/500`}>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder={isAr ? "وصف المنظم..." : "Describe the organizer..."} />
              </FieldGroup>
              <FieldGroup label={isAr ? "الوصف (AR)" : "Description (AR)"} hint={`${form.description_ar.length}/500`}>
                <Textarea value={form.description_ar} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} rows={4} dir="rtl" placeholder={isAr ? "الوصف بالعربية..." : "Arabic description..."} />
              </FieldGroup>
            </div>
          </section>

          <Separator />

          {/* ─ Images & Gallery ─ */}
          <section ref={el => { sectionRefs.current.images = el; }} id="section-images">
            <SectionHeader icon={ImageIcon} title={isAr ? "الصور والمعرض" : "Images & Gallery"} desc={isAr ? "الشعار والغلاف ومعرض الصور" : "Logo, cover image & photo gallery"} />

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
                    className="w-full rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/40 transition-all p-8 flex flex-col items-center gap-2 text-muted-foreground hover:bg-muted/30 active:scale-[0.98]">
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
                      <Button type="button" variant="secondary" size="sm" className="h-8" onClick={() => coverRef.current?.click()}>{isAr ? "تغيير" : "Change"}</Button>
                      <Button type="button" variant="destructive" size="sm" className="h-8" onClick={() => setForm(f => ({ ...f, cover_image_url: "" }))}><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => coverRef.current?.click()} disabled={uploadingCover}
                    className="w-full rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/40 transition-all p-8 flex flex-col items-center gap-2 text-muted-foreground hover:bg-muted/30 active:scale-[0.98]">
                    {uploadingCover ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
                    <span className="text-xs">{uploadingCover ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "رفع غلاف" : "Upload Cover")}</span>
                  </button>
                )}
                <Input value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))} placeholder={isAr ? "أو الصق رابط" : "Or paste URL"} className="text-xs h-8" />
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
                    <div key={i} className="relative group rounded-xl overflow-hidden border aspect-square">
                      <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(i)}
                        className="absolute top-1 end-1 h-6 w-6 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                      >
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              <FieldGroup label={isAr ? "المدينة" : "City"}>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </FieldGroup>
              <FieldGroup label={isAr ? "المدينة (AR)" : "City (AR)"}>
                <Input value={form.city_ar} onChange={e => setForm(f => ({ ...f, city_ar: e.target.value }))} dir="rtl" />
              </FieldGroup>
              <FieldGroup label={isAr ? "الدولة" : "Country"}>
                <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
              </FieldGroup>
              <FieldGroup label={isAr ? "الدولة (AR)" : "Country (AR)"}>
                <Input value={form.country_ar} onChange={e => setForm(f => ({ ...f, country_ar: e.target.value }))} dir="rtl" />
              </FieldGroup>
              <FieldGroup label={isAr ? "رمز الدولة" : "Code"} error={formErrors.country_code}>
                <Input value={form.country_code} onChange={e => { setForm(f => ({ ...f, country_code: e.target.value.toUpperCase() })); setFormErrors(e2 => ({ ...e2, country_code: "" })); }} maxLength={2} placeholder="SA" />
              </FieldGroup>
            </div>
          </section>

          <Separator />

          {/* ─ Key Contacts ─ */}
          <section ref={el => { sectionRefs.current.team = el; }} id="section-team">
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
                <p className="text-xs text-muted-foreground">{isAr ? "لا توجد جهات اتصال" : "No contacts added yet"}</p>
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
                        <FieldGroup label={isAr ? "الاسم" : "Name"}>
                          <Input value={c.name} onChange={e => updateContact(i, "name", e.target.value)} className="h-9" />
                        </FieldGroup>
                        <FieldGroup label={isAr ? "الاسم (AR)" : "Name (AR)"}>
                          <Input value={c.name_ar} onChange={e => updateContact(i, "name_ar", e.target.value)} dir="rtl" className="h-9" />
                        </FieldGroup>
                        <FieldGroup label={isAr ? "المنصب" : "Role"}>
                          <Input value={c.role} onChange={e => updateContact(i, "role", e.target.value)} className="h-9" placeholder={isAr ? "مثال: مدير" : "e.g. Director"} />
                        </FieldGroup>
                        <FieldGroup label={isAr ? "المنصب (AR)" : "Role (AR)"}>
                          <Input value={c.role_ar} onChange={e => updateContact(i, "role_ar", e.target.value)} dir="rtl" className="h-9" />
                        </FieldGroup>
                        <FieldGroup label={isAr ? "البريد" : "Email"}>
                          <Input value={c.email} onChange={e => updateContact(i, "email", e.target.value)} type="email" className="h-9" />
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
          </section>

          <Separator />

          {/* ─ Details ─ */}
          <section ref={el => { sectionRefs.current.details = el; }} id="section-details">
            <SectionHeader icon={Briefcase} title={isAr ? "التفاصيل" : "Details"} desc={isAr ? "الخدمات والقطاعات وسنة التأسيس" : "Services, sectors & founding year"} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldGroup label={isAr ? "سنة التأسيس" : "Founded Year"} error={formErrors.founded_year}>
                <Input value={form.founded_year} onChange={e => { setForm(f => ({ ...f, founded_year: e.target.value })); setFormErrors(e2 => ({ ...e2, founded_year: "" })); }} type="number" placeholder="2010" startIcon={<Calendar className="h-4 w-4" />} />
              </FieldGroup>
              <FieldGroup label={isAr ? "الخدمات" : "Services"} hint={isAr ? "مفصولة بفاصلة" : "Comma-separated"}>
                <Input value={form.services} onChange={e => setForm(f => ({ ...f, services: e.target.value }))} placeholder="Exhibitions, Training..." startIcon={<Briefcase className="h-4 w-4" />} />
              </FieldGroup>
              <FieldGroup label={isAr ? "القطاعات المستهدفة" : "Targeted Sectors"} hint={isAr ? "مفصولة بفاصلة" : "Comma-separated"}>
                <Input value={form.targeted_sectors} onChange={e => setForm(f => ({ ...f, targeted_sectors: e.target.value }))} placeholder="Food & Beverage..." startIcon={<Target className="h-4 w-4" />} />
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
          </section>

          <Separator />

          {/* ─ Social Links ─ */}
          <section ref={el => { sectionRefs.current.social = el; }} id="section-social">
            <SectionHeader icon={Globe} title={isAr ? "التواصل الاجتماعي" : "Social Links"} desc={isAr ? "جميع حسابات التواصل الاجتماعي" : "All social media profiles"} />
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
                    placeholder={s.ph}
                    startIcon={<s.icon className="h-4 w-4" />}
                  />
                </FieldGroup>
              ))}
            </div>
            {/* Social links count */}
            <div className="mt-3">
              <p className="text-[10px] text-muted-foreground">
                {[form.social_twitter, form.social_facebook, form.social_linkedin, form.social_instagram, form.social_youtube, form.social_tiktok, form.social_whatsapp, form.social_snapchat].filter(Boolean).length}/8 {isAr ? "حسابات مرتبطة" : "profiles linked"}
              </p>
            </div>
          </section>

          <Separator />

          {/* ─ Settings ─ */}
          <section ref={el => { sectionRefs.current.settings = el; }} id="section-settings">
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
          </section>

          <Separator />

          {/* ─ Exhibitions ─ */}
          <section ref={el => { sectionRefs.current.exhibitions = el; }} id="section-exhibitions">
            <SectionHeader
              icon={BarChart3}
              title={isAr ? "المعارض المرتبطة" : "Linked Exhibitions"}
              desc={isAr ? "الفعاليات المرتبطة بهذا المنظم" : "Events linked to this organizer"}
              actions={organizerId ? (
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => refreshStatsMutation.mutate()} disabled={refreshStatsMutation.isPending}>
                  {refreshStatsMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  {isAr ? "تحديث" : "Refresh"}
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
                {/* Stats Cards */}
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
                          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
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

                {/* Exhibition List */}
                {linkedExhibitions && linkedExhibitions.length > 0 ? (
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
                    <CardContent className="p-8 text-center">
                      <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">{isAr ? "لا توجد معارض مرتبطة" : "No linked exhibitions"}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </section>

          <Separator />

          {/* ─ Admin Notes ─ */}
          <section ref={el => { sectionRefs.current.notes = el; }} id="section-notes">
            <SectionHeader icon={StickyNote} title={isAr ? "ملاحظات إدارية" : "Admin Notes"} desc={isAr ? "ملاحظات داخلية وبيانات وصفية" : "Internal notes & record metadata"} />
            <FieldGroup label={isAr ? "ملاحظات خاصة" : "Private Notes"} hint={isAr ? "مرئية فقط لفريق الإدارة" : "Only visible to admin team"}>
              <Textarea value={form.admin_notes} onChange={e => setForm(f => ({ ...f, admin_notes: e.target.value }))} rows={4} placeholder={isAr ? "ملاحظات داخلية للفريق..." : "Internal team notes..."} />
            </FieldGroup>
            {organizerId && orgData && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "ID", value: organizerId.slice(0, 8) + "...", copyable: organizerId },
                  { label: isAr ? "رقم المنظم" : "Number", value: orgData.organizer_number || "—" },
                  { label: isAr ? "تاريخ الإنشاء" : "Created", value: orgData.created_at ? new Date(orgData.created_at).toLocaleDateString() : "—" },
                  { label: isAr ? "آخر حفظ" : "Last Saved", value: lastSaved ? lastSaved.toLocaleTimeString() : "—" },
                ].map(m => (
                  <div key={m.label} className="rounded-xl bg-muted/40 p-3 group">
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <p className="text-xs font-medium font-mono truncate">{m.value}</p>
                      {"copyable" in m && m.copyable && (
                        <button
                          type="button"
                          onClick={() => { navigator.clipboard.writeText(m.copyable as string); toast.info("Copied!"); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

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
