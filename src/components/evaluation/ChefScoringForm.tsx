import { useState, useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useEvaluationCriteriaByDomain, useUpsertEvaluationScore, type EvaluationCriterion, type EvaluationCriteriaCategory } from "@/hooks/useEvaluationSystem";
import { useSubmitEvaluation, type ChefsTableEvaluation } from "@/hooks/useChefsTable";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  Star, ChefHat, Send, ThumbsUp, ThumbsDown, Scale,
  FileText, Sparkles, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";

interface Props {
  sessionId: string;
  invitationId: string;
  productCategory: string;
  entityId: string; // session ID used as entity_id for evaluation_scores
  evaluatorId: string; // chef user id
  subjectId: string; // session or product identifier
  existingEvaluation?: ChefsTableEvaluation;
  onComplete?: () => void;
}

function getScoreColor(score: number, max: number): string {
  const pct = (score / max) * 100;
  if (pct >= 80) return "text-chart-5";
  if (pct >= 60) return "text-chart-4";
  if (pct >= 40) return "text-primary";
  return "text-destructive";
}

function getScoreEmoji(score: number, max: number): string {
  const pct = (score / max) * 100;
  if (pct >= 90) return "🌟";
  if (pct >= 70) return "👍";
  if (pct >= 50) return "👌";
  if (pct >= 30) return "🤔";
  return "👎";
}

