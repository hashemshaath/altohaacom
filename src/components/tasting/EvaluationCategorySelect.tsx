import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Coffee, Wine, UtensilsCrossed, Palette, Globe, ChefHat } from "lucide-react";

export type EvaluationCategory = "culinary" | "coffee" | "barista" | "beverage" | "decoration" | "local_dishes" | "international";

const CATEGORIES: { value: EvaluationCategory; icon: any; en: string; ar: string; desc_en: string; desc_ar: string }[] = [
  { value: "culinary", icon: UtensilsCrossed, en: "Culinary", ar: "الطهي العام", desc_en: "General culinary evaluation", desc_ar: "تقييم الطهي العام" },
  { value: "coffee", icon: Coffee, en: "Coffee & Latte Art", ar: "القهوة ولاتيه آرت", desc_en: "WLAC-style coffee and latte art competitions", desc_ar: "مسابقات القهوة ولاتيه آرت على غرار WLAC" },
  { value: "barista", icon: ChefHat, en: "Barista Championship", ar: "بطولة الباريستا", desc_en: "Espresso, milk beverages, and signature drinks", desc_ar: "إسبريسو ومشروبات الحليب والمشروبات المميزة" },
  { value: "beverage", icon: Wine, en: "Beverages & Mixology", ar: "المشروبات والمزج", desc_en: "Non-alcoholic cocktails, juices, and beverages", desc_ar: "الكوكتيلات الخالية من الكحول والعصائر والمشروبات" },
  { value: "decoration", icon: Palette, en: "Decoration & Plating", ar: "التزيين والتقديم", desc_en: "Plate decoration and food art", desc_ar: "تزيين الأطباق وفن الطعام" },
  { value: "local_dishes", icon: UtensilsCrossed, en: "Local & Traditional", ar: "الأطباق المحلية والتقليدية", desc_en: "Local cuisine and traditional dishes", desc_ar: "المطبخ المحلي والأطباق التقليدية" },
  { value: "international", icon: Globe, en: "International Standards", ar: "المعايير الدولية", desc_en: "International culinary standards and dish development", desc_ar: "المعايير الدولية للطهي وتطوير الأطباق" },
];

interface Props {
  value: EvaluationCategory;
  onChange: (v: EvaluationCategory) => void;
}

export const EvaluationCategorySelect = memo(function EvaluationCategorySelect({ value, onChange }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(v as EvaluationCategory)} className="grid gap-2 sm:grid-cols-2">
      {CATEGORIES.map(cat => {
        const Icon = cat.icon;
        const active = value === cat.value;
        return (
          <div
            key={cat.value}
            className={`flex items-start gap-3 rounded-xl border p-3 transition-colors cursor-pointer ${active ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
            onClick={() => onChange(cat.value)}
          >
            <RadioGroupItem value={cat.value} id={`cat-${cat.value}`} className="mt-0.5" />
            <Label htmlFor={`cat-${cat.value}`} className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <span className="font-medium text-sm">{isAr ? cat.ar : cat.en}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{isAr ? cat.desc_ar : cat.desc_en}</p>
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
});

export { CATEGORIES };
