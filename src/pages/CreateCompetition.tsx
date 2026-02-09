import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react";
import { StepIndicator } from "@/components/competitions/wizard/StepIndicator";
import { BasicInfoStep } from "@/components/competitions/wizard/BasicInfoStep";
import { DatesLocationStep } from "@/components/competitions/wizard/DatesLocationStep";
import { CategoriesStep } from "@/components/competitions/wizard/CategoriesStep";
import { CriteriaStep } from "@/components/competitions/wizard/CriteriaStep";
import { ReviewStep } from "@/components/competitions/wizard/ReviewStep";
import { emptyCategory, emptyCriteria } from "@/components/competitions/wizard/types";
import type { CompetitionFormData } from "@/components/competitions/wizard/types";

const initialData: CompetitionFormData = {
  title: "", titleAr: "", description: "", descriptionAr: "",
  coverImageUrl: null, rulesSummary: "", rulesSummaryAr: "",
  scoringNotes: "", scoringNotesAr: "",
  registrationStart: "", registrationEnd: "",
  competitionStart: "", competitionEnd: "",
  isVirtual: false, venue: "", venueAr: "",
  city: "", country: "", countryCode: "",
  editionYear: new Date().getFullYear(), maxParticipants: "",
  categories: [{ ...emptyCategory }],
  criteria: [{ ...emptyCriteria }],
};

export default function CreateCompetition() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<CompetitionFormData>(initialData);

  const updateData = useCallback((updates: Partial<CompetitionFormData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const canProceed = () => {
    if (step === 1) return data.title.trim() !== "";
    if (step === 2) return data.competitionStart !== "" && data.competitionEnd !== "" && data.countryCode.length === 2;
    if (step === 3) return data.categories.some((c) => c.name.trim() !== "");
    if (step === 4) return data.criteria.some((c) => c.name.trim() !== "");
    return true;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data: competition, error: compError } = await supabase
        .from("competitions")
        .insert({
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
          organizer_id: user.id,
          status: "draft",
        })
        .select()
        .single();

      if (compError) throw compError;

      const validCategories = data.categories.filter((c) => c.name.trim());
      if (validCategories.length > 0) {
        const { error: catError } = await supabase
          .from("competition_categories")
          .insert(
            validCategories.map((cat, index) => ({
              competition_id: competition.id,
              name: cat.name,
              name_ar: cat.name_ar || null,
              description: cat.description || null,
              description_ar: cat.description_ar || null,
              max_participants: cat.max_participants,
              gender: cat.gender || "mixed",
              sort_order: index + 1,
            }))
          );
        if (catError) throw catError;
      }

      const validCriteria = data.criteria.filter((c) => c.name.trim());
      if (validCriteria.length > 0) {
        const { error: critError } = await supabase
          .from("judging_criteria")
          .insert(
            validCriteria.map((crit, index) => ({
              competition_id: competition.id,
              name: crit.name,
              name_ar: crit.name_ar || null,
              description: crit.description || null,
              description_ar: crit.description_ar || null,
              max_score: crit.max_score,
              weight: crit.weight,
              sort_order: index + 1,
            }))
          );
        if (critError) throw critError;
      }

      return competition;
    },
    onSuccess: (competition) => {
      toast({
        title: language === "ar" ? "تم إنشاء المسابقة!" : "Competition created!",
        description: language === "ar" ? "تم حفظ المسابقة كمسودة." : "Your competition has been saved as a draft.",
      });
      navigate(`/competitions/${competition.id}`);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/competitions")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {language === "ar" ? "العودة للمسابقات" : "Back to Competitions"}
        </Button>

        <div className="mx-auto max-w-2xl">
          <h1 className="mb-2 font-serif text-3xl font-bold">{t("createCompetition")}</h1>
          <p className="mb-6 text-muted-foreground">
            {language === "ar" ? "أدخل التفاصيل لإنشاء مسابقة جديدة" : "Fill in the details to create a new competition"}
          </p>

          <StepIndicator currentStep={step} totalSteps={5} />

          {step === 1 && <BasicInfoStep data={data} onChange={updateData} />}
          {step === 2 && <DatesLocationStep data={data} onChange={updateData} />}
          {step === 3 && <CategoriesStep categories={data.categories} onChange={(cats) => updateData({ categories: cats })} />}
          {step === 4 && <CriteriaStep criteria={data.criteria} onChange={(crits) => updateData({ criteria: crits })} />}
          {step === 5 && <ReviewStep data={data} />}

          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === "ar" ? "السابق" : "Previous"}
            </Button>

            {step < 5 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                {language === "ar" ? "التالي" : "Next"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !data.title.trim()}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {language === "ar" ? "إنشاء المسابقة" : "Create Competition"}
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
