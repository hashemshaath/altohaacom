import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { ICON_MAP, AVAILABLE_ICONS } from "./career-timeline/constants";
import {
  TranslateInlineButton, SortableSectionItem, SectionDragHandle,
} from "./career-timeline/shared-ui";
import { SectionContent } from "./career-timeline/section-renderer";
import { useCareerData } from "./career-timeline/useCareerData";
import { useCareerMutations } from "./career-timeline/useCareerMutations";
import { CareerTimelineSkeleton } from "./career-timeline/CareerTimelineSkeleton";

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

  // ── Extracted hooks ──
  const {
    dbSections, sections, records, memberships, competitions, certificates,
    competitionCareerRecords, getRecordsForSection, getSectionCount,
    getSectionItemIds, sectionIds, isLoading,
  } = useCareerData(userId);

  const closeForm = useCallback(() => {
    setAddingSection(null); setEditingId(null); setEditingMembershipId(null);
    setEditingAwardId(null); setSelectedCompetitionId("");
  }, []);

  const {
    saveCareerMutation, saveMembershipMutation, addCompetitionMutation,
    addManualCompetitionMutation, addAwardMutation, saveAwardMutation,
    deleteAwardMutation, deleteCareerMutation, deleteMembershipMutation,
    moveRecordToSection, persistSectionsOrder, getMoveSections,
  } = useCareerMutations({
    userId, isAr, sections, careerForm, membershipForm, awardForm,
    editingId, editingMembershipId, editingAwardId, selectedCompetitionId, closeForm,
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

  // ── DnD ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
    const { CUSTOM_SECTION_COLORS } = await import("./career-timeline/constants");
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

  // ── Loading State ──
  if (isLoading) return <CareerTimelineSkeleton />;

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
          <div className="rounded-xl border bg-card/50 p-4 space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
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
                                className={`flex items-center justify-center h-9 w-9 rounded-xl transition-all ${section.icon === ic.key ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "hover:bg-muted/60 text-muted-foreground"}`} title={ic.label}>
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

                  {/* Section Content */}
                  {isExpanded && (
                    <div className="border-t px-5 py-4 space-y-2.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
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
                        memberships={memberships}
                        membershipForm={membershipForm}
                        editingMembershipId={editingMembershipId}
                        saveMembershipPending={saveMembershipMutation.isPending}
                        onUpdateMembership={(k, v) => setMembershipForm(prev => ({ ...prev, [k]: v }))}
                        onSaveMembership={() => saveMembershipMutation.mutate()}
                        onStartAddMembership={startAddMembership}
                        onStartEditMembership={startEditMembership}
                        onDeleteMembership={(id) => deleteMembershipMutation.mutate(id)}
                        competitions={competitions}
                        availableCompetitions={availableCompetitions}
                        selectedCompetitionId={selectedCompetitionId}
                        onSelectCompetition={setSelectedCompetitionId}
                        addCompetitionPending={addCompetitionMutation.isPending}
                        onSaveLinkCompetition={() => addCompetitionMutation.mutate()}
                        addManualCompetitionPending={addManualCompetitionMutation.isPending}
                        onSaveManualCompetition={() => addManualCompetitionMutation.mutate()}
                        competitionCareerRecords={competitionCareerRecords}
                        onDeleteCompetitionReg={(id) => deleteCareerMutation.mutate(id)}
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
