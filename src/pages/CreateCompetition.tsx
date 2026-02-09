import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowLeft, ArrowRight, Save } from "lucide-react";
import { CoverImageUpload } from "@/components/competitions/CoverImageUpload";

interface Category {
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  max_participants: number | null;
}

interface Criteria {
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  max_score: number;
  weight: number;
}

export default function CreateCompetition() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  
  // Step 1: Basic Info
  const [title, setTitle] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [rulesSummary, setRulesSummary] = useState("");
  const [rulesSummaryAr, setRulesSummaryAr] = useState("");
  const [scoringNotes, setScoringNotes] = useState("");
  const [scoringNotesAr, setScoringNotesAr] = useState("");
  
  // Step 2: Dates & Location
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
  
  // Step 3: Categories
  const [categories, setCategories] = useState<Category[]>([
    { name: "", name_ar: "", description: "", description_ar: "", max_participants: null }
  ]);
  
  // Step 4: Judging Criteria
  const [criteria, setCriteria] = useState<Criteria[]>([
    { name: "", name_ar: "", description: "", description_ar: "", max_score: 10, weight: 0.25 }
  ]);

  const addCategory = () => {
    setCategories([...categories, { name: "", name_ar: "", description: "", description_ar: "", max_participants: null }]);
  };

  const removeCategory = (index: number) => {
    if (categories.length > 1) {
      setCategories(categories.filter((_, i) => i !== index));
    }
  };

  const updateCategory = (index: number, field: keyof Category, value: string | number | null) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
  };

  const addCriteria = () => {
    setCriteria([...criteria, { name: "", name_ar: "", description: "", description_ar: "", max_score: 10, weight: 0.25 }]);
  };

  const removeCriteria = (index: number) => {
    if (criteria.length > 1) {
      setCriteria(criteria.filter((_, i) => i !== index));
    }
  };

  const updateCriteria = (index: number, field: keyof Criteria, value: string | number) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Create competition
      const { data: competition, error: compError } = await supabase
        .from("competitions")
        .insert({
          title,
          title_ar: titleAr || null,
          description: description || null,
          description_ar: descriptionAr || null,
          cover_image_url: coverImageUrl,
          rules_summary: rulesSummary || null,
          rules_summary_ar: rulesSummaryAr || null,
          scoring_notes: scoringNotes || null,
          scoring_notes_ar: scoringNotesAr || null,
          registration_start: registrationStart || null,
          registration_end: registrationEnd || null,
          competition_start: competitionStart,
          competition_end: competitionEnd,
          is_virtual: isVirtual,
          venue: isVirtual ? null : venue || null,
          venue_ar: isVirtual ? null : venueAr || null,
          city: isVirtual ? null : city || null,
          country: isVirtual ? null : country || null,
          max_participants: maxParticipants || null,
          organizer_id: user.id,
          status: "draft",
        })
        .select()
        .single();

      if (compError) throw compError;

      // Create categories
      const validCategories = categories.filter(c => c.name.trim());
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
              sort_order: index + 1,
            }))
          );
        if (catError) throw catError;
      }

      // Create judging criteria
      const validCriteria = criteria.filter(c => c.name.trim());
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
        title: "Competition created!",
        description: "Your competition has been saved as a draft.",
      });
      navigate(`/competitions/${competition.id}`);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const canProceed = () => {
    if (step === 1) return title.trim() !== "";
    if (step === 2) return competitionStart !== "" && competitionEnd !== "";
    if (step === 3) return categories.some(c => c.name.trim() !== "");
    if (step === 4) return criteria.some(c => c.name.trim() !== "");
    return true;
  };

  const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight), 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="container flex-1 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/competitions")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Competitions
        </Button>

        <div className="mx-auto max-w-2xl">
          <h1 className="mb-2 font-serif text-3xl font-bold">{t("createCompetition")}</h1>
          <p className="mb-8 text-muted-foreground">Fill in the details to create a new competition</p>

          {/* Step Indicator */}
          <div className="mb-8 flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                    s === step
                      ? "bg-primary text-primary-foreground"
                      : s < step
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div className={`mx-2 h-1 w-12 sm:w-20 ${s < step ? "bg-primary/20" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the competition title and description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (English) *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Competition name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titleAr">Title (Arabic)</Label>
                    <Input
                      id="titleAr"
                      value={titleAr}
                      onChange={(e) => setTitleAr(e.target.value)}
                      placeholder="اسم المسابقة"
                      dir="rtl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (English)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your competition..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionAr">Description (Arabic)</Label>
                  <Textarea
                    id="descriptionAr"
                    value={descriptionAr}
                    onChange={(e) => setDescriptionAr(e.target.value)}
                    placeholder="وصف المسابقة..."
                    rows={4}
                    dir="rtl"
                  />
                </div>

                {/* Cover Image */}
                <CoverImageUpload currentUrl={coverImageUrl} onUrlChange={setCoverImageUrl} />

                {/* Rules Summary */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="rules">Rules Summary (English)</Label>
                    <Textarea
                      id="rules"
                      value={rulesSummary}
                      onChange={(e) => setRulesSummary(e.target.value)}
                      placeholder="Competition rules and guidelines..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rulesAr">Rules Summary (Arabic)</Label>
                    <Textarea
                      id="rulesAr"
                      value={rulesSummaryAr}
                      onChange={(e) => setRulesSummaryAr(e.target.value)}
                      placeholder="قواعد وإرشادات المسابقة..."
                      rows={3}
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Scoring Notes */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="scoring">Scoring Notes (English)</Label>
                    <Textarea
                      id="scoring"
                      value={scoringNotes}
                      onChange={(e) => setScoringNotes(e.target.value)}
                      placeholder="How scoring will be conducted..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scoringAr">Scoring Notes (Arabic)</Label>
                    <Textarea
                      id="scoringAr"
                      value={scoringNotesAr}
                      onChange={(e) => setScoringNotesAr(e.target.value)}
                      placeholder="كيف سيتم التقييم..."
                      rows={3}
                      dir="rtl"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Dates & Location */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Dates & Location</CardTitle>
                <CardDescription>Set the schedule and venue details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="regStart">Registration Start</Label>
                    <Input
                      id="regStart"
                      type="datetime-local"
                      value={registrationStart}
                      onChange={(e) => setRegistrationStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regEnd">Registration End</Label>
                    <Input
                      id="regEnd"
                      type="datetime-local"
                      value={registrationEnd}
                      onChange={(e) => setRegistrationEnd(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="compStart">Competition Start *</Label>
                    <Input
                      id="compStart"
                      type="datetime-local"
                      value={competitionStart}
                      onChange={(e) => setCompetitionStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compEnd">Competition End *</Label>
                    <Input
                      id="compEnd"
                      type="datetime-local"
                      value={competitionEnd}
                      onChange={(e) => setCompetitionEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Virtual Competition</p>
                    <p className="text-sm text-muted-foreground">This competition takes place online</p>
                  </div>
                  <Switch checked={isVirtual} onCheckedChange={setIsVirtual} />
                </div>

                {!isVirtual && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="venue">Venue (English)</Label>
                        <Input
                          id="venue"
                          value={venue}
                          onChange={(e) => setVenue(e.target.value)}
                          placeholder="Venue name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="venueAr">Venue (Arabic)</Label>
                        <Input
                          id="venueAr"
                          value={venueAr}
                          onChange={(e) => setVenueAr(e.target.value)}
                          placeholder="اسم المكان"
                          dir="rtl"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">Max Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value ? parseInt(e.target.value) : "")}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Categories */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("categories")}</CardTitle>
                <CardDescription>Define competition categories (e.g., Main Course, Desserts)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categories.map((cat, index) => (
                  <div key={index} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Category {index + 1}</span>
                      {categories.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeCategory(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        placeholder="Category name (English)"
                        value={cat.name}
                        onChange={(e) => updateCategory(index, "name", e.target.value)}
                      />
                      <Input
                        placeholder="اسم الفئة (عربي)"
                        value={cat.name_ar}
                        onChange={(e) => updateCategory(index, "name_ar", e.target.value)}
                        dir="rtl"
                      />
                    </div>
                    <Textarea
                      placeholder="Description (optional)"
                      value={cat.description}
                      onChange={(e) => updateCategory(index, "description", e.target.value)}
                      rows={2}
                    />
                    <Input
                      type="number"
                      placeholder="Max participants (optional)"
                      value={cat.max_participants || ""}
                      onChange={(e) => updateCategory(index, "max_participants", e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </div>
                ))}
                <Button variant="outline" onClick={addCategory} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Judging Criteria */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("criteria")}</CardTitle>
                <CardDescription>
                  Define how participants will be scored. Weights should add up to 1.0 (100%).
                  <span className={`ml-2 font-medium ${Math.abs(totalWeight - 1) < 0.01 ? "text-primary" : "text-destructive"}`}>
                    Current: {(totalWeight * 100).toFixed(0)}%
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {criteria.map((crit, index) => (
                  <div key={index} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Criterion {index + 1}</span>
                      {criteria.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeCriteria(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        placeholder="Criterion name (English)"
                        value={crit.name}
                        onChange={(e) => updateCriteria(index, "name", e.target.value)}
                      />
                      <Input
                        placeholder="اسم المعيار (عربي)"
                        value={crit.name_ar}
                        onChange={(e) => updateCriteria(index, "name_ar", e.target.value)}
                        dir="rtl"
                      />
                    </div>
                    <Textarea
                      placeholder="Description (optional)"
                      value={crit.description}
                      onChange={(e) => updateCriteria(index, "description", e.target.value)}
                      rows={2}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Max Score</Label>
                        <Input
                          type="number"
                          value={crit.max_score}
                          onChange={(e) => updateCriteria(index, "max_score", parseInt(e.target.value) || 10)}
                          min={1}
                          max={100}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Weight ({(Number(crit.weight) * 100).toFixed(0)}%)</Label>
                        <Input
                          type="number"
                          step="0.05"
                          value={crit.weight}
                          onChange={(e) => updateCriteria(index, "weight", parseFloat(e.target.value) || 0)}
                          min={0}
                          max={1}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addCriteria} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Criterion
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !canProceed()}
              >
                <Save className="mr-2 h-4 w-4" />
                {createMutation.isPending ? "Creating..." : "Create Competition"}
              </Button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
