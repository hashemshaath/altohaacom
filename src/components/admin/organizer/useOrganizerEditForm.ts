import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadAndGetUrl } from "@/lib/storageUrl";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";
import { useEntityDedup } from "@/hooks/useEntityDedup";
import { useFormAutoSave } from "@/hooks/useFormAutoSave";
import { toast } from "sonner";
import { generateSlug } from "./OrganizerFormHelpers";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

/* ─── Types ─── */
export interface KeyContact {
  name: string; name_ar: string; role: string; role_ar: string; email: string; phone: string;
}

export interface OrganizerForm {
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

export const TABS = [
  { id: "identity", en: "Information", ar: "المعلومات" },
  { id: "images", en: "Media", ar: "الوسائط" },
  { id: "contact", en: "Contact", ar: "التواصل" },
  { id: "location", en: "Location", ar: "الموقع" },
  { id: "team", en: "Team", ar: "الفريق" },
  { id: "details", en: "Details", ar: "التفاصيل" },
  { id: "social", en: "Social", ar: "اجتماعي" },
  { id: "settings", en: "Settings", ar: "إعدادات" },
  { id: "exhibitions", en: "Events", ar: "المعارض" },
  { id: "analytics", en: "Analytics", ar: "التحليلات" },
  { id: "notes", en: "Notes", ar: "ملاحظات" },
] as const;

export function useOrganizerEditForm(organizerId: string | null | undefined, onClose: () => void) {
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
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

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
  const translateCtx = "event organizer / exhibition management / Saudi Arabia";

  // Load existing data
  const { data: orgData, isLoading } = useQuery({
    queryKey: ["admin-organizer-edit", organizerId],
    queryFn: async () => {
      if (!organizerId) return null;
      const { data, error } = await supabase.from("organizers").select("*").eq("id", organizerId).maybeSingle();
      if (error) throw handleSupabaseError(error);
      return data;
    },
    enabled: !!organizerId,
  });

  // Load linked exhibitions
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

  // Group exhibitions by base title
  const exhibitionGroups = useMemo(() => {
    if (!linkedExhibitions?.length) return [];
    const groups: Record<string, typeof linkedExhibitions> = {};
    for (const ex of linkedExhibitions) {
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
      registration_number: String(org.registration_number || ""),
      license_number: String(org.license_number || ""),
      vat_number: String(org.vat_number || ""),
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

  const handleImageUpload = useCallback(async (file: File, type: "logo" | "cover" | "gallery") => {
    const setter = type === "logo" ? setUploadingLogo : type === "cover" ? setUploadingCover : setUploadingGallery;
    setter(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `organizers/${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { url: uploadedUrl, error: uploadError } = await uploadAndGetUrl("company-media", path, file);
      if (uploadError) throw uploadError;
      if (type === "gallery") {
        setForm(f => ({ ...f, gallery_urls: [...f.gallery_urls, uploadedUrl] }));
      } else {
        setForm(f => ({ ...f, [type === "logo" ? "logo_url" : "cover_image_url"]: uploadedUrl }));
      }
      toast.success(isAr ? "تم الرفع بنجاح" : "Uploaded successfully");
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : "") || (isAr ? "فشل الرفع" : "Upload failed"));
    } finally { setter(false); }
  }, [isAr]);

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
        key_contacts: f.key_contacts.length > 0 ? (f.key_contacts as unknown as Record<string, unknown>[]) : null,
      };
      if (organizerId) {
        const { error } = await supabase.from("organizers").update(payload).eq("id", organizerId);
        if (error) throw handleSupabaseError(error);
      } else {
        const { error } = await supabase.from("organizers").insert(payload as any);
        if (error) throw handleSupabaseError(error);
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

  const refreshStatsMutation = useMutation({
    mutationFn: async () => {
      if (!organizerId) return;
      const { error } = await supabase.rpc("refresh_organizer_stats", { p_organizer_id: organizerId });
      if (error) throw handleSupabaseError(error);
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

  const addContact = () => setForm(f => ({ ...f, key_contacts: [...f.key_contacts, { ...emptyContact }] }));
  const removeContact = (i: number) => setForm(f => ({ ...f, key_contacts: f.key_contacts.filter((_, idx) => idx !== i) }));
  const updateContact = (i: number, field: keyof KeyContact, value: string) => {
    setForm(f => ({ ...f, key_contacts: f.key_contacts.map((c, idx) => idx === i ? { ...c, [field]: value } : c) }));
  };
  const removeGalleryImage = (i: number) => setForm(f => ({ ...f, gallery_urls: f.gallery_urls.filter((_, idx) => idx !== i) }));

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

  return {
    isAr, form, setForm, formErrors, setFormErrors,
    activeTab, setActiveTab, lastSaved, isLoading,
    uploadingLogo, uploadingCover, uploadingGallery,
    showDiscardConfirm, setShowDiscardConfirm,
    showSideNav, setShowSideNav,
    expandedGroup, setExpandedGroup,
    translating, hasUnsavedChanges,
    logoRef, coverRef, galleryRef,
    orgData, linkedExhibitions, linkedCompetitions,
    exhibitionGroups, checking, duplicates, clearDuplicates,
    translateField, translateCtx,
    handleImageUpload, handleAutoTranslate,
    saveMutation, handleSave, handleDiscard,
    refreshStatsMutation, getTabStatus, completePct,
    addContact, removeContact, updateContact, removeGalleryImage,
    goNextTab, goPrevTab, currentTabIdx, socialProfiles,
    organizerId,
  };
}
