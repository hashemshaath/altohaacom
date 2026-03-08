import { useState, useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { TastingEntry, TastingCriterion, TastingScore, EvalMethod, useSubmitScore } from "@/hooks/useTasting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Star, CheckCircle2, XCircle, Send, Eye, Wrench, Users, HelpCircle, ChevronDown, ImageIcon } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

interface Props {
  sessionId: string;
  entries: TastingEntry[];
  criteria: TastingCriterion[];
  scores: TastingScore[];
  evalMethod: EvalMethod;
  allowNotes: boolean;
  isBlind: boolean;
}

const STAGE_CONFIG = {
  visual: { icon: Eye, en: "Visual Assessment", ar: "التقييم البصري", color: "text-chart-4" },
  technical: { icon: Wrench, en: "Technical Assessment", ar: "التقييم الفني", color: "text-chart-5" },
  performance: { icon: Users, en: "Professional Performance", ar: "الأداء المهني", color: "text-chart-3" },
};

const EVAL_SCALE_LABELS = [
  { value: 0, en: "Unacceptable", ar: "غير مقبول" },
  { value: 1, en: "Acceptable", ar: "مقبول" },
  { value: 2, en: "Average", ar: "متوسط" },
  { value: 3, en: "Good", ar: "جيد" },
  { value: 4, en: "Very Good", ar: "جيد جداً" },
  { value: 5, en: "Excellent", ar: "ممتاز" },
  { value: 6, en: "Extraordinary", ar: "استثنائي" },
];

export const TastingEvaluationPanel = memo(function TastingEvaluationPanel({ sessionId, entries, criteria, scores, evalMethod, allowNotes, isBlind }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const submitScore = useSubmitScore();
  const [selectedEntry, setSelectedEntry] = useState<string>(entries[0]?.id || "");
  const [localScores, setLocalScores] = useState<Record<string, { score?: number; stars?: number; passed?: boolean; note?: string }>>({});

  const entry = entries.find(e => e.id === selectedEntry);
  const myScores = scores.filter(s => s.judge_id === user?.id && s.entry_id === selectedEntry);

  // Group criteria by stage
  const stages = useMemo(() => {
    const grouped: Record<string, TastingCriterion[]> = {};
    const noStage: TastingCriterion[] = [];
    criteria.forEach(c => {
      const s = (c as any).stage;
      if (s && STAGE_CONFIG[s as keyof typeof STAGE_CONFIG]) {
        if (!grouped[s]) grouped[s] = [];
        grouped[s].push(c);
      } else {
        noStage.push(c);
      }
    });
    return { grouped, noStage, hasStages: Object.keys(grouped).length > 0 };
  }, [criteria]);

  // Radar data for current entry
  const radarData = useMemo(() => {
    if (criteria.length < 3) return null;
    return criteria.map(crit => {
      const val = getScoreValue(crit.id);
      const maxScore = crit.max_score || 10;
      let normalized = 0;
      if (evalMethod === "numeric") normalized = ((val.score ?? 0) / maxScore) * 100;
      else if (evalMethod === "stars") normalized = ((val.stars ?? 0) / 5) * 100;
      else if (evalMethod === "pass_fail") normalized = val.passed ? 100 : 0;
      return {
        criterion: isAr && crit.name_ar ? crit.name_ar : crit.name,
        value: Math.round(normalized),
      };
    });
  }, [criteria, localScores, selectedEntry, evalMethod, isAr]);

  function getExistingScore(criterionId: string) {
    return myScores.find(s => s.criterion_id === criterionId);
  }

  function getLocalKey(criterionId: string) {
    return `${selectedEntry}-${criterionId}`;
  }

  function getScoreValue(criterionId: string) {
    const key = getLocalKey(criterionId);
    if (localScores[key]) return localScores[key];
    const existing = getExistingScore(criterionId);
    if (existing) return { score: existing.score ?? undefined, stars: existing.stars ?? undefined, passed: existing.passed ?? undefined, note: existing.note ?? undefined };
    return {};
  }

  function updateLocal(criterionId: string, update: Partial<{ score: number; stars: number; passed: boolean; note: string }>) {
    const key = getLocalKey(criterionId);
    setLocalScores(prev => ({ ...prev, [key]: { ...getScoreValue(criterionId), ...update } }));
  }

  async function handleSubmitAll() {
    if (!user) return;
    try {
      for (const crit of criteria) {
        const val = getScoreValue(crit.id);
        await submitScore.mutateAsync({
          session_id: sessionId,
          entry_id: selectedEntry,
          criterion_id: crit.id,
          score: val.score ?? null as any,
          stars: val.stars ?? null as any,
          passed: val.passed ?? null as any,
          note: val.note ?? null as any,
        });
      }
      toast.success(isAr ? "تم حفظ التقييمات" : "Scores saved");
    } catch {
      toast.error(isAr ? "خطأ في الحفظ" : "Failed to save");
    }
  }

  function renderScaleLabel(value: number) {
    const label = EVAL_SCALE_LABELS.find(l => l.value === Math.round(value));
    return label ? (isAr ? label.ar : label.en) : "";
  }

  function renderCriterionCard(crit: TastingCriterion) {
    const val = getScoreValue(crit.id);
    const guidelines = (crit as any).guidelines;
    const guidelinesAr = (crit as any).guidelines_ar;
    const refImages = (crit as any).reference_images as string[] | null;
    const hasHelp = guidelines || guidelinesAr || (refImages && refImages.length > 0);

    return (
      <div key={crit.id} className="space-y-2 rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm font-medium">{isAr && crit.name_ar ? crit.name_ar : crit.name}</p>
              {crit.description && <p className="text-xs text-muted-foreground">{isAr && (crit as any).description_ar ? (crit as any).description_ar : crit.description}</p>}
            </div>
            {hasHelp && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-primary transition-colors">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{isAr && guidelinesAr ? guidelinesAr : guidelines}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center gap-2">
            {crit.weight > 1 && <Badge variant="outline" className="text-xs">×{crit.weight}</Badge>}
          </div>
        </div>

        {/* Reference images */}
        {refImages && refImages.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs text-muted-foreground">
                <ImageIcon className="h-3 w-3" />
                {isAr ? "صور مرجعية" : "Reference Images"}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                {refImages.map((img, i) => (
                  <img key={i} src={img} alt={`ref-${i}`} className="h-20 w-20 rounded-xl object-cover border" />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {evalMethod === "numeric" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">0</span>
              <div className="text-center">
                <span className="text-lg font-bold text-primary">{val.score ?? 0}</span>
                {crit.max_score <= 6 && (
                  <p className="text-[10px] text-muted-foreground">{renderScaleLabel(val.score ?? 0)}</p>
                )}
              </div>
              <span className="text-muted-foreground">{crit.max_score}</span>
            </div>
            <Slider
              value={[val.score ?? 0]}
              onValueChange={([v]) => updateLocal(crit.id, { score: v })}
              max={crit.max_score}
              step={crit.max_score <= 6 ? 1 : 0.5}
            />
          </div>
        )}

        {evalMethod === "stars" && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} type="button" onClick={() => updateLocal(crit.id, { stars: star })} className="transition-transform hover:scale-110">
                <Star className={`h-7 w-7 ${(val.stars ?? 0) >= star ? "fill-chart-4 text-chart-4" : "text-muted-foreground/30"}`} />
              </button>
            ))}
            <span className="ms-2 text-sm font-medium text-muted-foreground">{val.stars ?? 0}/5</span>
          </div>
        )}

        {evalMethod === "pass_fail" && (
          <div className="flex items-center gap-4">
            <Button type="button" variant={val.passed === true ? "default" : "outline"} size="sm" className="gap-1.5" onClick={() => updateLocal(crit.id, { passed: true })}>
              <CheckCircle2 className="h-4 w-4" />{isAr ? "ناجح" : "Pass"}
            </Button>
            <Button type="button" variant={val.passed === false ? "destructive" : "outline"} size="sm" className="gap-1.5" onClick={() => updateLocal(crit.id, { passed: false })}>
              <XCircle className="h-4 w-4" />{isAr ? "راسب" : "Fail"}
            </Button>
          </div>
        )}

        {allowNotes && (
          <Textarea
            placeholder={isAr ? "ملاحظات..." : "Notes..."}
            value={val.note ?? ""}
            onChange={e => updateLocal(crit.id, { note: e.target.value })}
            rows={2}
            className="mt-2"
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Entry selector */}
      <div className="flex flex-wrap gap-2">
        {entries.map((e, i) => (
          <Button
            key={e.id}
            variant={selectedEntry === e.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedEntry(e.id)}
            className="gap-1.5"
          >
            {(e as any).images?.[0] && (
              <img src={(e as any).images[0]} alt="" className="h-5 w-5 rounded object-cover" />
            )}
            {isBlind ? `#${e.entry_number || i + 1}` : (isAr && e.dish_name_ar ? e.dish_name_ar : e.dish_name)}
          </Button>
        ))}
      </div>

      {entry && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main evaluation area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Entry images */}
            {(entry as any).images?.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {((entry as any).images as string[]).map((img, i) => (
                  <img key={i} src={img} alt={entry.dish_name} className="h-32 w-32 rounded-xl object-cover border" />
                ))}
              </div>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {isBlind ? `${isAr ? "طبق" : "Entry"} #${entry.entry_number || 1}` : (isAr && entry.dish_name_ar ? entry.dish_name_ar : entry.dish_name)}
                  {!isBlind && entry.chef_name && (
                    <Badge variant="secondary" className="text-xs">{entry.chef_name}</Badge>
                  )}
                  {entry.category && <Badge variant="outline" className="text-xs">{entry.category}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {/* Stage-based tabs or flat list */}
                {stages.hasStages ? (
                  <Tabs defaultValue={Object.keys(stages.grouped)[0]} className="w-full">
                    <TabsList className="w-full flex-wrap mb-4">
                      {Object.entries(stages.grouped).map(([stageKey, stageCriteria]) => {
                        const cfg = STAGE_CONFIG[stageKey as keyof typeof STAGE_CONFIG];
                        const Icon = cfg.icon;
                        return (
                          <TabsTrigger key={stageKey} value={stageKey} className="gap-1.5">
                            <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                            {isAr ? cfg.ar : cfg.en}
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">{stageCriteria.length}</Badge>
                          </TabsTrigger>
                        );
                      })}
                      {stages.noStage.length > 0 && (
                        <TabsTrigger value="general" className="gap-1.5">
                          {isAr ? "عام" : "General"}
                        </TabsTrigger>
                      )}
                    </TabsList>

                    {Object.entries(stages.grouped).map(([stageKey, stageCriteria]) => (
                      <TabsContent key={stageKey} value={stageKey} className="space-y-4">
                        {/* Stage description */}
                        <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                          {stageKey === "visual" && (isAr ? "قم بتقييم المظهر البصري والتقديم والجاذبية العامة" : "Evaluate visual appearance, presentation, and overall appeal")}
                          {stageKey === "technical" && (isAr ? "قم بتقييم المهارات الفنية والتقنيات والنظافة" : "Assess technical skills, techniques, and hygiene standards")}
                          {stageKey === "performance" && (isAr ? "قم بتقييم الأداء المهني والتواصل والانطباع العام" : "Rate professional performance, communication, and overall impression")}
                        </div>
                        {stageCriteria.map(renderCriterionCard)}
                      </TabsContent>
                    ))}

                    {stages.noStage.length > 0 && (
                      <TabsContent value="general" className="space-y-4">
                        {stages.noStage.map(renderCriterionCard)}
                      </TabsContent>
                    )}
                  </Tabs>
                ) : (
                  <div className="space-y-4">
                    {criteria.map(renderCriterionCard)}
                  </div>
                )}

                <Button onClick={handleSubmitAll} disabled={submitScore.isPending} className="w-full gap-2 mt-4">
                  <Send className="h-4 w-4" />
                  {submitScore.isPending ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ التقييمات" : "Save Scores")}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Radar chart + score summary */}
          <div className="space-y-4">
            {/* Live radar chart */}
            {radarData && radarData.length >= 3 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{isAr ? "نظرة عامة على التقييم" : "Evaluation Overview"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 9 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                        <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Score summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{isAr ? "ملخص الدرجات" : "Score Summary"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {criteria.map(crit => {
                  const val = getScoreValue(crit.id);
                  let display = "—";
                  let percent = 0;
                  if (evalMethod === "numeric" && val.score != null) {
                    display = `${val.score}/${crit.max_score}`;
                    percent = (val.score / crit.max_score) * 100;
                  } else if (evalMethod === "stars" && val.stars != null) {
                    display = `${val.stars}/5`;
                    percent = (val.stars / 5) * 100;
                  } else if (evalMethod === "pass_fail" && val.passed != null) {
                    display = val.passed ? (isAr ? "✓ ناجح" : "✓ Pass") : (isAr ? "✗ راسب" : "✗ Fail");
                    percent = val.passed ? 100 : 0;
                  }
                  return (
                    <div key={crit.id} className="flex items-center gap-2 text-xs">
                      <div className="flex-1 min-w-0 truncate">{isAr && crit.name_ar ? crit.name_ar : crit.name}</div>
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="w-12 text-end font-medium shrink-0">{display}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Evaluation scale legend */}
            {evalMethod === "numeric" && criteria.some(c => c.max_score <= 6) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{isAr ? "مقياس التقييم" : "Evaluation Scale"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {EVAL_SCALE_LABELS.map(label => (
                      <div key={label.value} className="flex items-center gap-2 text-xs">
                        <span className="w-4 font-bold text-primary">{label.value}</span>
                        <span className="text-muted-foreground">{isAr ? label.ar : label.en}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