export const ChefScoringForm = memo(function ChefScoringForm({
  sessionId,
  invitationId,
  productCategory,
  entityId,
  evaluatorId,
  subjectId,
  existingEvaluation,
  onComplete,
}: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: criteriaData, isLoading } = useEvaluationCriteriaByDomain("chefs_table", productCategory);
  const upsertScore = useUpsertEvaluationScore();
  const submitEvaluation = useSubmitEvaluation();

  // Scores keyed by criterion ID
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Review fields
  const [reviewTitle, setReviewTitle] = useState(existingEvaluation?.review_title || "");
  const [reviewText, setReviewText] = useState(existingEvaluation?.review_text || "");
  const [cookingExperience, setCookingExperience] = useState(existingEvaluation?.cooking_experience || "");
  const [dishesPrepared, setDishesPrepared] = useState(existingEvaluation?.dishes_prepared || "");
  const [pros, setPros] = useState(existingEvaluation?.pros || "");
  const [cons, setCons] = useState(existingEvaluation?.cons || "");
  const [usageSuggestions, setUsageSuggestions] = useState(existingEvaluation?.usage_suggestions || "");
  const [endorsementText, setEndorsementText] = useState(existingEvaluation?.endorsement_text || "");
  const [isRecommended, setIsRecommended] = useState(existingEvaluation?.is_recommended ?? true);
  const [allowPublish, setAllowPublish] = useState(existingEvaluation?.allow_publish ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: EvaluationCriteriaCategory[] = (criteriaData?.categories || []) as EvaluationCriteriaCategory[];
  const criteria: EvaluationCriterion[] = (criteriaData?.criteria || []) as EvaluationCriterion[];

  // Compute progress
  const requiredCriteria = useMemo(() => criteria.filter(c => c.is_required), [criteria]);
  const { filledRequired, progress } = useMemo(() => {
    const filled = requiredCriteria.filter(c => scores[c.id] !== undefined);
    return { filledRequired: filled, progress: requiredCriteria.length > 0 ? Math.round((filled.length / requiredCriteria.length) * 100) : 0 };
  }, [requiredCriteria, scores]);

  // Compute overall score
  const overallScore = useMemo(() => {
    const scored = criteria.filter(c => scores[c.id] !== undefined);
    if (scored.length === 0) return 0;
    const totalWeight = scored.reduce((s, c) => s + c.weight, 0);
    if (totalWeight === 0) return 0;
    const weighted = scored.reduce((s, c) => s + (scores[c.id] / c.max_score) * c.weight, 0);
    return (weighted / totalWeight) * 10;
  }, [scores, criteria]);

  const handleScoreChange = (criterionId: string, value: number) => {
    setScores(prev => ({ ...prev, [criterionId]: value }));
  };

  const handleSubmit = async () => {
    // Validate required
    const missing = requiredCriteria.filter(c => scores[c.id] === undefined);
    if (missing.length > 0) {
      toast.error(isAr ? `يرجى تقييم جميع المعايير المطلوبة (${missing.length} متبقية)` : `Please rate all required criteria (${missing.length} remaining)`);
      return;
    }
    if (!reviewText.trim()) {
      toast.error(isAr ? "يرجى كتابة ملاحظاتك" : "Please write your review");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Save individual scores to evaluation_scores
      for (const criterion of criteria) {
        if (scores[criterion.id] !== undefined) {
          await upsertScore.mutateAsync({
            domain_slug: "chefs_table",
            entity_id: entityId,
            evaluator_id: evaluatorId,
            subject_id: subjectId,
            criterion_id: criterion.id,
            score: scores[criterion.id],
            notes: notes[criterion.id] || null,
          });
        }
      }

      // 2. Map scores to legacy evaluation columns
      const catScoreMap: Record<string, { total: number; count: number }> = {};
      for (const c of criteria) {
        if (scores[c.id] === undefined) continue;
        const cat = categories.find(cat => cat.id === c.category_id);
        if (!cat) continue;
        const catName = cat.name.toLowerCase();
        if (!catScoreMap[catName]) catScoreMap[catName] = { total: 0, count: 0 };
        catScoreMap[catName].total += scores[c.id];
        catScoreMap[catName].count += 1;
      }

      // Approximate legacy score fields from category averages
      const getAvg = (keywords: string[]) => {
        for (const kw of keywords) {
          const match = Object.entries(catScoreMap).find(([k]) => k.includes(kw));
          if (match) return Math.round((match[1].total / match[1].count) * 10) / 10;
        }
        return null;
      };

      const evaluationData: Partial<ChefsTableEvaluation> & { session_id: string; invitation_id: string } = {
        session_id: sessionId,
        invitation_id: invitationId,
        taste_score: getAvg(["sensory", "taste", "flavor"]),
        texture_score: getAvg(["texture", "tenderness", "mouthfeel"]),
        aroma_score: getAvg(["aroma", "fragrance"]),
        versatility_score: getAvg(["versatility", "culinary", "application"]),
        value_score: getAvg(["value", "professional", "standards", "quality"]),
        presentation_score: getAvg(["visual", "presentation", "appearance", "color"]),
        overall_score: Math.round(overallScore * 10) / 10,
        is_recommended: isRecommended,
        recommendation_level: isRecommended ? "recommended" : "not_recommended",
        review_title: reviewTitle || null,
        review_text: reviewText,
        cooking_experience: cookingExperience || null,
        dishes_prepared: dishesPrepared || null,
        pros: pros || null,
        cons: cons || null,
        usage_suggestions: usageSuggestions || null,
        endorsement_text: endorsementText || null,
        allow_publish: allowPublish,
      };

      await submitEvaluation.mutateAsync(evaluationData);

      toast.success(isAr ? "تم إرسال تقييمك بنجاح! شكرًا لك." : "Your evaluation has been submitted! Thank you.");
      onComplete?.();
    } catch (err) {
      toast.error(isAr ? "حدث خطأ أثناء الإرسال" : "Error submitting evaluation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">{isAr ? "جاري تحميل معايير التقييم..." : "Loading evaluation criteria..."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Scale className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">{isAr ? "نموذج التقييم المهني" : "Professional Evaluation Form"}</h2>
              <p className="text-xs text-muted-foreground">
                {isAr ? `${categories.length} فئات · ${criteria.length} معايير · ${requiredCriteria.length} مطلوبة` : `${categories.length} categories · ${criteria.length} criteria · ${requiredCriteria.length} required`}
              </p>
            </div>
            <div className="text-center">
              <span className={`text-3xl font-black ${getScoreColor(overallScore, 10)}`}>
                {overallScore.toFixed(1)}
              </span>
              <p className="text-[10px] text-muted-foreground">/10</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-xs font-bold tabular-nums">{progress}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Criteria Scoring */}
      <Accordion type="multiple" defaultValue={categories.map(c => c.id)} className="space-y-3">
        {categories.map(cat => {
          const catCriteria = criteria.filter(c => c.category_id === cat.id);
          const catScored = catCriteria.filter(c => scores[c.id] !== undefined);
          const catAvg = catScored.length > 0
            ? catScored.reduce((s, c) => s + scores[c.id], 0) / catScored.length
            : 0;

          return (
            <AccordionItem key={cat.id} value={cat.id} className="border rounded-xl overflow-hidden">
              <AccordionTrigger className="hover:no-underline px-5 py-4 bg-muted/20">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-start flex-1">
                    <p className="font-bold text-sm">{isAr && cat.name_ar ? cat.name_ar : cat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {catScored.length}/{catCriteria.length} {isAr ? "مقيّم" : "scored"}
                    </p>
                  </div>
                  {catScored.length > 0 && (
                    <Badge variant="secondary" className={`text-sm font-black ${getScoreColor(catAvg, 10)}`}>
                      {catAvg.toFixed(1)} {getScoreEmoji(catAvg, 10)}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-2">
                <div className="space-y-5">
                  {catCriteria.map(criterion => (
                    <CriterionScoreInput
                      key={criterion.id}
                      criterion={criterion}
                      score={scores[criterion.id]}
                      note={notes[criterion.id] || ""}
                      onScoreChange={(v) => handleScoreChange(criterion.id, v)}
                      onNoteChange={(v) => setNotes(prev => ({ ...prev, [criterion.id]: v }))}
                      isAr={isAr}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Written Review */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {isAr ? "المراجعة المكتوبة" : "Written Review"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs font-bold">{isAr ? "عنوان المراجعة" : "Review Title"}</Label>
            <Input
              value={reviewTitle}
              onChange={e => setReviewTitle(e.target.value)}
              placeholder={isAr ? "مثال: منتج ممتاز للمطابخ المهنية" : "e.g. Excellent product for professional kitchens"}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-bold">
              {isAr ? "ملاحظاتك التفصيلية *" : "Your Detailed Review *"}
            </Label>
            <Textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder={isAr ? "اكتب ملاحظاتك المهنية عن المنتج..." : "Write your professional notes about the product..."}
              rows={4}
              className="mt-1"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold">{isAr ? "تجربة الطهي" : "Cooking Experience"}</Label>
              <Textarea
                value={cookingExperience}
                onChange={e => setCookingExperience(e.target.value)}
                placeholder={isAr ? "كيف كانت تجربة الطهي مع المنتج؟" : "How was the cooking experience with the product?"}
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">{isAr ? "الأطباق المحضّرة" : "Dishes Prepared"}</Label>
              <Textarea
                value={dishesPrepared}
                onChange={e => setDishesPrepared(e.target.value)}
                placeholder={isAr ? "ما الأطباق التي أعددتها؟" : "What dishes did you prepare?"}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-chart-5">{isAr ? "نقاط القوة" : "Strengths"}</Label>
              <Textarea
                value={pros}
                onChange={e => setPros(e.target.value)}
                placeholder={isAr ? "ما أبرز مميزات المنتج؟" : "What are the product's key strengths?"}
                rows={3}
                className="mt-1 border-chart-5/20 focus-visible:ring-chart-5/30"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-destructive">{isAr ? "نقاط التحسين" : "Areas for Improvement"}</Label>
              <Textarea
                value={cons}
                onChange={e => setCons(e.target.value)}
                placeholder={isAr ? "ما النقاط التي يمكن تحسينها؟" : "What could be improved?"}
                rows={3}
                className="mt-1 border-destructive/20 focus-visible:ring-destructive/30"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold">{isAr ? "اقتراحات الاستخدام" : "Usage Suggestions"}</Label>
            <Textarea
              value={usageSuggestions}
              onChange={e => setUsageSuggestions(e.target.value)}
              placeholder={isAr ? "كيف تنصح المطابخ باستخدام هذا المنتج؟" : "How would you recommend professional kitchens use this product?"}
              rows={2}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recommendation & Endorsement */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {isAr ? "التوصية والمصادقة" : "Recommendation & Endorsement"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/40">
            <span className="text-sm font-bold flex-1">
              {isAr ? "هل توصي بهذا المنتج للمطابخ المهنية؟" : "Do you recommend this product for professional kitchens?"}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={isRecommended ? "default" : "outline"}
                onClick={() => setIsRecommended(true)}
                className="gap-1.5"
              >
                <ThumbsUp className="h-4 w-4" />
                {isAr ? "نعم" : "Yes"}
              </Button>
              <Button
                size="sm"
                variant={!isRecommended ? "destructive" : "outline"}
                onClick={() => setIsRecommended(false)}
                className="gap-1.5"
              >
                <ThumbsDown className="h-4 w-4" />
                {isAr ? "لا" : "No"}
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold">{isAr ? "نص المصادقة (قابل للنشر)" : "Endorsement Quote (publishable)"}</Label>
            <Textarea
              value={endorsementText}
              onChange={e => setEndorsementText(e.target.value)}
              placeholder={isAr ? `"منتج استثنائي أنصح به كل شيف محترف..."` : `"An exceptional product I'd recommend to every professional chef..."`}
              rows={2}
              className="mt-1 border-primary/20 italic"
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <Switch checked={allowPublish} onCheckedChange={setAllowPublish} />
            <div>
              <p className="text-sm font-bold">{isAr ? "السماح بالنشر" : "Allow Publication"}</p>
              <p className="text-xs text-muted-foreground">
                {isAr ? "أوافق على نشر تقييمي واسمي في التقرير النهائي" : "I agree to have my evaluation and name published in the final report"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-3">
          {progress === 100 ? (
            <CheckCircle2 className="h-6 w-6 text-chart-5" />
          ) : (
            <AlertCircle className="h-6 w-6 text-chart-4" />
          )}
          <div>
            <p className="text-sm font-bold">
              {progress === 100
                ? (isAr ? "جاهز للإرسال!" : "Ready to submit!")
                : (isAr ? `${100 - progress}% متبقي` : `${100 - progress}% remaining`)}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAr ? `التقييم الإجمالي: ${overallScore.toFixed(1)}/10` : `Overall score: ${overallScore.toFixed(1)}/10`}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          size="lg"
          className="gap-2 rounded-2xl px-8 font-bold shadow-lg shadow-primary/30"
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          {isSubmitting ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "إرسال التقييم" : "Submit Evaluation")}
        </Button>
      </div>
    </div>
  );
});

// ─── Individual Criterion Score Input ───────────

function CriterionScoreInput({
  criterion,
  score,
  note,
  onScoreChange,
  onNoteChange,
  isAr,
}: {
  criterion: EvaluationCriterion;
  score: number | undefined;
  note: string;
  onScoreChange: (v: number) => void;
  onNoteChange: (v: string) => void;
  isAr: boolean;
}) {
  const [showNote, setShowNote] = useState(!!note);

  return (
    <div className="rounded-xl border border-border/50 p-4 hover:bg-muted/20 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold">{isAr && criterion.name_ar ? criterion.name_ar : criterion.name}</p>
            {criterion.is_required && (
              <Badge variant="destructive" className="text-[9px] h-4 px-1">{isAr ? "مطلوب" : "Required"}</Badge>
            )}
            <Badge variant="outline" className="text-[9px] h-4 px-1">{criterion.weight}%</Badge>
          </div>
          {criterion.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr && criterion.description_ar ? criterion.description_ar : criterion.description}
            </p>
          )}
        </div>
        <div className="text-center shrink-0 w-16">
          <span className={`text-2xl font-black tabular-nums ${score !== undefined ? getScoreColor(score, criterion.max_score) : "text-muted-foreground/30"}`}>
            {score !== undefined ? score : "—"}
          </span>
          <p className="text-[10px] text-muted-foreground">/{criterion.max_score}</p>
        </div>
      </div>

      {/* Score Slider */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground font-bold w-4">0</span>
        <Slider
          value={score !== undefined ? [score] : [0]}
          onValueChange={([v]) => onScoreChange(v)}
          min={0}
          max={criterion.max_score}
          step={0.5}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground font-bold w-4">{criterion.max_score}</span>
      </div>

      {/* Quick score buttons */}
      <div className="flex items-center gap-1.5 mt-2">
        {Array.from({ length: criterion.max_score + 1 }, (_, i) => i).filter(i => i % 2 === 0 || i === criterion.max_score).map(v => (
          <button
            key={v}
            onClick={() => onScoreChange(v)}
            className={`h-7 min-w-[28px] rounded-xl text-xs font-bold transition-all ${
              score === v
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 hover:bg-muted text-muted-foreground"
            }`}
          >
            {v}
          </button>
        ))}
        <button
          onClick={() => setShowNote(!showNote)}
          className="ms-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isAr ? "ملاحظة" : "Note"}
        </button>
      </div>

      {showNote && (
        <Textarea
          value={note}
          onChange={e => onNoteChange(e.target.value)}
          placeholder={isAr ? "أضف ملاحظة لهذا المعيار..." : "Add a note for this criterion..."}
          rows={2}
          className="mt-2 text-xs"
        />
      )}
    </div>
  );
});