import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react";
import { StepIndicator } from "@/components/competitions/wizard/StepIndicator";
import { ExhibitionStep } from "@/components/competitions/wizard/ExhibitionStep";
import { BasicInfoStep } from "@/components/competitions/wizard/BasicInfoStep";
import { DatesLocationStep } from "@/components/competitions/wizard/DatesLocationStep";
import { TypesCategoriesStep } from "@/components/competitions/wizard/TypesCategoriesStep";
import { CriteriaStep } from "@/components/competitions/wizard/CriteriaStep";
import { SupervisingBodiesStep } from "@/components/competitions/wizard/SupervisingBodiesStep";
import { ReviewStep } from "@/components/competitions/wizard/ReviewStep";
import type { CompetitionFormData } from "@/components/competitions/wizard/types";

const STEP_LABELS_EN = ["Exhibition", "Basic Info", "Types & Categories", "Schedule", "Supervising & Judges", "Criteria", "Review"];
const STEP_LABELS_AR = ["المعرض", "المعلومات", "الأنواع والفئات", "الجدول", "الإشراف والتحكيم", "المعايير", "المراجعة"];

export default function EditCompetition() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [step, setStep] = useState(1);
  const [data, setData] = useState<CompetitionFormData | null>(null);

  const updateData = useCallback((updates: Partial<CompetitionFormData>) => {
    setData((prev) => prev ? { ...prev, ...updates } : null);
  }, []);

  const { data: competition, isLoading } = useQuery({
    queryKey: ["competition", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Competition not found");
      return data;
    },
    enabled: !!id,
  });

  const { data: existingCategories } = useQuery({
    queryKey: ["competition-categories", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("competition_categories").select("*").eq("competition_id", id).order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: existingCriteria } = useQuery({
    queryKey: ["judging-criteria", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("judging_criteria").select("*").eq("competition_id", id).order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: existingTypeAssignments } = useQuery({
    queryKey: ["competition-type-assignments", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("competition_type_assignments").select("type_id").eq("competition_id", id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: existingSupervisingBodies } = useQuery({
    queryKey: ["competition-supervising-bodies", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("competition_supervising_bodies").select("entity_id").eq("competition_id", id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: existingJudges } = useQuery({
    queryKey: ["competition-judges-edit", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("competition_judges").select("judge_id").eq("competition_id", id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Populate form when all data loads
  useEffect(() => {
    if (competition && existingCategories && existingCriteria && existingTypeAssignments && existingSupervisingBodies && existingJudges) {
      setData({
        title: competition.title,
        titleAr: competition.title_ar || "",
        description: competition.description || "",
        descriptionAr: competition.description_ar || "",
        coverImageUrl: competition.cover_image_url,
        rulesSummary: competition.rules_summary || "",
        rulesSummaryAr: competition.rules_summary_ar || "",
        scoringNotes: competition.scoring_notes || "",
        scoringNotesAr: competition.scoring_notes_ar || "",
        registrationStart: competition.registration_start ? competition.registration_start.slice(0, 16) : "",
        registrationEnd: competition.registration_end ? competition.registration_end.slice(0, 16) : "",
        competitionStart: competition.competition_start.slice(0, 16),
        competitionEnd: competition.competition_end.slice(0, 16),
        isVirtual: competition.is_virtual || false,
        venue: competition.venue || "",
        venueAr: competition.venue_ar || "",
        city: competition.city || "",
        country: competition.country || "",
        countryCode: competition.country_code || "",
        editionYear: competition.edition_year || new Date().getFullYear(),
        maxParticipants: competition.max_participants || "",
        exhibitionId: competition.exhibition_id || null,
        selectedTypeIds: existingTypeAssignments.map((t) => t.type_id),
        supervisingBodyIds: existingSupervisingBodies.map((s) => s.entity_id),
        judgeIds: existingJudges.map((j) => j.judge_id),
        categories: existingCategories.map((c) => ({
          id: c.id,
          name: c.name,
          name_ar: c.name_ar || "",
          description: c.description || "",
          description_ar: c.description_ar || "",
          max_participants: c.max_participants,
          gender: c.gender || "mixed",
        })),
        criteria: existingCriteria.map((c) => ({
          id: c.id,
          name: c.name,
          name_ar: c.name_ar || "",
          description: c.description || "",
          description_ar: c.description_ar || "",
          max_score: c.max_score,
          weight: Number(c.weight),
        })),
      });
    }
  }, [competition, existingCategories, existingCriteria, existingTypeAssignments, existingSupervisingBodies, existingJudges]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id || !data) throw new Error("Not authenticated");

      // Update competition
      const { error } = await supabase.from("competitions").update({
        title: data.title,
        title_ar: data.titleAr || null,
        description: data.description || null,
        description_ar: data.descriptionAr || null,
        cover_image_url: data.coverImageUrl,
        rules_summary: data.rulesSummary || null,
        rules_summary_ar: data.rulesSummaryAr || null,
        scoring_notes: data.scoringNotes || null,
        scoring_notes_ar: data.scoringNotesAr || null,
        registration_start: data.registrationStart || null,
        registration_end: data.registrationEnd || null,
        competition_start: data.competitionStart,
        competition_end: data.competitionEnd,
        is_virtual: data.isVirtual,
        venue: data.isVirtual ? null : data.venue || null,
        venue_ar: data.isVirtual ? null : data.venueAr || null,
        city: data.isVirtual ? null : data.city || null,
        country: data.isVirtual ? null : data.country || null,
        country_code: data.countryCode.toUpperCase() || null,
        edition_year: data.editionYear || null,
        max_participants: data.maxParticipants || null,
        exhibition_id: data.exhibitionId || null,
      }).eq("id", id);
      if (error) throw error;

      // Sync type assignments
      await supabase.from("competition_type_assignments").delete().eq("competition_id", id);
      if (data.selectedTypeIds.length > 0) {
        const { error: typeError } = await supabase
          .from("competition_type_assignments")
          .insert(data.selectedTypeIds.map((typeId) => ({ competition_id: id, type_id: typeId })));
        if (typeError) throw typeError;
      }

      // Sync categories
      const existingCatIds = existingCategories?.map((c) => c.id) || [];
      const currentCatIds = data.categories.filter((c) => c.id).map((c) => c.id!);
      const deletedCatIds = existingCatIds.filter((eid) => !currentCatIds.includes(eid));
      if (deletedCatIds.length > 0) {
        await supabase.from("competition_categories").delete().in("id", deletedCatIds);
      }
      const validCategories = data.categories.filter((c) => c.name.trim());
      for (let i = 0; i < validCategories.length; i++) {
        const cat = validCategories[i];
        const catData = {
          name: cat.name, name_ar: cat.name_ar || null,
          description: cat.description || null, description_ar: cat.description_ar || null,
          max_participants: cat.max_participants, gender: cat.gender || "mixed",
          sort_order: i + 1,
        };
        if (cat.id) {
          await supabase.from("competition_categories").update(catData).eq("id", cat.id);
        } else {
          await supabase.from("competition_categories").insert({ ...catData, competition_id: id });
        }
      }

      // Sync criteria
      const existingCritIds = existingCriteria?.map((c) => c.id) || [];
      const currentCritIds = data.criteria.filter((c) => c.id).map((c) => c.id!);
      const deletedCritIds = existingCritIds.filter((eid) => !currentCritIds.includes(eid));
      if (deletedCritIds.length > 0) {
        await supabase.from("judging_criteria").delete().in("id", deletedCritIds);
      }
      const validCriteria = data.criteria.filter((c) => c.name.trim());
      for (let i = 0; i < validCriteria.length; i++) {
        const crit = validCriteria[i];
        const critData = {
          name: crit.name, name_ar: crit.name_ar || null,
          description: crit.description || null, description_ar: crit.description_ar || null,
          max_score: crit.max_score, weight: crit.weight, sort_order: i + 1,
        };
        if (crit.id) {
          await supabase.from("judging_criteria").update(critData).eq("id", crit.id);
        } else {
          await supabase.from("judging_criteria").insert({ ...critData, competition_id: id });
        }
      }

      // Sync supervising bodies
      await supabase.from("competition_supervising_bodies").delete().eq("competition_id", id);
      if (data.supervisingBodyIds.length > 0) {
        const { error: supError } = await supabase
          .from("competition_supervising_bodies")
          .insert(data.supervisingBodyIds.map((entityId) => ({ competition_id: id, entity_id: entityId, role: "supervisor" })));
        if (supError) throw supError;
      }

      // Sync judges
      await supabase.from("competition_judges").delete().eq("competition_id", id);
      if (data.judgeIds.length > 0) {
        const { error: judgeError } = await supabase
          .from("competition_judges")
          .insert(data.judgeIds.map((judgeId) => ({ competition_id: id, judge_id: judgeId, assigned_by: user.id })));
        if (judgeError) throw judgeError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition", id] });
      queryClient.invalidateQueries({ queryKey: ["competition-categories", id] });
      queryClient.invalidateQueries({ queryKey: ["judging-criteria", id] });
      queryClient.invalidateQueries({ queryKey: ["competition-type-assignments", id] });
      queryClient.invalidateQueries({ queryKey: ["competition-supervising-bodies", id] });
      queryClient.invalidateQueries({ queryKey: ["competition-judges-edit", id] });
      toast({ title: isAr ? "تم حفظ التغييرات!" : "Changes saved!" });
      navigate(`/competitions/${id}`);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const canProceed = () => {
    if (!data) return false;
    if (step === 1) return true;
    if (step === 2) return data.title.trim() !== "";
    if (step === 3) return data.selectedTypeIds.length > 0 && data.categories.some((c) => c.name.trim() !== "");
    if (step === 4) return data.competitionStart !== "" && data.competitionEnd !== "" && data.countryCode.length === 2;
    if (step === 5) return true;
    if (step === 6) return data.criteria.some((c) => c.name.trim() !== "");
    return true;
  };

  const totalSteps = 7;
  const isOrganizer = user && competition && competition.organizer_id === user.id;

  if (isLoading || (competition && !data)) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-8">
          <Skeleton className="mb-4 h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!competition || !isOrganizer || !data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-8 text-center">
          <p className="text-muted-foreground">
            {!competition
              ? isAr ? "المسابقة غير موجودة" : "Competition not found"
              : isAr ? "ليس لديك صلاحية تعديل هذه المسابقة" : "You don't have permission to edit this competition"}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/competitions/${id}`)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {isAr ? "العودة للمسابقة" : "Back to Competition"}
        </Button>

        <div className="mx-auto max-w-2xl">
          <h1 className="mb-2 font-serif text-3xl font-bold">
            {isAr ? "تعديل المسابقة" : "Edit Competition"}
          </h1>
          <p className="mb-1 text-muted-foreground">
            {isAr ? "قم بتحديث تفاصيل المسابقة" : "Update the competition details"}
          </p>
          <p className="mb-6 text-xs text-muted-foreground">
            {isAr ? STEP_LABELS_AR[step - 1] : STEP_LABELS_EN[step - 1]} ({step}/{totalSteps})
          </p>

          <StepIndicator currentStep={step} totalSteps={totalSteps} />

          {step === 1 && (
            <ExhibitionStep
              selectedId={data.exhibitionId}
              onChange={(exhId) => updateData({ exhibitionId: exhId })}
            />
          )}
          {step === 2 && <BasicInfoStep data={data} onChange={updateData} />}
          {step === 3 && (
            <TypesCategoriesStep
              selectedTypeIds={data.selectedTypeIds}
              categories={data.categories}
              onTypeChange={(ids) => updateData({ selectedTypeIds: ids })}
              onCategoriesChange={(cats) => updateData({ categories: cats })}
            />
          )}
          {step === 4 && <DatesLocationStep data={data} onChange={updateData} competitionNumber={competition.competition_number} />}
          {step === 5 && (
            <SupervisingBodiesStep
              supervisingBodyIds={data.supervisingBodyIds}
              judgeIds={data.judgeIds}
              onSupervisingChange={(ids) => updateData({ supervisingBodyIds: ids })}
              onJudgesChange={(ids) => updateData({ judgeIds: ids })}
            />
          )}
          {step === 6 && <CriteriaStep criteria={data.criteria} onChange={(crits) => updateData({ criteria: crits })} />}
          {step === 7 && <ReviewStep data={data} />}

          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {isAr ? "السابق" : "Previous"}
            </Button>

            {step < totalSteps ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                {isAr ? "التالي" : "Next"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || !data.title.trim()}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isAr ? "حفظ التغييرات" : "Save Changes"}
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
