import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Flame, Cake, Eye, Monitor, Check, Plus, Trash2 } from "lucide-react";
import type { CategoryForm } from "./types";
import { emptyCategory } from "./types";
import { GENDER_OPTIONS, PARTICIPANT_LEVELS, genderDisplay, categoryBadgeText } from "@/lib/categoryUtils";

const iconMap: Record<string, React.ReactNode> = {
  flame: <Flame className="h-5 w-5" />,
  cake: <Cake className="h-5 w-5" />,
  eye: <Eye className="h-5 w-5" />,
  monitor: <Monitor className="h-5 w-5" />,
};

interface TypesCategoriesStepProps {
  selectedTypeIds: string[];
  categories: CategoryForm[];
  onTypeChange: (ids: string[]) => void;
  onCategoriesChange: (cats: CategoryForm[]) => void;
}

export function TypesCategoriesStep({
  selectedTypeIds,
  categories,
  onTypeChange,
  onCategoriesChange,
}: TypesCategoriesStepProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: competitionTypes } = useQuery({
    queryKey: ["competition-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_types")
        .select("id, name, name_ar, description, description_ar, icon, cover_image_url, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: predefinedCategories } = useQuery({
    queryKey: ["predefined-categories", selectedTypeIds],
    queryFn: async () => {
      let query = supabase
        .from("predefined_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (selectedTypeIds.length > 0) {
        query = query.in("type_id", selectedTypeIds);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: selectedTypeIds.length > 0,
  });

  const toggleType = (typeId: string) => {
    if (selectedTypeIds.includes(typeId)) {
      onTypeChange(selectedTypeIds.filter((id) => id !== typeId));
    } else {
      onTypeChange([...selectedTypeIds, typeId]);
    }
  };

  const togglePredefinedCategory = (predef: { name: string; name_ar: string | null; description: string | null; description_ar: string | null; gender: string | null; default_max_participants: number | null }) => {
    const exists = categories.some((c) => c.name === predef.name);
    if (exists) {
      onCategoriesChange(categories.filter((c) => c.name !== predef.name));
    } else {
      onCategoriesChange([
        ...categories.filter((c) => c.name.trim()),
        {
          name: predef.name,
          name_ar: predef.name_ar || "",
          description: predef.description || "",
          description_ar: predef.description_ar || "",
          max_participants: predef.default_max_participants,
          gender: predef.gender === "mixed" ? "open" : (predef.gender || "open"),
        },
      ]);
    }
  };

  const addCustomCategory = () => {
    onCategoriesChange([...categories, { ...emptyCategory }]);
  };

  const removeCategory = (index: number) => {
    onCategoriesChange(categories.filter((_, i) => i !== index));
  };

  const updateCategory = (index: number, field: keyof CategoryForm, value: string | number | null) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    onCategoriesChange(updated);
  };

  // Group predefined categories by type
  const categoriesByType = competitionTypes?.reduce((acc, type) => {
    acc[type.id] = predefinedCategories?.filter((c) => c.type_id === type.id) || [];
    return acc;
  }, {} as Record<string, typeof predefinedCategories>) || {};

  return (
    <div className="space-y-6">
      {/* Competition Types */}
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "نوع المسابقة" : "Competition Type"}</CardTitle>
          <CardDescription>
            {isAr
              ? "اختر نوعاً واحداً أو أكثر من أنواع المسابقة"
              : "Select one or more competition types"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {competitionTypes?.map((type) => {
              const isSelected = selectedTypeIds.includes(type.id);
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => toggleType(type.id)}
                  className={`group relative flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-md ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/60 hover:border-primary/30"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {iconMap[type.icon || ""] || <Flame className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 text-start">
                    <p className="font-semibold text-sm">{isAr && type.name_ar ? type.name_ar : type.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {isAr && type.description_ar ? type.description_ar : type.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Predefined Categories (shown when types selected) */}
      {selectedTypeIds.length > 0 && predefinedCategories && predefinedCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "الفئات المتاحة" : "Available Categories"}</CardTitle>
            <CardDescription>
              {isAr
                ? "اختر الفئات من القائمة المحددة مسبقاً أو أضف فئات مخصصة"
                : "Pick from predefined categories or add custom ones"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTypeIds.map((typeId) => {
              const type = competitionTypes?.find((t) => t.id === typeId);
              const typeCats = categoriesByType[typeId];
              if (!type || !typeCats || typeCats.length === 0) return null;
              return (
                <div key={typeId} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isAr && type.name_ar ? type.name_ar : type.name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {typeCats.map((predef) => {
                      const isSelected = categories.some((c) => c.name === predef.name);
                      return (
                        <Badge
                          key={predef.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer transition-all text-xs py-1.5 px-3 ${
                            isSelected ? "" : "hover:bg-primary/10"
                          }`}
                          onClick={() => togglePredefinedCategory(predef)}
                        >
                          {isSelected && <Check className="me-1 h-3 w-3" />}
                          {isAr && predef.name_ar ? predef.name_ar : predef.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Selected & Custom Categories */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isAr ? "الفئات المختارة" : "Selected Categories"} ({categories.filter((c) => c.name.trim()).length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((cat, index) => (
            <div key={index} className="rounded-xl border p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  {cat.name ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{isAr && cat.name_ar ? cat.name_ar : cat.name}</span>
                      <Badge variant="outline" className="text-[10px]">{categoryBadgeText(cat.gender, undefined, isAr)}</Badge>
                      {cat.max_participants && (
                        <Badge variant="outline" className="text-[10px]">
                          {isAr ? `الحد: ${cat.max_participants}` : `Max: ${cat.max_participants}`}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder={isAr ? "اسم الفئة (إنجليزي)" : "Category name (English)"}
                        value={cat.name}
                        onChange={(e) => updateCategory(index, "name", e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Input
                        placeholder="اسم الفئة (عربي)"
                        value={cat.name_ar}
                        onChange={(e) => updateCategory(index, "name_ar", e.target.value)}
                        className="h-8 text-sm"
                        dir="rtl"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Select value={cat.gender === "mixed" ? "open" : (cat.gender || "open")} onValueChange={(v) => updateCategory(index, "gender", v)}>
                    <SelectTrigger className="h-7 w-24 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.symbol} {isAr ? opt.ar : opt.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeCategory(index)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              {/* Description fields */}
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder={isAr ? "وصف الفئة (إنجليزي)" : "Category description (English)"}
                  value={cat.description}
                  onChange={(e) => updateCategory(index, "description", e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  placeholder="وصف الفئة (عربي)"
                  value={cat.description_ar}
                  onChange={(e) => updateCategory(index, "description_ar", e.target.value)}
                  className="h-8 text-xs"
                  dir="rtl"
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addCustomCategory} className="w-full">
            <Plus className="me-2 h-4 w-4" />
            {isAr ? "إضافة فئة مخصصة" : "Add Custom Category"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
