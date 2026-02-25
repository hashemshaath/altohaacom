import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { SectionConfig, CareerRecord } from "./constants";

interface MutationDeps {
  userId: string;
  isAr: boolean;
  sections: SectionConfig[];
  careerForm: any;
  membershipForm: any;
  awardForm: any;
  editingId: string | null;
  editingMembershipId: string | null;
  editingAwardId: string | null;
  selectedCompetitionId: string;
  closeForm: () => void;
}

export function useCareerMutations(deps: MutationDeps) {
  const { userId, isAr, sections, careerForm, membershipForm, awardForm, editingId, editingMembershipId, editingAwardId, selectedCompetitionId, closeForm } = deps;
  const queryClient = useQueryClient();

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

  const getMoveSections = useCallback((currentKey: string) => {
    const movableKeys = ["education", "work", "competitions", "judging", "media", "organizing"];
    return sections.filter(s => s.key !== currentKey && (movableKeys.includes(s.key) || s.isCustom)).map(s => ({ key: s.key, label: isAr ? s.ar : s.en }));
  }, [sections, isAr]);

  return {
    saveCareerMutation, saveMembershipMutation, addCompetitionMutation,
    addManualCompetitionMutation, addAwardMutation, saveAwardMutation,
    deleteAwardMutation, deleteCareerMutation, deleteMembershipMutation,
    moveRecordToSection, persistSectionsOrder, getMoveSections,
  };
}
