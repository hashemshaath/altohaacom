import { useMemo, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AITextOptimizer } from "@/components/admin/AITextOptimizer";
import { Plus, Trash2 } from "lucide-react";
import type { CriteriaForm } from "./types";
import { emptyCriteria } from "./types";

interface CriteriaStepProps {
  criteria: CriteriaForm[];
  onChange: (criteria: CriteriaForm[]) => void;
}

export const CriteriaStep = memo(function CriteriaStep({ criteria, onChange }: CriteriaStepProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { totalWeight, weightPct, isBalanced } = useMemo(() => {
    const tw = criteria.reduce((sum, c) => sum + Number(c.weight), 0);
    return { totalWeight: tw, weightPct: Math.round(tw * 100), isBalanced: Math.abs(tw - 1) < 0.01 };
  }, [criteria]);

  const addCriteria = () => onChange([...criteria, { ...emptyCriteria }]);

  const removeCriteria = (index: number) => {
    if (criteria.length > 1) onChange(criteria.filter((_, i) => i !== index));
  };

  const updateCriteria = (index: number, field: keyof CriteriaForm, value: string | number) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{isAr ? "معايير التحكيم" : "Judging Criteria"}</CardTitle>
        <CardDescription className="text-xs">
          {isAr
            ? "حدد كيف سيتم تقييم المشاركين. يجب أن تصل الأوزان إلى 100%."
            : "Define how participants will be scored. Weights should total 100%."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5 rounded-xl border p-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{isAr ? "إجمالي الأوزان" : "Total Weight"}</span>
            <span className={`font-medium ${isBalanced ? "text-primary" : "text-destructive"}`}>{weightPct}%</span>
          </div>
          <Progress value={Math.min(weightPct, 100)} className="h-1.5" />
          {!isBalanced && (
            <p className="text-[10px] text-destructive">
              {weightPct < 100
                ? isAr ? `متبقي ${100 - weightPct}% للوصول إلى 100%` : `${100 - weightPct}% remaining to reach 100%`
                : isAr ? `تجاوز بـ ${weightPct - 100}%` : `Exceeds by ${weightPct - 100}%`}
            </p>
          )}
        </div>

        {criteria.map((crit, index) => (
          <div key={crit.id || index} className="space-y-2.5 rounded-xl border p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {isAr ? `المعيار ${index + 1}` : `Criterion ${index + 1}`}
              </span>
              {criteria.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCriteria(index)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px]">{isAr ? "الاسم (إنجليزي)" : "Name (English)"}</Label>
                  <AITextOptimizer
                    text={crit.name}
                    lang="en"
                    compact
                    onTranslated={(v) => updateCriteria(index, "name_ar", v)}
                  />
                </div>
                <Input
                  placeholder={isAr ? "الاسم (إنجليزي)" : "Name (English)"}
                  value={crit.name}
                  onChange={(e) => updateCriteria(index, "name", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px]">{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                  <AITextOptimizer
                    text={crit.name_ar}
                    lang="ar"
                    compact
                    onTranslated={(v) => updateCriteria(index, "name", v)}
                  />
                </div>
                <Input
                  placeholder="الاسم (عربي)"
                  value={crit.name_ar}
                  onChange={(e) => updateCriteria(index, "name_ar", e.target.value)}
                  dir="rtl"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px]">{isAr ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
                  <AITextOptimizer
                    text={crit.description}
                    lang="en"
                    compact
                    onTranslated={(v) => updateCriteria(index, "description_ar", v)}
                  />
                </div>
                <Textarea
                  placeholder={isAr ? "الوصف (اختياري)" : "Description (optional)"}
                  value={crit.description}
                  onChange={(e) => updateCriteria(index, "description", e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px]">{isAr ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                  <AITextOptimizer
                    text={crit.description_ar}
                    lang="ar"
                    compact
                    onTranslated={(v) => updateCriteria(index, "description", v)}
                  />
                </div>
                <Textarea
                  placeholder="الوصف (عربي)"
                  value={crit.description_ar}
                  onChange={(e) => updateCriteria(index, "description_ar", e.target.value)}
                  rows={2}
                  dir="rtl"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[10px]">{isAr ? "الدرجة القصوى" : "Max Score"}</Label>
                <Input type="number" value={crit.max_score} onChange={(e) => updateCriteria(index, "max_score", parseInt(e.target.value) || 10)} min={1} max={100} className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">{isAr ? "الوزن" : "Weight"} ({(Number(crit.weight) * 100).toFixed(0)}%)</Label>
                <Input type="number" step="0.05" value={crit.weight} onChange={(e) => updateCriteria(index, "weight", parseFloat(e.target.value) || 0)} min={0} max={1} className="h-8" />
              </div>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addCriteria} className="w-full">
          <Plus className="me-2 h-4 w-4" />
          {isAr ? "إضافة معيار" : "Add Criterion"}
        </Button>
      </CardContent>
    </Card>
  );
}
