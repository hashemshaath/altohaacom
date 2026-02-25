import { useState, useMemo, useCallback, createContext, useContext } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toEnglishDigits } from "@/lib/formatNumber";
import { EntitySelector } from "@/components/admin/EntitySelector";
import { FlexibleDateInput } from "@/components/ui/flexible-date-input";
import { toast } from "@/hooks/use-toast";
import {
  GraduationCap, Briefcase, Plus, Pencil, Trash2, X, Check, 
  Building2, MapPin, Trophy, Award, Medal, Users, ChevronDown, ChevronUp, FileText,
  GripVertical, FolderPlus, Type, Languages, Loader2, ArrowRightLeft,
  Scale, Tv, CalendarCheck,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { CVImportDialog } from "@/components/cv-import/CVImportDialog";
import { TranslatableInput } from "@/components/profile/edit/TranslatableInput";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  DragEndEvent, DragStartEvent, DragOverEvent, DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Inline Translate Button (compact for inline editing) ──
function TranslateInlineButton({ text, fromLang, toLang, onTranslated, isAr }: {
  text: string; fromLang: "en" | "ar"; toLang: "en" | "ar";
  onTranslated: (v: string) => void; isAr: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const handleTranslate = async () => {
    if (!text?.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("smart-translate", {
        body: { text, from: fromLang, to: toLang, context: "culinary/chef profile/section titles" },
      });
      if (error) throw error;
      if (data?.translated) onTranslated(data.translated);
    } catch { /* silent */ } finally { setLoading(false); }
  };
  return (
    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleTranslate} disabled={loading}
      title={toLang === "ar" ? "ترجمة إلى العربية" : "Translate to English"}>
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3 text-primary" />}
    </Button>
  );
}

// ── Constants ──────────────────────────────────────

const EDUCATION_LEVELS = [
  { value: "high_school", en: "High School", ar: "ثانوية عامة" },
  { value: "diploma", en: "Diploma", ar: "دبلوم" },
  { value: "bachelors", en: "Bachelor's", ar: "بكالوريوس" },
  { value: "masters", en: "Master's", ar: "ماجستير" },
  { value: "doctorate", en: "PhD", ar: "دكتوراه" },
  { value: "culinary_certificate", en: "Culinary Certificate", ar: "شهادة طهي" },
  { value: "professional_diploma", en: "Professional Diploma", ar: "دبلوم مهني" },
  { value: "other", en: "Other", ar: "أخرى" },
];

const EMPLOYMENT_TYPES = [
  { value: "full_time", en: "Full-time", ar: "دوام كامل" },
  { value: "part_time", en: "Part-time", ar: "دوام جزئي" },
  { value: "contract", en: "Contract", ar: "عقد" },
  { value: "internship", en: "Internship", ar: "تدريب" },
  { value: "freelance", en: "Freelance", ar: "عمل حر" },
  { value: "volunteer", en: "Volunteer", ar: "تطوعي" },
];

const MEMBERSHIP_TYPES = [
  { value: "member", en: "Member", ar: "عضو" },
  { value: "associate", en: "Associate", ar: "منتسب" },
  { value: "honorary", en: "Honorary", ar: "شرفي" },
  { value: "student", en: "Student", ar: "طالب" },
  { value: "professional", en: "Professional", ar: "محترف" },
];

const CERTIFICATE_TYPES = [
  { value: "participation", en: "Participation", ar: "مشاركة" },
  { value: "achievement", en: "Achievement", ar: "إنجاز" },
  { value: "winner", en: "Winner", ar: "فائز" },
  { value: "judge", en: "Judging", ar: "تحكيم" },
];

const COMPETITION_ROLES = [
  { value: "participant", en: "Participant", ar: "مشارك" },
  { value: "organizer", en: "Organizer", ar: "منظّم" },
  { value: "judge", en: "Judge", ar: "حَكَم" },
  { value: "volunteer", en: "Volunteer", ar: "متطوع" },
  { value: "sponsor", en: "Sponsor", ar: "راعي" },
  { value: "coordinator", en: "Coordinator", ar: "منسّق" },
  { value: "speaker", en: "Speaker", ar: "متحدث" },
];

const JUDGING_POSITIONS = [
  { value: "head_judge", en: "Head Judge", ar: "رئيس لجنة التحكيم" },
  { value: "judge", en: "Judge", ar: "حَكَم" },
  { value: "assistant_judge", en: "Assistant Judge", ar: "مساعد حكم" },
  { value: "technical_judge", en: "Technical Judge", ar: "حكم تقني" },
];

const MEDAL_TYPES = [
  { value: "gold", en: "Gold Medal", ar: "ميدالية ذهبية" },
  { value: "silver", en: "Silver Medal", ar: "ميدالية فضية" },
  { value: "bronze", en: "Bronze Medal", ar: "ميدالية برونزية" },
  { value: "diploma", en: "Diploma", ar: "دبلوم" },
  { value: "best_in_show", en: "Best in Show", ar: "الأفضل" },
  { value: "other", en: "Other", ar: "أخرى" },
];

const COUNTRIES = [
  { code: "SA", en: "Saudi Arabia", ar: "السعودية", flag: "🇸🇦" },
  { code: "AE", en: "UAE", ar: "الإمارات", flag: "🇦🇪" },
  { code: "KW", en: "Kuwait", ar: "الكويت", flag: "🇰🇼" },
  { code: "BH", en: "Bahrain", ar: "البحرين", flag: "🇧🇭" },
  { code: "QA", en: "Qatar", ar: "قطر", flag: "🇶🇦" },
  { code: "OM", en: "Oman", ar: "عُمان", flag: "🇴🇲" },
  { code: "EG", en: "Egypt", ar: "مصر", flag: "🇪🇬" },
  { code: "JO", en: "Jordan", ar: "الأردن", flag: "🇯🇴" },
  { code: "LB", en: "Lebanon", ar: "لبنان", flag: "🇱🇧" },
  { code: "IQ", en: "Iraq", ar: "العراق", flag: "🇮🇶" },
  { code: "MA", en: "Morocco", ar: "المغرب", flag: "🇲🇦" },
  { code: "TN", en: "Tunisia", ar: "تونس", flag: "🇹🇳" },
  { code: "TR", en: "Turkey", ar: "تركيا", flag: "🇹🇷" },
  { code: "GB", en: "United Kingdom", ar: "بريطانيا", flag: "🇬🇧" },
  { code: "US", en: "United States", ar: "أمريكا", flag: "🇺🇸" },
  { code: "FR", en: "France", ar: "فرنسا", flag: "🇫🇷" },
  { code: "DE", en: "Germany", ar: "ألمانيا", flag: "🇩🇪" },
  { code: "IT", en: "Italy", ar: "إيطاليا", flag: "🇮🇹" },
  { code: "ES", en: "Spain", ar: "إسبانيا", flag: "🇪🇸" },
  { code: "AU", en: "Australia", ar: "أستراليا", flag: "🇦🇺" },
  { code: "CA", en: "Canada", ar: "كندا", flag: "🇨🇦" },
  { code: "JP", en: "Japan", ar: "اليابان", flag: "🇯🇵" },
  { code: "IN", en: "India", ar: "الهند", flag: "🇮🇳" },
  { code: "SG", en: "Singapore", ar: "سنغافورة", flag: "🇸🇬" },
  { code: "MY", en: "Malaysia", ar: "ماليزيا", flag: "🇲🇾" },
];

const DEFAULT_SECTIONS: SectionConfig[] = [
  { key: "work", icon: "Briefcase", en: "Experience", ar: "الخبرة المهنية", color: "bg-chart-3/10 text-chart-3", isCustom: false },
  { key: "education", icon: "GraduationCap", en: "Education", ar: "التعليم", color: "bg-chart-2/10 text-chart-2", isCustom: false },
  { key: "judging", icon: "Scale", en: "Judging Competitions", ar: "تحكيم المسابقات", color: "bg-amber-500/10 text-amber-600", isCustom: false },
  { key: "memberships", icon: "Users", en: "Memberships", ar: "العضويات", color: "bg-primary/10 text-primary", isCustom: false },
  { key: "competitions", icon: "Trophy", en: "Competitions Participated", ar: "المسابقات المشارك فيها", color: "bg-chart-4/10 text-chart-4", isCustom: false },
  { key: "awards", icon: "Medal", en: "Awards & Medals", ar: "الجوائز والميداليات", color: "bg-chart-1/10 text-chart-1", isCustom: false },
  { key: "media", icon: "Tv", en: "Television Interviews", ar: "المقابلات التلفزيونية", color: "bg-blue-500/10 text-blue-600", isCustom: false },
  { key: "organizing", icon: "CalendarCheck", en: "Organizing Events", ar: "تنظيم الفعاليات والمسابقات", color: "bg-green-500/10 text-green-600", isCustom: false },
];

const ICON_MAP: Record<string, any> = {
  GraduationCap, Briefcase, Users, Trophy, Medal, Award, Building2, FileText, MapPin, Scale, Tv, CalendarCheck,
};

const AVAILABLE_ICONS = [
  { key: "GraduationCap", label: "Education", icon: GraduationCap },
  { key: "Briefcase", label: "Work", icon: Briefcase },
  { key: "Users", label: "Group", icon: Users },
  { key: "Trophy", label: "Trophy", icon: Trophy },
  { key: "Medal", label: "Medal", icon: Medal },
  { key: "Award", label: "Award", icon: Award },
  { key: "Building2", label: "Building", icon: Building2 },
  { key: "FileText", label: "Document", icon: FileText },
  { key: "MapPin", label: "Location", icon: MapPin },
  { key: "Scale", label: "Judging", icon: Scale },
  { key: "Tv", label: "Media", icon: Tv },
  { key: "CalendarCheck", label: "Events", icon: CalendarCheck },
];

const CUSTOM_SECTION_COLORS = [
  "bg-chart-2/10 text-chart-2",
  "bg-chart-3/10 text-chart-3",
  "bg-primary/10 text-primary",
  "bg-chart-4/10 text-chart-4",
  "bg-chart-1/10 text-chart-1",
  "bg-chart-5/10 text-chart-5",
];

interface SectionConfig {
  key: string;
  icon: string;
  en: string;
  ar: string;
  color: string;
  isCustom: boolean;
}

type SectionKey = string;

// ── Smart Translate Button ──────────────────────────────────────

function SmartTranslateBtn({ sourceText, fromLang, onTranslated, className }: {
  sourceText: string; fromLang: "en" | "ar"; onTranslated: (text: string) => void; className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const { toast: showToast } = useToast();

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("smart-translate", {
        body: { text: sourceText, from: fromLang, to: fromLang === "ar" ? "en" : "ar", context: "culinary/hospitality/food industry professional CV" },
      });
      if (error) throw error;
      if (data?.translated) onTranslated(data.translated);
    } catch (e: any) {
      showToast({ title: "Translation failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 shrink-0 text-primary/70 hover:text-primary ${className || ""}`}
      onClick={handleTranslate} disabled={loading || !sourceText.trim()} title={fromLang === "en" ? "ترجمة إلى العربية" : "Translate to English"}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
    </Button>
  );
}

// ── Types ──────────────────────────────────────

interface CareerRecord {
  id: string; user_id: string; record_type: string; entity_id: string | null; entity_name: string | null;
  title: string; title_ar: string | null; education_level: string | null; field_of_study: string | null;
  field_of_study_ar: string | null; grade: string | null; department: string | null; department_ar: string | null;
  employment_type: string | null; start_date: string | null; end_date: string | null; is_current: boolean;
  description: string | null; description_ar: string | null; location: string | null; sort_order: number; created_at: string;
  entity_name_ar?: string | null;
}

interface Props { userId: string; isAr: boolean; }

const formatDateShort = (date: string | null, isAr: boolean) => {
  if (!date) return "";
  // Handle flexible formats: year only, year-month, full date
  const parts = date.split("-");
  if (parts.length === 1) return parts[0]; // year only
  if (parts.length === 2) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1);
    return toEnglishDigits(d.toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short" }));
  }
  const d = new Date(date);
  return toEnglishDigits(d.toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short" }));
};

const formatDateRange = (startDate: string | null, endDate: string | null, isCurrent: boolean, isAr: boolean) => {
  const start = formatDateShort(startDate, isAr);
  const end = isCurrent ? "" : formatDateShort(endDate, isAr);
  if (!start && !end) {
    return isCurrent ? (isAr ? "لا يزال مستمراً" : "Still ongoing") : "";
  }
  if (isCurrent) return `${start} – ${isAr ? "مستمر" : "Ongoing"}`;
  if (!end) return start; // Single date only (year, month, or day)
  if (start && end && start !== end) return `${start} – ${end}`;
  return start || end || "";
};

const labelFor = (key: string, list: { value: string; en: string; ar: string }[], isAr: boolean) => {
  const item = list.find(l => l.value === key);
  return item ? (isAr ? item.ar : item.en) : key;
};

// ── Main Component ──────────────────────────────────────

export function UserCareerTimeline({ userId, isAr }: Props) {
  const queryClient = useQueryClient();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["education", "work"]));
  const [addingSection, setAddingSection] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMembershipId, setEditingMembershipId] = useState<string | null>(null);
  const [editingAwardId, setEditingAwardId] = useState<string | null>(null);
  const [editingSectionKey, setEditingSectionKey] = useState<string | null>(null);
  const [sectionEditName, setSectionEditName] = useState({ en: "", ar: "" });
  const [addingSectionDialog, setAddingSectionDialog] = useState(false);
  const [newSectionName, setNewSectionName] = useState({ en: "", ar: "" });
  const [activeId, setActiveId] = useState<string | null>(null);

  // ── Load custom sections from DB ──────────────────────────────────────
  const { data: dbSections = [] } = useQuery({
    queryKey: ["user-career-sections", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_career_sections")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Merge default sections with DB custom sections
  const sections: SectionConfig[] = useMemo(() => {
    const customFromDb: SectionConfig[] = dbSections
      .filter((s: any) => s.is_custom)
      .map((s: any) => ({
        key: s.section_key,
        icon: s.icon || "FileText",
        en: s.name_en,
        ar: s.name_ar || s.name_en,
        color: s.color || CUSTOM_SECTION_COLORS[0],
        isCustom: true,
      }));

    // Check if DB has stored order for default sections
    const dbDefaultOrder = dbSections
      .filter((s: any) => !s.is_custom)
      .reduce((acc: Record<string, any>, s: any) => {
        acc[s.section_key] = s;
        return acc;
      }, {} as Record<string, any>);

    // Apply saved icon/name overrides to defaults
    const defaults = DEFAULT_SECTIONS.map(d => {
      const override = dbDefaultOrder[d.key];
      if (override) {
        return { ...d, icon: override.icon || d.icon, en: override.name_en || d.en, ar: override.name_ar || d.ar };
      }
      return d;
    });

    // If we have stored order, use it; otherwise append customs after defaults
    if (dbSections.length > 0) {
      const orderedKeys = dbSections.map((s: any) => s.section_key);
      const allSections = [...defaults, ...customFromDb];
      const ordered: SectionConfig[] = [];
      for (const key of orderedKeys) {
        const found = allSections.find(s => s.key === key);
        if (found) ordered.push(found);
      }
      // Add any defaults not in DB (new defaults)
      for (const d of defaults) {
        if (!ordered.find(s => s.key === d.key)) ordered.push(d);
      }
      return ordered;
    }

    return [...defaults, ...customFromDb];
  }, [dbSections]);

  // Career form state
  const [careerForm, setCareerForm] = useState({
    record_type: "education", entity_id: null as string | null, entity_name: "",
    title: "", title_ar: "", education_level: "", field_of_study: "", field_of_study_ar: "", grade: "",
    department: "", department_ar: "", employment_type: "", start_date: "", end_date: "",
    is_current: false, description: "", description_ar: "", location: "", country_code: "",
  });

  // Membership form state
  const [membershipForm, setMembershipForm] = useState({
    entity_id: "", membership_type: "member", title: "", title_ar: "",
    enrollment_date: "", notes: "",
  });

  // Award form state
  const [awardForm, setAwardForm] = useState({
    event_name: "", event_name_ar: "", achievement: "", achievement_ar: "",
    type: "participation" as string, event_date: "",
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ── DnD Sensors ──────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── Data Queries ──────────────────────────────────────

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["career-records", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_career_records").select("*")
        .eq("user_id", userId).order("sort_order", { ascending: true })
        .order("is_current", { ascending: false })
        .order("end_date", { ascending: false, nullsFirst: true }).order("start_date", { ascending: false });
      if (error) throw error;
      return (data || []) as CareerRecord[];
    },
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ["user-entity-memberships", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("entity_memberships")
        .select("*, culinary_entities(name, name_ar, logo_url, type)")
        .eq("user_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ["user-competition-history", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("competition_registrations")
        .select("id, registered_at, status, competitions(title, title_ar, competition_start, country_code, status)")
        .eq("participant_id", userId).order("registered_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ["user-certificates-awards", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("certificates")
        .select("id, issued_at, event_name, event_name_ar, achievement, achievement_ar, type, status, verification_code")
        .eq("recipient_id", userId).eq("status", "issued").order("issued_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: availableCompetitions = [] } = useQuery({
    queryKey: ["available-competitions-for-user"],
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions")
        .select("id, title, title_ar, competition_start, country_code")
        .in("status", ["upcoming", "registration_open", "registration_closed", "in_progress", "completed"])
        .order("competition_start", { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: addingSection === "competitions",
  });

  const [selectedCompetitionId, setSelectedCompetitionId] = useState("");

  const educationRecords = useMemo(() => records.filter(r => r.record_type === "education"), [records]);
  const workRecords = useMemo(() => records.filter(r => r.record_type === "work"), [records]);
  const competitionCareerRecords = useMemo(() => records.filter(r => r.record_type === "competitions"), [records]);
  const judgingRecords = useMemo(() => records.filter(r => r.record_type === "judging"), [records]);
  const mediaRecords = useMemo(() => records.filter(r => r.record_type === "media"), [records]);
  const organizingRecords = useMemo(() => records.filter(r => r.record_type === "organizing"), [records]);
  
  // Custom section records
  const customSectionRecords = useCallback((key: string) => {
    return records.filter(r => r.record_type === key);
  }, [records]);

  const getRecordsForSection = useCallback((key: string) => {
    if (key === "education") return educationRecords;
    if (key === "work") return workRecords;
    if (key === "competitions") return competitionCareerRecords;
    if (key === "judging") return judgingRecords;
    if (key === "media") return mediaRecords;
    if (key === "organizing") return organizingRecords;
    return customSectionRecords(key);
  }, [educationRecords, workRecords, competitionCareerRecords, judgingRecords, mediaRecords, organizingRecords, customSectionRecords]);

  const getSectionCount = (key: string): number => {
    if (key === "memberships") return memberships.length;
    if (key === "competitions") return competitions.length + competitionCareerRecords.length;
    if (key === "awards") return certificates.length;
    return getRecordsForSection(key).length;
  };

  // ── Drag & Drop ──────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };
  // ── Helper: persist section order to DB ──────────────────────────────────────
  const persistSectionsOrder = useCallback(async (newSections: SectionConfig[]) => {
    // Upsert all sections (both default and custom) to preserve order
    for (let i = 0; i < newSections.length; i++) {
      const s = newSections[i];
      await supabase.from("user_career_sections" as any).upsert({
        user_id: userId,
        section_key: s.key,
        icon: s.icon,
        name_en: s.en,
        name_ar: s.ar,
        color: s.color,
        sort_order: i,
        is_custom: s.isCustom,
      } as any, { onConflict: "user_id,section_key" });
    }
    queryClient.invalidateQueries({ queryKey: ["user-career-sections", userId] });
  }, [userId, queryClient]);

   const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Handle section reordering
    if (activeData?.type === "section" && overData?.type === "section") {
      const oldIndex = sections.findIndex(s => s.key === active.id);
      const newIndex = sections.findIndex(s => s.key === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove([...sections], oldIndex, newIndex);
        await persistSectionsOrder(reordered);
        toast({ title: isAr ? "تم إعادة ترتيب الأقسام" : "Sections reordered" });
      }
      return;
    }

    if (!activeData || !overData) return;

    const activeSectionKey = activeData.sectionKey as string;
    const overSectionKey = overData.sectionKey as string;

    // Only handle career records (education/work/custom)
    if (!["education", "work", "competitions"].includes(activeSectionKey) && !sections.find(s => s.isCustom && s.key === activeSectionKey)) return;

    if (activeSectionKey === overSectionKey) {
      // Reorder within same section
      const sectionRecords = records.filter(r => r.record_type === activeSectionKey);
      const oldIndex = sectionRecords.findIndex(r => r.id === active.id);
      const newIndex = sectionRecords.findIndex(r => r.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sectionRecords, oldIndex, newIndex);
      for (let i = 0; i < reordered.length; i++) {
        await supabase.from("user_career_records").update({ sort_order: i }).eq("id", reordered[i].id);
      }
      queryClient.invalidateQueries({ queryKey: ["career-records", userId] });
    } else {
      // Move to different section (change record_type)
      const targetType = overSectionKey;
      await supabase.from("user_career_records").update({ record_type: targetType }).eq("id", String(active.id));
      queryClient.invalidateQueries({ queryKey: ["career-records", userId] });
      toast({ title: isAr ? "تم نقل العنصر" : "Item moved" });
    }
  }, [records, sections, userId, queryClient, isAr, persistSectionsOrder]);

  const changeSectionIcon = async (sectionKey: string, iconKey: string) => {
    const updated = sections.map(s => s.key === sectionKey ? { ...s, icon: iconKey } : s);
    await persistSectionsOrder(updated);
    toast({ title: isAr ? "تم تغيير الأيقونة" : "Icon changed" });
  };

  const deleteSection = async (key: string) => {
    await supabase.from("user_career_sections" as any).delete().eq("user_id", userId).eq("section_key", key);
    queryClient.invalidateQueries({ queryKey: ["user-career-sections", userId] });
    toast({ title: isAr ? "تم حذف القسم" : "Section deleted" });
  };

  // ── Mutations ──────────────────────────────────────

  const saveCareerMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: userId, record_type: careerForm.record_type,
        entity_id: careerForm.entity_id || null, entity_name: careerForm.entity_name || null,
        title: careerForm.title, title_ar: careerForm.title_ar || null,
        education_level: careerForm.education_level || null,
        field_of_study: careerForm.field_of_study || null, field_of_study_ar: careerForm.field_of_study_ar || null,
        grade: careerForm.grade || null, department: careerForm.department || null, department_ar: careerForm.department_ar || null,
        employment_type: careerForm.employment_type || null,
        start_date: careerForm.start_date || null, end_date: careerForm.is_current ? null : (careerForm.end_date || null),
        is_current: careerForm.is_current, description: careerForm.description || null,
        description_ar: careerForm.description_ar || null, location: careerForm.location || null,
        country_code: careerForm.country_code || null,
      } as any;
      if (editingId) {
        const { error } = await supabase.from("user_career_records").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_career_records").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-records", userId] });
      toast({ title: editingId ? (isAr ? "تم التحديث" : "Updated") : (isAr ? "تمت الإضافة" : "Added") });
      closeForm();
    },
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const saveMembershipMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        entity_id: membershipForm.entity_id,
        membership_type: membershipForm.membership_type,
        title: membershipForm.title || null,
        title_ar: membershipForm.title_ar || null,
        enrollment_date: membershipForm.enrollment_date || null,
        notes: membershipForm.notes || null,
      };
      if (editingMembershipId) {
        const { error } = await supabase.from("entity_memberships").update(payload).eq("id", editingMembershipId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("entity_memberships").insert({ ...payload, user_id: userId, status: "active" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-entity-memberships", userId] });
      toast({ title: editingMembershipId ? (isAr ? "تم التحديث" : "Updated") : (isAr ? "تمت إضافة العضوية" : "Membership added") });
      closeForm();
    },
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const addCompetitionMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("competition_registrations").insert({
        participant_id: userId, competition_id: selectedCompetitionId, status: "approved",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-competition-history", userId] });
      toast({ title: isAr ? "تمت إضافة المسابقة" : "Competition added" });
      closeForm();
    },
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const addManualCompetitionMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: userId, record_type: "competitions",
        entity_id: careerForm.entity_id || null,
        entity_name: careerForm.entity_name || null,
        title: careerForm.title,
        title_ar: careerForm.title_ar || null,
        description: careerForm.description || null,
        description_ar: careerForm.description_ar || null,
        start_date: careerForm.start_date || null,
        end_date: careerForm.is_current ? null : (careerForm.end_date || null),
        is_current: careerForm.is_current,
        location: careerForm.location || null,
        employment_type: careerForm.employment_type || null, // reuse for role (organizer/participant/judge)
      };
      if (editingId) {
        const { error } = await supabase.from("user_career_records").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_career_records").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-records", userId] });
      toast({ title: editingId ? (isAr ? "تم التحديث" : "Updated") : (isAr ? "تمت الإضافة" : "Added") });
      closeForm();
    },
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const addAwardMutation = useMutation({
    mutationFn: async () => {
      const { data: templates } = await supabase.from("certificate_templates").select("id").limit(1);
      const templateId = templates?.[0]?.id;
      if (!templateId) throw new Error("No certificate template found");

      const { error } = await supabase.from("certificates").insert({
        recipient_id: userId, recipient_name: "User",
        template_id: templateId, type: awardForm.type as any,
        event_name: awardForm.event_name, event_name_ar: awardForm.event_name_ar || null,
        achievement: awardForm.achievement || null, achievement_ar: awardForm.achievement_ar || null,
        event_date: awardForm.event_date || null,
        status: "issued", verification_code: crypto.randomUUID().substring(0, 8).toUpperCase(),
        issued_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-certificates-awards", userId] });
      toast({ title: isAr ? "تمت إضافة الجائزة" : "Award added" });
      closeForm();
    },
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const saveAwardMutation = useMutation({
    mutationFn: async () => {
      if (editingAwardId) {
        const { error } = await supabase.from("certificates").update({
          event_name: awardForm.event_name, event_name_ar: awardForm.event_name_ar || null,
          achievement: awardForm.achievement || null, achievement_ar: awardForm.achievement_ar || null,
          event_date: awardForm.event_date || null, type: awardForm.type as any,
        }).eq("id", editingAwardId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-certificates-awards", userId] });
      toast({ title: isAr ? "تم التحديث" : "Updated" });
      closeForm();
    },
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const deleteAwardMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("certificates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-certificates-awards", userId] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  const deleteCareerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_career_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-records", userId] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  const deleteMembershipMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entity_memberships").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-entity-memberships", userId] });
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  const moveRecordToSection = useMutation({
    mutationFn: async ({ id, targetSection }: { id: string; targetSection: string }) => {
      const { error } = await supabase.from("user_career_records").update({ record_type: targetSection }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-records", userId] });
      toast({ title: isAr ? "تم نقل العنصر" : "Item moved" });
    },
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const getMoveSections = (currentKey: string) => {
    const movableKeys = ["education", "work", "competitions", "judging", "media", "organizing"];
    return sections
      .filter(s => s.key !== currentKey && (movableKeys.includes(s.key) || s.isCustom))
      .map(s => ({ key: s.key, label: isAr ? s.ar : s.en }));
  };

  const closeForm = () => {
    setAddingSection(null);
    setEditingId(null);
    setEditingMembershipId(null);
    setEditingAwardId(null);
    setSelectedCompetitionId("");
  };

  const startAddCareer = (type: string) => {
    setCareerForm({
      record_type: type, entity_id: null, entity_name: "", title: "", title_ar: "",
      education_level: "", field_of_study: "", field_of_study_ar: "", grade: "",
      department: "", department_ar: "", employment_type: "", start_date: "", end_date: "",
      is_current: false, description: "", description_ar: "", location: "", country_code: "",
    });
    setEditingId(null);
    setAddingSection(type);
  };

  const startEditCareer = (record: CareerRecord) => {
    setCareerForm({
      record_type: record.record_type, entity_id: record.entity_id, entity_name: record.entity_name || "",
      title: record.title, title_ar: record.title_ar || "",
      education_level: record.education_level || "", field_of_study: record.field_of_study || "",
      field_of_study_ar: record.field_of_study_ar || "", grade: record.grade || "",
      department: record.department || "", department_ar: record.department_ar || "",
      employment_type: record.employment_type || "",
      start_date: record.start_date || "", end_date: record.end_date || "",
      is_current: record.is_current, description: record.description || "",
      description_ar: record.description_ar || "", location: record.location || "",
      country_code: (record as any).country_code || "",
    });
    setEditingId(record.id);
    setAddingSection(record.record_type);
  };

  const startAddMembership = () => {
    setMembershipForm({ entity_id: "", membership_type: "member", title: "", title_ar: "", enrollment_date: "", notes: "" });
    setEditingMembershipId(null);
    setAddingSection("memberships");
  };

  const startEditMembership = (m: any) => {
    setMembershipForm({
      entity_id: m.entity_id || "", membership_type: m.membership_type || "member",
      title: m.title || "", title_ar: m.title_ar || "",
      enrollment_date: m.enrollment_date || "", notes: m.notes || "",
    });
    setEditingMembershipId(m.id);
    setAddingSection("memberships");
  };

  const startAddAward = () => {
    setAwardForm({ event_name: "", event_name_ar: "", achievement: "", achievement_ar: "", type: "participation", event_date: "" });
    setEditingAwardId(null);
    setAddingSection("awards");
  };

  const startEditAward = (cert: any) => {
    setAwardForm({
      event_name: cert.event_name || "", event_name_ar: cert.event_name_ar || "",
      achievement: cert.achievement || "", achievement_ar: cert.achievement_ar || "",
      type: cert.type || "participation", event_date: cert.event_date || "",
    });
    setEditingAwardId(cert.id);
    setAddingSection("awards");
  };

  // ── Section Management ──────────────────────────────────────

  const startEditSectionTitle = (section: SectionConfig) => {
    setEditingSectionKey(section.key);
    setSectionEditName({ en: section.en, ar: section.ar });
  };

  const saveSectionTitle = async () => {
    if (!editingSectionKey) return;
    const updated = sections.map(s => 
      s.key === editingSectionKey ? { ...s, en: sectionEditName.en || s.en, ar: sectionEditName.ar || s.ar } : s
    );
    await persistSectionsOrder(updated);
    setEditingSectionKey(null);
    toast({ title: isAr ? "تم تحديث العنوان" : "Title updated" });
  };

  const addCustomSection = async () => {
    if (!newSectionName.en.trim()) return;
    const key = `custom_${Date.now()}`;
    const colorIndex = sections.filter(s => s.isCustom).length % CUSTOM_SECTION_COLORS.length;
    const newSection: SectionConfig = {
      key, icon: "FileText", en: newSectionName.en, ar: newSectionName.ar || newSectionName.en,
      color: CUSTOM_SECTION_COLORS[colorIndex], isCustom: true,
    };
    // Save to DB
    await supabase.from("user_career_sections" as any).insert({
      user_id: userId,
      section_key: key,
      icon: newSection.icon,
      name_en: newSection.en,
      name_ar: newSection.ar,
      color: newSection.color,
      sort_order: sections.length,
      is_custom: true,
    } as any);
    // Also persist all default sections if not yet saved (to preserve order)
    if (dbSections.length === 0) {
      await persistSectionsOrder([...sections, newSection]);
    } else {
      queryClient.invalidateQueries({ queryKey: ["user-career-sections", userId] });
    }
    setExpandedSections(prev => new Set([...prev, key]));
    setNewSectionName({ en: "", ar: "" });
    setAddingSectionDialog(false);
    toast({ title: isAr ? "تم إنشاء القسم" : "Section created" });
  };

  const deleteCustomSection = async (key: string) => {
    await supabase.from("user_career_sections" as any).delete().eq("user_id", userId).eq("section_key", key);
    // Also delete any career records in this section
    await supabase.from("user_career_records").delete().eq("user_id", userId).eq("record_type", key);
    queryClient.invalidateQueries({ queryKey: ["user-career-sections", userId] });
    queryClient.invalidateQueries({ queryKey: ["career-records", userId] });
    toast({ title: isAr ? "تم حذف القسم" : "Section deleted" });
  };

  // ── Render ──────────────────────────────────────

  const [cvImportOpen, setCvImportOpen] = useState(false);

  // Collect all draggable IDs for each section
  const getSectionItemIds = (key: string): string[] => {
    const draggableKeys = ["education", "work", "competitions", "judging", "media", "organizing"];
    if (draggableKeys.includes(key)) return getRecordsForSection(key).map(r => r.id);
    if (sections.find(s => s.isCustom && s.key === key)) return customSectionRecords(key).map(r => r.id);
    return [];
  };

  const isDraggableSection = (key: string) => ["education", "work", "competitions", "judging", "media", "organizing"].includes(key) || sections.find(s => s.isCustom && s.key === key);
  const sectionIds = useMemo(() => sections.map(s => s.key), [sections]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-3">
        {/* Header Actions */}
        <div className="flex gap-2 justify-end flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setAddingSectionDialog(true)}>
            <FolderPlus className="h-3.5 w-3.5" />
            {isAr ? "قسم جديد" : "New Section"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setCvImportOpen(true)}>
            <FileText className="h-4 w-4" />
            {isAr ? "استيراد سيرة ذاتية" : "Import CV"}
          </Button>
        </div>

        {/* Add Section Dialog */}
        {addingSectionDialog && (
          <div className="rounded-xl border bg-card/50 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/30">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <FolderPlus className="h-4 w-4" />
                {isAr ? "إنشاء قسم جديد" : "Create New Section"}
              </h4>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setAddingSectionDialog(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <TranslatableInput
                label={isAr ? "الاسم (EN) *" : "Name (EN) *"}
                value={newSectionName.en}
                onChange={(v) => setNewSectionName(p => ({ ...p, en: v }))}
                dir="ltr" lang="en" placeholder="e.g., Volunteering"
                pairedValue={newSectionName.ar}
                onTranslated={(v) => setNewSectionName(p => ({ ...p, ar: v }))}
              />
              <TranslatableInput
                label={isAr ? "الاسم (AR)" : "Name (AR)"}
                value={newSectionName.ar}
                onChange={(v) => setNewSectionName(p => ({ ...p, ar: v }))}
                dir="rtl" lang="ar" placeholder="مثل: التطوع"
                pairedValue={newSectionName.en}
                onTranslated={(v) => setNewSectionName(p => ({ ...p, en: v }))}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => setAddingSectionDialog(false)}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button size="sm" className="flex-1 h-8 text-xs gap-1" onClick={addCustomSection} disabled={!newSectionName.en.trim()}>
                <Check className="h-3 w-3" />{isAr ? "إنشاء" : "Create"}
              </Button>
            </div>
          </div>
        )}

        <CVImportDialog
          open={cvImportOpen}
          onOpenChange={setCvImportOpen}
          targetUserId={userId}
          isAr={isAr}
          onImported={() => {
            queryClient.invalidateQueries({ queryKey: ["career-records", userId] });
            queryClient.invalidateQueries({ queryKey: ["user-entity-memberships", userId] });
          }}
        />

        <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
        {sections.map(section => {
          const IconComp = ICON_MAP[section.icon] || FileText;
          const count = getSectionCount(section.key);
          const isExpanded = expandedSections.has(section.key);
          const isAddingHere = addingSection === section.key;
          const isEditingTitle = editingSectionKey === section.key;
          const itemIds = getSectionItemIds(section.key);

          return (
            <SortableSectionItem key={section.key} id={section.key}>
            <div className="rounded-xl border bg-card/50 overflow-hidden transition-all hover:shadow-sm">
              {/* Section Header */}
              <div className="flex items-center gap-1 px-2">
                <SectionDragHandle />
                <button
                  onClick={() => toggleSection(section.key)}
                  className="flex-1 flex items-center gap-3 px-2 py-4 hover:bg-muted/40 transition-all group"
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${section.color} group-hover:scale-110 transition-transform cursor-pointer`}
                        onClick={e => e.stopPropagation()}
                        title={isAr ? "تغيير الأيقونة" : "Change icon"}
                      >
                        <IconComp className="h-4.5 w-4.5" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start" onClick={e => e.stopPropagation()}>
                      <p className="text-[10px] font-semibold text-muted-foreground px-1 pb-1.5">{isAr ? "اختر أيقونة" : "Pick icon"}</p>
                      <div className="grid grid-cols-3 gap-1">
                        {AVAILABLE_ICONS.map(ic => (
                          <button key={ic.key} onClick={() => changeSectionIcon(section.key, ic.key)}
                            className={`flex items-center justify-center h-9 w-9 rounded-lg transition-all ${section.icon === ic.key ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "hover:bg-muted/60 text-muted-foreground"}`}
                            title={ic.label}>
                            <ic.icon className="h-4 w-4" />
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <div className="flex-1 text-start">
                    {isEditingTitle ? (
                      <div className="flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <Input value={sectionEditName.en} onChange={e => setSectionEditName(p => ({ ...p, en: e.target.value }))}
                            className="h-7 text-xs w-24" dir="ltr" placeholder="EN" />
                          {sectionEditName.en?.trim() && (
                            <TranslateInlineButton
                              text={sectionEditName.en} fromLang="en" toLang="ar"
                              onTranslated={(v) => setSectionEditName(p => ({ ...p, ar: v }))}
                              isAr={isAr}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Input value={sectionEditName.ar} onChange={e => setSectionEditName(p => ({ ...p, ar: e.target.value }))}
                            className="h-7 text-xs w-24" dir="rtl" placeholder="AR" />
                          {sectionEditName.ar?.trim() && (
                            <TranslateInlineButton
                              text={sectionEditName.ar} fromLang="ar" toLang="en"
                              onTranslated={(v) => setSectionEditName(p => ({ ...p, en: v }))}
                              isAr={isAr}
                            />
                          )}
                        </div>
                        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={saveSectionTitle}>
                          <Check className="h-3 w-3 text-primary" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => setEditingSectionKey(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold">{isAr ? section.ar : section.en}</span>
                    )}
                  </div>
                  {count > 0 && <Badge variant="outline" className="text-xs h-6 px-2.5 font-medium">{count}</Badge>}
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </button>
                
                {/* Section actions */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => startEditSectionTitle(section)} title={isAr ? "تعديل العنوان" : "Edit title"}>
                    <Type className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/60 hover:text-destructive"
                        title={isAr ? "حذف القسم" : "Delete section"}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{isAr ? "تأكيد الحذف" : "Confirm Deletion"}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {isAr
                            ? `هل أنت متأكد من حذف قسم "${section.ar}"؟ سيتم حذف القسم فقط وليس البيانات الموجودة فيه.`
                            : `Are you sure you want to delete the "${section.en}" section? This only removes the section, not the data in it.`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteSection(section.key)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          {isAr ? "حذف" : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Section Content */}
              {isExpanded && (
                <div className="border-t px-5 py-4 space-y-2.5">
                  {/* ═══ EDUCATION ═══ */}
                  {section.key === "education" && (
                    <>
                      {educationRecords.length === 0 && !isAddingHere && (
                        <EmptyState icon={GraduationCap} message={isAr ? "لا يوجد سجل تعليمي" : "No education records"} />
                      )}
                      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                        {educationRecords.map(r => (
                          <SortableItem key={r.id} id={r.id} sectionKey="education">
                            {editingId === r.id ? (
                              <CareerForm form={careerForm} editingId={editingId} isAr={isAr}
                                isPending={saveCareerMutation.isPending}
                                onUpdate={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                                onSave={() => saveCareerMutation.mutate()} onCancel={closeForm} />
                            ) : (
                              <CompactRow icon={GraduationCap} color={section.color}
                                title={isAr ? (r.title_ar || r.title) : r.title}
                                subtitle={r.entity_name || ""}
                                meta={`${formatDateRange(r.start_date, r.end_date, r.is_current, isAr)}${r.education_level ? ` · ${labelFor(r.education_level, EDUCATION_LEVELS, isAr)}` : ""}`}
                                isCurrent={r.is_current} isAr={isAr}
                                onEdit={() => startEditCareer(r)} onDelete={() => deleteCareerMutation.mutate(r.id)}
                                moveSections={getMoveSections("education")} onMove={(target) => moveRecordToSection.mutate({ id: r.id, targetSection: target })}
                                draggable
                              />
                            )}
                          </SortableItem>
                        ))}
                      </SortableContext>
                      {addingSection === "education" && !editingId ? (
                        <CareerForm form={careerForm} editingId={null} isAr={isAr}
                          isPending={saveCareerMutation.isPending}
                          onUpdate={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                          onSave={() => saveCareerMutation.mutate()} onCancel={closeForm} />
                      ) : !editingId || addingSection !== "education" ? (
                        <AddButton label={isAr ? "إضافة تعليم" : "Add Education"} onClick={() => startAddCareer("education")} />
                      ) : null}
                    </>
                  )}

                  {/* ═══ EXPERIENCE ═══ */}
                  {section.key === "work" && (
                    <>
                      {workRecords.length === 0 && !isAddingHere && (
                        <EmptyState icon={Briefcase} message={isAr ? "لا يوجد سجل خبرات" : "No work experience"} />
                      )}
                      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                        {workRecords.map(r => (
                          <SortableItem key={r.id} id={r.id} sectionKey="work">
                            {editingId === r.id ? (
                              <CareerForm form={careerForm} editingId={editingId} isAr={isAr}
                                isPending={saveCareerMutation.isPending}
                                onUpdate={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                                onSave={() => saveCareerMutation.mutate()} onCancel={closeForm} />
                            ) : (
                              <CompactRow icon={Briefcase} color={section.color}
                                title={isAr ? (r.title_ar || r.title) : r.title}
                                subtitle={r.entity_name || ""}
                                meta={`${formatDateRange(r.start_date, r.end_date, r.is_current, isAr)}${r.employment_type ? ` · ${labelFor(r.employment_type, EMPLOYMENT_TYPES, isAr)}` : ""}${r.location ? ` · ${r.location}` : ""}`}
                                isCurrent={r.is_current} isAr={isAr}
                                onEdit={() => startEditCareer(r)} onDelete={() => deleteCareerMutation.mutate(r.id)}
                                moveSections={getMoveSections("work")} onMove={(target) => moveRecordToSection.mutate({ id: r.id, targetSection: target })}
                                draggable
                              />
                            )}
                          </SortableItem>
                        ))}
                      </SortableContext>
                      {addingSection === "work" && !editingId ? (
                        <CareerForm form={careerForm} editingId={null} isAr={isAr}
                          isPending={saveCareerMutation.isPending}
                          onUpdate={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                          onSave={() => saveCareerMutation.mutate()} onCancel={closeForm} />
                      ) : !editingId || addingSection !== "work" ? (
                        <AddButton label={isAr ? "إضافة خبرة" : "Add Experience"} onClick={() => startAddCareer("work")} />
                      ) : null}
                    </>
                  )}

                  {/* ═══ MEMBERSHIPS ═══ */}
                  {section.key === "memberships" && (
                    <>
                      {memberships.length === 0 && !isAddingHere && (
                        <EmptyState icon={Users} message={isAr ? "لا توجد عضويات" : "No memberships"} />
                      )}
                      {memberships.map((m: any) => (
                        editingMembershipId === m.id ? (
                          <MembershipForm key={m.id} form={membershipForm} isAr={isAr}
                            editingId={editingMembershipId}
                            isPending={saveMembershipMutation.isPending}
                            onUpdate={(k, v) => setMembershipForm(prev => ({ ...prev, [k]: v }))}
                            onSave={() => saveMembershipMutation.mutate()} onCancel={closeForm} />
                        ) : (
                          <CompactRow key={m.id} icon={Users} color={section.color}
                            logoUrl={m.culinary_entities?.logo_url}
                            title={isAr ? (m.culinary_entities?.name_ar || m.culinary_entities?.name) : m.culinary_entities?.name}
                            subtitle={[m.title && (isAr ? m.title_ar || m.title : m.title), m.membership_type && labelFor(m.membership_type, MEMBERSHIP_TYPES, isAr)].filter(Boolean).join(" · ")}
                            meta={m.enrollment_date ? formatDateShort(m.enrollment_date, isAr) : formatDateShort(m.created_at, isAr)}
                            badge={m.status === "active" ? (isAr ? "نشط" : "Active") : m.status}
                            badgeVariant={m.status === "active" ? "default" : "secondary"}
                            isAr={isAr}
                            onEdit={() => startEditMembership(m)}
                            onDelete={() => deleteMembershipMutation.mutate(m.id)}
                          />
                        )
                      ))}
                      {isAddingHere && !editingMembershipId ? (
                        <MembershipForm form={membershipForm} isAr={isAr}
                          isPending={saveMembershipMutation.isPending}
                          onUpdate={(k, v) => setMembershipForm(prev => ({ ...prev, [k]: v }))}
                          onSave={() => saveMembershipMutation.mutate()} onCancel={closeForm} />
                      ) : !editingMembershipId ? (
                        <AddButton label={isAr ? "إضافة عضوية" : "Add Membership"} onClick={startAddMembership} />
                      ) : null}
                    </>
                  )}

                  {/* ═══ COMPETITIONS & EVENTS ═══ */}
                  {section.key === "competitions" && (
                    <>
                      {competitions.length === 0 && competitionCareerRecords.length === 0 && !isAddingHere && (
                        <EmptyState icon={Trophy} message={isAr ? "لا توجد مشاركات أو فعاليات" : "No competitions or events"} />
                      )}
                      {/* DB-linked competitions */}
                      {competitions.map((reg: any) => (
                        <CompactRow key={reg.id} icon={Trophy} color={section.color}
                          title={isAr ? (reg.competitions?.title_ar || reg.competitions?.title) : reg.competitions?.title}
                          subtitle=""
                          meta={`${reg.competitions?.competition_start ? formatDateShort(reg.competitions.competition_start, isAr) : ""}${reg.competitions?.country_code ? ` · ${reg.competitions.country_code}` : ""}`}
                          badge={reg.status === "approved" ? (isAr ? "مقبول" : "Approved") : reg.status === "pending" ? (isAr ? "قيد المراجعة" : "Pending") : reg.status}
                          badgeVariant={reg.status === "approved" ? "default" : "secondary"}
                          isAr={isAr}
                          onDelete={() => {
                            supabase.from("competition_registrations").delete().eq("id", reg.id).then(() => {
                              queryClient.invalidateQueries({ queryKey: ["user-competition-history", userId] });
                              toast({ title: isAr ? "تم الحذف" : "Deleted" });
                            });
                          }}
                        />
                      ))}
                      {/* Manual competition/event career records */}
                      {competitionCareerRecords.map(r => (
                        editingId === r.id ? (
                          <CompetitionEventForm key={r.id} form={careerForm} editingId={editingId} isAr={isAr}
                            isPending={addManualCompetitionMutation.isPending}
                            onUpdate={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                            onSave={() => addManualCompetitionMutation.mutate()} onCancel={closeForm} />
                        ) : (
                          <CompactRow key={r.id} icon={Trophy} color={section.color}
                            title={isAr ? (r.title_ar || r.title) : r.title}
                            subtitle={r.entity_name || ""}
                            meta={`${formatDateRange(r.start_date, r.end_date, r.is_current, isAr)}${r.employment_type ? ` · ${labelFor(r.employment_type, COMPETITION_ROLES, isAr)}` : ""}`}
                            isAr={isAr}
                            onEdit={() => startEditCareer(r)}
                            onDelete={() => deleteCareerMutation.mutate(r.id)}
                          />
                        )
                      ))}
                      {isAddingHere && !editingId ? (
                        <CompetitionAddForm
                          competitions={availableCompetitions} selectedId={selectedCompetitionId}
                          onSelect={setSelectedCompetitionId} isAr={isAr}
                          isPendingLink={addCompetitionMutation.isPending}
                          onSaveLink={() => addCompetitionMutation.mutate()}
                          careerForm={careerForm}
                          onUpdateCareer={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                          isPendingManual={addManualCompetitionMutation.isPending}
                          onSaveManual={() => addManualCompetitionMutation.mutate()}
                          onCancel={closeForm}
                        />
                      ) : !editingId ? (
                        <AddButton label={isAr ? "إضافة مسابقة / فعالية" : "Add Competition / Event"} onClick={() => { startAddCareer("competitions"); setAddingSection("competitions"); }} />
                      ) : null}
                    </>
                  )}

                  {/* ═══ AWARDS ═══ */}
                  {section.key === "awards" && (
                    <>
                      {certificates.length === 0 && !isAddingHere && (
                        <EmptyState icon={Medal} message={isAr ? "لا توجد جوائز" : "No awards"} />
                      )}
                      {certificates.map((cert: any) => (
                        editingAwardId === cert.id ? (
                          <AwardAddForm key={cert.id} form={awardForm} isAr={isAr}
                            editingId={editingAwardId}
                            isPending={saveAwardMutation.isPending}
                            onUpdate={(k, v) => setAwardForm(prev => ({ ...prev, [k]: v }))}
                            onSave={() => saveAwardMutation.mutate()} onCancel={closeForm} />
                        ) : (
                          <CompactRow key={cert.id} icon={Award} color={section.color}
                            title={isAr ? (cert.event_name_ar || cert.event_name) : cert.event_name}
                            subtitle={isAr ? (cert.achievement_ar || cert.achievement || "") : (cert.achievement || "")}
                            meta={`${cert.verification_code ? cert.verification_code.slice(-4) : ""}${cert.issued_at ? ` · ${formatDateShort(cert.issued_at, isAr)}` : ""}`}
                            badge={cert.type} badgeVariant="outline"
                            isAr={isAr}
                            onEdit={() => startEditAward(cert)}
                            onDelete={() => deleteAwardMutation.mutate(cert.id)}
                          />
                        )
                      ))}
                      {isAddingHere && !editingAwardId ? (
                        <AwardAddForm form={awardForm} isAr={isAr}
                          isPending={addAwardMutation.isPending}
                          onUpdate={(k, v) => setAwardForm(prev => ({ ...prev, [k]: v }))}
                          onSave={() => addAwardMutation.mutate()} onCancel={closeForm} />
                      ) : !editingAwardId ? (
                        <AddButton label={isAr ? "إضافة جائزة" : "Add Award"} onClick={startAddAward} />
                      ) : null}
                    </>
                  )}

                  {/* ═══ JUDGING COMPETITIONS ═══ */}
                  {section.key === "judging" && (
                    <>
                      {judgingRecords.length === 0 && !isAddingHere && (
                        <EmptyState icon={Scale} message={isAr ? "لا يوجد سجل تحكيم" : "No judging records"} />
                      )}
                      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                        {judgingRecords.map(r => (
                          <SortableItem key={r.id} id={r.id} sectionKey="judging">
                            {editingId === r.id ? (
                              <CareerForm form={careerForm} editingId={editingId} isAr={isAr}
                                isPending={saveCareerMutation.isPending}
                                onUpdate={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                                onSave={() => saveCareerMutation.mutate()} onCancel={closeForm} />
                            ) : (
                              <CompactRow icon={Scale} color={section.color}
                                title={isAr ? (r.title_ar || r.title) : r.title}
                                subtitle={r.entity_name || ""}
                                meta={`${formatDateRange(r.start_date, r.end_date, r.is_current, isAr)}${r.employment_type ? ` · ${labelFor(r.employment_type, JUDGING_POSITIONS, isAr)}` : ""}${r.location ? ` · ${r.location}` : ""}${(r as any).country_code ? `, ${(r as any).country_code}` : ""}`}
                                isAr={isAr}
                                onEdit={() => startEditCareer(r)} onDelete={() => deleteCareerMutation.mutate(r.id)}
                                moveSections={getMoveSections("judging")} onMove={(target) => moveRecordToSection.mutate({ id: r.id, targetSection: target })}
                                draggable
                              />
                            )}
                          </SortableItem>
                        ))}
                      </SortableContext>
                      {addingSection === "judging" && !editingId ? (
                        <CareerForm form={careerForm} editingId={null} isAr={isAr}
                          isPending={saveCareerMutation.isPending}
                          onUpdate={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                          onSave={() => saveCareerMutation.mutate()} onCancel={closeForm} />
                      ) : !editingId || addingSection !== "judging" ? (
                        <AddButton label={isAr ? "إضافة تحكيم" : "Add Judging"} onClick={() => startAddCareer("judging")} />
                      ) : null}
                    </>
                  )}

                  {/* ═══ TELEVISION INTERVIEWS ═══ */}
                  {section.key === "media" && (
                    <>
                      {mediaRecords.length === 0 && !isAddingHere && (
                        <EmptyState icon={Tv} message={isAr ? "لا توجد مقابلات تلفزيونية" : "No television interviews"} />
                      )}
                      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                        {mediaRecords.map(r => (
                          <SortableItem key={r.id} id={r.id} sectionKey="media">
                            {editingId === r.id ? (
                              <CareerForm form={careerForm} editingId={editingId} isAr={isAr}
                                isPending={saveCareerMutation.isPending}
                                onUpdate={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                                onSave={() => saveCareerMutation.mutate()} onCancel={closeForm} />
                            ) : (
                              <CompactRow icon={Tv} color={section.color}
                                title={isAr ? (r.title_ar || r.title) : r.title}
                                subtitle={r.entity_name || ""}
                                meta={`${formatDateRange(r.start_date, r.end_date, r.is_current, isAr)}${r.department ? ` · ${isAr ? "مقدم: " : "Host: "}${r.department}` : ""}${r.field_of_study ? ` · ${isAr ? "ضيف: " : "Guest: "}${r.field_of_study}` : ""}`}
                                isAr={isAr}
                                onEdit={() => startEditCareer(r)} onDelete={() => deleteCareerMutation.mutate(r.id)}
                                moveSections={getMoveSections("media")} onMove={(target) => moveRecordToSection.mutate({ id: r.id, targetSection: target })}
                                draggable
                              />
                            )}
                          </SortableItem>
                        ))}
                      </SortableContext>
                      {addingSection === "media" && !editingId ? (
                        <CareerForm form={careerForm} editingId={null} isAr={isAr}
                          isPending={saveCareerMutation.isPending}
                          onUpdate={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                          onSave={() => saveCareerMutation.mutate()} onCancel={closeForm} />
                      ) : !editingId || addingSection !== "media" ? (
                        <AddButton label={isAr ? "إضافة مقابلة" : "Add Interview"} onClick={() => startAddCareer("media")} />
                      ) : null}
                    </>
                  )}

                  {/* ═══ ORGANIZING EVENTS ═══ */}
                  {section.key === "organizing" && (
                    <>
                      {organizingRecords.length === 0 && !isAddingHere && (
                        <EmptyState icon={CalendarCheck} message={isAr ? "لا يوجد سجل تنظيم" : "No organizing records"} />
                      )}
                      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                        {organizingRecords.map(r => (
                          <SortableItem key={r.id} id={r.id} sectionKey="organizing">
                            {editingId === r.id ? (
                              <CareerForm form={careerForm} editingId={editingId} isAr={isAr}
                                isPending={saveCareerMutation.isPending}
                                onUpdate={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                                onSave={() => saveCareerMutation.mutate()} onCancel={closeForm} />
                            ) : (
                              <CompactRow icon={CalendarCheck} color={section.color}
                                title={isAr ? (r.title_ar || r.title) : r.title}
                                subtitle={r.entity_name || ""}
                                meta={`${formatDateRange(r.start_date, r.end_date, r.is_current, isAr)}${r.field_of_study ? ` · ${r.field_of_study}` : ""}${r.location ? ` · ${r.location}` : ""}${(r as any).country_code ? `, ${(r as any).country_code}` : ""}`}
                                isAr={isAr}
                                onEdit={() => startEditCareer(r)} onDelete={() => deleteCareerMutation.mutate(r.id)}
                                moveSections={getMoveSections("organizing")} onMove={(target) => moveRecordToSection.mutate({ id: r.id, targetSection: target })}
                                draggable
                              />
                            )}
                          </SortableItem>
                        ))}
                      </SortableContext>
                      {addingSection === "organizing" && !editingId ? (
                        <CareerForm form={careerForm} editingId={null} isAr={isAr}
                          isPending={saveCareerMutation.isPending}
                          onUpdate={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                          onSave={() => saveCareerMutation.mutate()} onCancel={closeForm} />
                      ) : !editingId || addingSection !== "organizing" ? (
                        <AddButton label={isAr ? "إضافة فعالية منظمة" : "Add Organized Event"} onClick={() => startAddCareer("organizing")} />
                      ) : null}
                    </>
                  )}

                  {/* ═══ CUSTOM SECTIONS ═══ */}
                  {section.isCustom && (
                    <>
                      {customSectionRecords(section.key).length === 0 && !isAddingHere && (
                        <EmptyState icon={FileText} message={isAr ? "لا توجد عناصر" : "No items"} />
                      )}
                      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                        {customSectionRecords(section.key).map(r => (
                          <SortableItem key={r.id} id={r.id} sectionKey={section.key}>
                            {editingId === r.id ? (
                              <CareerForm form={careerForm} editingId={editingId} isAr={isAr}
                                isPending={saveCareerMutation.isPending}
                                onUpdate={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                                onSave={() => saveCareerMutation.mutate()} onCancel={closeForm} />
                            ) : (
                              <CompactRow icon={FileText} color={section.color}
                                title={isAr ? (r.title_ar || r.title) : r.title}
                                subtitle={r.entity_name || ""}
                                meta={formatDateRange(r.start_date, r.end_date, r.is_current, isAr)}
                                isCurrent={r.is_current} isAr={isAr}
                                onEdit={() => startEditCareer(r)} onDelete={() => deleteCareerMutation.mutate(r.id)}
                                moveSections={getMoveSections(section.key)} onMove={(target) => moveRecordToSection.mutate({ id: r.id, targetSection: target })}
                                draggable
                              />
                            )}
                          </SortableItem>
                        ))}
                      </SortableContext>
                      {addingSection === section.key && !editingId ? (
                        <CareerForm form={careerForm} editingId={null} isAr={isAr}
                          isPending={saveCareerMutation.isPending}
                          onUpdate={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                          onSave={() => saveCareerMutation.mutate()} onCancel={closeForm} />
                      ) : !editingId || addingSection !== section.key ? (
                        <AddButton label={isAr ? "إضافة عنصر" : "Add Item"} onClick={() => startAddCareer(section.key)} />
                      ) : null}
                    </>
                  )}
                </div>
              )}
            </div>
            </SortableSectionItem>
          );
        })}
        </SortableContext>
      </div>
    </DndContext>
  );
}

// ── Sortable Item Wrapper ──────────────────────────────────────

function SortableItem({ id, sectionKey, children }: { id: string; sectionKey: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { sectionKey },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center gap-0.5">
        <button {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

// ── Sortable Section Wrapper ──────────────────────────────────────



const SectionDragListenersContext = createContext<Record<string, any> | null>(null);

function SortableSectionItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { type: "section" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <SectionDragListenersContext.Provider value={listeners || {}}>
      <div ref={setNodeRef} style={style} {...attributes}>
        {children}
      </div>
    </SectionDragListenersContext.Provider>
  );
}

function SectionDragHandle() {
  const listeners = useContext(SectionDragListenersContext);
  return (
    <button {...(listeners || {})} className="cursor-grab active:cursor-grabbing p-1.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none">
      <GripVertical className="h-4 w-4" />
    </button>
  );
}

// ── Sub-Components ──────────────────────────────────────

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/50 p-6 text-center bg-muted/20">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted/40 mb-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground font-medium">{message}</p>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" className="w-full gap-2 text-xs h-9 border-dashed hover:bg-muted/50 hover:border-border/80 transition-all" onClick={onClick}>
      <Plus className="h-3.5 w-3.5" />{label}
    </Button>
  );
}

function CompactRow({ icon: Icon, color, logoUrl, title, subtitle, meta, badge, badgeVariant, isCurrent, isAr, onEdit, onDelete, draggable, moveSections, onMove }: {
  icon: any; color: string; logoUrl?: string; title: string; subtitle: string; meta: string;
  badge?: string; badgeVariant?: "default" | "secondary" | "outline"; isCurrent?: boolean; isAr: boolean;
  onEdit?: () => void; onDelete?: () => void; draggable?: boolean;
  moveSections?: { key: string; label: string }[]; onMove?: (targetSection: string) => void;
}) {
  const mainContent = [title, subtitle, meta].filter(Boolean).join(" · ");
  const [moveOpen, setMoveOpen] = useState(false);
  
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 px-4 py-2.5 hover:bg-muted/50 transition-all hover:border-border/80 group">
      {logoUrl ? (
        <img src={logoUrl} className="h-8 w-8 rounded-lg object-cover shrink-0" alt="" />
      ) : (
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
        <p className="text-sm font-medium truncate">{mainContent}</p>
        {isCurrent && <Badge variant="default" className="text-[10px] h-5 px-1.5 shrink-0 whitespace-nowrap">{isAr ? "مستمر" : "Ongoing"}</Badge>}
        {badge && <Badge variant={badgeVariant || "secondary"} className="text-[10px] h-5 px-1.5 shrink-0 capitalize whitespace-nowrap">{badge}</Badge>}
      </div>
      {(onEdit || onDelete || (moveSections && moveSections.length > 0)) && (
        <div className="flex items-center gap-1 shrink-0 ms-2">
          {onEdit && (
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onEdit} title={isAr ? "تعديل" : "Edit"}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {moveSections && moveSections.length > 0 && onMove && (
            <Popover open={moveOpen} onOpenChange={setMoveOpen}>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" title={isAr ? "نقل إلى قسم آخر" : "Move to another section"}>
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1.5" align="end">
                <p className="text-xs font-semibold text-muted-foreground px-2 py-1.5">{isAr ? "نقل إلى:" : "Move to:"}</p>
                {moveSections.map(s => (
                  <button key={s.key} className="w-full text-start text-xs px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors"
                    onClick={() => { onMove(s.key); setMoveOpen(false); }}>
                    {s.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/5" title={isAr ? "حذف" : "Delete"}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{isAr ? "تأكيد الحذف" : "Confirm Deletion"}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {isAr ? "هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this item? This action cannot be undone."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {isAr ? "حذف" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );
}

function FormActions({ isAr, isPending, editingId, canSave, onSave, onCancel }: {
  isAr: boolean; isPending: boolean; editingId?: string | null; canSave: boolean; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="flex gap-2 pt-2 border-t border-border/30">
      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs font-medium" onClick={onCancel}>{isAr ? "إلغاء" : "Cancel"}</Button>
      <Button size="sm" className="flex-1 h-8 text-xs font-medium gap-1.5" onClick={onSave} disabled={!canSave || isPending}>
        {isPending ? <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" /> : <Check className="h-3 w-3" />}
        {editingId ? (isAr ? "حفظ" : "Save") : (isAr ? "إضافة" : "Add")}
      </Button>
    </div>
  );
}

function BilingualFieldPair({ labelEn, labelAr, valueEn, valueAr, onChangeEn, onChangeAr, isAr, placeholderEn, placeholderAr, required }: {
  labelEn: string; labelAr: string; valueEn: string; valueAr: string;
  onChangeEn: (v: string) => void; onChangeAr: (v: string) => void;
  isAr: boolean; placeholderEn?: string; placeholderAr?: string; required?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-muted-foreground">{labelEn} {required && <span className="text-destructive">*</span>}</Label>
        <div className="flex gap-1">
          <Input value={valueEn} onChange={(e) => onChangeEn(e.target.value)} className="h-8 text-xs flex-1" dir="ltr" placeholder={placeholderEn || "English"} />
          <SmartTranslateBtn sourceText={valueEn} fromLang="en" onTranslated={onChangeAr} />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-muted-foreground">{labelAr} <span className="text-muted-foreground/60">(AR)</span></Label>
        <div className="flex gap-1">
          <Input value={valueAr} onChange={(e) => onChangeAr(e.target.value)} className="h-8 text-xs flex-1" dir="rtl" placeholder={placeholderAr || "عربي"} />
          <SmartTranslateBtn sourceText={valueAr} fromLang="ar" onTranslated={onChangeEn} />
        </div>
      </div>
    </div>
  );
}

function CareerForm({ form, editingId, isAr, isPending, onUpdate, onSave, onCancel }: {
  form: any; editingId: string | null; isAr: boolean; isPending: boolean;
  onUpdate: (key: string, value: any) => void; onSave: () => void; onCancel: () => void;
}) {
  const rt = form.record_type;
  const isEdu = rt === "education";
  const isWork = rt === "work";
  const isJudging = rt === "judging";
  const isMedia = rt === "media";
  const isOrganizing = rt === "organizing";

  const formTitle = editingId
    ? (isAr ? "تعديل" : "Edit")
    : isEdu ? (isAr ? "إضافة تعليم" : "Add Education")
    : isWork ? (isAr ? "إضافة خبرة" : "Add Experience")
    : isJudging ? (isAr ? "إضافة تحكيم" : "Add Judging")
    : isMedia ? (isAr ? "إضافة مقابلة تلفزيونية" : "Add TV Interview")
    : isOrganizing ? (isAr ? "إضافة فعالية منظمة" : "Add Organized Event")
    : (isAr ? "إضافة عنصر" : "Add Item");

  const formIcon = isEdu ? GraduationCap : isJudging ? Scale : isMedia ? Tv : isOrganizing ? CalendarCheck : Briefcase;
  const FormIcon = formIcon;
  const iconClass = isEdu ? "bg-chart-2/15 text-chart-2" : isJudging ? "bg-amber-500/15 text-amber-600" : isMedia ? "bg-blue-500/15 text-blue-600" : isOrganizing ? "bg-green-500/15 text-green-600" : "bg-chart-3/15 text-chart-3";

  return (
    <div className="rounded-xl border border-primary/20 bg-card p-3 sm:p-4 space-y-3 shadow-sm animate-in fade-in-0 zoom-in-95 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconClass}`}>
            <FormIcon className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-xs font-bold">{formTitle}</h4>
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
      </div>

      {/* Organization / Entity */}
      <EntitySelector value={form.entity_id} entityName={form.entity_name}
        onChange={(id, name) => { onUpdate("entity_id", id); onUpdate("entity_name", name); }}
        label={isEdu ? (isAr ? "المؤسسة التعليمية" : "Institution")
          : isJudging ? (isAr ? "المسابقة / المعرض" : "Competition / Exhibition")
          : isMedia ? (isAr ? "اسم القناة" : "Channel Name")
          : isOrganizing ? (isAr ? "اسم الفعالية / المسابقة" : "Event / Competition Name")
          : (isAr ? "جهة العمل" : "Organization")} />

      {/* Title bilingual */}
      <BilingualFieldPair
        labelEn={isEdu ? "Degree / Specialization" : isJudging ? "Competition Name" : isMedia ? "Program Name" : isOrganizing ? "Specialization / Role" : "Job Title"}
        labelAr={isEdu ? "الدرجة / التخصص" : isJudging ? "اسم المسابقة" : isMedia ? "اسم البرنامج" : isOrganizing ? "التخصص / الدور" : "المسمى الوظيفي"}
        valueEn={form.title} valueAr={form.title_ar}
        onChangeEn={(v) => onUpdate("title", v)} onChangeAr={(v) => onUpdate("title_ar", v)}
        isAr={isAr} required
      />

      {/* ── Section-specific fields ── */}
      {isEdu && (
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "المستوى" : "Level"}</Label>
            <Select value={form.education_level} onValueChange={(v) => onUpdate("education_level", v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
              <SelectContent>{EDUCATION_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{isAr ? l.ar : l.en}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "التخصص" : "Field of Study"}</Label>
            <Input value={form.field_of_study} onChange={(e) => onUpdate("field_of_study", e.target.value)} className="h-8 text-xs" placeholder={isAr ? "الطهي" : "Culinary Arts"} />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "المعدل" : "GPA"}</Label>
            <Input value={form.grade} onChange={(e) => onUpdate("grade", e.target.value)} className="h-8 text-xs" placeholder="4.0" />
          </div>
        </div>
      )}

      {isWork && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "نوع التوظيف" : "Employment Type"}</Label>
            <Select value={form.employment_type} onValueChange={(v) => onUpdate("employment_type", v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
              <SelectContent>{EMPLOYMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <BilingualFieldPair
            labelEn="Department" labelAr="القسم"
            valueEn={form.department} valueAr={form.department_ar}
            onChangeEn={(v) => onUpdate("department", v)} onChangeAr={(v) => onUpdate("department_ar", v)}
            isAr={isAr}
          />
        </div>
      )}

      {isJudging && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "منصب التحكيم" : "Judging Position"}</Label>
            <Select value={form.employment_type || "judge"} onValueChange={(v) => onUpdate("employment_type", v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{JUDGING_POSITIONS.map(p => <SelectItem key={p.value} value={p.value}>{isAr ? p.ar : p.en}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <EntitySelector value={null} entityName={form.department || ""}
            onChange={(_, name) => onUpdate("department", name)}
            label={isAr ? "الجمعية المعتمدة" : "Associated Organization"} />
        </div>
      )}

      {isMedia && (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "المقدم / المحاور" : "Host / Interviewer"}</Label>
              <Input value={form.department} onChange={(e) => onUpdate("department", e.target.value)} className="h-8 text-xs" placeholder={isAr ? "اسم المقدم" : "Host name"} />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "الضيف" : "Guest"}</Label>
              <Input value={form.field_of_study} onChange={(e) => onUpdate("field_of_study", e.target.value)} className="h-8 text-xs" placeholder={isAr ? "اسم الضيف" : "Guest name"} />
            </div>
          </div>
          <BilingualFieldPair
            labelEn="Episode / Topic" labelAr="الحلقة / الموضوع"
            valueEn={form.description} valueAr={form.description_ar}
            onChangeEn={(v) => onUpdate("description", v)} onChangeAr={(v) => onUpdate("description_ar", v)}
            isAr={isAr}
          />
        </>
      )}

      {isOrganizing && (
        <BilingualFieldPair
          labelEn="Description (organizer & beneficiaries)" labelAr="الوصف (المنظم والمستفيدون)"
          valueEn={form.description} valueAr={form.description_ar}
          onChangeEn={(v) => onUpdate("description", v)} onChangeAr={(v) => onUpdate("description_ar", v)}
          isAr={isAr}
        />
      )}

      {/* Location: city + country (for all section types) */}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "المدينة" : "City"}</Label>
          <Input value={form.location} onChange={(e) => onUpdate("location", e.target.value)} className="h-8 text-xs" placeholder={isAr ? "الرياض" : "Riyadh"} />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "الدولة" : "Country"}</Label>
          <Select value={form.country_code} onValueChange={(v) => onUpdate("country_code", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isAr ? "اختر الدولة" : "Select country"} /></SelectTrigger>
            <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {isAr ? c.ar : c.en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Date section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/40">
            <Switch checked={!form.is_current && !!form.end_date || form.is_current} onCheckedChange={(v) => {
              if (!v) { onUpdate("end_date", ""); onUpdate("is_current", false); }
            }} className="scale-90" id="date-range-toggle" />
            <Label htmlFor="date-range-toggle" className="text-[11px] font-medium cursor-pointer">
              {isAr ? "فترة (من - إلى)" : "Date range (From - To)"}
            </Label>
          </div>
          {(!!form.end_date || form.is_current) && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/40">
              <Switch checked={form.is_current} onCheckedChange={(v) => { onUpdate("is_current", v); if (v) onUpdate("end_date", ""); }} className="scale-90" id="is-current-toggle" />
              <Label htmlFor="is-current-toggle" className="text-[11px] font-medium cursor-pointer">
                {isAr ? "لا يزال مستمراً" : "Still ongoing"}
              </Label>
            </div>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 items-end">
          <FlexibleDateInput value={form.start_date} onChange={(v) => onUpdate("start_date", v)}
            label={(!!form.end_date || form.is_current) ? (isAr ? "من" : "From") : (isAr ? "التاريخ" : "Date")} isAr={isAr} />
          {(!!form.end_date || form.is_current) && !form.is_current && (
            <FlexibleDateInput value={form.end_date} onChange={(v) => onUpdate("end_date", v)}
              label={isAr ? "إلى" : "To"} isAr={isAr} />
          )}
        </div>
      </div>

      {/* Description for work/edu/custom only (media/organizing already handled above) */}
      {!isMedia && !isOrganizing && (isWork || isEdu || (!isJudging)) && (
        <BilingualFieldPair
          labelEn="Description / Notes" labelAr="الوصف / ملاحظات"
          valueEn={form.description} valueAr={form.description_ar}
          onChangeEn={(v) => onUpdate("description", v)} onChangeAr={(v) => onUpdate("description_ar", v)}
          isAr={isAr}
        />
      )}

      <FormActions isAr={isAr} isPending={isPending} editingId={editingId} canSave={!!form.title.trim()} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

function MembershipForm({ form, isAr, isPending, editingId, onUpdate, onSave, onCancel }: {
  form: any; isAr: boolean; isPending: boolean; editingId?: string | null;
  onUpdate: (key: string, value: any) => void; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="rounded-xl border border-primary/20 bg-card p-3 sm:p-4 space-y-3 shadow-sm animate-in fade-in-0 zoom-in-95 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-xs font-bold">{editingId ? (isAr ? "تعديل العضوية" : "Edit Membership") : (isAr ? "إضافة عضوية" : "Add Membership")}</h4>
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
      </div>

      <EntitySelector value={form.entity_id} entityName=""
        onChange={(id, name) => onUpdate("entity_id", id)}
        label={isAr ? "المنظمة / الجمعية" : "Organization / Association"} />

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "نوع العضوية" : "Type"}</Label>
          <Select value={form.membership_type} onValueChange={(v) => onUpdate("membership_type", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
            <SelectContent>{MEMBERSHIP_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <FlexibleDateInput value={form.enrollment_date} onChange={(v) => onUpdate("enrollment_date", v)}
          label={isAr ? "تاريخ الانتساب" : "Enrollment"} isAr={isAr} />
      </div>

      <BilingualFieldPair
        labelEn="Title / Position" labelAr="المسمى / المنصب"
        valueEn={form.title} valueAr={form.title_ar}
        onChangeEn={(v) => onUpdate("title", v)} onChangeAr={(v) => onUpdate("title_ar", v)}
        isAr={isAr}
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "المدينة" : "City"}</Label>
          <Input value={form.notes?.split("|")[0] || ""} onChange={(e) => {
            const parts = (form.notes || "").split("|");
            parts[0] = e.target.value;
            onUpdate("notes", parts.join("|"));
          }} className="h-8 text-xs" placeholder={isAr ? "الرياض" : "Riyadh"} />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "الدولة" : "Country"}</Label>
          <Input value={form.notes?.split("|")[1] || ""} onChange={(e) => {
            const parts = (form.notes || "").split("|");
            while (parts.length < 2) parts.push("");
            parts[1] = e.target.value;
            onUpdate("notes", parts.join("|"));
          }} className="h-8 text-xs" placeholder={isAr ? "السعودية" : "Saudi Arabia"} />
        </div>
      </div>

      <FormActions isAr={isAr} isPending={isPending} canSave={!!form.entity_id} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

function CompetitionAddForm({ competitions, selectedId, onSelect, isAr, isPendingLink, onSaveLink,
  careerForm, onUpdateCareer, isPendingManual, onSaveManual, onCancel }: {
  competitions: any[]; selectedId: string; onSelect: (id: string) => void;
  isAr: boolean; isPendingLink: boolean; onSaveLink: () => void;
  careerForm: any; onUpdateCareer: (key: string, value: any) => void;
  isPendingManual: boolean; onSaveManual: () => void; onCancel: () => void;
}) {
  const [mode, setMode] = useState<"link" | "manual">("link");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search.trim()) return competitions.slice(0, 10);
    const q = search.toLowerCase();
    return competitions.filter(c => c.title?.toLowerCase().includes(q) || c.title_ar?.toLowerCase().includes(q));
  }, [competitions, search]);

  return (
    <div className="rounded-xl border border-primary/20 bg-card p-3 sm:p-4 space-y-3 shadow-sm animate-in fade-in-0 zoom-in-95 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-4/15 text-chart-4">
            <Trophy className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-xs font-bold">{isAr ? "إضافة مسابقة / فعالية" : "Add Competition / Event"}</h4>
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-0.5 rounded-lg bg-muted/40">
        <button type="button" onClick={() => setMode("link")}
          className={`flex-1 text-[11px] font-medium py-1.5 px-3 rounded-md transition-all ${mode === "link" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          {isAr ? "🔗 ربط بمسابقة موجودة" : "🔗 Link Existing"}
        </button>
        <button type="button" onClick={() => setMode("manual")}
          className={`flex-1 text-[11px] font-medium py-1.5 px-3 rounded-md transition-all ${mode === "manual" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          {isAr ? "✏️ إضافة يدوية" : "✏️ Add Manually"}
        </button>
      </div>

      {mode === "link" ? (
        <>
          <Input placeholder={isAr ? "🔍 بحث في المسابقات..." : "🔍 Search competitions..."}
            value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-xs" />
          <div className="max-h-44 overflow-y-auto space-y-0.5 rounded-lg border border-border/30 bg-muted/10 p-1.5">
            {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">{isAr ? "لا توجد نتائج — جرّب الإضافة اليدوية" : "No results — try adding manually"}</p>}
            {filtered.map(c => (
              <button key={c.id} onClick={() => onSelect(c.id)}
                className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-start transition-all text-xs ${selectedId === c.id ? "bg-primary/10 border border-primary/30 text-primary" : "hover:bg-muted/50 border border-transparent"}`}>
                <Trophy className="h-3.5 w-3.5 shrink-0 text-chart-4" />
                <p className="flex-1 min-w-0 truncate font-medium">{isAr ? (c.title_ar || c.title) : c.title}</p>
                {c.competition_start && <span className="text-[10px] text-muted-foreground shrink-0">{formatDateShort(c.competition_start, isAr)}</span>}
                {selectedId === c.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </button>
            ))}
          </div>
          <FormActions isAr={isAr} isPending={isPendingLink} canSave={!!selectedId} onSave={onSaveLink} onCancel={onCancel} />
        </>
      ) : (
        <CompetitionEventForm form={careerForm} editingId={null} isAr={isAr}
          isPending={isPendingManual} onUpdate={onUpdateCareer}
          onSave={onSaveManual} onCancel={onCancel} />
      )}
    </div>
  );
}

function CompetitionEventForm({ form, editingId, isAr, isPending, onUpdate, onSave, onCancel }: {
  form: any; editingId: string | null; isAr: boolean; isPending: boolean;
  onUpdate: (key: string, value: any) => void; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className={editingId ? "rounded-xl border border-primary/20 bg-card p-3 sm:p-4 space-y-3 shadow-sm animate-in fade-in-0 zoom-in-95 duration-200" : "space-y-3"}>
      {editingId && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-4/15 text-chart-4">
              <Trophy className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-xs font-bold">{isAr ? "تعديل" : "Edit"}</h4>
          </div>
          <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
        </div>
      )}

      <BilingualFieldPair
        labelEn="Competition Name" labelAr="اسم المسابقة"
        valueEn={form.title} valueAr={form.title_ar}
        onChangeEn={(v) => onUpdate("title", v)} onChangeAr={(v) => onUpdate("title_ar", v)}
        isAr={isAr} required
      />

      <EntitySelector value={form.entity_id} entityName={form.entity_name}
        onChange={(id, name) => { onUpdate("entity_id", id); onUpdate("entity_name", name); }}
        label={isAr ? "الجهة المنظمة" : "Organizer"} />

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "الدور" : "Role"}</Label>
          <Select value={form.employment_type || "participant"} onValueChange={(v) => onUpdate("employment_type", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{COMPETITION_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{isAr ? r.ar : r.en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "الميدالية / الإنجاز" : "Medal / Achievement"}</Label>
          <Select value={form.grade || ""} onValueChange={(v) => onUpdate("grade", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
            <SelectContent>{MEDAL_TYPES.map(m => <SelectItem key={m.value} value={m.value}>{isAr ? m.ar : m.en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "المدينة" : "City"}</Label>
          <Input value={form.location} onChange={(e) => onUpdate("location", e.target.value)} className="h-8 text-xs" placeholder={isAr ? "الرياض" : "Riyadh"} />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "الدولة" : "Country"}</Label>
          <Select value={form.country_code || ""} onValueChange={(v) => onUpdate("country_code", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
            <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {isAr ? c.ar : c.en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <FlexibleDateInput value={form.start_date} onChange={(v) => onUpdate("start_date", v)}
        label={isAr ? "التاريخ" : "Date"} isAr={isAr} />

      <BilingualFieldPair
        labelEn="Description" labelAr="الوصف"
        valueEn={form.description} valueAr={form.description_ar}
        onChangeEn={(v) => onUpdate("description", v)} onChangeAr={(v) => onUpdate("description_ar", v)}
        isAr={isAr}
      />

      <FormActions isAr={isAr} isPending={isPending} editingId={editingId} canSave={!!form.title.trim()} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

function AwardAddForm({ form, isAr, isPending, editingId, onUpdate, onSave, onCancel }: {
  form: any; isAr: boolean; isPending: boolean; editingId?: string | null;
  onUpdate: (key: string, value: any) => void; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="rounded-xl border border-primary/20 bg-card p-3 sm:p-4 space-y-3 shadow-sm animate-in fade-in-0 zoom-in-95 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-1/15 text-chart-1">
            <Medal className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-xs font-bold">{editingId ? (isAr ? "تعديل الجائزة" : "Edit Award") : (isAr ? "إضافة جائزة" : "Add Award")}</h4>
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
      </div>

      <BilingualFieldPair
        labelEn="Event Name" labelAr="اسم الحدث"
        valueEn={form.event_name} valueAr={form.event_name_ar}
        onChangeEn={(v) => onUpdate("event_name", v)} onChangeAr={(v) => onUpdate("event_name_ar", v)}
        isAr={isAr} required
      />

      <BilingualFieldPair
        labelEn="Achievement" labelAr="الإنجاز"
        valueEn={form.achievement} valueAr={form.achievement_ar}
        onChangeEn={(v) => onUpdate("achievement", v)} onChangeAr={(v) => onUpdate("achievement_ar", v)}
        isAr={isAr}
        placeholderEn="Gold Medal" placeholderAr="ميدالية ذهبية"
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{isAr ? "النوع" : "Type"}</Label>
          <Select value={form.type} onValueChange={(v) => onUpdate("type", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
            <SelectContent>{CERTIFICATE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <FlexibleDateInput value={form.event_date} onChange={(v) => onUpdate("event_date", v)}
          label={isAr ? "التاريخ" : "Date"} isAr={isAr} eventMode />
      </div>

      <FormActions isAr={isAr} isPending={isPending} canSave={!!form.event_name.trim()} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}
