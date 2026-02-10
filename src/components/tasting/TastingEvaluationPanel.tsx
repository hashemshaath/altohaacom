import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { TastingEntry, TastingCriterion, TastingScore, EvalMethod, useSubmitScore } from "@/hooks/useTasting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Star, CheckCircle2, XCircle, Send } from "lucide-react";

interface Props {
  sessionId: string;
  entries: TastingEntry[];
  criteria: TastingCriterion[];
  scores: TastingScore[];
  evalMethod: EvalMethod;
  allowNotes: boolean;
  isBlind: boolean;
}

export function TastingEvaluationPanel({ sessionId, entries, criteria, scores, evalMethod, allowNotes, isBlind }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const submitScore = useSubmitScore();
  const [selectedEntry, setSelectedEntry] = useState<string>(entries[0]?.id || "");
  const [localScores, setLocalScores] = useState<Record<string, { score?: number; stars?: number; passed?: boolean; note?: string }>>({});

  const entry = entries.find(e => e.id === selectedEntry);
  const myScores = scores.filter(s => s.judge_id === user?.id && s.entry_id === selectedEntry);

  const getExistingScore = (criterionId: string) => {
    return myScores.find(s => s.criterion_id === criterionId);
  };

  const getLocalKey = (criterionId: string) => `${selectedEntry}-${criterionId}`;

  const getScoreValue = (criterionId: string) => {
    const key = getLocalKey(criterionId);
    if (localScores[key]) return localScores[key];
    const existing = getExistingScore(criterionId);
    if (existing) return { score: existing.score ?? undefined, stars: existing.stars ?? undefined, passed: existing.passed ?? undefined, note: existing.note ?? undefined };
    return {};
  };

  const updateLocal = (criterionId: string, update: Partial<{ score: number; stars: number; passed: boolean; note: string }>) => {
    const key = getLocalKey(criterionId);
    setLocalScores(prev => ({ ...prev, [key]: { ...getScoreValue(criterionId), ...update } }));
  };

  const handleSubmitAll = async () => {
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
  };

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
          >
            {isBlind ? `#${e.entry_number || i + 1}` : (isAr && e.dish_name_ar ? e.dish_name_ar : e.dish_name)}
          </Button>
        ))}
      </div>

      {entry && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {isBlind ? `${isAr ? "طبق" : "Entry"} #${entry.entry_number || 1}` : (isAr && entry.dish_name_ar ? entry.dish_name_ar : entry.dish_name)}
              {!isBlind && entry.chef_name && (
                <Badge variant="secondary" className="text-xs">{entry.chef_name}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {criteria.map(crit => {
              const val = getScoreValue(crit.id);
              return (
                <div key={crit.id} className="space-y-2 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{isAr && crit.name_ar ? crit.name_ar : crit.name}</p>
                      {crit.description && <p className="text-xs text-muted-foreground">{isAr && crit.description_ar ? crit.description_ar : crit.description}</p>}
                    </div>
                    {crit.weight > 1 && <Badge variant="outline" className="text-xs">×{crit.weight}</Badge>}
                  </div>

                  {evalMethod === "numeric" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">0</span>
                        <span className="text-lg font-bold text-primary">{val.score ?? 0}</span>
                        <span className="text-muted-foreground">{crit.max_score}</span>
                      </div>
                      <Slider
                        value={[val.score ?? 0]}
                        onValueChange={([v]) => updateLocal(crit.id, { score: v })}
                        max={crit.max_score}
                        step={0.5}
                      />
                    </div>
                  )}

                  {evalMethod === "stars" && (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => updateLocal(crit.id, { stars: star })}
                          className="transition-transform hover:scale-110"
                        >
                          <Star className={`h-7 w-7 ${(val.stars ?? 0) >= star ? "fill-chart-4 text-chart-4" : "text-muted-foreground/30"}`} />
                        </button>
                      ))}
                      <span className="ms-2 text-sm font-medium text-muted-foreground">{val.stars ?? 0}/5</span>
                    </div>
                  )}

                  {evalMethod === "pass_fail" && (
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant={val.passed === true ? "default" : "outline"}
                        size="sm"
                        className="gap-1.5"
                        onClick={() => updateLocal(crit.id, { passed: true })}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {isAr ? "ناجح" : "Pass"}
                      </Button>
                      <Button
                        type="button"
                        variant={val.passed === false ? "destructive" : "outline"}
                        size="sm"
                        className="gap-1.5"
                        onClick={() => updateLocal(crit.id, { passed: false })}
                      >
                        <XCircle className="h-4 w-4" />
                        {isAr ? "راسب" : "Fail"}
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
            })}

            <Button onClick={handleSubmitAll} disabled={submitScore.isPending} className="w-full gap-2">
              <Send className="h-4 w-4" />
              {submitScore.isPending ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ التقييمات" : "Save Scores")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
