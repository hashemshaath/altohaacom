import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trophy, User, CheckCircle, Star, AlertCircle, X, Save, ArrowLeft, BookOpen, Flag, BarChart3, ArrowLeftRight, LayoutDashboard, Scale } from "lucide-react";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";
import { JudgeAIAssistant } from "@/components/knowledge/JudgeAIAssistant";
import { ReferenceGalleryPanel } from "@/components/competitions/ReferenceGalleryPanel";
import { JudgeDashboard } from "@/components/judging/JudgeDashboard";
import { ScoringAnalytics } from "@/components/judging/ScoringAnalytics";
import { EntryComparison } from "@/components/judging/EntryComparison";

type Registration = Database["public"]["Tables"]["competition_registrations"]["Row"];
type Criteria = Database["public"]["Tables"]["judging_criteria"]["Row"];
type Score = Database["public"]["Tables"]["competition_scores"]["Row"];

interface RegistrationWithProfile extends Registration {
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    specialization: string | null;
  };
  category?: {
    name: string;
    name_ar: string | null;
  };
}

type ViewMode = "list" | "scoring";

export default function Judging() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [scoringRegistration, setScoringRegistration] = useState<RegistrationWithProfile | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [flagStatus, setFlagStatus] = useState<Record<string, string>>({});
  const [detailedFeedback, setDetailedFeedback] = useState<Record<string, string>>({});

  // Fetch competitions where user is a judge
  const { data: assignedCompetitions, isLoading: loadingCompetitions } = useQuery({
    queryKey: ["judge-competitions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: judgeAssignments, error: assignError } = await supabase
        .from("competition_judges")
        .select("competition_id")
        .eq("judge_id", user.id);
      
      if (assignError) throw assignError;
      if (!judgeAssignments || judgeAssignments.length === 0) return [];
      
      const competitionIds = judgeAssignments.map(j => j.competition_id);
      
      const { data: competitions, error: compError } = await supabase
        .from("competitions")
        .select("id, title, title_ar, status, competition_start, competition_end, country_code, city")
        .in("id", competitionIds)
        .in("status", ["in_progress", "judging"])
        .order("competition_start", { ascending: false });
      
      if (compError) throw compError;
      return competitions || [];
    },
    enabled: !!user,
  });

  // Fetch registrations for selected competition
  const { data: registrations, isLoading: loadingRegistrations } = useQuery({
    queryKey: ["judge-registrations", selectedCompetition],
    queryFn: async () => {
      if (!selectedCompetition) return [];
      
      const { data, error } = await supabase
        .from("competition_registrations")
        .select("*, category:competition_categories(*)")
        .eq("competition_id", selectedCompetition)
        .eq("status", "approved");
      
      if (error) throw error;
      
      // Fetch profiles for participants
      if (data && data.length > 0) {
        const participantIds = data.map(r => r.participant_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, specialization")
          .in("user_id", participantIds);
        
        return data.map(reg => ({
          ...reg,
          profile: profiles?.find(p => p.user_id === reg.participant_id),
        })) as RegistrationWithProfile[];
      }
      
      return data as RegistrationWithProfile[];
    },
    enabled: !!selectedCompetition,
  });

  // Fetch judging criteria for selected competition
  const { data: criteria } = useQuery({
    queryKey: ["judge-criteria", selectedCompetition],
    queryFn: async () => {
      if (!selectedCompetition) return [];
      
      const { data, error } = await supabase
        .from("judging_criteria")
        .select("id, competition_id, name, name_ar, max_score, weight, sort_order, description, description_ar")
        .eq("competition_id", selectedCompetition)
        .order("sort_order");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCompetition,
  });

  // Fetch existing scores for selected competition
  const { data: existingScores } = useQuery({
    queryKey: ["judge-scores", selectedCompetition, user?.id],
    queryFn: async () => {
      if (!selectedCompetition || !user) return [];
      
      const { data, error } = await supabase
        .from("competition_scores")
        .select("id, judge_id, registration_id, criteria_id, score, notes, scored_at")
        .eq("judge_id", user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCompetition && !!user,
  });

  const submitScoreMutation = useMutation({
    mutationFn: async () => {
      if (!user || !scoringRegistration || !criteria) {
        throw new Error("Missing required data");
      }

      // Upsert scores for each criterion
      const scoreRows = criteria.map(crit => ({
        registration_id: scoringRegistration.id,
        judge_id: user.id,
        criteria_id: crit.id,
        score: scores[crit.id] || 0,
        notes: notes[crit.id] || null,
        flag_status: flagStatus[crit.id] || null,
        flag_reason: flagStatus[crit.id] ? notes[crit.id] || null : null,
        detailed_feedback: detailedFeedback[crit.id] || null,
      }));

      // Delete existing scores first (for upsert behavior)
      await supabase
        .from("competition_scores")
        .delete()
        .eq("registration_id", scoringRegistration.id)
        .eq("judge_id", user.id);

      const { error } = await supabase
        .from("competition_scores")
        .insert(scoreRows);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judge-scores"] });
      toast({
        title: language === "ar" ? "تم حفظ الدرجات!" : "Scores submitted!",
        description: language === "ar" 
          ? `تم حفظ درجاتك للمشارك ${scoringRegistration?.profile?.full_name || ""}`
          : `Your scores for ${scoringRegistration?.profile?.full_name || "this participant"} have been saved.`,
      });
      setViewMode("list");
      setScoringRegistration(null);
      setScores({});
      setNotes({});
      setFlagStatus({});
      setDetailedFeedback({});
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "خطأ في حفظ الدرجات" : "Error submitting scores",
        description: error.message,
      });
    },
  });

  const openScoringView = (registration: RegistrationWithProfile) => {
    setScoringRegistration(registration);
    setViewMode("scoring");
    
    // Pre-fill with existing scores if any
    if (existingScores) {
      const regScores = existingScores.filter(s => s.registration_id === registration.id);
      const scoreMap: Record<string, number> = {};
      const noteMap: Record<string, string> = {};
      
      regScores.forEach(s => {
        scoreMap[s.criteria_id] = Number(s.score);
        if (s.notes) noteMap[s.criteria_id] = s.notes;
      });
      
      setScores(scoreMap);
      setNotes(noteMap);
    } else {
      // Initialize with default scores
      const defaultScores: Record<string, number> = {};
      criteria?.forEach(c => {
        defaultScores[c.id] = Math.floor(c.max_score / 2);
      });
      setScores(defaultScores);
      setNotes({});
    }
  };

  const handleBackToList = () => {
    setViewMode("list");
    setScoringRegistration(null);
    setScores({});
    setNotes({});
    setFlagStatus({});
    setDetailedFeedback({});
  };

  const hasScored = (registrationId: string): boolean => {
    if (!existingScores || !criteria) return false;
    const regScores = existingScores.filter(s => s.registration_id === registrationId);
    return regScores.length >= criteria.length;
  };

  const calculateTotalScore = (): number => {
    if (!criteria) return 0;
    let total = 0;
    criteria.forEach(crit => {
      const score = scores[crit.id] || 0;
      total += score * Number(crit.weight);
    });
    return Math.round(total * 100) / 100;
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex flex-1 items-center justify-center py-8">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                {language === "ar" ? "الرجاء تسجيل الدخول للوصول إلى لوحة التحكيم" : "Please sign in to access the judging panel."}
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Scoring View
  if (viewMode === "scoring" && scoringRegistration) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        
        <main className="container flex-1 py-8">
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {language === "ar" ? "رجوع للقائمة" : "Back to list"}
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Scoring Panel */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Star className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>
                        {language === "ar" ? "تقييم:" : "Scoring:"} {scoringRegistration.profile?.full_name || "Participant"}
                      </CardTitle>
                      <CardDescription>
                        {scoringRegistration.dish_name && (
                          <span className="font-medium text-foreground">
                            {language === "ar" ? "الطبق:" : "Dish:"} {scoringRegistration.dish_name}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" 
                      ? "قم بتقييم كل معيار باستخدام المنزلقات أدناه" 
                      : "Rate each criterion using the sliders below."}
                  </p>

                  {criteria?.map((crit) => (
                    <div key={crit.id} className="space-y-4 rounded-xl border p-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">
                          {language === "ar" && crit.name_ar ? crit.name_ar : crit.name}
                        </Label>
                        <Badge variant="outline" className="text-lg px-3 py-1">
                          {scores[crit.id] || 0} / {crit.max_score}
                        </Badge>
                      </div>
                      {crit.description && (
                        <p className="text-sm text-muted-foreground">
                          {language === "ar" && crit.description_ar ? crit.description_ar : crit.description}
                        </p>
                      )}
                      <Slider
                        value={[scores[crit.id] || 0]}
                        onValueChange={([val]) => setScores(prev => ({ ...prev, [crit.id]: val }))}
                        max={crit.max_score}
                        min={0}
                        step={1}
                        className="py-2"
                      />
                      <Textarea
                        placeholder={language === "ar" 
                          ? `ملاحظات لـ ${crit.name_ar || crit.name} (اختياري)` 
                          : `Notes for ${crit.name} (optional)`}
                        value={notes[crit.id] || ""}
                        onChange={(e) => setNotes(prev => ({ ...prev, [crit.id]: e.target.value }))}
                        className="text-sm"
                        rows={2}
                      />
                      <Textarea
                        placeholder={language === "ar" 
                          ? `ملاحظات تفصيلية للمشارك (اختياري)` 
                          : `Detailed feedback for participant (optional)`}
                        value={detailedFeedback[crit.id] || ""}
                        onChange={(e) => setDetailedFeedback(prev => ({ ...prev, [crit.id]: e.target.value }))}
                        className="text-sm"
                        rows={2}
                      />
                      <div className="flex items-center gap-2">
                        <Flag className={`h-4 w-4 ${flagStatus[crit.id] ? "text-destructive" : "text-muted-foreground"}`} />
                        <Select
                          value={flagStatus[crit.id] || "none"}
                          onValueChange={(v) => setFlagStatus(prev => ({ ...prev, [crit.id]: v === "none" ? "" : v }))}
                        >
                          <SelectTrigger className="h-8 w-48 text-xs">
                            <SelectValue placeholder={language === "ar" ? "تعليم..." : "Flag..."} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{language === "ar" ? "بدون علم" : "No flag"}</SelectItem>
                            <SelectItem value="review">{language === "ar" ? "يحتاج مراجعة" : "Needs review"}</SelectItem>
                            <SelectItem value="concern">{language === "ar" ? "قلق" : "Concern"}</SelectItem>
                            <SelectItem value="disqualify">{language === "ar" ? "اقتراح استبعاد" : "Suggest disqualify"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}

                  <div className="rounded-xl border-2 border-primary bg-primary/5 p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">
                        {language === "ar" ? "المجموع الموزون" : "Weighted Total Score"}
                      </span>
                      <span className="text-3xl font-bold text-primary">
                        {calculateTotalScore()}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={handleBackToList}>
                      <X className="me-2 h-4 w-4" />
                      {language === "ar" ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button 
                      onClick={() => submitScoreMutation.mutate()}
                      disabled={submitScoreMutation.isPending}
                    >
                      <Save className="me-2 h-4 w-4" />
                      {submitScoreMutation.isPending
                        ? (language === "ar" ? "جاري الحفظ..." : "Saving...")
                        : (language === "ar" ? "حفظ الدرجات" : "Save Scores")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Assistant Sidebar */}
            <div className="space-y-6">
              <JudgeAIAssistant competitionId={selectedCompetition || undefined} className="h-[500px]" />
              <ReferenceGalleryPanel isJudge={true} />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  // List View
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="container flex-1 py-6 md:py-10">
        {/* Page Header */}
        <Card className="mb-8 overflow-hidden border-chart-4/10 bg-gradient-to-br from-chart-4/5 via-background to-primary/5">
          <CardContent className="flex items-center gap-4 p-5 sm:p-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-chart-4/10 ring-4 ring-chart-4/5">
              <Scale className="h-6 w-6 text-chart-4" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold sm:text-2xl md:text-3xl">{t("judgingPanel")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {language === "ar" ? "تقييم المشاركين في المسابقات" : "Score and evaluate competition participants"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Judging Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              {language === "ar" ? "لوحة التحكم" : "Dashboard"}
            </TabsTrigger>
            <TabsTrigger value="scoring" className="gap-2">
              <Star className="h-4 w-4" />
              {language === "ar" ? "التقييم" : "Scoring"}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              {language === "ar" ? "التحليلات" : "Analytics"}
            </TabsTrigger>
            <TabsTrigger value="comparison" className="gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              {language === "ar" ? "المقارنة" : "Compare"}
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <JudgeDashboard onSelectCompetition={(id) => {
              setSelectedCompetition(id);
              setActiveTab("scoring");
            }} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            {selectedCompetition ? (
              <ScoringAnalytics competitionId={selectedCompetition} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {language === "ar" ? "اختر مسابقة أولاً من لوحة التحكم" : "Select a competition first from the Dashboard tab"}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison">
            {selectedCompetition ? (
              <EntryComparison competitionId={selectedCompetition} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {language === "ar" ? "اختر مسابقة أولاً من لوحة التحكم" : "Select a competition first from the Dashboard tab"}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Scoring Tab */}
          <TabsContent value="scoring">
        {loadingCompetitions ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : assignedCompetitions && assignedCompetitions.length > 0 ? (
          <Tabs value={selectedCompetition || undefined} onValueChange={setSelectedCompetition}>
            <TabsList className="mb-6 flex-wrap">
              {assignedCompetitions.map((comp) => (
                <TabsTrigger key={comp.id} value={comp.id}>
                  {language === "ar" && comp.title_ar ? comp.title_ar : comp.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {assignedCompetitions.map((comp) => (
              <TabsContent key={comp.id} value={comp.id}>
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        {language === "ar" && comp.title_ar ? comp.title_ar : comp.title}
                      </CardTitle>
                      <Badge variant="outline">{(() => {
                        const sl: Record<string, string> = { open: "مفتوحة", closed: "مغلقة", completed: "مكتملة", judging: "جاري التحكيم", upcoming: "قادمة", ongoing: "جارية", registration_open: "التسجيل مفتوح" };
                        const raw = comp.status.replace("_", " ");
                        return language === "ar" ? (sl[comp.status] || raw) : raw;
                      })()}</Badge>
                    </div>
                    <CardDescription>
                      {format(new Date(comp.competition_start), language === "ar" ? "d MMMM" : "MMMM d", language === "ar" ? { locale: arLocale } : undefined)} - {format(new Date(comp.competition_end), language === "ar" ? "d MMMM yyyy" : "MMMM d, yyyy", language === "ar" ? { locale: arLocale } : undefined)}
                    </CardDescription>
                  </CardHeader>
                </Card>

                {loadingRegistrations ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
                  </div>
                ) : registrations && registrations.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {registrations.map((reg) => (
                      <Card key={reg.id} className={hasScored(reg.id) ? "border-primary/50" : ""}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-base">
                                  {reg.profile?.full_name || "Anonymous"}
                                </CardTitle>
                                {reg.profile?.specialization && (
                                  <p className="text-xs text-muted-foreground">
                                    {reg.profile.specialization}
                                  </p>
                                )}
                              </div>
                            </div>
                            {hasScored(reg.id) && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {reg.dish_name && (
                            <div>
                              <p className="text-sm font-medium">{reg.dish_name}</p>
                              {reg.dish_description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {reg.dish_description}
                                </p>
                              )}
                            </div>
                          )}
                          {reg.category && (
                            <Badge variant="secondary" className="text-xs">
                              {language === "ar" && reg.category.name_ar 
                                ? reg.category.name_ar 
                                : reg.category.name}
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            className="w-full"
                            variant={hasScored(reg.id) ? "outline" : "default"}
                            onClick={() => openScoringView(reg)}
                          >
                            <Star className="me-2 h-4 w-4" />
                            {hasScored(reg.id) 
                              ? (language === "ar" ? "تعديل الدرجات" : "Edit Scores") 
                              : (language === "ar" ? "تقييم المشارك" : "Score Participant")}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <User className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {language === "ar" 
                          ? "لا يوجد مشاركين معتمدين للتقييم بعد" 
                          : "No approved participants to score yet."}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                {language === "ar" 
                  ? "لم يتم تعيينك كحكم في أي مسابقات نشطة" 
                  : "You are not assigned as a judge to any active competitions."}
              </p>
            </CardContent>
          </Card>
        )}
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}
