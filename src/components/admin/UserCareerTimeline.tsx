import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  ChevronDown, ChevronUp, FileText, FolderPlus, Type, X, Check, Trash2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CVImportDialog } from "@/components/cv-import/CVImportDialog";
import { TranslatableInput } from "@/components/profile/edit/TranslatableInput";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  DragEndEvent, DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";

import type { SectionConfig, CareerRecord } from "./career-timeline/constants";
import {
  DEFAULT_SECTIONS, ICON_MAP, AVAILABLE_ICONS, CUSTOM_SECTION_COLORS,
} from "./career-timeline/constants";
import {
  TranslateInlineButton, SortableSectionItem, SectionDragHandle,
} from "./career-timeline/shared-ui";
import { SectionContent } from "./career-timeline/section-renderer";

interface Props { userId: string; isAr: boolean; }

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
  const [cvImportOpen, setCvImportOpen] = useState(false);

  // ── Career form state ──
  const [careerForm, setCareerForm] = useState({
    record_type: "education", entity_id: null as string | null, entity_name: "",
    title: "", title_ar: "", education_level: "", field_of_study: "", field_of_study_ar: "", grade: "",
    department: "", department_ar: "", employment_type: "", start_date: "", end_date: "",
    is_current: false, description: "", description_ar: "", location: "", country_code: "",
  });
  const [membershipForm, setMembershipForm] = useState({
    entity_id: "", membership_type: "member", title: "", title_ar: "",
    enrollment_date: "", notes: "",
  });
  const [awardForm, setAwardForm] = useState({
    event_name: "", event_name_ar: "", achievement: "", achievement_ar: "",
    type: "participation" as string, event_date: "",
  });
  const [selectedCompetitionId, setSelectedCompetitionId] = useState("");

  // ── Load sections ──
  const { data: dbSections = [] } = useQuery({
    queryKey: ["user-career-sections", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_career_sections").select("*")
        .eq("user_id", userId).order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const sections: SectionConfig[] = useMemo(() => {
    const customFromDb: SectionConfig[] = dbSections
      .filter((s: any) => s.is_custom)
      .map((s: any) => ({
        key: s.section_key, icon: s.icon || "FileText",
        en: s.name_en, ar: s.name_ar || s.name_en,
        color: s.color || CUSTOM_SECTION_COLORS[0], isCustom: true,
      }));
    const dbDefaultOrder = dbSections
      .filter((s: any) => !s.is_custom)
      .reduce((acc: Record<string, any>, s: any) => { acc[s.section_key] = s; return acc; }, {} as Record<string, any>);
    const defaults = DEFAULT_SECTIONS.map(d => {
      const override = dbDefaultOrder[d.key];
      if (override) return { ...d, icon: override.icon || d.icon, en: override.name_en || d.en, ar: override.name_ar || d.ar };
      return d;
    });
    if (dbSections.length > 0) {
      const orderedKeys = dbSections.map((s: any) => s.section_key);
      const allSections = [...defaults, ...customFromDb];
      const ordered: SectionConfig[] = [];
      for (const key of orderedKeys) {
        const found = allSections.find(s => s.key === key);
        if (found) ordered.push(found);
      }
      for (const d of defaults) {
        if (!ordered.find(s => s.key === d.key)) ordered.push(d);
      }
      return ordered;
    }
    return [...defaults, ...customFromDb];
  }, [dbSections]);

  // ── Data Queries ──
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

  // ── Memoized record filters ──
  const getRecordsForSection = useCallback((key: string) => records.filter(r => r.record_type === key), [records]);
  const competitionCareerRecords = useMemo(() => records.filter(r => r.record_type === "competitions"), [records]);

  const getSectionCount = useCallback((key: string): number => {
    if (key === "memberships") return memberships.length;
    if (key === "competitions") return competitions.length + competitionCareerRecords.length;
    if (key === "awards") return certificates.length;
    return getRecordsForSection(key).length;
  }, [memberships, competitions, competitionCareerRecords, certificates, getRecordsForSection]);

  // ── DnD ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const persistSectionsOrder = useCallback(async (newSections: SectionConfig[]) => {
    for (let i = 0; i < newSections.length; i++) {
      const s = newSections[i];
      await supabase.from("user_career_sections" as any).upsert({
        user_id: userId, section_key: s.key, icon: s.icon,
        name_en: s.en, name_ar: s.ar, color: s.color,
        sort_order: i, is_custom: s.isCustom,
      } as any, { onConflict: "user_id,section_key" });
    }
    queryClient.invalidateQueries({ queryKey: ["user-career-sections", userId] });
  }, [userId, queryClient]);

  const handleDragStart = (event: DragStartEvent) => { setActiveId(String(event.active.id)); };

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeData = active.data.current;
    const overData = over.data.current;

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
    const draggableKeys = ["education", "work", "competitions", "judging", "media", "organizing"];
    if (!draggableKeys.includes(activeSectionKey) && !sections.find(s => s.isCustom && s.key === activeSectionKey)) return;

    if (activeSectionKey === overSectionKey) {
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
      await supabase.from("user_career_records").update({ record_type: overSectionKey }).eq("id", String(active.id));
      queryClient.invalidateQueries({ queryKey: ["career-records", userId] });
      toast({ title: isAr ? "تم نقل العنصر" : "Item moved" });
    }
  }, [records, sections, userId, queryClient, isAr, persistSectionsOrder]);

  // ── Mutations ──
  const closeForm = () => { setAddingSection(null); setEditingId(null); setEditingMembershipId(null); setEditingAwardId(null); setSelectedCompetitionId(""); };

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["career-records", userId] }); toast({ title: editingId ? (isAr ? "تم التحديث" : "Updated") : (isAr ? "تمت الإضافة" : "Added") }); closeForm(); },
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const saveMembershipMutation = useMutation({
    mutationFn: async () => {
      const payload = { entity_id: membershipForm.entity_id, membership_type: membershipForm.membership_type, title: membershipForm.title || null, title_ar: membershipForm.title_ar || null, enrollment_date: membershipForm.enrollment_date || null, notes: membershipForm.notes || null };
      if (editingMembershipId) { const { error } = await supabase.from("entity_memberships").update(payload).eq("id", editingMembershipId); if (error) throw error; }
      else { const { error } = await supabase.from("entity_memberships").insert({ ...payload, user_id: userId, status: "active" }); if (error) throw error; }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["user-entity-memberships", userId] }); toast({ title: editingMembershipId ? (isAr ? "تم التحديث" : "Updated") : (isAr ? "تمت إضافة العضوية" : "Membership added") }); closeForm(); },
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const addCompetitionMutation = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("competition_registrations").insert({ participant_id: userId, competition_id: selectedCompetitionId, status: "approved" }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["user-competition-history", userId] }); toast({ title: isAr ? "تمت إضافة المسابقة" : "Competition added" }); closeForm(); },
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const addManualCompetitionMutation = useMutation({
    mutationFn: async () => {
      const payload = { user_id: userId, record_type: "competitions", entity_id: careerForm.entity_id || null, entity_name: careerForm.entity_name || null, title: careerForm.title, title_ar: careerForm.title_ar || null, description: careerForm.description || null, description_ar: careerForm.description_ar || null, start_date: careerForm.start_date || null, end_date: careerForm.is_current ? null : (careerForm.end_date || null), is_current: careerForm.is_current, location: careerForm.location || null, employment_type: careerForm.employment_type || null, grade: careerForm.grade || null, country_code: careerForm.country_code || null } as any;
      if (editingId) { const { error } = await supabase.from("user_career_records").update(payload).eq("id", editingId); if (error) throw error; }
      else { const { error } = await supabase.from("user_career_records").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["career-records", userId] }); toast({ title: editingId ? (isAr ? "تم التحديث" : "Updated") : (isAr ? "تمت الإضافة" : "Added") }); closeForm(); },
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const addAwardMutation = useMutation({
    mutationFn: async () => {
      const { data: templates } = await supabase.from("certificate_templates").select("id").limit(1);
      const templateId = templates?.[0]?.id;
      if (!templateId) throw new Error("No certificate template found");
      const { error } = await supabase.from("certificates").insert({ recipient_id: userId, recipient_name: "User", template_id: templateId, type: awardForm.type as any, event_name: awardForm.event_name, event_name_ar: awardForm.event_name_ar || null, achievement: awardForm.achievement || null, achievement_ar: awardForm.achievement_ar || null, event_date: awardForm.event_date || null, status: "issued", verification_code: crypto.randomUUID().substring(0, 8).toUpperCase(), issued_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["user-certificates-awards", userId] }); toast({ title: isAr ? "تمت إضافة الجائزة" : "Award added" }); closeForm(); },
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const saveAwardMutation = useMutation({
    mutationFn: async () => {
      if (!editingAwardId) return;
      const { error } = await supabase.from("certificates").update({ event_name: awardForm.event_name, event_name_ar: awardForm.event_name_ar || null, achievement: awardForm.achievement || null, achievement_ar: awardForm.achievement_ar || null, event_date: awardForm.event_date || null, type: awardForm.type as any }).eq("id", editingAwardId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["user-certificates-awards", userId] }); toast({ title: isAr ? "تم التحديث" : "Updated" }); closeForm(); },
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const deleteAwardMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("certificates").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["user-certificates-awards", userId] }); toast({ title: isAr ? "تم الحذف" : "Deleted" }); },
  });

  const deleteCareerMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("user_career_records").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["career-records", userId] }); toast({ title: isAr ? "تم الحذف" : "Deleted" }); },
  });

  const deleteMembershipMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("entity_memberships").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["user-entity-memberships", userId] }); toast({ title: isAr ? "تم الحذف" : "Deleted" }); },
  });

  const moveRecordToSection = useMutation({
    mutationFn: async ({ id, targetSection }: { id: string; targetSection: string }) => {
      const { error } = await supabase.from("user_career_records").update({ record_type: targetSection }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["career-records", userId] }); toast({ title: isAr ? "تم نقل العنصر" : "Item moved" }); },
    onError: (err: any) => toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" }),
  });

  const getMoveSections = useCallback((currentKey: string) => {
    const movableKeys = ["education", "work", "competitions", "judging", "media", "organizing"];
    return sections.filter(s => s.key !== currentKey && (movableKeys.includes(s.key) || s.isCustom)).map(s => ({ key: s.key, label: isAr ? s.ar : s.en }));
  }, [sections, isAr]);

  // ── Form Starters ──
  const resetCareerForm = (type: string) => {
    setCareerForm({ record_type: type, entity_id: null, entity_name: "", title: "", title_ar: "", education_level: "", field_of_study: "", field_of_study_ar: "", grade: "", department: "", department_ar: "", employment_type: "", start_date: "", end_date: "", is_current: false, description: "", description_ar: "", location: "", country_code: "" });
  };
  const startAddCareer = (type: string) => { resetCareerForm(type); setEditingId(null); setAddingSection(type); };
  const startEditCareer = (record: CareerRecord) => {
    setCareerForm({ record_type: record.record_type, entity_id: record.entity_id, entity_name: record.entity_name || "", title: record.title, title_ar: record.title_ar || "", education_level: record.education_level || "", field_of_study: record.field_of_study || "", field_of_study_ar: record.field_of_study_ar || "", grade: record.grade || "", department: record.department || "", department_ar: record.department_ar || "", employment_type: record.employment_type || "", start_date: record.start_date || "", end_date: record.end_date || "", is_current: record.is_current, description: record.description || "", description_ar: record.description_ar || "", location: record.location || "", country_code: record.country_code || "" });
    setEditingId(record.id); setAddingSection(record.record_type);
  };
  const startAddMembership = () => { setMembershipForm({ entity_id: "", membership_type: "member", title: "", title_ar: "", enrollment_date: "", notes: "" }); setEditingMembershipId(null); setAddingSection("memberships"); };
  const startEditMembership = (m: any) => { setMembershipForm({ entity_id: m.entity_id || "", membership_type: m.membership_type || "member", title: m.title || "", title_ar: m.title_ar || "", enrollment_date: m.enrollment_date || "", notes: m.notes || "" }); setEditingMembershipId(m.id); setAddingSection("memberships"); };
  const startAddAward = () => { setAwardForm({ event_name: "", event_name_ar: "", achievement: "", achievement_ar: "", type: "participation", event_date: "" }); setEditingAwardId(null); setAddingSection("awards"); };
  const startEditAward = (cert: any) => { setAwardForm({ event_name: cert.event_name || "", event_name_ar: cert.event_name_ar || "", achievement: cert.achievement || "", achievement_ar: cert.achievement_ar || "", type: cert.type || "participation", event_date: cert.event_date || "" }); setEditingAwardId(cert.id); setAddingSection("awards"); };

  // ── Section Management ──
  const startEditSectionTitle = (section: SectionConfig) => { setEditingSectionKey(section.key); setSectionEditName({ en: section.en, ar: section.ar }); };
  const saveSectionTitle = async () => {
    if (!editingSectionKey) return;
    const updated = sections.map(s => s.key === editingSectionKey ? { ...s, en: sectionEditName.en || s.en, ar: sectionEditName.ar || s.ar } : s);
    await persistSectionsOrder(updated);
    setEditingSectionKey(null);
    toast({ title: isAr ? "تم تحديث العنوان" : "Title updated" });
  };
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
  const addCustomSection = async () => {
    if (!newSectionName.en.trim()) return;
    const key = `custom_${Date.now()}`;
    const colorIndex = sections.filter(s => s.isCustom).length % CUSTOM_SECTION_COLORS.length;
    const newSection: SectionConfig = { key, icon: "FileText", en: newSectionName.en, ar: newSectionName.ar || newSectionName.en, color: CUSTOM_SECTION_COLORS[colorIndex], isCustom: true };
    await supabase.from("user_career_sections" as any).insert({ user_id: userId, section_key: key, icon: newSection.icon, name_en: newSection.en, name_ar: newSection.ar, color: newSection.color, sort_order: sections.length, is_custom: true } as any);
    if (dbSections.length === 0) { await persistSectionsOrder([...sections, newSection]); } else { queryClient.invalidateQueries({ queryKey: ["user-career-sections", userId] }); }
    setExpandedSections(prev => new Set([...prev, key]));
    setNewSectionName({ en: "", ar: "" }); setAddingSectionDialog(false);
    toast({ title: isAr ? "تم إنشاء القسم" : "Section created" });
  };
  const deleteCustomSection = async (key: string) => {
    await supabase.from("user_career_sections" as any).delete().eq("user_id", userId).eq("section_key", key);
    await supabase.from("user_career_records").delete().eq("user_id", userId).eq("record_type", key);
    queryClient.invalidateQueries({ queryKey: ["user-career-sections", userId] });
    queryClient.invalidateQueries({ queryKey: ["career-records", userId] });
    toast({ title: isAr ? "تم حذف القسم" : "Section deleted" });
  };

  const toggleSection = (key: string) => setExpandedSections(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });

  const getSectionItemIds = (key: string): string[] => {
    const draggableKeys = ["education", "work", "competitions", "judging", "media", "organizing"];
    if (draggableKeys.includes(key) || sections.find(s => s.isCustom && s.key === key)) return getRecordsForSection(key).map(r => r.id);
    return [];
  };

  const sectionIds = useMemo(() => sections.map(s => s.key), [sections]);

  // ── Render ──
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-3">
        {/* Header Actions */}
        <div className="flex gap-2 justify-end flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setAddingSectionDialog(true)}>
            <FolderPlus className="h-3.5 w-3.5" />{isAr ? "قسم جديد" : "New Section"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setCvImportOpen(true)}>
            <FileText className="h-4 w-4" />{isAr ? "استيراد سيرة ذاتية" : "Import CV"}
          </Button>
        </div>

        {/* Add Section Dialog */}
        {addingSectionDialog && (
          <div className="rounded-xl border bg-card/50 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/30">
              <h4 className="text-sm font-semibold flex items-center gap-2"><FolderPlus className="h-4 w-4" />{isAr ? "إنشاء قسم جديد" : "Create New Section"}</h4>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setAddingSectionDialog(false)}><X className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <TranslatableInput label={isAr ? "الاسم (EN) *" : "Name (EN) *"} value={newSectionName.en} onChange={(v) => setNewSectionName(p => ({ ...p, en: v }))} dir="ltr" lang="en" placeholder="e.g., Volunteering" pairedValue={newSectionName.ar} onTranslated={(v) => setNewSectionName(p => ({ ...p, ar: v }))} />
              <TranslatableInput label={isAr ? "الاسم (AR)" : "Name (AR)"} value={newSectionName.ar} onChange={(v) => setNewSectionName(p => ({ ...p, ar: v }))} dir="rtl" lang="ar" placeholder="مثل: التطوع" pairedValue={newSectionName.en} onTranslated={(v) => setNewSectionName(p => ({ ...p, en: v }))} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => setAddingSectionDialog(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button size="sm" className="flex-1 h-8 text-xs gap-1" onClick={addCustomSection} disabled={!newSectionName.en.trim()}><Check className="h-3 w-3" />{isAr ? "إنشاء" : "Create"}</Button>
            </div>
          </div>
        )}

        <CVImportDialog open={cvImportOpen} onOpenChange={setCvImportOpen} targetUserId={userId} isAr={isAr}
          onImported={() => { queryClient.invalidateQueries({ queryKey: ["career-records", userId] }); queryClient.invalidateQueries({ queryKey: ["user-entity-memberships", userId] }); }} />

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
                    <button onClick={() => toggleSection(section.key)} className="flex-1 flex items-center gap-3 px-2 py-4 hover:bg-muted/40 transition-all group">
                      <Popover>
                        <PopoverTrigger asChild>
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${section.color} group-hover:scale-110 transition-transform cursor-pointer`}
                            onClick={e => e.stopPropagation()} title={isAr ? "تغيير الأيقونة" : "Change icon"}>
                            <IconComp className="h-4.5 w-4.5" />
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align="start" onClick={e => e.stopPropagation()}>
                          <p className="text-[10px] font-semibold text-muted-foreground px-1 pb-1.5">{isAr ? "اختر أيقونة" : "Pick icon"}</p>
                          <div className="grid grid-cols-3 gap-1">
                            {AVAILABLE_ICONS.map(ic => (
                              <button key={ic.key} onClick={() => changeSectionIcon(section.key, ic.key)}
                                className={`flex items-center justify-center h-9 w-9 rounded-lg transition-all ${section.icon === ic.key ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "hover:bg-muted/60 text-muted-foreground"}`} title={ic.label}>
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
                              <Input value={sectionEditName.en} onChange={e => setSectionEditName(p => ({ ...p, en: e.target.value }))} className="h-7 text-xs w-24" dir="ltr" placeholder="EN" />
                              {sectionEditName.en?.trim() && <TranslateInlineButton text={sectionEditName.en} fromLang="en" toLang="ar" onTranslated={(v) => setSectionEditName(p => ({ ...p, ar: v }))} isAr={isAr} />}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Input value={sectionEditName.ar} onChange={e => setSectionEditName(p => ({ ...p, ar: e.target.value }))} className="h-7 text-xs w-24" dir="rtl" placeholder="AR" />
                              {sectionEditName.ar?.trim() && <TranslateInlineButton text={sectionEditName.ar} fromLang="ar" toLang="en" onTranslated={(v) => setSectionEditName(p => ({ ...p, en: v }))} isAr={isAr} />}
                            </div>
                            <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={saveSectionTitle}><Check className="h-3 w-3 text-primary" /></Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => setEditingSectionKey(null)}><X className="h-3 w-3" /></Button>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold">{isAr ? section.ar : section.en}</span>
                        )}
                      </div>
                      {count > 0 && <Badge variant="outline" className="text-xs h-6 px-2.5 font-medium">{count}</Badge>}
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => startEditSectionTitle(section)} title={isAr ? "تعديل العنوان" : "Edit title"}><Type className="h-3 w-3" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/60 hover:text-destructive" title={isAr ? "حذف القسم" : "Delete section"}><Trash2 className="h-3 w-3" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{isAr ? "تأكيد الحذف" : "Confirm Deletion"}</AlertDialogTitle>
                            <AlertDialogDescription>{isAr ? `هل أنت متأكد من حذف قسم "${section.ar}"؟` : `Are you sure you want to delete the "${section.en}" section?`}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => section.isCustom ? deleteCustomSection(section.key) : deleteSection(section.key)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{isAr ? "حذف" : "Delete"}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Section Content — delegated to SectionContent */}
                  {isExpanded && (
                    <div className="border-t px-5 py-4 space-y-2.5">
                      <SectionContent
                        section={section} isAr={isAr} isAddingHere={isAddingHere} itemIds={itemIds}
                        sectionRecords={getRecordsForSection(section.key)}
                        careerForm={careerForm} editingId={editingId}
                        saveCareerPending={saveCareerMutation.isPending}
                        onUpdateCareer={(k, v) => setCareerForm(prev => ({ ...prev, [k]: v }))}
                        onSaveCareer={() => saveCareerMutation.mutate()}
                        onStartEditCareer={startEditCareer}
                        onDeleteCareer={(id) => deleteCareerMutation.mutate(id)}
                        onStartAddCareer={startAddCareer}
                        onCloseForm={closeForm}
                        getMoveSections={getMoveSections}
                        onMoveRecord={(id, target) => moveRecordToSection.mutate({ id, targetSection: target })}
                        // Memberships
                        memberships={memberships}
                        membershipForm={membershipForm}
                        editingMembershipId={editingMembershipId}
                        saveMembershipPending={saveMembershipMutation.isPending}
                        onUpdateMembership={(k, v) => setMembershipForm(prev => ({ ...prev, [k]: v }))}
                        onSaveMembership={() => saveMembershipMutation.mutate()}
                        onStartAddMembership={startAddMembership}
                        onStartEditMembership={startEditMembership}
                        onDeleteMembership={(id) => deleteMembershipMutation.mutate(id)}
                        // Competitions
                        competitions={competitions}
                        availableCompetitions={availableCompetitions}
                        selectedCompetitionId={selectedCompetitionId}
                        onSelectCompetition={setSelectedCompetitionId}
                        addCompetitionPending={addCompetitionMutation.isPending}
                        onSaveLinkCompetition={() => addCompetitionMutation.mutate()}
                        addManualCompetitionPending={addManualCompetitionMutation.isPending}
                        onSaveManualCompetition={() => addManualCompetitionMutation.mutate()}
                        competitionCareerRecords={competitionCareerRecords}
                        onDeleteCompetitionReg={(id) => { supabase.from("competition_registrations").delete().eq("id", id).then(() => { queryClient.invalidateQueries({ queryKey: ["user-competition-history", userId] }); toast({ title: isAr ? "تم الحذف" : "Deleted" }); }); }}
                        // Awards
                        certificates={certificates}
                        awardForm={awardForm}
                        editingAwardId={editingAwardId}
                        addAwardPending={addAwardMutation.isPending}
                        saveAwardPending={saveAwardMutation.isPending}
                        onUpdateAward={(k, v) => setAwardForm(prev => ({ ...prev, [k]: v }))}
                        onSaveAward={() => saveAwardMutation.mutate()}
                        onAddAward={() => addAwardMutation.mutate()}
                        onStartAddAward={startAddAward}
                        onStartEditAward={startEditAward}
                        onDeleteAward={(id) => deleteAwardMutation.mutate(id)}
                      />
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
