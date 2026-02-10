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
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { BasicInfoStep } from "@/components/competitions/wizard/BasicInfoStep";
import { DatesLocationStep } from "@/components/competitions/wizard/DatesLocationStep";
import { CategoriesStep } from "@/components/competitions/wizard/CategoriesStep";
import { CriteriaStep } from "@/components/competitions/wizard/CriteriaStep";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CompetitionFormData, CategoryForm, CriteriaForm as CriteriaFormType } from "@/components/competitions/wizard/types";

export default function EditCompetition() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [data, setData] = useState<CompetitionFormData | null>(null);

  const updateData = useCallback((updates: Partial<CompetitionFormData>) => {
    setData((prev) => prev ? { ...prev, ...updates } : null);
  }, []);

  const { data: competition, isLoading } = useQuery({
    queryKey: ["competition", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("*").eq("id", id).single();
      if (error) throw error;
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

  // Populate form when data loads
  useEffect(() => {
    if (competition && existingCategories && existingCriteria) {
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
        selectedTypeIds: [],
        supervisingBodyIds: [],
        judgeIds: [],
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
  }, [competition, existingCategories, existingCriteria]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id || !data) throw new Error("Not authenticated");

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
      }).eq("id", id);
      if (error) throw error;

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition", id] });
      queryClient.invalidateQueries({ queryKey: ["competition-categories", id] });
      queryClient.invalidateQueries({ queryKey: ["judging-criteria", id] });
      toast({ title: language === "ar" ? "تم حفظ التغييرات!" : "Changes saved!" });
      navigate(`/competitions/${id}`);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !data.title.trim() || !data.competitionStart || !data.competitionEnd) {
      toast({ variant: "destructive", title: language === "ar" ? "حقول مطلوبة" : "Required fields", description: language === "ar" ? "يرجى ملء العنوان وتواريخ المسابقة" : "Please fill in title and competition dates" });
      return;
    }
    updateMutation.mutate();
  };

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
              ? language === "ar" ? "المسابقة غير موجودة" : "Competition not found"
              : language === "ar" ? "ليس لديك صلاحية تعديل هذه المسابقة" : "You don't have permission to edit this competition"}
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
          {language === "ar" ? "العودة للمسابقة" : "Back to Competition"}
        </Button>

        <div className="mx-auto max-w-2xl">
          <h1 className="mb-2 font-serif text-3xl font-bold">
            {language === "ar" ? "تعديل المسابقة" : "Edit Competition"}
          </h1>
          <p className="mb-6 text-muted-foreground">
            {language === "ar" ? "قم بتحديث تفاصيل المسابقة" : "Update the competition details"}
          </p>

          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="info" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">{language === "ar" ? "المعلومات" : "Info"}</TabsTrigger>
                <TabsTrigger value="schedule">{language === "ar" ? "الجدول" : "Schedule"}</TabsTrigger>
                <TabsTrigger value="categories">{language === "ar" ? "الفئات" : "Categories"}</TabsTrigger>
                <TabsTrigger value="criteria">{language === "ar" ? "المعايير" : "Criteria"}</TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <BasicInfoStep data={data} onChange={updateData} />
              </TabsContent>
              <TabsContent value="schedule">
                <DatesLocationStep data={data} onChange={updateData} competitionNumber={competition.competition_number} />
              </TabsContent>
              <TabsContent value="categories">
                <CategoriesStep categories={data.categories} onChange={(cats) => updateData({ categories: cats })} />
              </TabsContent>
              <TabsContent value="criteria">
                <CriteriaStep criteria={data.criteria} onChange={(crits) => updateData({ criteria: crits })} />
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(`/competitions/${id}`)}>
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {language === "ar" ? "حفظ التغييرات" : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
