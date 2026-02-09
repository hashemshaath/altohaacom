import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2 } from "lucide-react";
import type { CriteriaForm } from "./types";
import { emptyCriteria } from "./types";

interface CriteriaStepProps {
  criteria: CriteriaForm[];
  onChange: (criteria: CriteriaForm[]) => void;
}

export function CriteriaStep({ criteria, onChange }: CriteriaStepProps) {
  const { language } = useLanguage();

  const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight), 0);
  const weightPct = Math.round(totalWeight * 100);
  const isBalanced = Math.abs(totalWeight - 1) < 0.01;

  const addCriteria = () => onChange([...criteria, { ...emptyCriteria }]);

  const removeCriteria = (index: number) => {
    if (criteria.length > 1) {
      onChange(criteria.filter((_, i) => i !== index));
    }
  };

  const updateCriteria = (index: number, field: keyof CriteriaForm, value: string | number) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{language === "ar" ? "معايير التحكيم" : "Judging Criteria"}</CardTitle>
        <CardDescription>
          {language === "ar"
            ? "حدد كيف سيتم تقييم المشاركين. يجب أن تصل الأوزان إلى 100%."
            : "Define how participants will be scored. Weights should total 100%."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weight Progress */}
        <div className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {language === "ar" ? "إجمالي الأوزان" : "Total Weight"}
            </span>
            <span className={`font-medium ${isBalanced ? "text-primary" : "text-destructive"}`}>
              {weightPct}%
            </span>
          </div>
          <Progress value={Math.min(weightPct, 100)} className="h-2" />
          {!isBalanced && (
            <p className="text-xs text-destructive">
              {weightPct < 100
                ? language === "ar"
                  ? `متبقي ${100 - weightPct}% للوصول إلى 100%`
                  : `${100 - weightPct}% remaining to reach 100%`
                : language === "ar"
                ? `تجاوز بـ ${weightPct - 100}%`
                : `Exceeds by ${weightPct - 100}%`}
            </p>
          )}
        </div>

        {criteria.map((crit, index) => (
          <div key={crit.id || index} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {language === "ar" ? `المعيار ${index + 1}` : `Criterion ${index + 1}`}
              </span>
              {criteria.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeCriteria(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder={language === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}
                value={crit.name}
                onChange={(e) => updateCriteria(index, "name", e.target.value)}
              />
              <Input
                placeholder="الاسم (عربي)"
                value={crit.name_ar}
                onChange={(e) => updateCriteria(index, "name_ar", e.target.value)}
                dir="rtl"
              />
            </div>

            <Textarea
              placeholder={language === "ar" ? "الوصف (اختياري)" : "Description (optional)"}
              value={crit.description}
              onChange={(e) => updateCriteria(index, "description", e.target.value)}
              rows={2}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">
                  {language === "ar" ? "الدرجة القصوى" : "Max Score"}
                </Label>
                <Input
                  type="number"
                  value={crit.max_score}
                  onChange={(e) => updateCriteria(index, "max_score", parseInt(e.target.value) || 10)}
                  min={1}
                  max={100}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">
                  {language === "ar" ? "الوزن" : "Weight"} ({(Number(crit.weight) * 100).toFixed(0)}%)
                </Label>
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

        <Button type="button" variant="outline" onClick={addCriteria} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          {language === "ar" ? "إضافة معيار" : "Add Criterion"}
        </Button>
      </CardContent>
    </Card>
  );
}
