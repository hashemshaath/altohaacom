import { useState, useCallback, useRef, useEffect, memo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCountries } from "@/hooks/useCountries";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityFormGuard } from "@/components/admin/EntityFormGuard";
import { AITextOptimizer } from "@/components/admin/AITextOptimizer";
import { OrganizerSearchSelector, type OrganizerValue } from "@/components/admin/OrganizerSearchSelector";
import { ExhibitionMediaUploader } from "@/components/admin/ExhibitionMediaUploader";
import { ExhibitionOfficialsPanel } from "@/components/admin/ExhibitionOfficialsPanel";
import { ExhibitionDocumentsPanel } from "@/components/admin/ExhibitionDocumentsPanel";
import {
  Landmark, Calendar, MapPin, Building, Ticket, Tag, Globe, Save, X,
  Loader2, Trophy, GraduationCap, Mic, Image, Users, FileText, Layers,
  ChevronLeft, CheckCircle2, Info, Link as LinkIcon, Eye, CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type ExhibitionStatus = Database["public"]["Enums"]["exhibition_status"];
type ExhibitionType = Database["public"]["Enums"]["exhibition_type"];
type ExhibitionInsert = Database["public"]["Tables"]["exhibitions"]["Insert"];

const statusOptions: { value: ExhibitionStatus; en: string; ar: string }[] = [
  { value: "pending", en: "Pending Approval", ar: "بانتظار الموافقة" },
  { value: "draft", en: "Draft", ar: "مسودة" },
  { value: "upcoming", en: "Upcoming", ar: "قادمة" },
  { value: "active", en: "Active", ar: "نشطة" },
  { value: "completed", en: "Completed", ar: "مكتملة" },
  { value: "cancelled", en: "Cancelled", ar: "ملغاة" },
];

const typeOptions: { value: ExhibitionType; en: string; ar: string }[] = [
  { value: "exhibition", en: "Exhibition", ar: "معرض" },
  { value: "conference", en: "Conference", ar: "مؤتمر" },
  { value: "summit", en: "Summit", ar: "قمة" },
  { value: "workshop", en: "Workshop", ar: "ورشة عمل" },
  { value: "food_festival", en: "Food Festival", ar: "مهرجان طعام" },
  { value: "trade_show", en: "Trade Show", ar: "معرض تجاري" },
  { value: "competition_event", en: "Competition Event", ar: "حدث تنافسي" },
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
  fields: string[];
}

const SECTIONS: SectionDef[] = [
  { id: "basic", icon: Landmark, en: "Basic Info", ar: "المعلومات الأساسية", fields: ["title", "title_ar", "description", "type"] },
  { id: "datetime", icon: Calendar, en: "Date & Schedule", ar: "التاريخ والجدول", fields: ["start_date", "end_date"] },
  { id: "location", icon: MapPin, en: "Location", ar: "الموقع", fields: ["venue", "city", "country"] },
  { id: "organizer", icon: Building, en: "Organizer", ar: "الجهة المنظمة", fields: ["organizer_name"] },
  { id: "tickets", icon: Ticket, en: "Tickets & Pricing", ar: "التذاكر والأسعار", fields: ["is_free"] },
  { id: "links", icon: LinkIcon, en: "Links & URLs", ar: "الروابط", fields: ["registration_url", "website_url"] },
  { id: "media", icon: Image, en: "Media & Files", ar: "الوسائط والملفات", fields: ["cover_image_url"] },
  { id: "team", icon: Users, en: "Team & Officials", ar: "الفريق والمسؤولون", fields: [] },
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
  const editingId = exhibition?.id || null;

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
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(exhibition?.series_id || null);
  const [editionYear, setEditionYear] = useState<number | null>(exhibition?.edition_year || null);
  const [editionNumber, setEditionNumber] = useState<number | null>((exhibition as any)?.edition_number || null);
  const [activeSection, setActiveSection] = useState("basic");

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const updateField = useCallback((key: string, value: any) => setForm(prev => ({ ...prev, [key]: value })), []);

  // Section completeness check
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
      case "tickets": return "complete"; // always valid (free or priced)
      case "links": return (form.registration_url || form.website_url) ? "complete" : "empty";
      case "media": return form.cover_image_url ? "complete" : "empty";
      case "team": return editingId ? "complete" : "empty";
      default: return "empty";
    }
  }, [form, organizer, editingId]);

  const completeness = (() => {
    let filled = 0, total = 10;
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

  // Intersection observer for active section tracking
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
        created_by: user?.id,
        series_id: selectedSeriesId || null,
        edition_year: editionYear || null,
        edition_number: editionNumber || null,
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
      toast({ title: editingId ? t("Exhibition updated", "تم تحديث الفعالية") : t("Exhibition created", "تم إنشاء الفعالية") });
      if (result.isNew && (includesCompetitions || includesTraining || includesSeminars)) {
        onClose();
        navigate(`/exhibitions/${result.slug}`);
      } else {
        onClose();
      }
    },
    onError: (err: Error) => {
      toast({ title: t("Error", "خطأ"), description: err.message, variant: "destructive" });
    },
  });

  const statusDotColor: Record<string, string> = {
    complete: "bg-chart-2",
    partial: "bg-chart-4",
    empty: "bg-muted-foreground/30",
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
      {/* ═══ Top Bar ═══ */}
      <div className="flex items-center justify-between gap-3 border-b bg-card px-4 py-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-sm font-bold truncate">
              {editingId ? t("Edit Exhibition", "تعديل الفعالية") : t("New Exhibition", "فعالية جديدة")}
            </h2>
            {editingId && form.title && (
              <p className="text-xs text-muted-foreground truncate max-w-[300px]">{form.title}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Completeness ring */}
          <div className="hidden sm:flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-1.5">
            <div className="relative h-5 w-5">
              <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
                <circle cx="10" cy="10" r="8" fill="none" stroke={completeness === 100 ? "hsl(var(--chart-2))" : "hsl(var(--primary))"} strokeWidth="2.5" strokeDasharray={`${completeness * 0.5} 100`} strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[10px] font-bold tabular-nums">{completeness}%</span>
          </div>

          {/* Status selector */}
          <Select value={form.status || "draft"} onValueChange={v => updateField("status", v)}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6" />

          <Button variant="outline" size="sm" className="h-8" onClick={onClose}>
            <X className="me-1.5 h-3.5 w-3.5" />
            {t("Cancel", "إلغاء")}
          </Button>
          <Button size="sm" className="h-8" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title || !form.start_date || !form.end_date}>
            {saveMutation.isPending ? <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="me-1.5 h-3.5 w-3.5" />}
            {editingId ? t("Save Changes", "حفظ التعديلات") : t("Create", "إنشاء")}
          </Button>
        </div>
      </div>

      {/* ═══ Body: Sidebar + Content ═══ */}
      <div className="flex flex-1 min-h-0">
        {/* ── Sidebar Navigation ── */}
        <nav className="hidden md:flex w-52 shrink-0 flex-col border-e bg-muted/20 py-2">
          <ScrollArea className="flex-1 px-2">
            {SECTIONS.map((sec) => {
              const status = getSectionStatus(sec.id);
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-start text-xs font-medium transition-all duration-200 mb-0.5",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <sec.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 truncate">{isAr ? sec.ar : sec.en}</span>
                  <span className={cn("h-2 w-2 rounded-full shrink-0 transition-colors", statusDotColor[status])} />
                </button>
              );
            })}
          </ScrollArea>

          {/* Sidebar footer: preview link */}
          {editingId && exhibition?.slug && (
            <div className="px-3 pt-2 border-t mt-auto">
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs gap-2 h-8" asChild>
                <a href={`/exhibitions/${exhibition.slug}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-3.5 w-3.5" />
                  {t("Preview", "معاينة")}
                </a>
              </Button>
            </div>
          )}
        </nav>

        {/* ── Scrollable Content ── */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scroll-smooth">
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
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5"
            >
              <SectionHeader icon={Landmark} title={t("Basic Info", "المعلومات الأساسية")} status={getSectionStatus("basic")} />

              {/* Series & Edition */}
              <div className="rounded-xl bg-muted/30 p-4 space-y-3">
                <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3 w-3" />
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
                    <Select value={editionYear ? String(editionYear) : "none"} onValueChange={v => setEditionYear(v === "none" ? null : parseInt(v))}>
                      <SelectTrigger className="h-9"><SelectValue placeholder={t("Select year", "اختر السنة")} /></SelectTrigger>
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
                    <Select value={editionNumber ? String(editionNumber) : "none"} onValueChange={v => setEditionNumber(v === "none" ? null : parseInt(v))}>
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
                              {isAr ? `الدورة ${ordinalAr}` : `${ordinalEn} Edition`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  {(editionYear || editionNumber) && (
                    <div className="flex items-end">
                      <Badge variant="outline" className="text-xs gap-1 whitespace-nowrap">
                        <Info className="h-3 w-3" />
                        {form.title || "..."}{editionYear ? ` ${editionYear}` : ""}{editionNumber ? ` — ${isAr ? `الدورة ${editionNumber}` : `#${editionNumber}`}` : ""}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup label={t("Title (English)", "العنوان (إنجليزي)")} required aiSlot={<AITextOptimizer text={form.title || ""} lang="en" onOptimized={v => updateField("title", v)} onTranslated={v => updateField("title_ar", v)} />}>
                  <Input className="h-9" value={form.title || ""} onChange={e => updateField("title", e.target.value)} placeholder={t("Exhibition title", "عنوان المعرض")} />
                </FieldGroup>
                <FieldGroup label={t("Title (Arabic)", "العنوان (عربي)")} aiSlot={<AITextOptimizer text={form.title_ar || ""} lang="ar" onOptimized={v => updateField("title_ar", v)} onTranslated={v => updateField("title", v)} />}>
                  <Input className="h-9" value={form.title_ar || ""} onChange={e => updateField("title_ar", e.target.value)} dir="rtl" />
                </FieldGroup>
              </div>

              {/* Slug */}
              <FieldGroup label={t("URL Slug", "الرابط المختصر")}>
                <Input className="h-9 font-mono text-xs max-w-md" value={form.slug || ""} onChange={e => updateField("slug", e.target.value)} placeholder="auto-generated-from-title" />
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
                <FieldGroup label={t("Tags (comma-separated)", "الوسوم")}>
                  <Input className="h-9" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="food, beverages" />
                </FieldGroup>
                <FieldGroup label={t("Target Audience", "الجمهور المستهدف")}>
                  <Input className="h-9" value={audienceInput} onChange={e => setAudienceInput(e.target.value)} placeholder="Chefs, Owners" />
                </FieldGroup>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Switch checked={form.is_featured || false} onCheckedChange={v => updateField("is_featured", v)} />
                <Label className="text-xs">{t("Featured Event", "فعالية مميزة")}</Label>
              </div>
            </section>

            {/* ═══ Section: Date & Schedule ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { sectionRefs.current["datetime"] = el; }}
              data-section="datetime"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5"
            >
              <SectionHeader icon={Calendar} title={t("Date & Schedule", "التاريخ والجدول")} status={getSectionStatus("datetime")} />

              <div className="grid gap-4 sm:grid-cols-3">
                <FieldGroup label={t("Type", "النوع")}>
                  <Select value={form.type || "exhibition"} onValueChange={v => updateField("type", v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {typeOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</SelectItem>
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

              {/* Event Content Types */}
              <div className="rounded-xl bg-muted/30 p-4">
                <p className="text-[11px] font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Trophy className="h-3 w-3" />
                  {t("Event Content", "محتوى الفعالية")}
                </p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={includesCompetitions} onCheckedChange={(v) => setIncludesCompetitions(!!v)} />
                    <Trophy className="h-4 w-4 text-chart-4" />
                    <span className="text-xs">{t("Competitions", "مسابقات")}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={includesTraining} onCheckedChange={(v) => setIncludesTraining(!!v)} />
                    <GraduationCap className="h-4 w-4 text-chart-2" />
                    <span className="text-xs">{t("Training / Workshops", "تدريب / ورش عمل")}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={includesSeminars} onCheckedChange={(v) => setIncludesSeminars(!!v)} />
                    <Mic className="h-4 w-4 text-chart-1" />
                    <span className="text-xs">{t("Seminars / Talks", "ندوات / محاضرات")}</span>
                  </label>
                </div>
              </div>
            </section>

            {/* ═══ Section: Location ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { sectionRefs.current["location"] = el; }}
              data-section="location"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5"
            >
              <SectionHeader icon={MapPin} title={t("Location", "الموقع")} status={getSectionStatus("location")} />

              <div className="flex items-center gap-3">
                <Switch checked={form.is_virtual || false} onCheckedChange={v => updateField("is_virtual", v)} />
                <Label className="flex items-center gap-1.5 text-xs">
                  <Globe className="h-3.5 w-3.5" />
                  {t("Virtual Event", "حدث افتراضي")}
                </Label>
              </div>

              {form.is_virtual ? (
                <FieldGroup label={t("Virtual Event Link", "رابط الحدث الافتراضي")}>
                  <Input className="h-9 max-w-md" value={form.virtual_link || ""} onChange={e => updateField("virtual_link", e.target.value)} placeholder="https://zoom.us/..." />
                </FieldGroup>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldGroup label={t("Venue (EN)", "المكان (إنجليزي)")} aiSlot={<AITextOptimizer text={form.venue || ""} lang="en" onTranslated={v => updateField("venue_ar", v)} compact />}>
                      <Input className="h-9" value={form.venue || ""} onChange={e => updateField("venue", e.target.value)} />
                    </FieldGroup>
                    <FieldGroup label={t("Venue (AR)", "المكان (عربي)")} aiSlot={<AITextOptimizer text={form.venue_ar || ""} lang="ar" onTranslated={v => updateField("venue", v)} compact />}>
                      <Input className="h-9" value={form.venue_ar || ""} onChange={e => updateField("venue_ar", e.target.value)} dir="rtl" />
                    </FieldGroup>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldGroup label={t("City", "المدينة")}>
                      <Input className="h-9" value={form.city || ""} onChange={e => updateField("city", e.target.value)} />
                    </FieldGroup>
                    <FieldGroup label={t("Country", "الدولة")}>
                      <Input className="h-9" value={form.country || ""} onChange={e => updateField("country", e.target.value)} />
                    </FieldGroup>
                  </div>
                  <FieldGroup label={t("Map URL", "رابط الخريطة")}>
                    <Input className="h-9 max-w-md" value={form.map_url || ""} onChange={e => updateField("map_url", e.target.value)} placeholder="https://maps.google.com/..." />
                  </FieldGroup>
                </>
              )}
            </section>

            {/* ═══ Section: Organizer ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { sectionRefs.current["organizer"] = el; }}
              data-section="organizer"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5"
            >
              <SectionHeader icon={Building} title={t("Organizer", "الجهة المنظمة")} status={getSectionStatus("organizer")} />

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
                  }
                }}
                label={t("Search & Select Organizer", "البحث واختيار الجهة المنظمة")}
              />
              {organizer && (
                <div className="grid gap-4 sm:grid-cols-3">
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
              )}
            </section>

            {/* ═══ Section: Tickets ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { sectionRefs.current["tickets"] = el; }}
              data-section="tickets"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5"
            >
              <SectionHeader icon={Ticket} title={t("Tickets & Pricing", "التذاكر والأسعار")} status={getSectionStatus("tickets")} />

              <div className="flex items-center gap-3">
                <Switch checked={form.is_free || false} onCheckedChange={v => updateField("is_free", v)} />
                <Label className="text-xs">{t("Free Entry", "دخول مجاني")}</Label>
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
                  <Input className="h-9" type="number" value={form.max_attendees || ""} onChange={e => updateField("max_attendees", parseInt(e.target.value) || undefined)} />
                </FieldGroup>
              </div>
            </section>

            {/* ═══ Section: Links ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { sectionRefs.current["links"] = el; }}
              data-section="links"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5"
            >
              <SectionHeader icon={LinkIcon} title={t("Links & URLs", "الروابط")} status={getSectionStatus("links")} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup label={t("Registration URL", "رابط التسجيل")}>
                  <Input className="h-9" value={form.registration_url || ""} onChange={e => updateField("registration_url", e.target.value)} placeholder="https://..." />
                </FieldGroup>
                <FieldGroup label={t("Website URL", "رابط الموقع")}>
                  <Input className="h-9" value={form.website_url || ""} onChange={e => updateField("website_url", e.target.value)} placeholder="https://..." />
                </FieldGroup>
              </div>
            </section>

            {/* ═══ Section: Media ═══ */}
            <section
              ref={(el: HTMLDivElement | null) => { sectionRefs.current["media"] = el; }}
              data-section="media"
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5"
            >
              <SectionHeader icon={Image} title={t("Media & Files", "الوسائط والملفات")} status={getSectionStatus("media")} />

              <FieldGroup label={t("Cover Image URL", "رابط صورة الغلاف")}>
                <Input className="h-9 max-w-md" value={form.cover_image_url || ""} onChange={e => updateField("cover_image_url", e.target.value)} placeholder="https://example.com/image.jpg" />
              </FieldGroup>

              {form.cover_image_url && (
                <div className="rounded-xl border overflow-hidden max-w-xs">
                  <img src={form.cover_image_url} alt="Cover" className="w-full h-36 object-cover" />
                </div>
              )}

              <Separator />

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Image className="h-3 w-3" />
                  {t("Media Library", "مكتبة الوسائط")}
                </p>
                <ExhibitionMediaUploader
                  exhibitionId={editingId || ""}
                  coverImageUrl={form.cover_image_url || undefined}
                  onCoverChange={url => updateField("cover_image_url", url)}
                />
              </div>

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
              className="rounded-2xl border border-border/40 bg-card p-5 space-y-5"
            >
              <SectionHeader icon={Users} title={t("Team & Officials", "الفريق والمسؤولون")} status={getSectionStatus("team")} />
              <ExhibitionOfficialsPanel exhibitionId={editingId || ""} />
            </section>

            {/* Bottom spacer */}
            <div className="h-6" />
          </div>
        </div>
      </div>
    </div>
  );
});

/* ─── Helper Components ─── */

function SectionHeader({ icon: Icon, title, status }: { icon: any; title: string; status: string }) {
  const dotColor = status === "complete" ? "bg-chart-2" : status === "partial" ? "bg-chart-4" : "bg-muted-foreground/30";
  return (
    <div className="flex items-center gap-2.5 pb-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h3 className="text-sm font-bold flex-1">{title}</h3>
      <span className={cn("h-2.5 w-2.5 rounded-full", dotColor)} title={status} />
    </div>
  );
}

function FieldGroup({ label, required, aiSlot, children }: { label: string; required?: boolean; aiSlot?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">
          {label}
          {required && <span className="text-destructive ms-0.5">*</span>}
        </Label>
        {aiSlot}
      </div>
      {children}
    </div>
  );
}
