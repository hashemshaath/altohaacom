import { useState, useMemo, useCallback } from "react";
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
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { CVImportDialog } from "@/components/cv-import/CVImportDialog";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  DragEndEvent, DragStartEvent, DragOverEvent, DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

const DEFAULT_SECTIONS: SectionConfig[] = [
  { key: "education", icon: "GraduationCap", en: "Education", ar: "التعليم", color: "bg-chart-2/10 text-chart-2", isCustom: false },
  { key: "work", icon: "Briefcase", en: "Experience", ar: "الخبرات", color: "bg-chart-3/10 text-chart-3", isCustom: false },
  { key: "memberships", icon: "Users", en: "Memberships", ar: "العضويات", color: "bg-primary/10 text-primary", isCustom: false },
  { key: "competitions", icon: "Trophy", en: "Competitions", ar: "المسابقات", color: "bg-chart-4/10 text-chart-4", isCustom: false },
  { key: "awards", icon: "Medal", en: "Awards", ar: "الجوائز", color: "bg-chart-1/10 text-chart-1", isCustom: false },
];

const ICON_MAP: Record<string, any> = {
  GraduationCap, Briefcase, Users, Trophy, Medal, Award, Building2, FileText, MapPin,
};

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
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS);
  const [editingSectionKey, setEditingSectionKey] = useState<string | null>(null);
  const [sectionEditName, setSectionEditName] = useState({ en: "", ar: "" });
  const [addingSectionDialog, setAddingSectionDialog] = useState(false);
  const [newSectionName, setNewSectionName] = useState({ en: "", ar: "" });
  const [activeId, setActiveId] = useState<string | null>(null);

  // Career form state
  const [careerForm, setCareerForm] = useState({
    record_type: "education", entity_id: null as string | null, entity_name: "",
    title: "", title_ar: "", education_level: "", field_of_study: "", field_of_study_ar: "", grade: "",
    department: "", department_ar: "", employment_type: "", start_date: "", end_date: "",
    is_current: false, description: "", description_ar: "", location: "",
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
  
  // Custom section records
  const customSectionRecords = useCallback((key: string) => {
    return records.filter(r => r.record_type === key);
  }, [records]);

  const getSectionCount = (key: string): number => {
    if (key === "education") return educationRecords.length;
    if (key === "work") return workRecords.length;
    if (key === "memberships") return memberships.length;
    if (key === "competitions") return competitions.length;
    if (key === "awards") return certificates.length;
    return customSectionRecords(key).length;
  };

  // ── Drag & Drop ──────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    const activeSectionKey = activeData.sectionKey as string;
    const overSectionKey = overData.sectionKey as string;

    // Only handle career records (education/work/custom)
    if (!["education", "work"].includes(activeSectionKey) && !sections.find(s => s.isCustom && s.key === activeSectionKey)) return;

    if (activeSectionKey === overSectionKey) {
      // Reorder within same section
      const sectionRecords = records.filter(r => r.record_type === activeSectionKey);
      const oldIndex = sectionRecords.findIndex(r => r.id === active.id);
      const newIndex = sectionRecords.findIndex(r => r.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sectionRecords, oldIndex, newIndex);
      // Update sort_order in DB
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
  }, [records, sections, userId, queryClient, isAr]);

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

  const saveMembershipMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("entity_memberships").insert({
        user_id: userId, entity_id: membershipForm.entity_id,
        membership_type: membershipForm.membership_type, title: membershipForm.title || null,
        title_ar: membershipForm.title_ar || null, enrollment_date: membershipForm.enrollment_date || null,
        notes: membershipForm.notes || null, status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-entity-memberships", userId] });
      toast({ title: isAr ? "تمت إضافة العضوية" : "Membership added" });
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
    return sections
      .filter(s => s.key !== currentKey && (s.key === "education" || s.key === "work" || s.isCustom))
      .map(s => ({ key: s.key, label: isAr ? s.ar : s.en }));
  };

  const closeForm = () => {
    setAddingSection(null);
    setEditingId(null);
    setSelectedCompetitionId("");
  };

  const startAddCareer = (type: string) => {
    setCareerForm({
      record_type: type, entity_id: null, entity_name: "", title: "", title_ar: "",
      education_level: "", field_of_study: "", field_of_study_ar: "", grade: "",
      department: "", department_ar: "", employment_type: "", start_date: "", end_date: "",
      is_current: false, description: "", description_ar: "", location: "",
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
    });
    setEditingId(record.id);
    setAddingSection(record.record_type);
  };

  const startAddMembership = () => {
    setMembershipForm({ entity_id: "", membership_type: "member", title: "", title_ar: "", enrollment_date: "", notes: "" });
    setAddingSection("memberships");
  };

  const startAddAward = () => {
    setAwardForm({ event_name: "", event_name_ar: "", achievement: "", achievement_ar: "", type: "participation", event_date: "" });
    setAddingSection("awards");
  };

  // ── Section Management ──────────────────────────────────────

  const startEditSectionTitle = (section: SectionConfig) => {
    setEditingSectionKey(section.key);
    setSectionEditName({ en: section.en, ar: section.ar });
  };

  const saveSectionTitle = () => {
    if (!editingSectionKey) return;
    setSections(prev => prev.map(s => 
      s.key === editingSectionKey ? { ...s, en: sectionEditName.en || s.en, ar: sectionEditName.ar || s.ar } : s
    ));
    setEditingSectionKey(null);
    toast({ title: isAr ? "تم تحديث العنوان" : "Title updated" });
  };

  const addCustomSection = () => {
    if (!newSectionName.en.trim()) return;
    const key = `custom_${Date.now()}`;
    const colorIndex = sections.filter(s => s.isCustom).length % CUSTOM_SECTION_COLORS.length;
    setSections(prev => [...prev, {
      key, icon: "FileText", en: newSectionName.en, ar: newSectionName.ar || newSectionName.en,
      color: CUSTOM_SECTION_COLORS[colorIndex], isCustom: true,
    }]);
    setExpandedSections(prev => new Set([...prev, key]));
    setNewSectionName({ en: "", ar: "" });
    setAddingSectionDialog(false);
    toast({ title: isAr ? "تم إنشاء القسم" : "Section created" });
  };

  const deleteCustomSection = (key: string) => {
    setSections(prev => prev.filter(s => s.key !== key));
    toast({ title: isAr ? "تم حذف القسم" : "Section deleted" });
  };

  // ── Render ──────────────────────────────────────

  const [cvImportOpen, setCvImportOpen] = useState(false);

  // Collect all draggable IDs for each section
  const getSectionItemIds = (key: string): string[] => {
    if (key === "education") return educationRecords.map(r => r.id);
    if (key === "work") return workRecords.map(r => r.id);
    if (sections.find(s => s.isCustom && s.key === key)) return customSectionRecords(key).map(r => r.id);
    return [];
  };

  const isDraggableSection = (key: string) => ["education", "work"].includes(key) || sections.find(s => s.isCustom && s.key === key);

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
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isAr ? "الاسم (EN)" : "Name (EN)"} *</Label>
                <Input value={newSectionName.en} onChange={e => setNewSectionName(p => ({ ...p, en: e.target.value }))} 
                  className="h-9 text-xs" dir="ltr" placeholder="e.g., Volunteering" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isAr ? "الاسم (AR)" : "Name (AR)"}</Label>
                <Input value={newSectionName.ar} onChange={e => setNewSectionName(p => ({ ...p, ar: e.target.value }))} 
                  className="h-9 text-xs" dir="rtl" placeholder="مثل: التطوع" />
              </div>
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

        {sections.map(section => {
          const IconComp = ICON_MAP[section.icon] || FileText;
          const count = getSectionCount(section.key);
          const isExpanded = expandedSections.has(section.key);
          const isAddingHere = addingSection === section.key;
          const isEditingTitle = editingSectionKey === section.key;
          const itemIds = getSectionItemIds(section.key);

          return (
            <div key={section.key} className="rounded-xl border bg-card/50 overflow-hidden transition-all hover:shadow-sm">
              {/* Section Header */}
              <div className="flex items-center gap-1 px-2">
                <button
                  onClick={() => toggleSection(section.key)}
                  className="flex-1 flex items-center gap-3 px-3 py-4 hover:bg-muted/40 transition-all group"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${section.color} group-hover:scale-110 transition-transform`}>
                    <IconComp className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 text-start">
                    {isEditingTitle ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <Input value={sectionEditName.en} onChange={e => setSectionEditName(p => ({ ...p, en: e.target.value }))}
                          className="h-7 text-xs w-24" dir="ltr" placeholder="EN" />
                        <Input value={sectionEditName.ar} onChange={e => setSectionEditName(p => ({ ...p, ar: e.target.value }))}
                          className="h-7 text-xs w-24" dir="rtl" placeholder="AR" />
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
                  {section.isCustom && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/60 hover:text-destructive"
                      onClick={() => deleteCustomSection(section.key)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
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
                            <CompactRow icon={GraduationCap} color={section.color}
                              title={isAr ? (r.title_ar || r.title) : r.title}
                              subtitle={r.entity_name || ""}
                              meta={`${formatDateRange(r.start_date, r.end_date, r.is_current, isAr)}${r.education_level ? ` · ${labelFor(r.education_level, EDUCATION_LEVELS, isAr)}` : ""}`}
                              isCurrent={r.is_current} isAr={isAr}
                              onEdit={() => startEditCareer(r)} onDelete={() => deleteCareerMutation.mutate(r.id)}
                              moveSections={getMoveSections("education")} onMove={(target) => moveRecordToSection.mutate({ id: r.id, targetSection: target })}
                              draggable
                            />
                          </SortableItem>
                        ))}
                      </SortableContext>
                      {isAddingHere ? (
                        <CareerForm form={careerForm} editingId={editingId} isAr={isAr}
                          isPending={saveCareerMutation.isPending}
                          onUpdate={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                          onSave={() => saveCareerMutation.mutate()} onCancel={closeForm} />
                      ) : (
                        <AddButton label={isAr ? "إضافة تعليم" : "Add Education"} onClick={() => startAddCareer("education")} />
                      )}
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
                            <CompactRow icon={Briefcase} color={section.color}
                              title={isAr ? (r.title_ar || r.title) : r.title}
                              subtitle={r.entity_name || ""}
                              meta={`${formatDateRange(r.start_date, r.end_date, r.is_current, isAr)}${r.employment_type ? ` · ${labelFor(r.employment_type, EMPLOYMENT_TYPES, isAr)}` : ""}${r.location ? ` · ${r.location}` : ""}`}
                              isCurrent={r.is_current} isAr={isAr}
                              onEdit={() => startEditCareer(r)} onDelete={() => deleteCareerMutation.mutate(r.id)}
                              moveSections={getMoveSections("work")} onMove={(target) => moveRecordToSection.mutate({ id: r.id, targetSection: target })}
                              draggable
                            />
                          </SortableItem>
                        ))}
                      </SortableContext>
                      {isAddingHere ? (
                        <CareerForm form={careerForm} editingId={editingId} isAr={isAr}
                          isPending={saveCareerMutation.isPending}
                          onUpdate={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                          onSave={() => saveCareerMutation.mutate()} onCancel={closeForm} />
                      ) : (
                        <AddButton label={isAr ? "إضافة خبرة" : "Add Experience"} onClick={() => startAddCareer("work")} />
                      )}
                    </>
                  )}

                  {/* ═══ MEMBERSHIPS ═══ */}
                  {section.key === "memberships" && (
                    <>
                      {memberships.length === 0 && !isAddingHere && (
                        <EmptyState icon={Users} message={isAr ? "لا توجد عضويات" : "No memberships"} />
                      )}
                      {memberships.map((m: any) => (
                        <CompactRow key={m.id} icon={Users} color={section.color}
                          logoUrl={m.culinary_entities?.logo_url}
                          title={isAr ? (m.culinary_entities?.name_ar || m.culinary_entities?.name) : m.culinary_entities?.name}
                          subtitle={[m.title && (isAr ? m.title_ar || m.title : m.title), m.membership_type && labelFor(m.membership_type, MEMBERSHIP_TYPES, isAr)].filter(Boolean).join(" · ")}
                          meta={m.enrollment_date ? formatDateShort(m.enrollment_date, isAr) : formatDateShort(m.created_at, isAr)}
                          badge={m.status === "active" ? (isAr ? "نشط" : "Active") : m.status}
                          badgeVariant={m.status === "active" ? "default" : "secondary"}
                          isAr={isAr}
                          onDelete={() => deleteMembershipMutation.mutate(m.id)}
                        />
                      ))}
                      {isAddingHere ? (
                        <MembershipForm form={membershipForm} isAr={isAr}
                          isPending={saveMembershipMutation.isPending}
                          onUpdate={(k, v) => setMembershipForm(prev => ({ ...prev, [k]: v }))}
                          onSave={() => saveMembershipMutation.mutate()} onCancel={closeForm} />
                      ) : (
                        <AddButton label={isAr ? "إضافة عضوية" : "Add Membership"} onClick={startAddMembership} />
                      )}
                    </>
                  )}

                  {/* ═══ COMPETITIONS ═══ */}
                  {section.key === "competitions" && (
                    <>
                      {competitions.length === 0 && !isAddingHere && (
                        <EmptyState icon={Trophy} message={isAr ? "لا توجد مشاركات" : "No competitions"} />
                      )}
                      {competitions.map((reg: any) => (
                        <CompactRow key={reg.id} icon={Trophy} color={section.color}
                          title={isAr ? (reg.competitions?.title_ar || reg.competitions?.title) : reg.competitions?.title}
                          subtitle=""
                          meta={`${reg.competitions?.competition_start ? formatDateShort(reg.competitions.competition_start, isAr) : ""}${reg.competitions?.country_code ? ` · ${reg.competitions.country_code}` : ""}`}
                          badge={reg.status === "approved" ? (isAr ? "مقبول" : "Approved") : reg.status === "pending" ? (isAr ? "قيد المراجعة" : "Pending") : reg.status}
                          badgeVariant={reg.status === "approved" ? "default" : "secondary"}
                          isAr={isAr}
                        />
                      ))}
                      {isAddingHere ? (
                        <CompetitionAddForm
                          competitions={availableCompetitions} selectedId={selectedCompetitionId}
                          onSelect={setSelectedCompetitionId} isAr={isAr}
                          isPending={addCompetitionMutation.isPending}
                          onSave={() => addCompetitionMutation.mutate()} onCancel={closeForm}
                        />
                      ) : (
                        <AddButton label={isAr ? "إضافة مسابقة" : "Add Competition"} onClick={() => setAddingSection("competitions")} />
                      )}
                    </>
                  )}

                  {/* ═══ AWARDS ═══ */}
                  {section.key === "awards" && (
                    <>
                      {certificates.length === 0 && !isAddingHere && (
                        <EmptyState icon={Medal} message={isAr ? "لا توجد جوائز" : "No awards"} />
                      )}
                      {certificates.map((cert: any) => (
                        <CompactRow key={cert.id} icon={Award} color={section.color}
                          title={isAr ? (cert.event_name_ar || cert.event_name) : cert.event_name}
                          subtitle={isAr ? (cert.achievement_ar || cert.achievement || "") : (cert.achievement || "")}
                          meta={`${cert.verification_code ? cert.verification_code.slice(-4) : ""}${cert.issued_at ? ` · ${formatDateShort(cert.issued_at, isAr)}` : ""}`}
                          badge={cert.type} badgeVariant="outline"
                          isAr={isAr}
                        />
                      ))}
                      {isAddingHere ? (
                        <AwardAddForm form={awardForm} isAr={isAr}
                          isPending={addAwardMutation.isPending}
                          onUpdate={(k, v) => setAwardForm(prev => ({ ...prev, [k]: v }))}
                          onSave={() => addAwardMutation.mutate()} onCancel={closeForm} />
                      ) : (
                        <AddButton label={isAr ? "إضافة جائزة" : "Add Award"} onClick={startAddAward} />
                      )}
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
                            <CompactRow icon={FileText} color={section.color}
                              title={isAr ? (r.title_ar || r.title) : r.title}
                              subtitle={r.entity_name || ""}
                              meta={formatDateRange(r.start_date, r.end_date, r.is_current, isAr)}
                              isCurrent={r.is_current} isAr={isAr}
                              onEdit={() => startEditCareer(r)} onDelete={() => deleteCareerMutation.mutate(r.id)}
                              moveSections={getMoveSections(section.key)} onMove={(target) => moveRecordToSection.mutate({ id: r.id, targetSection: target })}
                              draggable
                            />
                          </SortableItem>
                        ))}
                      </SortableContext>
                      {isAddingHere ? (
                        <CareerForm form={careerForm} editingId={editingId} isAr={isAr}
                          isPending={saveCareerMutation.isPending}
                          onUpdate={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                          onSave={() => saveCareerMutation.mutate()} onCancel={closeForm} />
                      ) : (
                        <AddButton label={isAr ? "إضافة عنصر" : "Add Item"} onClick={() => startAddCareer(section.key)} />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
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
    <div className="flex gap-2.5 pt-3 mt-1">
      <Button variant="outline" size="sm" className="flex-1 h-10 text-xs font-medium rounded-xl" onClick={onCancel}>{isAr ? "إلغاء" : "Cancel"}</Button>
      <Button size="sm" className="flex-1 h-10 text-xs font-medium gap-1.5 rounded-xl" onClick={onSave} disabled={!canSave || isPending}>
        {isPending ? <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" /> : <Check className="h-3.5 w-3.5" />}
        {editingId ? (isAr ? "حفظ التعديلات" : "Save Changes") : (isAr ? "إضافة" : "Add")}
      </Button>
    </div>
  );
}

function FormSection({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      {title && (
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function BilingualFieldPair({ labelEn, labelAr, valueEn, valueAr, onChangeEn, onChangeAr, isAr, placeholderEn, placeholderAr, required }: {
  labelEn: string; labelAr: string; valueEn: string; valueAr: string;
  onChangeEn: (v: string) => void; onChangeAr: (v: string) => void;
  isAr: boolean; placeholderEn?: string; placeholderAr?: string; required?: boolean;
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-foreground/80">{isAr ? labelAr : labelEn} {required && <span className="text-destructive">*</span>}</Label>
        <div className="flex gap-1">
          <Input value={valueEn} onChange={(e) => onChangeEn(e.target.value)} className="h-9 text-xs flex-1 rounded-lg" dir="ltr" placeholder={placeholderEn || (isAr ? "باللغة الإنجليزية" : "In English")} />
          <SmartTranslateBtn sourceText={valueEn} fromLang="en" onTranslated={onChangeAr} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-foreground/80">{isAr ? labelAr : labelEn} <span className="text-muted-foreground">(AR)</span></Label>
        <div className="flex gap-1">
          <Input value={valueAr} onChange={(e) => onChangeAr(e.target.value)} className="h-9 text-xs flex-1 rounded-lg" dir="rtl" placeholder={placeholderAr || (isAr ? "باللغة العربية" : "In Arabic")} />
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
  const isEdu = form.record_type === "education";
  
  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-muted/20 p-5 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isEdu ? "bg-chart-2/15 text-chart-2" : "bg-chart-3/15 text-chart-3"}`}>
            {isEdu ? <GraduationCap className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
          </div>
          <div>
            <h4 className="text-sm font-bold">
              {editingId ? (isAr ? "تعديل البيانات" : "Edit Details") : isEdu ? (isAr ? "إضافة تعليم جديد" : "Add Education") : (isAr ? "إضافة خبرة جديدة" : "Add Experience")}
            </h4>
            <p className="text-[11px] text-muted-foreground">{isAr ? "جميع الحقول ثنائية اللغة" : "All fields support bilingual input"}</p>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={onCancel}><X className="h-4 w-4" /></Button>
      </div>

      <div className="h-px bg-border/40" />

      {/* Organization */}
      <FormSection title={isEdu ? (isAr ? "المؤسسة التعليمية" : "Institution") : (isAr ? "جهة العمل" : "Organization")} icon={Building2}>
        <EntitySelector value={form.entity_id} entityName={form.entity_name}
          onChange={(id, name) => { onUpdate("entity_id", id); onUpdate("entity_name", name); }}
          label="" />
      </FormSection>

      {/* Title / Degree */}
      <FormSection title={isEdu ? (isAr ? "الدرجة العلمية" : "Degree") : (isAr ? "المسمى الوظيفي" : "Job Title")} icon={FileText}>
        <BilingualFieldPair
          labelEn={isEdu ? "Degree" : "Title"} labelAr={isEdu ? "الدرجة" : "المسمى"}
          valueEn={form.title} valueAr={form.title_ar}
          onChangeEn={(v) => onUpdate("title", v)} onChangeAr={(v) => onUpdate("title_ar", v)}
          isAr={isAr} required
        />
      </FormSection>

      {/* Type-specific fields */}
      {isEdu ? (
        <FormSection title={isAr ? "تفاصيل الدراسة" : "Study Details"} icon={GraduationCap}>
          <div className="grid gap-2.5 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground/80">{isAr ? "المستوى" : "Level"}</Label>
              <Select value={form.education_level} onValueChange={(v) => onUpdate("education_level", v)}>
                <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue placeholder={isAr ? "اختر المستوى" : "Select level"} /></SelectTrigger>
                <SelectContent>{EDUCATION_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{isAr ? l.ar : l.en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground/80">{isAr ? "التخصص" : "Field of Study"}</Label>
              <Input value={form.field_of_study} onChange={(e) => onUpdate("field_of_study", e.target.value)} className="h-9 text-xs rounded-lg" placeholder={isAr ? "مثل فنون الطهي" : "e.g., Culinary Arts"} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground/80">{isAr ? "المعدل" : "Grade / GPA"}</Label>
              <Input value={form.grade} onChange={(e) => onUpdate("grade", e.target.value)} className="h-9 text-xs rounded-lg" placeholder={isAr ? "مثل 4.0" : "e.g., 4.0"} />
            </div>
          </div>
        </FormSection>
      ) : form.record_type === "work" ? (
        <FormSection title={isAr ? "تفاصيل العمل" : "Work Details"} icon={Briefcase}>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground/80">{isAr ? "نوع التوظيف" : "Employment Type"}</Label>
              <Select value={form.employment_type} onValueChange={(v) => onUpdate("employment_type", v)}>
                <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue placeholder={isAr ? "اختر النوع" : "Select type"} /></SelectTrigger>
                <SelectContent>{EMPLOYMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground/80">{isAr ? "الموقع" : "Location"}</Label>
              <Input value={form.location} onChange={(e) => onUpdate("location", e.target.value)} className="h-9 text-xs rounded-lg" placeholder={isAr ? "مثل الرياض" : "e.g., Riyadh"} />
            </div>
          </div>
        </FormSection>
      ) : null}

      {/* Date Range */}
      <FormSection title={isAr ? "الفترة الزمنية" : "Time Period"} icon={MapPin}>
        <div className="grid gap-2.5 sm:grid-cols-2 items-end">
          <FlexibleDateInput value={form.start_date} onChange={(v) => onUpdate("start_date", v)}
            label={isAr ? "من" : "Start Date"} isAr={isAr} />
          {!form.is_current && (
            <FlexibleDateInput value={form.end_date} onChange={(v) => onUpdate("end_date", v)}
              label={isAr ? "إلى (اختياري)" : "End Date (optional)"} isAr={isAr} />
          )}
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/30">
          <Switch checked={form.is_current} onCheckedChange={(v) => { onUpdate("is_current", v); if (v) onUpdate("end_date", ""); }} />
          <Label className="text-xs font-medium cursor-pointer">
            {isEdu ? (isAr ? "لا يزال يدرس" : "Still studying") : (isAr ? "لا يزال يعمل" : "Still working")}
          </Label>
        </div>
      </FormSection>

      {/* Description */}
      <FormSection title={isAr ? "الوصف" : "Description"}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground/80">{isAr ? "الوصف (EN)" : "Description (EN)"}</Label>
            <Textarea value={form.description} onChange={(e) => onUpdate("description", e.target.value)} className="text-xs min-h-[60px] rounded-lg resize-none" dir="ltr" placeholder={isAr ? "وصف مختصر" : "Brief description"} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground/80">{isAr ? "الوصف (AR)" : "Description (AR)"}</Label>
            <Textarea value={form.description_ar} onChange={(e) => onUpdate("description_ar", e.target.value)} className="text-xs min-h-[60px] rounded-lg resize-none" dir="rtl" placeholder={isAr ? "وصف مختصر بالعربية" : "Brief description in Arabic"} />
          </div>
        </div>
      </FormSection>

      <FormActions isAr={isAr} isPending={isPending} editingId={editingId} canSave={!!form.title.trim()} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

function MembershipForm({ form, isAr, isPending, onUpdate, onSave, onCancel }: {
  form: any; isAr: boolean; isPending: boolean;
  onUpdate: (key: string, value: any) => void; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-muted/20 p-5 space-y-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold">{isAr ? "إضافة عضوية" : "Add Membership"}</h4>
            <p className="text-[11px] text-muted-foreground">{isAr ? "ربط بمنظمة أو جمعية" : "Link to an organization"}</p>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={onCancel}><X className="h-4 w-4" /></Button>
      </div>

      <div className="h-px bg-border/40" />

      <FormSection title={isAr ? "المنظمة" : "Organization"} icon={Building2}>
        <EntitySelector value={form.entity_id} entityName=""
          onChange={(id, name) => onUpdate("entity_id", id)}
          label="" />
      </FormSection>

      <FormSection title={isAr ? "تفاصيل العضوية" : "Membership Details"} icon={Users}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground/80">{isAr ? "نوع العضوية" : "Membership Type"}</Label>
            <Select value={form.membership_type} onValueChange={(v) => onUpdate("membership_type", v)}>
              <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue placeholder={isAr ? "اختر النوع" : "Select type"} /></SelectTrigger>
              <SelectContent>{MEMBERSHIP_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <FlexibleDateInput value={form.enrollment_date} onChange={(v) => onUpdate("enrollment_date", v)}
            label={isAr ? "تاريخ الانتساب" : "Enrollment Date"} isAr={isAr} />
        </div>
      </FormSection>

      <FormSection title={isAr ? "المسمى" : "Title"} icon={FileText}>
        <BilingualFieldPair
          labelEn="Title" labelAr="المسمى"
          valueEn={form.title} valueAr={form.title_ar}
          onChangeEn={(v) => onUpdate("title", v)} onChangeAr={(v) => onUpdate("title_ar", v)}
          isAr={isAr}
        />
      </FormSection>

      <FormActions isAr={isAr} isPending={isPending} canSave={!!form.entity_id} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

function CompetitionAddForm({ competitions, selectedId, onSelect, isAr, isPending, onSave, onCancel }: {
  competitions: any[]; selectedId: string; onSelect: (id: string) => void;
  isAr: boolean; isPending: boolean; onSave: () => void; onCancel: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search.trim()) return competitions.slice(0, 10);
    const q = search.toLowerCase();
    return competitions.filter(c => c.title?.toLowerCase().includes(q) || c.title_ar?.toLowerCase().includes(q));
  }, [competitions, search]);

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-muted/20 p-5 space-y-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold">{isAr ? "إضافة مسابقة" : "Add Competition"}</h4>
            <p className="text-[11px] text-muted-foreground">{isAr ? "اختر من المسابقات المتاحة" : "Select from available competitions"}</p>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={onCancel}><X className="h-4 w-4" /></Button>
      </div>

      <div className="h-px bg-border/40" />

      <Input placeholder={isAr ? "🔍 ابحث عن مسابقة..." : "🔍 Search competitions..."}
        value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 text-xs rounded-xl" />

      <div className="max-h-52 overflow-y-auto space-y-1 rounded-xl border border-border/30 bg-muted/10 p-2">
        {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">{isAr ? "لا توجد نتائج" : "No results"}</p>}
        {filtered.map(c => (
          <button key={c.id} onClick={() => onSelect(c.id)}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-all text-xs font-medium ${selectedId === c.id ? "bg-primary/10 border border-primary/30 text-primary shadow-sm" : "hover:bg-muted/50 border border-transparent"}`}>
            <Trophy className="h-4 w-4 shrink-0 text-chart-4" />
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{isAr ? (c.title_ar || c.title) : c.title}</p>
            </div>
            {c.competition_start && <span className="text-[10px] text-muted-foreground shrink-0">{formatDateShort(c.competition_start, isAr)}</span>}
            {selectedId === c.id && <Check className="h-4 w-4 text-primary shrink-0" />}
          </button>
        ))}
      </div>

      <FormActions isAr={isAr} isPending={isPending} canSave={!!selectedId} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

function AwardAddForm({ form, isAr, isPending, onUpdate, onSave, onCancel }: {
  form: any; isAr: boolean; isPending: boolean;
  onUpdate: (key: string, value: any) => void; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-muted/20 p-5 space-y-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-1/15 text-chart-1">
            <Medal className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold">{isAr ? "إضافة جائزة / شهادة" : "Add Award / Certificate"}</h4>
            <p className="text-[11px] text-muted-foreground">{isAr ? "توثيق الإنجازات والجوائز" : "Document achievements and awards"}</p>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={onCancel}><X className="h-4 w-4" /></Button>
      </div>

      <div className="h-px bg-border/40" />

      <FormSection title={isAr ? "اسم الحدث" : "Event Name"} icon={Trophy}>
        <BilingualFieldPair
          labelEn="Event Name" labelAr="اسم الحدث"
          valueEn={form.event_name} valueAr={form.event_name_ar}
          onChangeEn={(v) => onUpdate("event_name", v)} onChangeAr={(v) => onUpdate("event_name_ar", v)}
          isAr={isAr} required
        />
      </FormSection>

      <FormSection title={isAr ? "الإنجاز" : "Achievement"} icon={Award}>
        <BilingualFieldPair
          labelEn="Achievement" labelAr="الإنجاز"
          valueEn={form.achievement} valueAr={form.achievement_ar}
          onChangeEn={(v) => onUpdate("achievement", v)} onChangeAr={(v) => onUpdate("achievement_ar", v)}
          isAr={isAr}
          placeholderEn="e.g., Gold Medal Winner" placeholderAr="مثل: حائز على الميدالية الذهبية"
        />
      </FormSection>

      <FormSection title={isAr ? "معلومات إضافية" : "Additional Info"}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground/80">{isAr ? "النوع" : "Type"}</Label>
            <Select value={form.type} onValueChange={(v) => onUpdate("type", v)}>
              <SelectTrigger className="h-9 text-xs rounded-lg"><SelectValue placeholder={isAr ? "اختر النوع" : "Select type"} /></SelectTrigger>
              <SelectContent>{CERTIFICATE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <FlexibleDateInput value={form.event_date} onChange={(v) => onUpdate("event_date", v)}
            label={isAr ? "تاريخ الحدث" : "Event Date"} isAr={isAr} eventMode />
        </div>
      </FormSection>

      <FormActions isAr={isAr} isPending={isPending} canSave={!!form.event_name.trim()} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}
