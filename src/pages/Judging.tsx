import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Trophy, User, CheckCircle, Star, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

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

export default function Judging() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);
  const [scoringRegistration, setScoringRegistration] = useState<RegistrationWithProfile | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

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
        .select("*")
        .in("id", competitionIds)
        .in("status", ["in_progress", "judging"]);
      
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
        .select("*")
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
        .select("*")
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
        title: "Scores submitted!",
        description: `Your scores for ${scoringRegistration?.profile?.full_name || "this participant"} have been saved.`,
      });
      setScoringRegistration(null);
      setScores({});
      setNotes({});
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error submitting scores",
        description: error.message,
      });
    },
  });

  const openScoringDialog = (registration: RegistrationWithProfile) => {
    setScoringRegistration(registration);
    
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
              <p className="text-muted-foreground">Please sign in to access the judging panel.</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="container flex-1 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">{t("judgingPanel")}</h1>
          <p className="text-muted-foreground">
            Score and evaluate competition participants
          </p>
        </div>

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
                      <Badge variant="outline">{comp.status.replace("_", " ")}</Badge>
                    </div>
                    <CardDescription>
                      {format(new Date(comp.competition_start), "MMMM d")} - {format(new Date(comp.competition_end), "MMMM d, yyyy")}
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
                            onClick={() => openScoringDialog(reg)}
                          >
                            <Star className="mr-2 h-4 w-4" />
                            {hasScored(reg.id) ? "Edit Scores" : "Score Participant"}
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
                        No approved participants to score yet.
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
                You are not assigned as a judge to any active competitions.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Scoring Dialog */}
        <Dialog open={!!scoringRegistration} onOpenChange={(open) => !open && setScoringRegistration(null)}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Score: {scoringRegistration?.profile?.full_name || "Participant"}
              </DialogTitle>
              <DialogDescription>
                {scoringRegistration?.dish_name && (
                  <span className="block font-medium text-foreground">
                    Dish: {scoringRegistration.dish_name}
                  </span>
                )}
                Rate each criterion using the sliders below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {criteria?.map((crit) => (
                <div key={crit.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      {language === "ar" && crit.name_ar ? crit.name_ar : crit.name}
                    </Label>
                    <Badge variant="outline">
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
                    placeholder={`Notes for ${crit.name} (optional)`}
                    value={notes[crit.id] || ""}
                    onChange={(e) => setNotes(prev => ({ ...prev, [crit.id]: e.target.value }))}
                    className="text-sm"
                    rows={2}
                  />
                </div>
              ))}

              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Weighted Total Score</span>
                  <span className="text-2xl font-bold text-primary">
                    {calculateTotalScore()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setScoringRegistration(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => submitScoreMutation.mutate()}
                disabled={submitScoreMutation.isPending}
              >
                {submitScoreMutation.isPending ? "Submitting..." : "Submit Scores"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}
