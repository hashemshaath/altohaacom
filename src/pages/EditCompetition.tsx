import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { CoverImageUpload } from "@/components/competitions/CoverImageUpload";

interface CategoryForm {
  id?: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  max_participants: number | null;
}

interface CriteriaForm {
  id?: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  max_score: number;
  weight: number;
}

export default function EditCompetition() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [rulesSummary, setRulesSummary] = useState("");
  const [rulesSummaryAr, setRulesSummaryAr] = useState("");
  const [scoringNotes, setScoringNotes] = useState("");
  const [scoringNotesAr, setScoringNotesAr] = useState("");
  const [registrationStart, setRegistrationStart] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");
  const [competitionStart, setCompetitionStart] = useState("");
  const [competitionEnd, setCompetitionEnd] = useState("");
  const [isVirtual, setIsVirtual] = useState(false);
  const [venue, setVenue] = useState("");
  const [venueAr, setVenueAr] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<number | "">("");
  const [categories, setCategories] = useState<CategoryForm[]>([]);
  const [criteria, setCriteria] = useState<CriteriaForm[]>([]);

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

  useEffect(() => {
    if (competition) {
      setTitle(competition.title);
      setTitleAr(competition.title_ar || "");
      setDescription(competition.description || "");
      setDescriptionAr(competition.description_ar || "");
      setCoverImageUrl(competition.cover_image_url);
      setRulesSummary(competition.rules_summary || "");
      setRulesSummaryAr(competition.rules_summary_ar || "");
      setScoringNotes(competition.scoring_notes || "");
      setScoringNotesAr(competition.scoring_notes_ar || "");
      setRegistrationStart(competition.registration_start ? competition.registration_start.slice(0, 16) : "");
      setRegistrationEnd(competition.registration_end ? competition.registration_end.slice(0, 16) : "");
      setCompetitionStart(competition.competition_start.slice(0, 16));
      setCompetitionEnd(competition.competition_end.slice(0, 16));
      setIsVirtual(competition.is_virtual || false);
      setVenue(competition.venue || "");
      setVenueAr(competition.venue_ar || "");
      setCity(competition.city || "");
      setCountry(competition.country || "");
      setMaxParticipants(competition.max_participants || "");
    }
  }, [competition]);

  useEffect(() => {
    if (existingCategories) {
      setCategories(existingCategories.map(c => ({
        id: c.id, name: c.name, name_ar: c.name_ar || "", description: c.description || "",
        description_ar: c.description_ar || "", max_participants: c.max_participants,
      })));
    }
  }, [existingCategories]);

  useEffect(() => {
    if (existingCriteria) {
      setCriteria(existingCriteria.map(c => ({
        id: c.id, name: c.name, name_ar: c.name_ar || "", description: c.description || "",
        description_ar: c.description_ar || "", max_score: c.max_score, weight: Number(c.weight),
      })));
    }
  }, [existingCriteria]);

  const addCategory = () => setCategories([...categories, { name: "", name_ar: "", description: "", description_ar: "", max_participants: null }]);
  const removeCategory = (i: number) => setCategories(categories.filter((_, idx) => idx !== i));
  const updateCategory = (i: number, field: keyof CategoryForm, value: any) => {
    const u = [...categories]; u[i] = { ...u[i], [field]: value }; setCategories(u);
  };

  const addCriteria = () => setCriteria([...criteria, { name: "", name_ar: "", description: "", description_ar: "", max_score: 10, weight: 0.25 }]);
  const removeCriteria = (i: number) => setCriteria(criteria.filter((_, idx) => idx !== i));
  const updateCriteria = (i: number, field: keyof CriteriaForm, value: any) => {
    const u = [...criteria]; u[i] = { ...u[i], [field]: value }; setCriteria(u);
  };

  const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight), 0);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("Not authenticated");

      // Update competition
      const { error } = await supabase.from("competitions").update({
        title, title_ar: titleAr || null,
        description: description || null, description_ar: descriptionAr || null,
        cover_image_url: coverImageUrl,
        rules_summary: rulesSummary || null, rules_summary_ar: rulesSummaryAr || null,
        scoring_notes: scoringNotes || null, scoring_notes_ar: scoringNotesAr || null,
        registration_start: registrationStart || null, registration_end: registrationEnd || null,
        competition_start: competitionStart, competition_end: competitionEnd,
        is_virtual: isVirtual,
        venue: isVirtual ? null : venue || null, venue_ar: isVirtual ? null : venueAr || null,
        city: isVirtual ? null : city || null, country: isVirtual ? null : country || null,
        max_participants: maxParticipants || null,
      }).eq("id", id);
      if (error) throw error;

      // Sync categories: delete removed, upsert existing/new
      const existingIds = existingCategories?.map(c => c.id) || [];
      const currentIds = categories.filter(c => c.id).map(c => c.id!);
      const deletedIds = existingIds.filter(eid => !currentIds.includes(eid));

      if (deletedIds.length > 0) {
        await supabase.from("competition_categories").delete().in("id", deletedIds);
      }

      const validCategories = categories.filter(c => c.name.trim());
      for (let i = 0; i < validCategories.length; i++) {
        const cat = validCategories[i];
        if (cat.id) {
          await supabase.from("competition_categories").update({
            name: cat.name, name_ar: cat.name_ar || null,
            description: cat.description || null, description_ar: cat.description_ar || null,
            max_participants: cat.max_participants, sort_order: i + 1,
          }).eq("id", cat.id);
        } else {
          await supabase.from("competition_categories").insert({
            competition_id: id, name: cat.name, name_ar: cat.name_ar || null,
            description: cat.description || null, description_ar: cat.description_ar || null,
            max_participants: cat.max_participants, sort_order: i + 1,
          });
        }
      }

      // Sync criteria
      const existingCritIds = existingCriteria?.map(c => c.id) || [];
      const currentCritIds = criteria.filter(c => c.id).map(c => c.id!);
      const deletedCritIds = existingCritIds.filter(eid => !currentCritIds.includes(eid));

      if (deletedCritIds.length > 0) {
        await supabase.from("judging_criteria").delete().in("id", deletedCritIds);
      }

      const validCriteria = criteria.filter(c => c.name.trim());
      for (let i = 0; i < validCriteria.length; i++) {
        const crit = validCriteria[i];
        if (crit.id) {
          await supabase.from("judging_criteria").update({
            name: crit.name, name_ar: crit.name_ar || null,
            description: crit.description || null, description_ar: crit.description_ar || null,
            max_score: crit.max_score, weight: crit.weight, sort_order: i + 1,
          }).eq("id", crit.id);
        } else {
          await supabase.from("judging_criteria").insert({
            competition_id: id, name: crit.name, name_ar: crit.name_ar || null,
            description: crit.description || null, description_ar: crit.description_ar || null,
            max_score: crit.max_score, weight: crit.weight, sort_order: i + 1,
          });
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
    if (!title.trim() || !competitionStart || !competitionEnd) {
      toast({ variant: "destructive", title: "Required fields", description: "Please fill in title and competition dates" });
      return;
    }
    updateMutation.mutate();
  };

  const isOrganizer = user && competition && competition.organizer_id === user.id;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-8"><Skeleton className="mb-4 h-8 w-48" /><Skeleton className="h-96 w-full" /></main>
        <Footer />
      </div>
    );
  }

  if (!competition || !isOrganizer) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-8 text-center">
          <p className="text-muted-foreground">{!competition ? "Competition not found" : "You don't have permission to edit this competition"}</p>
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
          <h1 className="mb-2 font-serif text-3xl font-bold">{language === "ar" ? "تعديل المسابقة" : "Edit Competition"}</h1>
          <p className="mb-8 text-muted-foreground">{language === "ar" ? "قم بتحديث تفاصيل المسابقة" : "Update the competition details"}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader><CardTitle>{language === "ar" ? "المعلومات الأساسية" : "Basic Information"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Title (English) *</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Title (Arabic)</Label>
                    <Input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description (English)</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                </div>
                <div className="space-y-2">
                  <Label>Description (Arabic)</Label>
                  <Textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} rows={4} dir="rtl" />
                </div>
                <CoverImageUpload currentUrl={coverImageUrl} onUrlChange={setCoverImageUrl} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Rules Summary (English)</Label>
                    <Textarea value={rulesSummary} onChange={(e) => setRulesSummary(e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Rules Summary (Arabic)</Label>
                    <Textarea value={rulesSummaryAr} onChange={(e) => setRulesSummaryAr(e.target.value)} rows={3} dir="rtl" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Scoring Notes (English)</Label>
                    <Textarea value={scoringNotes} onChange={(e) => setScoringNotes(e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Scoring Notes (Arabic)</Label>
                    <Textarea value={scoringNotesAr} onChange={(e) => setScoringNotesAr(e.target.value)} rows={3} dir="rtl" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates & Location */}
            <Card>
              <CardHeader><CardTitle>{language === "ar" ? "التواريخ والموقع" : "Dates & Location"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Registration Start</Label><Input type="datetime-local" value={registrationStart} onChange={(e) => setRegistrationStart(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Registration End</Label><Input type="datetime-local" value={registrationEnd} onChange={(e) => setRegistrationEnd(e.target.value)} /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Competition Start *</Label><Input type="datetime-local" value={competitionStart} onChange={(e) => setCompetitionStart(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Competition End *</Label><Input type="datetime-local" value={competitionEnd} onChange={(e) => setCompetitionEnd(e.target.value)} /></div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{language === "ar" ? "مسابقة افتراضية" : "Virtual Competition"}</p>
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "تقام عبر الإنترنت" : "This competition takes place online"}</p>
                  </div>
                  <Switch checked={isVirtual} onCheckedChange={setIsVirtual} />
                </div>
                {!isVirtual && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2"><Label>Venue (English)</Label><Input value={venue} onChange={(e) => setVenue(e.target.value)} /></div>
                      <div className="space-y-2"><Label>Venue (Arabic)</Label><Input value={venueAr} onChange={(e) => setVenueAr(e.target.value)} dir="rtl" /></div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2"><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
                      <div className="space-y-2"><Label>Country</Label><Input value={country} onChange={(e) => setCountry(e.target.value)} /></div>
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Max Participants</Label>
                  <Input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value ? parseInt(e.target.value) : "")} placeholder="Leave empty for unlimited" />
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>{language === "ar" ? "الفئات" : "Categories"}</CardTitle>
                <CardDescription>{language === "ar" ? "حدد فئات المسابقة" : "Define competition categories"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categories.map((cat, i) => (
                  <div key={cat.id || i} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Category {i + 1}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeCategory(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input placeholder="Name (English)" value={cat.name} onChange={(e) => updateCategory(i, "name", e.target.value)} />
                      <Input placeholder="الاسم (عربي)" value={cat.name_ar} onChange={(e) => updateCategory(i, "name_ar", e.target.value)} dir="rtl" />
                    </div>
                    <Textarea placeholder="Description" value={cat.description} onChange={(e) => updateCategory(i, "description", e.target.value)} rows={2} />
                    <Input type="number" placeholder="Max participants" value={cat.max_participants || ""} onChange={(e) => updateCategory(i, "max_participants", e.target.value ? parseInt(e.target.value) : null)} />
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addCategory} className="w-full"><Plus className="mr-2 h-4 w-4" />Add Category</Button>
              </CardContent>
            </Card>

            {/* Judging Criteria */}
            <Card>
              <CardHeader>
                <CardTitle>{language === "ar" ? "معايير التحكيم" : "Judging Criteria"}</CardTitle>
                <CardDescription>
                  Weights should add up to 100%.
                  <span className={`ml-2 font-medium ${Math.abs(totalWeight - 1) < 0.01 ? "text-primary" : "text-destructive"}`}>
                    Current: {(totalWeight * 100).toFixed(0)}%
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {criteria.map((crit, i) => (
                  <div key={crit.id || i} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Criterion {i + 1}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeCriteria(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input placeholder="Name (English)" value={crit.name} onChange={(e) => updateCriteria(i, "name", e.target.value)} />
                      <Input placeholder="الاسم (عربي)" value={crit.name_ar} onChange={(e) => updateCriteria(i, "name_ar", e.target.value)} dir="rtl" />
                    </div>
                    <Textarea placeholder="Description" value={crit.description} onChange={(e) => updateCriteria(i, "description", e.target.value)} rows={2} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Max Score</Label>
                        <Input type="number" value={crit.max_score} onChange={(e) => updateCriteria(i, "max_score", parseInt(e.target.value) || 10)} min={1} max={100} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Weight ({(Number(crit.weight) * 100).toFixed(0)}%)</Label>
                        <Input type="number" step="0.05" value={crit.weight} onChange={(e) => updateCriteria(i, "weight", parseFloat(e.target.value) || 0)} min={0} max={1} />
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addCriteria} className="w-full"><Plus className="mr-2 h-4 w-4" />Add Criterion</Button>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(`/competitions/${id}`)}>
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
