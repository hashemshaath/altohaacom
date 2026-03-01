import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ClipboardList, Plus, Star, Loader2, CheckCircle2, BarChart3 } from "lucide-react";

interface Props {
  exhibitionId: string;
  isAr: boolean;
  isOrganizer?: boolean;
}

export function ExhibitionSurveyManager({ exhibitionId, isAr, isOrganizer }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [questions, setQuestions] = useState<{ question: string; question_ar: string; type: string }[]>([
    { question: "", question_ar: "", type: "rating" },
  ]);

  const { data: surveys = [] } = useQuery({
    queryKey: ["exhibition-surveys", exhibitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibition_surveys")
        .select("*, exhibition_survey_questions(*)")
        .eq("exhibition_id", exhibitionId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: myResponses = [] } = useQuery({
    queryKey: ["exhibition-survey-responses", exhibitionId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("exhibition_survey_responses")
        .select("survey_id")
        .eq("user_id", user.id);
      return (data || []).map((r: any) => r.survey_id);
    },
    enabled: !!user,
  });

  const { data: responseCounts = {} } = useQuery({
    queryKey: ["exhibition-survey-counts", exhibitionId],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const survey of surveys) {
        const { count } = await supabase
          .from("exhibition_survey_responses")
          .select("id", { count: "exact", head: true })
          .eq("survey_id", survey.id);
        counts[survey.id] = count || 0;
      }
      return counts;
    },
    enabled: surveys.length > 0,
  });

  const createSurvey = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { data: survey, error } = await supabase
        .from("exhibition_surveys")
        .insert({ exhibition_id: exhibitionId, title, title_ar: titleAr || title, created_by: user.id })
        .select()
        .single();
      if (error) throw error;

      const validQuestions = questions.filter(q => q.question.trim());
      if (validQuestions.length > 0) {
        const { error: qError } = await supabase.from("exhibition_survey_questions").insert(
          validQuestions.map((q, i) => ({
            survey_id: survey.id,
            question: q.question,
            question_ar: q.question_ar || q.question,
            question_type: q.type,
            sort_order: i,
          }))
        );
        if (qError) throw qError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-surveys", exhibitionId] });
      setCreateOpen(false);
      setTitle("");
      setTitleAr("");
      setQuestions([{ question: "", question_ar: "", type: "rating" }]);
      toast({ title: t("Survey created! 📋", "تم إنشاء الاستبيان! 📋") });
    },
  });

  return (
    <div className="space-y-4">
      {isOrganizer && (
        <div className="flex justify-end">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="h-3 w-3" /> {t("Create Survey", "إنشاء استبيان")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm">{t("New Survey", "استبيان جديد")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("Title (EN)", "العنوان (EN)")}</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("Title (AR)", "العنوان (AR)")}</Label>
                    <Input value={titleAr} onChange={e => setTitleAr(e.target.value)} className="h-9 text-xs" dir="rtl" />
                  </div>
                </div>

                <Label className="text-xs font-semibold">{t("Questions", "الأسئلة")}</Label>
                {questions.map((q, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/40 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={q.question}
                        onChange={e => {
                          const updated = [...questions];
                          updated[i].question = e.target.value;
                          setQuestions(updated);
                        }}
                        placeholder={t(`Question ${i + 1}`, `سؤال ${i + 1}`)}
                        className="h-8 text-xs flex-1"
                      />
                      <Select
                        value={q.type}
                        onValueChange={v => {
                          const updated = [...questions];
                          updated[i].type = v;
                          setQuestions(updated);
                        }}
                      >
                        <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rating" className="text-xs">⭐ {t("Rating", "تقييم")}</SelectItem>
                          <SelectItem value="text" className="text-xs">📝 {t("Text", "نص")}</SelectItem>
                          <SelectItem value="yes_no" className="text-xs">✅ {t("Yes/No", "نعم/لا")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setQuestions([...questions, { question: "", question_ar: "", type: "rating" }])}>
                  <Plus className="h-3 w-3 me-1" /> {t("Add Question", "إضافة سؤال")}
                </Button>

                <Button className="w-full" onClick={() => createSurvey.mutate()} disabled={!title.trim() || createSurvey.isPending}>
                  {createSurvey.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Create", "إنشاء")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Surveys list */}
      {surveys.map((survey: any) => {
        const responded = myResponses.includes(survey.id);
        const responseCount = responseCounts[survey.id] || 0;
        return (
          <SurveyCard
            key={survey.id}
            survey={survey}
            responded={responded}
            responseCount={responseCount}
            isAr={isAr}
            isOrganizer={isOrganizer}
            exhibitionId={exhibitionId}
          />
        );
      })}

      {surveys.length === 0 && (
        <div className="py-12 text-center">
          <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">{t("No surveys yet", "لا توجد استبيانات بعد")}</p>
        </div>
      )}
    </div>
  );
}

function SurveyCard({ survey, responded, responseCount, isAr, isOrganizer, exhibitionId }: any) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const submitResponse = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("exhibition_survey_responses").insert({
        survey_id: survey.id,
        user_id: user.id,
        answers,
      });
      if (error) throw error;

      // Award loyalty points for completing survey
      await supabase.from("exhibition_loyalty_actions").insert({
        user_id: user.id,
        exhibition_id: exhibitionId,
        action_type: "survey",
        points_earned: 20,
      }).then(() => {
        supabase.rpc("award_points", {
          p_user_id: user.id,
          p_action_type: "exhibition_survey",
          p_points: 20,
          p_description: "Completed exhibition survey",
          p_description_ar: "إكمال استبيان المعرض",
          p_reference_type: "exhibition",
          p_reference_id: exhibitionId,
        });
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-survey-responses"] });
      queryClient.invalidateQueries({ queryKey: ["exhibition-loyalty"] });
      setShowForm(false);
      toast({ title: t("Thank you for your feedback! 🙏", "شكراً لملاحظاتك! 🙏") });
    },
  });

  const questions = survey.exhibition_survey_questions || [];

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{isAr ? (survey.title_ar || survey.title) : survey.title}</p>
            {isOrganizer && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[9px] gap-1">
                  <BarChart3 className="h-2.5 w-2.5" /> {responseCount} {t("responses", "إجابة")}
                </Badge>
              </div>
            )}
          </div>
          {responded ? (
            <Badge className="bg-chart-3/10 text-chart-3 text-[10px] gap-1 shrink-0">
              <CheckCircle2 className="h-3 w-3" /> {t("Completed", "مكتمل")}
            </Badge>
          ) : user && !isOrganizer ? (
            <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => setShowForm(!showForm)}>
              {t("Take Survey", "أجب")}
            </Button>
          ) : null}
        </div>

        {showForm && !responded && (
          <div className="mt-4 space-y-3 border-t border-border/40 pt-3">
            {questions.sort((a: any, b: any) => a.sort_order - b.sort_order).map((q: any) => (
              <div key={q.id} className="space-y-1.5">
                <Label className="text-xs">{isAr ? (q.question_ar || q.question) : q.question}</Label>
                {q.question_type === "rating" ? (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(r => (
                      <button
                        key={r}
                        onClick={() => setAnswers({ ...answers, [q.id]: r })}
                        className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                          answers[q.id] === r ? "bg-chart-4 text-chart-4-foreground scale-110" : "bg-muted/60 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                ) : q.question_type === "yes_no" ? (
                  <div className="flex gap-2">
                    {["yes", "no"].map(v => (
                      <Button
                        key={v}
                        variant={answers[q.id] === v ? "default" : "outline"}
                        size="sm"
                        className="h-8 text-xs flex-1"
                        onClick={() => setAnswers({ ...answers, [q.id]: v })}
                      >
                        {v === "yes" ? t("Yes", "نعم") : t("No", "لا")}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Textarea
                    value={answers[q.id] || ""}
                    onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder={t("Your answer...", "إجابتك...")}
                    rows={2}
                    className="text-xs"
                  />
                )}
              </div>
            ))}
            <Button
              className="w-full"
              size="sm"
              onClick={() => submitResponse.mutate()}
              disabled={submitResponse.isPending}
            >
              {submitResponse.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Submit", "إرسال")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
