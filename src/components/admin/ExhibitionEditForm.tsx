import { useState, useCallback, useRef, useEffect, memo, type ReactNode } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCountries } from "@/hooks/useCountries";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityFormGuard } from "@/components/admin/EntityFormGuard";
import { AITextOptimizer } from "@/components/admin/AITextOptimizer";
import { OrganizerSearchSelector, type OrganizerValue } from "@/components/admin/OrganizerSearchSelector";
import { VenueSearchSelector, type VenueValue } from "@/components/admin/VenueSearchSelector";
import { ExhibitionMediaLibrary } from "@/components/admin/ExhibitionMediaLibrary";
import { ExhibitionSocialLinksEditor } from "@/components/admin/ExhibitionSocialLinksEditor";
import { ExhibitionOfficialsPanel } from "@/components/admin/ExhibitionOfficialsPanel";
import { ExhibitionDocumentsPanel } from "@/components/admin/ExhibitionDocumentsPanel";
import { ExhibitionSponsorsPanel } from "@/components/admin/ExhibitionSponsorsPanel";
import { ExhibitionCompetitionsPanel } from "@/components/admin/ExhibitionCompetitionsPanel";
import {
  Landmark, Calendar, MapPin, Building, Ticket, Tag, Globe, Save, X,
  Loader2, Trophy, GraduationCap, Mic, Image, Users, FileText, Layers,
  ChevronLeft, CheckCircle2, Info, Link as LinkIcon, Eye, CircleDot, Award,
  Clock, Star, Sparkles, ExternalLink, Hash, AlertTriangle, ArrowUpRight,
  ImageIcon, History, Activity, Camera, Upload, Palette, StickyNote,
  BarChart3, Copy, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type ExhibitionStatus = Database["public"]["Enums"]["exhibition_status"];
type ExhibitionType = Database["public"]["Enums"]["exhibition_type"];
type ExhibitionInsert = Database["public"]["Tables"]["exhibitions"]["Insert"];

const statusOptions: { value: ExhibitionStatus; en: string; ar: string; color: string }[] = [
  { value: "pending", en: "Pending Approval", ar: "بانتظار الموافقة", color: "bg-amber-500" },
  { value: "draft", en: "Draft", ar: "مسودة", color: "bg-muted-foreground" },
  { value: "upcoming", en: "Upcoming", ar: "قادمة", color: "bg-blue-500" },
  { value: "active", en: "Active", ar: "نشطة", color: "bg-chart-2" },
  { value: "completed", en: "Completed", ar: "مكتملة", color: "bg-primary" },
  { value: "cancelled", en: "Cancelled", ar: "ملغاة", color: "bg-destructive" },
];

const typeOptions: { value: ExhibitionType; en: string; ar: string; icon: any }[] = [
  { value: "exhibition", en: "Exhibition", ar: "معرض", icon: Landmark },
  { value: "conference", en: "Conference", ar: "مؤتمر", icon: Mic },
  { value: "summit", en: "Summit", ar: "قمة", icon: Star },
  { value: "workshop", en: "Workshop", ar: "ورشة عمل", icon: GraduationCap },
  { value: "food_festival", en: "Food Festival", ar: "مهرجان طعام", icon: Sparkles },
  { value: "trade_show", en: "Trade Show", ar: "معرض تجاري", icon: Building },
  { value: "competition_event", en: "Competition Event", ar: "حدث تنافسي", icon: Trophy },
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

interface SectionDef {
  id: string;
  icon: any;
  en: string;
  ar: string;
  descEn: string;
  descAr: string;
  fields: string[];
}

const SECTIONS: SectionDef[] = [
  { id: "basic", icon: Landmark, en: "Basic Info", ar: "المعلومات الأساسية", descEn: "Title, description & series", descAr: "العنوان والوصف والسلسلة", fields: ["title", "title_ar", "description", "type"] },
  { id: "images", icon: Camera, en: "Images", ar: "الصور", descEn: "Cover, logo & display image", descAr: "الغلاف والشعار وصورة العرض", fields: ["cover_image_url"] },
  { id: "datetime", icon: Calendar, en: "Date & Schedule", ar: "التاريخ والجدول", descEn: "Timing & event content", descAr: "التوقيت ومحتوى الفعالية", fields: ["start_date", "end_date"] },
  { id: "location", icon: MapPin, en: "Location", ar: "الموقع", descEn: "Venue & address", descAr: "المقر والعنوان", fields: ["venue", "city", "country"] },
  { id: "organizer", icon: Building, en: "Organizer", ar: "الجهة المنظمة", descEn: "Organizer details", descAr: "بيانات المنظم", fields: ["organizer_name"] },
  { id: "tickets", icon: Ticket, en: "Tickets & Pricing", ar: "التذاكر والأسعار", descEn: "Entry & capacity", descAr: "الدخول والسعة", fields: ["is_free"] },
  { id: "links", icon: LinkIcon, en: "Links & Social", ar: "الروابط والتواصل", descEn: "URLs & social media", descAr: "الروابط ووسائل التواصل", fields: ["registration_url", "website_url"] },
  { id: "sponsors", icon: Award, en: "Sponsors & Partners", ar: "الرعاة والشركاء", descEn: "Manage sponsors", descAr: "إدارة الرعاة", fields: [] },
  { id: "competitions", icon: Trophy, en: "Competitions", ar: "المسابقات", descEn: "Linked competitions", descAr: "المسابقات المرتبطة", fields: [] },
  { id: "media", icon: FileText, en: "Media Library", ar: "مكتبة الوسائط", descEn: "Files & documents", descAr: "الملفات والمستندات", fields: [] },
  { id: "editions", icon: History, en: "Previous Editions", ar: "النسخ السابقة", descEn: "Edition history", descAr: "تاريخ النسخ", fields: [] },
  { id: "team", icon: Users, en: "Team & Officials", ar: "الفريق والمسؤولون", descEn: "Staff & officials", descAr: "الطاقم والمسؤولون", fields: [] },
  { id: "notes", icon: StickyNote, en: "Notes & Activity", ar: "الملاحظات والنشاط", descEn: "Internal notes & log", descAr: "ملاحظات داخلية وسجل", fields: [] },
];

interface ExhibitionEditFormProps {
  exhibition?: any;
  onClose: () => void;
}

export const ExhibitionEditForm = memo(function ExhibitionEditForm({ exhibition, onClose }: ExhibitionEditFormProps) {
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
      const { data } = await (supabase as any).from("event_series").select("id, name, name_ar, series_type, default_venue, default_venue_ar, default_city, default_country, default_organizer_name, default_organizer_name_ar, default_organizer_email, cover_image_url, tags, website_url").eq("is_active", true).order("name");
      return data as any[] || [];
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
  const [editionNumber, setEditionNumber] = useState<number | null>((exhibition as any)?.edition_number || null);
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

  const updateField = useCallback((key: string, value: any) => setForm(prev => ({ ...prev, [key]: value })), []);

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
  }, [form, organizer, editingId]);

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = form.slug || form.title?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "";
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

  // Computed display helpers
  const currentStatus = statusOptions.find(s => s.value === form.status);
  const currentType = typeOptions.find(tp => tp.value === form.type);
  const filledSocialLinks = Object.values(socialLinks).filter(v => v?.trim()).length;
  const daysUntilStart = form.start_date ? Math.ceil((new Date(form.start_date).getTime() - Date.now()) / 86400000) : null;

  return (
    <TooltipProvider>
    <div className="flex flex-col h-[calc(100vh-8rem)] rounded-2xl border border-border/60 bg-card overflow-hidden shadow-[var(--shadow-md)]">
      {/* ═══ Top Bar ═══ */}
      <div className="flex items-center justify-between gap-3 border-b bg-gradient-to-r from-card to-muted/20 px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-xl" onClick={onClose}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t("Back to list", "العودة للقائمة")}</TooltipContent>
          </Tooltip>

          {/* Cover thumbnail */}
          {form.cover_image_url && (
            <div className="hidden sm:block h-9 w-14 rounded-lg overflow-hidden border border-border/40 shrink-0">
              <img src={form.cover_image_url} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold truncate">
                {editingId ? (form.title || t("Edit Exhibition", "تعديل الفعالية")) : t("New Exhibition", "فعالية جديدة")}
              </h2>
              {editionYear && (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0 font-mono">{editionYear}</Badge>
              )}
              {form.is_featured && (
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {currentType && (
                <span className="flex items-center gap-1">
                  <currentType.icon className="h-2.5 w-2.5" />
                  {isAr ? currentType.ar : currentType.en}
                </span>
              )}
              {form.city && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" />
                    {form.city}
                  </span>
                </>
              )}
              {lastSaved && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {t("Saved", "محفوظ")} {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Completeness ring */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-muted/50 px-2.5 py-1.5 cursor-default">
                <div className="relative h-5 w-5">
                  <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="8" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
                    <circle cx="10" cy="10" r="8" fill="none" stroke={completeness === 100 ? "hsl(var(--chart-2))" : "hsl(var(--primary))"} strokeWidth="2.5" strokeDasharray={`${completeness * 0.5} 100`} strokeLinecap="round" className="transition-all duration-500" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold tabular-nums">{completeness}%</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>{t("Form completeness", "اكتمال النموذج")}</TooltipContent>
          </Tooltip>

          {/* Countdown badge */}
          {daysUntilStart !== null && daysUntilStart > 0 && daysUntilStart <= 90 && (
            <Badge variant="outline" className="hidden lg:flex text-[10px] h-6 gap-1 font-medium">
              <Clock className="h-3 w-3" />
              {daysUntilStart} {t("days", "يوم")}
            </Badge>
          )}

          {/* Status selector */}
          <Select value={form.status || "draft"} onValueChange={v => updateField("status", v)}>
            <SelectTrigger className="h-8 w-[130px] text-xs gap-1.5">
              <span className={cn("h-2 w-2 rounded-full shrink-0", currentStatus?.color || "bg-muted-foreground")} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", opt.color)} />
                    {isAr ? opt.ar : opt.en}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6" />

          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>
            <X className="me-1 h-3 w-3" />
            {t("Cancel", "إلغاء")}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !form.title || !form.start_date || !form.end_date || editionFieldsDisabled}
              >
                {saveMutation.isPending ? <Loader2 className="me-1 h-3 w-3 animate-spin" /> : <Save className="me-1 h-3 w-3" />}
                {editingId ? t("Save", "حفظ") : t("Create", "إنشاء")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>⌘S</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* ═══ Body: Sidebar + Content ═══ */}
      <div className="flex flex-1 min-h-0">
        {/* ── Sidebar Navigation ── */}
        <nav className="hidden md:flex w-56 shrink-0 flex-col border-e bg-muted/10">
          {/* Cover image preview in sidebar */}
          {form.cover_image_url && (
            <div className="relative h-28 w-full overflow-hidden border-b">
              <img src={form.cover_image_url} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 start-2.5 end-2.5">
                <p className="text-[10px] text-white/90 font-medium truncate">{form.title || t("Untitled", "بدون عنوان")}</p>
                {editionYear && <p className="text-[9px] text-white/70">{t("Edition", "النسخة")} {editionYear}</p>}
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 py-2 px-2">
            {SECTIONS.map((sec) => {
              const status = getSectionStatus(sec.id);
              const isActive = activeSection === sec.id;
              const dotColor = status === "complete" ? "bg-chart-2" : status === "partial" ? "bg-chart-4" : "bg-muted-foreground/20";
              return (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-start transition-all duration-200 mb-0.5 group/nav",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-lg shrink-0 transition-colors",
                    isActive ? "bg-primary/15" : "bg-muted/40 group-hover/nav:bg-muted/60"
                  )}>
                    <sec.icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium block truncate">{isAr ? sec.ar : sec.en}</span>
                    <span className={cn("text-[9px] block truncate transition-colors", isActive ? "text-primary/60" : "text-muted-foreground/50")}>{isAr ? sec.descAr : sec.descEn}</span>
                  </div>
                  <span className={cn("h-2 w-2 rounded-full shrink-0 transition-colors", dotColor)} />
                </button>
              );
            })}
          </ScrollArea>

          {/* Sidebar footer */}
          <div className="px-3 py-2 border-t space-y-1.5">
            {editingId && exhibition?.slug && (
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs gap-2 h-8" asChild>
                <a href={`/exhibitions/${exhibition.slug}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-3.5 w-3.5" />
                  {t("Preview", "معاينة")}
                  <ExternalLink className="h-2.5 w-2.5 ms-auto text-muted-foreground" />
                </a>
              </Button>
            )}
            <div className="text-[9px] text-muted-foreground/50 text-center">
              ⌘S {t("to save", "للحفظ")}
            </div>
          </div>
        </nav>

        {/* ── Scrollable Content ── */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scroll-smooth bg-muted/5">
          <div className="max-w-3xl mx-auto py-5 px-4 sm:px-6 space-y-1">

            <EntityFormGuard
              entity={{ name: (form.title as string) || "", name_ar: (form.title_ar as string) || "", website: (form.website_url as string) || "", city: (form.city as string) || "", country: (form.country as string) || "" }}
              tables={["exhibitions", "organizers", "companies"]}
              excludeId={editingId || undefined}
              translationFields={[
                { en: (form.title as string) || null, ar: (form.title_ar as string) || null, key: "title" },
                { en: (form.description as string) || null, ar: (form.description_ar as string) || null, key: "description" },
              ]}
              translationContext="exhibition / food event / trade show"
              onTranslated={(u) => setForm(f => ({ ...f, ...u }))}
            />

            {/* ═══ Section: Basic Info ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { sectionRefs.current["basic"] = el; }}
              data-section="basic"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={Landmark} title={t("Basic Info", "المعلومات الأساسية")} desc={t("Title, description, series & edition", "العنوان والوصف والسلسلة والنسخة")} status={getSectionStatus("basic")} />

              {/* Series & Edition */}
              <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-primary/[0.02] to-transparent p-4 space-y-3">
                <p className="text-[11px] font-semibold text-primary/80 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  {t("Event Series & Edition", "سلسلة الفعالية والإصدار")}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label className="text-xs">{t("Event Series", "سلسلة الفعاليات")}</Label>
                    <Select value={selectedSeriesId || "none"} onValueChange={v => {
                      const sid = v === "none" ? null : v;
                      setSelectedSeriesId(sid);
                      if (sid && !editingId) {
                        const series = seriesList?.find(s => s.id === sid);
                        if (series) {
                          if (series.default_venue) updateField("venue", series.default_venue);
                          if (series.default_venue_ar) updateField("venue_ar", series.default_venue_ar);
                          if (series.default_city) updateField("city", series.default_city);
                          if (series.default_country) updateField("country", series.default_country);
                          if (series.default_organizer_name) updateField("organizer_name", series.default_organizer_name);
                          if (series.default_organizer_name_ar) updateField("organizer_name_ar", series.default_organizer_name_ar);
                          if (series.default_organizer_email) updateField("organizer_email", series.default_organizer_email);
                          if (series.cover_image_url) updateField("cover_image_url", series.cover_image_url);
                          if (series.tags) setTagsInput(series.tags.join(", "));
                        }
                      }
                    }}>
                      <SelectTrigger className="h-9"><SelectValue placeholder={t("No series", "بدون سلسلة")} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("No series (standalone)", "بدون سلسلة (مستقل)")}</SelectItem>
                        {seriesList?.map(s => (
                          <SelectItem key={s.id} value={s.id}>{isAr && s.name_ar ? s.name_ar : s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">{t("Edition Year", "سنة الإصدار")}</Label>
                    <Select value={editionYear ? String(editionYear) : "none"} onValueChange={v => {
                      const yr = v === "none" ? null : parseInt(v);
                      setEditionYear(yr);
                    }}>
                      <SelectTrigger className={cn("h-9 transition-all", editionHasData && "border-chart-2/60 bg-chart-2/5 text-chart-2 ring-1 ring-chart-2/20")}><SelectValue placeholder={t("Select year", "اختر السنة")} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("Not set", "غير محدد")}</SelectItem>
                        {(() => {
                          const currentYear = new Date().getFullYear();
                          const years: number[] = [];
                          for (let y = currentYear + 5; y >= currentYear - 20; y--) years.push(y);
                          return years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>);
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">{t("Edition Number", "رقم الإصدار")}</Label>
                    <Select disabled={editionFieldsDisabled} value={editionNumber ? String(editionNumber) : "none"} onValueChange={v => setEditionNumber(v === "none" ? null : parseInt(v))}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={t("Select edition", "اختر الإصدار")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("Not set", "غير محدد")}</SelectItem>
                        {Array.from({ length: 50 }, (_, i) => i + 1).map(n => {
                          const ordinalEn = n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;
                          const ordinalAr = ["الأولى","الثانية","الثالثة","الرابعة","الخامسة","السادسة","السابعة","الثامنة","التاسعة","العاشرة",
                            "الحادية عشرة","الثانية عشرة","الثالثة عشرة","الرابعة عشرة","الخامسة عشرة","السادسة عشرة","السابعة عشرة","الثامنة عشرة","التاسعة عشرة","العشرون",
                            "الحادية والعشرون","الثانية والعشرون","الثالثة والعشرون","الرابعة والعشرون","الخامسة والعشرون","السادسة والعشرون","السابعة والعشرون","الثامنة والعشرون","التاسعة والعشرون","الثلاثون",
                            "الحادية والثلاثون","الثانية والثلاثون","الثالثة والثلاثون","الرابعة والثلاثون","الخامسة والثلاثون","السادسة والثلاثون","السابعة والثلاثون","الثامنة والثلاثون","التاسعة والثلاثون","الأربعون",
                            "الحادية والأربعون","الثانية والأربعون","الثالثة والأربعون","الرابعة والأربعون","الخامسة والأربعون","السادسة والأربعون","السابعة والأربعون","الثامنة والأربعون","التاسعة والأربعون","الخمسون"
                          ][n - 1] || `${n}`;
                          return (
                            <SelectItem key={n} value={String(n)}>
                              {isAr ? `النسخة ${ordinalAr}` : `${ordinalEn} Edition`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Edition status feedback */}
                {selectedSeriesId && editionYear && (
                  <div className="mt-2">
                    {editionLoading ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {t("Checking edition...", "جارِ التحقق من النسخة...")}
                      </div>
                    ) : existingEdition ? (
                      <div className="flex items-center gap-3 rounded-xl border border-chart-2/20 bg-chart-2/5 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-2/10 shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-chart-2" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-chart-2">
                            {t("Edition loaded", "تم تحميل النسخة")}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {isAr && existingEdition.title_ar ? existingEdition.title_ar : existingEdition.title}
                            {" · "}{t("Edition", "النسخة")} #{existingEdition.edition_number || "?"}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] h-5">{existingEdition.status}</Badge>
                      </div>
                    ) : !editionConfirmed ? (
                      <div className="flex items-center gap-3 rounded-xl border border-chart-4/20 bg-chart-4/5 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-4/10 shrink-0">
                          <AlertTriangle className="h-4 w-4 text-chart-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-chart-4">{t("New edition", "نسخة جديدة")}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {t("No data found for", "لم يتم العثور على بيانات لعام")} {editionYear}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="h-7 text-[11px] px-3 gap-1.5"
                          onClick={() => { setEditionResolved(true); setEditionConfirmed(true); }}
                        >
                          <Sparkles className="h-3 w-3" />
                          {t(`Add ${editionYear} Edition`, `إضافة نسخة ${editionYear}`)}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-chart-2">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("New edition confirmed", "تم تأكيد النسخة الجديدة")}
                        <Badge variant="outline" className="text-[10px] h-5 ms-auto">{editionYear}</Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Lock overlay */}
              {formLocked && (
                <div className="rounded-xl border border-chart-4/20 bg-chart-4/5 p-5 text-center space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-4/10 mx-auto">
                    <Layers className="h-5 w-5 text-chart-4" />
                  </div>
                  <p className="text-sm font-semibold">{t("Select an edition year to continue", "اختر سنة الإصدار للمتابعة")}</p>
                  <p className="text-xs text-muted-foreground">{t("Choose a year above to load or create an edition", "اختر سنة أعلاه لتحميل أو إنشاء نسخة")}</p>
                </div>
              )}

              {/* Title */}
              <div className={cn("grid gap-4 sm:grid-cols-2", formLocked && "opacity-40 pointer-events-none")}>
                <FieldGroup label={t("Title (English)", "العنوان (إنجليزي)")} required aiSlot={<AITextOptimizer text={form.title || ""} lang="en" onOptimized={v => updateField("title", v)} onTranslated={v => updateField("title_ar", v)} />}>
                  <Input className="h-9" value={form.title || ""} onChange={e => updateField("title", e.target.value)} placeholder={t("Exhibition title", "عنوان المعرض")} />
                </FieldGroup>
                <FieldGroup label={t("Title (Arabic)", "العنوان (عربي)")} aiSlot={<AITextOptimizer text={form.title_ar || ""} lang="ar" onOptimized={v => updateField("title_ar", v)} onTranslated={v => updateField("title", v)} />}>
                  <Input className="h-9" value={form.title_ar || ""} onChange={e => updateField("title_ar", e.target.value)} dir="rtl" />
                </FieldGroup>
              </div>

              <div className={cn(formLocked && "opacity-40 pointer-events-none", "space-y-4")}>
                {/* Slug */}
                <FieldGroup label={t("URL Slug", "الرابط المختصر")} hint={form.slug ? `/${form.slug}` : undefined}>
                  <Input className="h-9 font-mono text-xs max-w-md" value={form.slug || ""} onChange={e => updateField("slug", e.target.value)} placeholder="auto-generated-from-title" startIcon={<Hash className="h-3 w-3" />} />
                </FieldGroup>

                {/* Descriptions */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldGroup label={t("Description (EN)", "الوصف (إنجليزي)")} aiSlot={<AITextOptimizer text={form.description || ""} lang="en" onOptimized={v => updateField("description", v)} onTranslated={v => updateField("description_ar", v)} />}>
                    <Textarea className="min-h-[100px] text-sm" value={form.description || ""} onChange={e => updateField("description", e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label={t("Description (AR)", "الوصف (عربي)")} aiSlot={<AITextOptimizer text={form.description_ar || ""} lang="ar" onOptimized={v => updateField("description_ar", v)} onTranslated={v => updateField("description", v)} />}>
                    <Textarea className="min-h-[100px] text-sm" value={form.description_ar || ""} onChange={e => updateField("description_ar", e.target.value)} dir="rtl" />
                  </FieldGroup>
                </div>

                {/* Tags & Audience */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldGroup label={t("Tags", "الوسوم")} hint={t("Comma-separated", "مفصولة بفاصلة")}>
                    <Input className="h-9" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="food, beverages" startIcon={<Tag className="h-3 w-3" />} />
                  </FieldGroup>
                  <FieldGroup label={t("Target Audience", "الجمهور المستهدف")} hint={t("Comma-separated", "مفصولة بفاصلة")}>
                    <Input className="h-9" value={audienceInput} onChange={e => setAudienceInput(e.target.value)} placeholder="Chefs, Owners" startIcon={<Users className="h-3 w-3" />} />
                  </FieldGroup>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Switch checked={form.is_featured || false} onCheckedChange={v => updateField("is_featured", v)} />
                  <Label className="text-xs flex items-center gap-1.5">
                    <Star className="h-3 w-3 text-amber-500" />
                    {t("Featured Event", "فعالية مميزة")}
                  </Label>
                </div>
              </div>
            </section>

            <div className={cn(formLocked && "opacity-40 pointer-events-none select-none", "space-y-1")}>

            {/* ═══ Section: Date & Schedule ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { sectionRefs.current["datetime"] = el; }}
              data-section="datetime"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={Calendar} title={t("Date & Schedule", "التاريخ والجدول")} desc={t("Event timing, type & content categories", "التوقيت ونوع الفعالية وفئات المحتوى")} status={getSectionStatus("datetime")} />

              <div className="grid gap-4 sm:grid-cols-3">
                <FieldGroup label={t("Type", "النوع")}>
                  <Select value={form.type || "exhibition"} onValueChange={v => updateField("type", v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {typeOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            <opt.icon className="h-3 w-3 text-muted-foreground" />
                            {isAr ? opt.ar : opt.en}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
                <FieldGroup label={t("Currency", "العملة")}>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {countries?.filter(c => c.currency_code).map(c => (
                        <SelectItem key={c.code} value={c.currency_code!}>{c.currency_code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FieldGroup label={t("Start Date", "تاريخ البدء")} required>
                  <Input className="h-9" type="datetime-local" value={form.start_date || ""} onChange={e => updateField("start_date", e.target.value)} />
                </FieldGroup>
                <FieldGroup label={t("End Date", "تاريخ الانتهاء")} required>
                  <Input className="h-9" type="datetime-local" value={form.end_date || ""} onChange={e => updateField("end_date", e.target.value)} />
                </FieldGroup>
                <FieldGroup label={t("Registration Deadline", "آخر موعد للتسجيل")}>
                  <Input className="h-9" type="datetime-local" value={(form as any).registration_deadline || ""} onChange={e => updateField("registration_deadline", e.target.value)} />
                </FieldGroup>
              </div>

              {/* Duration display */}
              {form.start_date && form.end_date && (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground rounded-lg bg-muted/30 px-3 py-1.5 w-fit">
                  <Clock className="h-3 w-3" />
                  {(() => {
                    const days = Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000);
                    return days > 0 ? `${days} ${t("day(s)", "يوم")}` : t("Same day", "نفس اليوم");
                  })()}
                </div>
              )}

              {/* Event Content Types */}
              <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
                <p className="text-[11px] font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  {t("Event Content", "محتوى الفعالية")}
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { checked: includesCompetitions, onChange: setIncludesCompetitions, icon: Trophy, color: "text-chart-4", label: t("Competitions", "مسابقات") },
                    { checked: includesTraining, onChange: setIncludesTraining, icon: GraduationCap, color: "text-chart-2", label: t("Training / Workshops", "تدريب / ورش عمل") },
                    { checked: includesSeminars, onChange: setIncludesSeminars, icon: Mic, color: "text-chart-1", label: t("Seminars / Talks", "ندوات / محاضرات") },
                  ].map((item, i) => (
                    <label key={i} className={cn("flex items-center gap-2.5 cursor-pointer rounded-xl border px-3 py-2 transition-all", item.checked ? "border-primary/20 bg-primary/5" : "border-transparent hover:bg-muted/40")}>
                      <Checkbox checked={item.checked} onCheckedChange={(v) => item.onChange(!!v)} />
                      <item.icon className={cn("h-4 w-4", item.color)} />
                      <span className="text-xs font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            {/* ═══ Section: Location ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { sectionRefs.current["location"] = el; }}
              data-section="location"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={MapPin} title={t("Location & Venue", "الموقع والمقر")} desc={t("Physical or virtual event location", "موقع الحدث الفعلي أو الافتراضي")} status={getSectionStatus("location")} />

              <div className="flex items-center gap-3 rounded-xl bg-muted/20 px-3 py-2">
                <Switch checked={form.is_virtual || false} onCheckedChange={v => updateField("is_virtual", v)} />
                <Label className="flex items-center gap-1.5 text-xs font-medium">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  {t("Virtual Event", "حدث افتراضي")}
                </Label>
              </div>

              {form.is_virtual ? (
                <FieldGroup label={t("Virtual Event Link", "رابط الحدث الافتراضي")}>
                  <Input className="h-9 max-w-md" value={form.virtual_link || ""} onChange={e => updateField("virtual_link", e.target.value)} placeholder="https://zoom.us/..." startIcon={<LinkIcon className="h-3 w-3" />} />
                </FieldGroup>
              ) : (
                <>
                  {(() => {
                    const currentYear = new Date().getFullYear();
                    const canAssignVenue = !editionYear || (editionYear >= currentYear && editionYear <= currentYear + 1);
                    return (
                      <div className={cn(!canAssignVenue && "opacity-50 pointer-events-none")}>
                        <VenueSearchSelector
                          value={selectedVenue}
                          onChange={setSelectedVenue}
                          onVenueSelected={(v) => {
                            updateField("venue", v.name);
                            updateField("venue_ar", v.nameAr || "");
                            if (v.city) updateField("city", v.city);
                            if (v.country) updateField("country", v.country);
                            if (v.mapUrl) updateField("map_url", v.mapUrl);
                          }}
                          isAr={isAr}
                          disabled={!canAssignVenue}
                        />
                        {!canAssignVenue && (
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            {t("Venue can only be assigned for current or next year", "يمكن تعيين المقر فقط للسنة الحالية أو القادمة")}
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  <div className="rounded-xl border border-border/30 bg-muted/10 p-4 space-y-3 mt-2">
                    <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      {t("Location Details", "تفاصيل الموقع")}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FieldGroup label={t("Venue (EN)", "المكان (EN)")} aiSlot={<AITextOptimizer text={form.venue || ""} lang="en" onTranslated={v => updateField("venue_ar", v)} compact />}>
                        <Input className="h-9" value={form.venue || ""} onChange={e => updateField("venue", e.target.value)} />
                      </FieldGroup>
                      <FieldGroup label={t("Venue (AR)", "المكان (AR)")} aiSlot={<AITextOptimizer text={form.venue_ar || ""} lang="ar" onTranslated={v => updateField("venue", v)} compact />}>
                        <Input className="h-9" value={form.venue_ar || ""} onChange={e => updateField("venue_ar", e.target.value)} dir="rtl" />
                      </FieldGroup>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FieldGroup label={t("City", "المدينة")}>
                        <Input className="h-9" value={form.city || ""} onChange={e => updateField("city", e.target.value)} />
                      </FieldGroup>
                      <FieldGroup label={t("Country", "الدولة")}>
                        <Input className="h-9" value={form.country || ""} onChange={e => updateField("country", e.target.value)} />
                      </FieldGroup>
                    </div>
                    <FieldGroup label={t("Map URL", "رابط الخريطة")}>
                      <Input className="h-9" value={form.map_url || ""} onChange={e => updateField("map_url", e.target.value)} placeholder="https://maps.google.com/..." startIcon={<MapPin className="h-3 w-3" />} />
                    </FieldGroup>
                    {form.map_url && (
                      <a href={form.map_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                        <ArrowUpRight className="h-3 w-3" />
                        {t("View on Map", "عرض على الخريطة")}
                      </a>
                    )}
                  </div>
                </>
              )}
            </section>

            {/* ═══ Section: Organizer ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { sectionRefs.current["organizer"] = el; }}
              data-section="organizer"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={Building} title={t("Organizer", "الجهة المنظمة")} desc={t("Managing organization details", "بيانات الجهة المنظمة")} status={getSectionStatus("organizer")} />

              <OrganizerSearchSelector
                value={organizer}
                onChange={(val) => {
                  setOrganizer(val);
                  if (val) {
                    updateField("organizer_name", val.name);
                    updateField("organizer_name_ar", val.nameAr);
                    updateField("organizer_email", val.email || "");
                    updateField("organizer_phone", val.phone || "");
                    updateField("organizer_website", val.website || "");
                    if (val.country) {
                      const c = countries?.find(co => co.code === val.country || co.name === val.country);
                      if (c?.currency_code) setCurrency(c.currency_code);
                    }
                  } else {
                    updateField("organizer_name", "");
                    updateField("organizer_name_ar", "");
                    updateField("organizer_email", "");
                    updateField("organizer_phone", "");
                    updateField("organizer_website", "");
                  }
                }}
                label={t("Search & Select Organizer", "البحث واختيار الجهة المنظمة")}
              />

              {/* Organizer details card */}
              <div className="rounded-xl border border-border/30 bg-muted/10 p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldGroup label={t("Organizer Name (EN)", "اسم المنظم (EN)")}>
                    <Input className="h-9" value={form.organizer_name || ""} onChange={e => updateField("organizer_name", e.target.value)} placeholder={t("Organizer name", "اسم الجهة المنظمة")} />
                  </FieldGroup>
                  <FieldGroup label={t("Organizer Name (AR)", "اسم المنظم (AR)")}>
                    <Input className="h-9" value={form.organizer_name_ar || ""} onChange={e => updateField("organizer_name_ar", e.target.value)} dir="rtl" />
                  </FieldGroup>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <FieldGroup label={t("Email", "البريد الإلكتروني")}>
                    <Input className="h-9" type="email" value={form.organizer_email || ""} onChange={e => updateField("organizer_email", e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label={t("Phone", "رقم الهاتف")}>
                    <Input className="h-9" value={form.organizer_phone || ""} onChange={e => updateField("organizer_phone", e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label={t("Website", "الموقع الإلكتروني")}>
                    <Input className="h-9" value={form.organizer_website || ""} onChange={e => updateField("organizer_website", e.target.value)} placeholder="https://..." />
                  </FieldGroup>
                </div>
              </div>
            </section>

            {/* ═══ Section: Tickets ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { sectionRefs.current["tickets"] = el; }}
              data-section="tickets"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={Ticket} title={t("Tickets & Pricing", "التذاكر والأسعار")} desc={t("Entry pricing & capacity limits", "تسعير الدخول وحدود السعة")} status={getSectionStatus("tickets")} />

              <div className="flex items-center gap-3 rounded-xl bg-muted/20 px-3 py-2">
                <Switch checked={form.is_free || false} onCheckedChange={v => updateField("is_free", v)} />
                <Label className="text-xs font-medium">{t("Free Entry", "دخول مجاني")}</Label>
                {form.is_free && <Badge variant="outline" className="text-[10px] h-5 bg-chart-2/5 text-chart-2 border-chart-2/20">{t("Free", "مجاني")}</Badge>}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {!form.is_free && (
                  <>
                    <FieldGroup label={t("Ticket Price (EN)", "سعر التذكرة (إنجليزي)")}>
                      <Input className="h-9" value={form.ticket_price || ""} onChange={e => updateField("ticket_price", e.target.value)} placeholder={`${currency} 50`} />
                    </FieldGroup>
                    <FieldGroup label={t("Ticket Price (AR)", "سعر التذكرة (عربي)")}>
                      <Input className="h-9" value={form.ticket_price_ar || ""} onChange={e => updateField("ticket_price_ar", e.target.value)} dir="rtl" />
                    </FieldGroup>
                  </>
                )}
                <FieldGroup label={t("Max Attendees", "الحد الأقصى للحضور")}>
                  <Input className="h-9" type="number" value={form.max_attendees || ""} onChange={e => updateField("max_attendees", parseInt(e.target.value) || undefined)} startIcon={<Users className="h-3 w-3" />} />
                </FieldGroup>
              </div>
            </section>

            {/* ═══ Section: Links ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { sectionRefs.current["links"] = el; }}
              data-section="links"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader
                icon={LinkIcon}
                title={t("Links & Social Media", "الروابط والتواصل الاجتماعي")}
                desc={t("Registration, website & social profiles", "التسجيل والموقع وحسابات التواصل")}
                status={getSectionStatus("links")}
                badge={filledSocialLinks > 0 ? `${filledSocialLinks} ${t("links", "روابط")}` : undefined}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup label={t("Registration URL", "رابط التسجيل")}>
                  <Input className="h-9" value={form.registration_url || ""} onChange={e => updateField("registration_url", e.target.value)} placeholder="https://..." startIcon={<ExternalLink className="h-3 w-3" />} />
                </FieldGroup>
                <FieldGroup label={t("Website URL", "رابط الموقع")}>
                  <Input className="h-9" value={form.website_url || ""} onChange={e => updateField("website_url", e.target.value)} placeholder="https://..." startIcon={<Globe className="h-3 w-3" />} />
                </FieldGroup>
              </div>

              <Separator />

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Globe className="h-3 w-3" />
                  {t("Social Media & Contact Links", "روابط التواصل الاجتماعي والاتصال")}
                </p>
                <ExhibitionSocialLinksEditor value={socialLinks} onChange={setSocialLinks} isAr={isAr} />
              </div>
            </section>

            {/* ═══ Section: Sponsors & Partners ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { sectionRefs.current["sponsors"] = el; }}
              data-section="sponsors"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={Award} title={t("Sponsors & Partners", "الرعاة والشركاء")} desc={t("Manage event sponsors & partners", "إدارة رعاة وشركاء الفعالية")} status={editingId ? "complete" : "empty"} />
              {editingId ? (
                <ExhibitionSponsorsPanel exhibitionId={editingId} isAr={isAr} />
              ) : (
                <EmptyHint icon={Award} text={t("Save the exhibition first to manage sponsors", "احفظ الفعالية أولاً لإدارة الرعاة")} />
              )}
            </section>

            {/* ═══ Section: Competitions ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { sectionRefs.current["competitions"] = el; }}
              data-section="competitions"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={Trophy} title={t("Competitions", "المسابقات")} desc={t("Link & manage competitions", "ربط وإدارة المسابقات")} status={editingId ? "complete" : "empty"} />
              {editingId ? (
                <ExhibitionCompetitionsPanel exhibitionId={editingId} editionYear={editionYear} isAr={isAr} />
              ) : (
                <EmptyHint icon={Trophy} text={t("Save the exhibition first to link competitions", "احفظ الفعالية أولاً لربط المسابقات")} />
              )}
            </section>

            {/* ═══ Section: Media ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { sectionRefs.current["media"] = el; }}
              data-section="media"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={Image} title={t("Media & Files", "الوسائط والملفات")} desc={t("Cover image, gallery & documents", "صورة الغلاف والمعرض والمستندات")} status={getSectionStatus("media")} />

              {/* Cover Image with preview */}
              <div className="space-y-2">
                <FieldGroup label={t("Cover Image URL", "رابط صورة الغلاف")}>
                  <Input className="h-9 max-w-md" value={form.cover_image_url || ""} onChange={e => updateField("cover_image_url", e.target.value)} placeholder="https://example.com/image.jpg" startIcon={<Image className="h-3 w-3" />} />
                </FieldGroup>
                {form.cover_image_url && (
                  <div className="relative h-40 max-w-md rounded-xl overflow-hidden border border-border/40">
                    <img src={form.cover_image_url} alt="" className="h-full w-full object-cover" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 end-2 h-6 w-6 rounded-lg bg-black/50 text-white hover:bg-black/70"
                      onClick={() => updateField("cover_image_url", "")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              <ExhibitionMediaLibrary
                exhibitionId={editingId || ""}
                coverImageUrl={form.cover_image_url || undefined}
                onCoverChange={url => updateField("cover_image_url", url)}
                isAr={isAr}
              />

              <Separator />

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <FileText className="h-3 w-3" />
                  {t("Documents & AI Knowledge Base", "المستندات وقاعدة معارف الذكاء الاصطناعي")}
                </p>
                <ExhibitionDocumentsPanel exhibitionId={editingId || ""} />
              </div>
            </section>

            {/* ═══ Section: Team ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { sectionRefs.current["team"] = el; }}
              data-section="team"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 shadow-sm"
            >
              <SectionHeader icon={Users} title={t("Team & Officials", "الفريق والمسؤولون")} desc={t("Staff assignments & roles", "تعيينات الطاقم والأدوار")} status={getSectionStatus("team")} />
              {editingId ? (
                <ExhibitionOfficialsPanel exhibitionId={editingId} />
              ) : (
                <EmptyHint icon={Users} text={t("Save the exhibition first to assign team members", "احفظ الفعالية أولاً لتعيين أعضاء الفريق")} />
              )}
            </section>

            </div>{/* end formLocked wrapper */}

            <div className="h-6" />
          </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
});

/* ─── Helper Components ─── */

function SectionHeader({ icon: Icon, title, desc, status, badge }: { icon: any; title: string; desc?: string; status: string; badge?: string }) {
  const dotColor = status === "complete" ? "bg-chart-2" : status === "partial" ? "bg-chart-4" : "bg-muted-foreground/30";
  return (
    <div className="flex items-center gap-3 pb-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold">{title}</h3>
        {desc && <p className="text-[10px] text-muted-foreground">{desc}</p>}
      </div>
      {badge && (
        <Badge variant="outline" className="text-[10px] h-5 px-1.5">{badge}</Badge>
      )}
      <span className={cn("h-2.5 w-2.5 rounded-full shrink-0 transition-colors", dotColor)} title={status} />
    </div>
  );
}

function FieldGroup({ label, required, aiSlot, hint, children }: { label: string; required?: boolean; aiSlot?: ReactNode; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">
          {label}
          {required && <span className="text-destructive ms-0.5">*</span>}
        </Label>
        {aiSlot}
      </div>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground/60">{hint}</p>}
    </div>
  );
}

function EmptyHint({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40 mb-2">
        <Icon className="h-5 w-5 text-muted-foreground/50" />
      </div>
      <p className="text-xs text-muted-foreground/70">{text}</p>
    </div>
  );
}
