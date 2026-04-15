/**
 * Extracted state & mutation logic for ExhibitionEditForm.
 * Keeps the component focused on rendering.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCountries } from "@/hooks/useCountries";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { MS_PER_DAY } from "@/lib/constants";
import type { OrganizerValue } from "@/components/admin/OrganizerSearchSelector";
import type { VenueValue } from "@/components/admin/VenueSearchSelector";
import type { Database } from "@/integrations/supabase/types";
import { CACHE } from "@/lib/queryConfig";

export type ExhibitionStatus = Database["public"]["Enums"]["exhibition_status"];
export type ExhibitionType = Database["public"]["Enums"]["exhibition_type"];
export type ExhibitionInsert = Database["public"]["Tables"]["exhibitions"]["Insert"];

export const statusOptions: { value: ExhibitionStatus; en: string; ar: string; color: string }[] = [
  { value: "pending", en: "Pending Approval", ar: "بانتظار الموافقة", color: "bg-amber-500" },
  { value: "draft", en: "Draft", ar: "مسودة", color: "bg-muted-foreground" },
  { value: "upcoming", en: "Upcoming", ar: "قادمة", color: "bg-blue-500" },
  { value: "active", en: "Active", ar: "نشطة", color: "bg-chart-2" },
  { value: "completed", en: "Completed", ar: "مكتملة", color: "bg-primary" },
  { value: "cancelled", en: "Cancelled", ar: "ملغاة", color: "bg-destructive" },
];

export const typeOptions: { value: ExhibitionType; en: string; ar: string; iconName: string }[] = [
  { value: "exhibition", en: "Exhibition", ar: "معرض", iconName: "Landmark" },
  { value: "conference", en: "Conference", ar: "مؤتمر", iconName: "Mic" },
  { value: "summit", en: "Summit", ar: "قمة", iconName: "Star" },
  { value: "workshop", en: "Workshop", ar: "ورشة عمل", iconName: "GraduationCap" },
  { value: "food_festival", en: "Food Festival", ar: "مهرجان طعام", iconName: "Sparkles" },
  { value: "trade_show", en: "Trade Show", ar: "معرض تجاري", iconName: "Building" },
  { value: "competition_event", en: "Competition Event", ar: "حدث تنافسي", iconName: "Trophy" },
];

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useExhibitionEditForm(exhibition: any | undefined, onClose: () => void) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const originalEditingId = exhibition?.id || null;
  const [activeEditingId, setActiveEditingId] = useState<string | null>(originalEditingId);
  const editingId = activeEditingId;

  const { data: countries } = useCountries();
  const { data: seriesList } = useQuery({
    queryKey: ["event-series-select"],
    queryFn: async () => {
      const { data } = await supabase.from("event_series").select("id, name, name_ar, series_type, default_venue, default_venue_ar, default_city, default_country, default_organizer_name, default_organizer_name_ar, default_organizer_email, cover_image_url, tags, website_url").eq("is_active", true).order("name").limit(500);
      return data || [];
    },
  });

  const [form, setForm] = useState<Partial<ExhibitionInsert>>(() => {
    if (!exhibition) return emptyForm;
    return {
      title: exhibition.title, title_ar: exhibition.title_ar, slug: exhibition.slug,
      description: exhibition.description, description_ar: exhibition.description_ar,
      type: exhibition.type, status: exhibition.status,
      start_date: exhibition.start_date?.slice(0, 16), end_date: exhibition.end_date?.slice(0, 16),
      venue: exhibition.venue, venue_ar: exhibition.venue_ar, city: exhibition.city, country: exhibition.country,
      is_virtual: exhibition.is_virtual, virtual_link: exhibition.virtual_link,
      organizer_name: exhibition.organizer_name, organizer_name_ar: exhibition.organizer_name_ar,
      organizer_email: exhibition.organizer_email, organizer_phone: exhibition.organizer_phone,
      organizer_website: exhibition.organizer_website,
      registration_url: exhibition.registration_url, website_url: exhibition.website_url, map_url: exhibition.map_url,
      ticket_price: exhibition.ticket_price, ticket_price_ar: exhibition.ticket_price_ar,
      is_free: exhibition.is_free, max_attendees: exhibition.max_attendees, is_featured: exhibition.is_featured,
      cover_image_url: exhibition.cover_image_url,
      registration_deadline: exhibition.registration_deadline?.slice(0, 16),
    };
  });

  const [organizer, setOrganizer] = useState<OrganizerValue | null>(() => {
    if (!exhibition || (!exhibition.organizer_entity_id && !exhibition.organizer_company_id && !exhibition.organizer_user_id)) return null;
    return {
      type: exhibition.organizer_type || "custom",
      entityId: exhibition.organizer_entity_id || null,
      companyId: exhibition.organizer_company_id || null,
      userId: exhibition.organizer_user_id || null,
      name: exhibition.organizer_name || "",
      nameAr: exhibition.organizer_name_ar || "",
      email: exhibition.organizer_email || undefined,
      phone: exhibition.organizer_phone || undefined,
      website: exhibition.organizer_website || undefined,
      logoUrl: exhibition.organizer_logo_url || undefined,
      country: exhibition.country || undefined,
    };
  });

  const [currency, setCurrency] = useState(exhibition?.currency || "SAR");
  const [includesCompetitions, setIncludesCompetitions] = useState(exhibition?.includes_competitions || false);
  const [includesTraining, setIncludesTraining] = useState(exhibition?.includes_training || false);
  const [includesSeminars, setIncludesSeminars] = useState(exhibition?.includes_seminars || false);
  const [tagsInput, setTagsInput] = useState((exhibition?.tags || []).join(", "));
  const [audienceInput, setAudienceInput] = useState((exhibition?.target_audience || []).join(", "));
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(() => {
    if (!exhibition?.social_links || typeof exhibition.social_links !== "object") return {};
    return exhibition.social_links as Record<string, string>;
  });
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(exhibition?.series_id || null);
  const [editionYear, setEditionYear] = useState<number | null>(exhibition?.edition_year || null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editionNumber, setEditionNumber] = useState<number | null>((exhibition as any)?.edition_number as number | null ?? null);
  const [editionConfirmed, setEditionConfirmed] = useState(!!originalEditingId);
  const [editionResolved, setEditionResolved] = useState(!!originalEditingId || !exhibition?.series_id);
  const [selectedVenue, setSelectedVenue] = useState<VenueValue | null>(() => {
    if (!exhibition?.venue_id) return null;
    return {
      id: exhibition.venue_id,
      name: exhibition.venue || "",
      nameAr: exhibition.venue_ar || null,
      city: exhibition.city || null,
      country: exhibition.country || null,
      address: null, capacity: null, logoUrl: null,
      mapUrl: exhibition.map_url || null,
    };
  });
  const [activeSection, setActiveSection] = useState("basic");
  const [lastSaved, setLastSaved] = useState<Date | null>(exhibition?.updated_at ? new Date(exhibition.updated_at) : null);
  const [logoUrl, setLogoUrl] = useState(exhibition?.logo_url || "");
  const [adminNotes, setAdminNotes] = useState(exhibition?.admin_notes || "");

  // Check if edition exists in DB
  const { data: existingEdition, isLoading: editionLoading } = useQuery({
    queryKey: ["edition-check", selectedSeriesId, editionYear],
    queryFn: async () => {
      if (!selectedSeriesId || !editionYear) return null;
      const { data } = await supabase
        .from("exhibitions")
        .select("*")
        .eq("series_id", selectedSeriesId)
        .eq("edition_year", editionYear)
        .maybeSingle();
      return data;
    },
    enabled: !!selectedSeriesId && !!editionYear,
  });

  // Fetch previous editions for this series
  const { data: previousEditions = [] } = useQuery({
    queryKey: ["previous-editions", selectedSeriesId, editingId],
    queryFn: async () => {
      if (!selectedSeriesId) return [];
      const { data } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, edition_year, edition_number, status, start_date, end_date, city, country, cover_image_url, view_count")
        .eq("series_id", selectedSeriesId)
        .order("edition_year", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!selectedSeriesId,
    staleTime: CACHE.medium.staleTime,
  });

  useEffect(() => {
    if (!selectedSeriesId || !editionYear || editionLoading) return;

    if (existingEdition) {
      setActiveEditingId(existingEdition.id);
      setForm({
        title: existingEdition.title, title_ar: existingEdition.title_ar, slug: existingEdition.slug,
        description: existingEdition.description, description_ar: existingEdition.description_ar,
        type: existingEdition.type, status: existingEdition.status,
        start_date: existingEdition.start_date?.slice(0, 16), end_date: existingEdition.end_date?.slice(0, 16),
        venue: existingEdition.venue, venue_ar: existingEdition.venue_ar, city: existingEdition.city, country: existingEdition.country,
        is_virtual: existingEdition.is_virtual, virtual_link: existingEdition.virtual_link,
        organizer_name: existingEdition.organizer_name, organizer_name_ar: existingEdition.organizer_name_ar,
        organizer_email: existingEdition.organizer_email, organizer_phone: existingEdition.organizer_phone,
        organizer_website: existingEdition.organizer_website,
        registration_url: existingEdition.registration_url, website_url: existingEdition.website_url, map_url: existingEdition.map_url,
        ticket_price: existingEdition.ticket_price, ticket_price_ar: existingEdition.ticket_price_ar,
        is_free: existingEdition.is_free, max_attendees: existingEdition.max_attendees, is_featured: existingEdition.is_featured,
        cover_image_url: existingEdition.cover_image_url,
        registration_deadline: existingEdition.registration_deadline?.slice(0, 16),
      });
      setEditionNumber(existingEdition.edition_number || null);
      setCurrency(existingEdition.currency || "SAR");
      setIncludesCompetitions(existingEdition.includes_competitions || false);
      setIncludesTraining(existingEdition.includes_training || false);
      setIncludesSeminars(existingEdition.includes_seminars || false);
      setTagsInput((existingEdition.tags || []).join(", "));
      setAudienceInput((existingEdition.target_audience || []).join(", "));
      setSocialLinks(existingEdition.social_links && typeof existingEdition.social_links === "object" && !Array.isArray(existingEdition.social_links) ? existingEdition.social_links as Record<string, string> : {});
      if (existingEdition.organizer_entity_id || existingEdition.organizer_company_id || existingEdition.organizer_user_id) {
        setOrganizer({
          type: (existingEdition.organizer_type as "entity" | "company" | "chef" | "custom") || "custom",
          entityId: existingEdition.organizer_entity_id || null,
          companyId: existingEdition.organizer_company_id || null,
          userId: existingEdition.organizer_user_id || null,
          name: existingEdition.organizer_name || "",
          nameAr: existingEdition.organizer_name_ar || "",
          email: existingEdition.organizer_email || undefined,
          phone: existingEdition.organizer_phone || undefined,
          website: existingEdition.organizer_website || undefined,
          logoUrl: existingEdition.organizer_logo_url || undefined,
          country: existingEdition.country || undefined,
        });
      } else {
        setOrganizer(null);
      }
      setEditionResolved(true);
      setEditionConfirmed(true);
      if (existingEdition.venue_id) {
        setSelectedVenue({
          id: existingEdition.venue_id,
          name: existingEdition.venue || "",
          nameAr: existingEdition.venue_ar || null,
          city: existingEdition.city || null,
          country: existingEdition.country || null,
          address: null, capacity: null, logoUrl: null,
          mapUrl: existingEdition.map_url || null,
        });
      } else {
        setSelectedVenue(null);
      }
      setLastSaved(existingEdition.updated_at ? new Date(existingEdition.updated_at) : null);
      setLogoUrl(existingEdition.logo_url || "");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAdminNotes(String((existingEdition as any).admin_notes || ""));
    } else {
      setActiveEditingId(null);
      setEditionResolved(false);
      setEditionConfirmed(false);
      setSelectedVenue(null);
      const series = seriesList?.find(s => s.id === selectedSeriesId);
      setForm({
        ...emptyForm,
        venue: series?.default_venue || "",
        venue_ar: series?.default_venue_ar || "",
        city: series?.default_city || "",
        country: series?.default_country || "",
        organizer_name: series?.default_organizer_name || "",
        organizer_name_ar: series?.default_organizer_name_ar || "",
        organizer_email: series?.default_organizer_email || "",
        cover_image_url: series?.cover_image_url || "",
      });
      setEditionNumber(null);
      setOrganizer(null);
      setSocialLinks({});
      if (series?.tags) setTagsInput(series.tags.join(", "));
      setLastSaved(null);
    }
  }, [selectedSeriesId, editionYear, existingEdition, editionLoading, seriesList]);

  const editionHasData = !!existingEdition && !editionLoading;
  const formLocked = !!selectedSeriesId && !editionResolved;
  const editionFieldsDisabled = formLocked;

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const updateField = useCallback((key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value })), []);

  const getSectionStatus = useCallback((sectionId: string): "complete" | "partial" | "empty" => {
    switch (sectionId) {
      case "basic": {
        const has = [form.title, form.description, form.type].filter(Boolean).length;
        return has >= 3 ? "complete" : has > 0 ? "partial" : "empty";
      }
      case "datetime": {
        const has = [form.start_date, form.end_date].filter(Boolean).length;
        return has >= 2 ? "complete" : has > 0 ? "partial" : "empty";
      }
      case "location": {
        if (form.is_virtual) return form.virtual_link ? "complete" : "partial";
        const has = [form.venue, form.city, form.country].filter(Boolean).length;
        return has >= 3 ? "complete" : has > 0 ? "partial" : "empty";
      }
      case "organizer": return (organizer || form.organizer_name) ? "complete" : "empty";
      case "tickets": return "complete";
      case "links": return (form.registration_url || form.website_url) ? "complete" : "empty";
      case "sponsors": return editingId ? "complete" : "empty";
      case "competitions": return editingId ? "complete" : "empty";
      case "images": {
        const has = [form.cover_image_url, logoUrl].filter(Boolean).length;
        return has >= 2 ? "complete" : has > 0 ? "partial" : "empty";
      }
      case "media": return editingId ? "complete" : "empty";
      case "editions": return editingId && selectedSeriesId ? "complete" : "empty";
      case "team": return editingId ? "complete" : "empty";
      case "notes": return adminNotes ? "partial" : "empty";
      default: return "empty";
    }
  }, [form, organizer, editingId, logoUrl, adminNotes, selectedSeriesId]);

  const completeness = (() => {
    let filled = 0;
    const total = 10;
    if (form.title) filled++;
    if (form.title_ar) filled++;
    if (form.description) filled++;
    if (form.start_date) filled++;
    if (form.end_date) filled++;
    if (form.venue || form.is_virtual) filled++;
    if (form.city || form.is_virtual) filled++;
    if (form.organizer_name || organizer) filled++;
    if (form.cover_image_url) filled++;
    if (form.type) filled++;
    return Math.round((filled / total) * 100);
  })();

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            setActiveSection(entry.target.getAttribute("data-section") || "basic");
          }
        }
      },
      { root: container, threshold: 0.3 }
    );
    Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = form.slug || form.title?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        social_links: Object.fromEntries(Object.entries(socialLinks).filter(([, v]) => v && v.trim().length > 0)),
        created_by: user?.id,
        series_id: selectedSeriesId || null,
        edition_year: editionYear || null,
        edition_number: editionNumber || null,
        venue_id: selectedVenue?.id || null,
        logo_url: logoUrl || null,
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
      setLastSaved(new Date());
      toast({ title: editingId ? t("Exhibition updated", "تم تحديث الفعالية") : t("Exhibition created", "تم إنشاء الفعالية") });
      if (result.isNew && (includesCompetitions || includesTraining || includesSeminars)) {
        onClose();
        navigate(`/exhibitions/${result.slug}`);
      } else if (result.isNew) {
        setActiveEditingId(result.id);
        setEditionResolved(true);
        setEditionConfirmed(true);
      }
    },
    onError: (err: Error) => {
      toast({ title: t("Error", "خطأ"), description: err.message, variant: "destructive" });
    },
  });

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (form.title && form.start_date && form.end_date && !editionFieldsDisabled) {
          saveMutation.mutate();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [form.title, form.start_date, form.end_date, editionFieldsDisabled]);

  // Computed display helpers
  const currentStatus = statusOptions.find(s => s.value === form.status);
  const currentType = typeOptions.find(tp => tp.value === form.type);
  const filledSocialLinks = Object.values(socialLinks).filter(v => v?.trim()).length;
  const daysUntilStart = form.start_date ? Math.ceil((new Date(form.start_date).getTime() - Date.now()) / MS_PER_DAY) : null;

  return {
    // language
    isAr, t,
    // ids
    editingId, originalEditingId,
    // form
    form, setForm, updateField,
    // organizer
    organizer, setOrganizer,
    // extra state
    currency, setCurrency,
    includesCompetitions, setIncludesCompetitions,
    includesTraining, setIncludesTraining,
    includesSeminars, setIncludesSeminars,
    tagsInput, setTagsInput,
    audienceInput, setAudienceInput,
    socialLinks, setSocialLinks,
    selectedSeriesId, setSelectedSeriesId,
    editionYear, setEditionYear,
    editionNumber, setEditionNumber,
    editionConfirmed, setEditionConfirmed,
    editionResolved, setEditionResolved,
    selectedVenue, setSelectedVenue,
    activeSection, setActiveSection,
    lastSaved, logoUrl, setLogoUrl,
    adminNotes, setAdminNotes,
    // queries
    countries, seriesList, existingEdition, editionLoading, previousEditions,
    // derived
    editionHasData, formLocked, editionFieldsDisabled,
    completeness, currentStatus, currentType,
    filledSocialLinks, daysUntilStart,
    // refs
    sectionRefs, scrollContainerRef,
    // actions
    scrollToSection, getSectionStatus, saveMutation,
  };
}
