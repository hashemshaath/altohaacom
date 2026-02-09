import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { CategoryForm } from "./types";
import { emptyCategory } from "./types";

interface CategoriesStepProps {
  categories: CategoryForm[];
  onChange: (categories: CategoryForm[]) => void;
}

export function CategoriesStep({ categories, onChange }: CategoriesStepProps) {
  const { language } = useLanguage();

  const addCategory = () => onChange([...categories, { ...emptyCategory }]);

  const removeCategory = (index: number) => {
    if (categories.length > 1) {
      onChange(categories.filter((_, i) => i !== index));
    }
  };

  const updateCategory = (index: number, field: keyof CategoryForm, value: string | number | null) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const genderOptions = [
    { value: "mixed", label: language === "ar" ? "مختلط" : "Mixed" },
    { value: "male", label: language === "ar" ? "ذكور" : "Male" },
    { value: "female", label: language === "ar" ? "إناث" : "Female" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{language === "ar" ? "الفئات" : "Categories"}</CardTitle>
        <CardDescription>
          {language === "ar"
            ? "حدد فئات المسابقة (مثل: الطبق الرئيسي، الحلويات)"
            : "Define competition categories (e.g., Main Course, Desserts)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((cat, index) => (
          <div key={cat.id || index} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {language === "ar" ? `الفئة ${index + 1}` : `Category ${index + 1}`}
              </span>
              {categories.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeCategory(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder={language === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}
                value={cat.name}
                onChange={(e) => updateCategory(index, "name", e.target.value)}
              />
              <Input
                placeholder="الاسم (عربي)"
                value={cat.name_ar}
                onChange={(e) => updateCategory(index, "name_ar", e.target.value)}
                dir="rtl"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Textarea
                placeholder={language === "ar" ? "الوصف (اختياري)" : "Description (optional)"}
                value={cat.description}
                onChange={(e) => updateCategory(index, "description", e.target.value)}
                rows={2}
              />
              <Textarea
                placeholder="الوصف (عربي - اختياري)"
                value={cat.description_ar}
                onChange={(e) => updateCategory(index, "description_ar", e.target.value)}
                rows={2}
                dir="rtl"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">
                  {language === "ar" ? "الحد الأقصى للمشاركين" : "Max Participants"}
                </Label>
                <Input
                  type="number"
                  placeholder={language === "ar" ? "غير محدود" : "Unlimited"}
                  value={cat.max_participants || ""}
                  onChange={(e) =>
                    updateCategory(index, "max_participants", e.target.value ? parseInt(e.target.value) : null)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{language === "ar" ? "الجنس" : "Gender"}</Label>
                <Select
                  value={cat.gender || "mixed"}
                  onValueChange={(v) => updateCategory(index, "gender", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addCategory} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          {language === "ar" ? "إضافة فئة" : "Add Category"}
        </Button>
      </CardContent>
    </Card>
  );
}
