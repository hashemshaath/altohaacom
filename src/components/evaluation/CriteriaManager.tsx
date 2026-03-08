import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  useEvaluationDomains,
  useEvaluationCriteriaByDomain,
  useCreateCriterion,
  useUpdateCriterion,
  useDeleteCriterion,
  useCreateCriteriaCategory,
  type EvaluationCriterion,
} from "@/hooks/useEvaluationSystem";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, GripVertical, ChefHat, Trophy, Wrench, Coffee,
  ClipboardCheck, Scale, Settings2, Layers, X, Save,
} from "lucide-react";

const PRODUCT_CATEGORIES = [
  { value: "all", en: "All Categories", ar: "جميع الفئات" },
  { value: "meat", en: "Meat Products", ar: "منتجات اللحوم" },
  { value: "beverage", en: "Beverages", ar: "المشروبات" },
  { value: "spices", en: "Spices & Seasonings", ar: "البهارات والتوابل" },
  { value: "rice", en: "Rice & Grains", ar: "الأرز والحبوب" },
  { value: "dairy", en: "Dairy", ar: "منتجات الألبان" },
  { value: "oils", en: "Oils & Fats", ar: "الزيوت والدهون" },
  { value: "pastry", en: "Pastry & Bakery", ar: "الحلويات والمخبوزات" },
  { value: "general", en: "General Products", ar: "منتجات عامة" },
];

const DOMAIN_ICONS: Record<string, React.ElementType> = {
  chefs_table: ChefHat,
  competition: Trophy,
  equipment: Wrench,
  beverage: Coffee,
};

export const CriteriaManager = memo(function CriteriaManager() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: domains, isLoading: domainsLoading } = useEvaluationDomains();
  const [activeDomain, setActiveDomain] = useState<string>("");
  const [productFilter, setProductFilter] = useState("all");
  const [editCriterion, setEditCriterion] = useState<EvaluationCriterion | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [newCriterion, setNewCriterion] = useState({ name: "", name_ar: "", description: "", description_ar: "", max_score: 10, weight: 10, category_id: "" });
  const [newCategory, setNewCategory] = useState({ name: "", name_ar: "", product_category: "" });

  const selectedDomain = domains?.find(d => d.slug === activeDomain);
  const { data: criteriaData, isLoading: criteriaLoading } = useEvaluationCriteriaByDomain(
    activeDomain || domains?.[0]?.slug || "",
    productFilter !== "all" ? productFilter : undefined
  );

  const createCriterion = useCreateCriterion();
  const updateCriterion = useUpdateCriterion();
  const deleteCriterion = useDeleteCriterion();
  const createCategory = useCreateCriteriaCategory();

  if (!activeDomain && domains?.length) {
    setActiveDomain(domains[0].slug);
  }

  const handleAddCriterion = async () => {
    if (!newCriterion.name || !newCriterion.category_id) return;
    try {
      await createCriterion.mutateAsync(newCriterion);
      toast.success(isAr ? "تمت إضافة المعيار" : "Criterion added");
      setShowAddForm(false);
      setNewCriterion({ name: "", name_ar: "", description: "", description_ar: "", max_score: 10, weight: 10, category_id: "" });
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Failed to add");
    }
  };

  const handleUpdateCriterion = async () => {
    if (!editCriterion) return;
    try {
      await updateCriterion.mutateAsync(editCriterion);
      toast.success(isAr ? "تم التحديث" : "Updated");
      setEditCriterion(null);
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Failed to update");
    }
  };

  const handleDeleteCriterion = async (id: string) => {
    try {
      await deleteCriterion.mutateAsync(id);
      toast.success(isAr ? "تم الحذف" : "Deleted");
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Failed to delete");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name || !selectedDomain) return;
    try {
      await createCategory.mutateAsync({
        domain_id: selectedDomain.id,
        name: newCategory.name,
        name_ar: newCategory.name_ar || null,
        product_category: newCategory.product_category || null,
      });
      toast.success(isAr ? "تمت إضافة الفئة" : "Category added");
      setShowAddCategoryForm(false);
      setNewCategory({ name: "", name_ar: "", product_category: "" });
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Failed to add category");
    }
  };

  if (domainsLoading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      {/* Domain Tabs */}
      <Tabs value={activeDomain || domains?.[0]?.slug} onValueChange={setActiveDomain}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <TabsList className="flex-wrap">
            {domains?.map(d => {
              const Icon = DOMAIN_ICONS[d.slug] || ClipboardCheck;
              return (
                <TabsTrigger key={d.slug} value={d.slug} className="gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {isAr && d.name_ar ? d.name_ar : d.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="flex gap-2">
            {activeDomain === "chefs_table" && (
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="w-40 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{isAr ? c.ar : c.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button size="sm" variant="outline" onClick={() => { setShowAddCategoryForm(v => !v); setShowAddForm(false); }} className="gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              {isAr ? "فئة جديدة" : "New Category"}
            </Button>
            <Button size="sm" onClick={() => { setShowAddForm(v => !v); setShowAddCategoryForm(false); }} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {isAr ? "معيار جديد" : "New Criterion"}
            </Button>
          </div>
        </div>

        {/* Inline Add Category Form */}
        {showAddCategoryForm && (
          <Card className="mt-4 border-primary/20 border-2">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm">{isAr ? "إضافة فئة معايير" : "Add Criteria Category"}</h4>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowAddCategoryForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>{isAr ? "الاسم (إنجليزي)" : "Name (English)"}</Label>
                  <Input value={newCategory.name} onChange={e => setNewCategory(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <Label>{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                  <Input value={newCategory.name_ar} onChange={e => setNewCategory(p => ({ ...p, name_ar: e.target.value }))} dir="rtl" />
                </div>
                <div>
                  <Label>{isAr ? "فئة المنتج" : "Product Category"}</Label>
                  <Select value={newCategory.product_category || "none"} onValueChange={v => setNewCategory(p => ({ ...p, product_category: v === "none" ? "" : v }))}>
                    <SelectTrigger><SelectValue placeholder={isAr ? "جميع المنتجات" : "All Products"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{isAr ? "جميع المنتجات" : "All Products"}</SelectItem>
                      {PRODUCT_CATEGORIES.filter(c => c.value !== "all").map(c => (
                        <SelectItem key={c.value} value={c.value}>{isAr ? c.ar : c.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddCategoryForm(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                <Button size="sm" onClick={handleAddCategory} disabled={!newCategory.name} className="gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  {isAr ? "إضافة الفئة" : "Add Category"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inline Add Criterion Form */}
        {showAddForm && (
          <Card className="mt-4 border-primary/20 border-2">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm">{isAr ? "إضافة معيار تقييم" : "Add Evaluation Criterion"}</h4>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowAddForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>{isAr ? "الفئة" : "Category"}</Label>
                  <Select value={newCriterion.category_id} onValueChange={v => setNewCriterion(p => ({ ...p, category_id: v }))}>
                    <SelectTrigger><SelectValue placeholder={isAr ? "اختر فئة" : "Select category"} /></SelectTrigger>
                    <SelectContent>
                      {criteriaData?.categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{isAr && c.name_ar ? c.name_ar : c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isAr ? "الاسم (إنجليزي)" : "Name (EN)"}</Label>
                  <Input value={newCriterion.name} onChange={e => setNewCriterion(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <Label>{isAr ? "الاسم (عربي)" : "Name (AR)"}</Label>
                  <Input value={newCriterion.name_ar} onChange={e => setNewCriterion(p => ({ ...p, name_ar: e.target.value }))} dir="rtl" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <Label>{isAr ? "الوصف (EN)" : "Description (EN)"}</Label>
                  <Textarea value={newCriterion.description} onChange={e => setNewCriterion(p => ({ ...p, description: e.target.value }))} rows={2} />
                </div>
                <div>
                  <Label>{isAr ? "الوصف (AR)" : "Description (AR)"}</Label>
                  <Textarea value={newCriterion.description_ar} onChange={e => setNewCriterion(p => ({ ...p, description_ar: e.target.value }))} rows={2} dir="rtl" />
                </div>
                <div>
                  <Label>{isAr ? "أقصى درجة" : "Max Score"}</Label>
                  <Input type="number" value={newCriterion.max_score} onChange={e => setNewCriterion(p => ({ ...p, max_score: +e.target.value }))} />
                </div>
                <div>
                  <Label>{isAr ? "الوزن %" : "Weight %"}</Label>
                  <Input type="number" value={newCriterion.weight} onChange={e => setNewCriterion(p => ({ ...p, weight: +e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                <Button size="sm" onClick={handleAddCriterion} disabled={!newCriterion.name || !newCriterion.category_id} className="gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  {isAr ? "إضافة المعيار" : "Add Criterion"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {domains?.map(d => (
          <TabsContent key={d.slug} value={d.slug} className="mt-4">
            {criteriaLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <Accordion type="multiple" defaultValue={criteriaData?.categories.map(c => c.id) || []} className="space-y-3">
                {criteriaData?.categories.map(cat => {
                  const catCriteria = criteriaData.criteria.filter(c => c.category_id === cat.id);
                  const totalWeight = catCriteria.reduce((sum, c) => sum + c.weight, 0);

                  return (
                    <AccordionItem key={cat.id} value={cat.id} className="border rounded-xl px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Scale className="h-4 w-4 text-primary" />
                          </div>
                          <div className="text-start">
                            <p className="font-bold text-sm">{isAr && cat.name_ar ? cat.name_ar : cat.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {catCriteria.length} {isAr ? "معايير" : "criteria"} · {totalWeight}% {isAr ? "وزن" : "weight"}
                              {cat.product_category && (
                                <Badge variant="outline" className="ms-2 text-[10px]">{cat.product_category}</Badge>
                              )}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="space-y-2">
                          {catCriteria.map(criterion => (
                            <div key={criterion.id}>
                              {editCriterion?.id === criterion.id ? (
                                /* Inline Edit Form */
                                <div className="rounded-xl border-2 border-primary/20 p-4 space-y-3 bg-muted/20">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div>
                                      <Label className="text-xs">{isAr ? "الاسم (EN)" : "Name (EN)"}</Label>
                                      <Input value={editCriterion.name} onChange={e => setEditCriterion(p => p ? { ...p, name: e.target.value } : null)} className="h-8 text-sm" />
                                    </div>
                                    <div>
                                      <Label className="text-xs">{isAr ? "الاسم (AR)" : "Name (AR)"}</Label>
                                      <Input value={editCriterion.name_ar || ""} onChange={e => setEditCriterion(p => p ? { ...p, name_ar: e.target.value } : null)} dir="rtl" className="h-8 text-sm" />
                                    </div>
                                    <div>
                                      <Label className="text-xs">{isAr ? "أقصى درجة" : "Max Score"}</Label>
                                      <Input type="number" value={editCriterion.max_score} onChange={e => setEditCriterion(p => p ? { ...p, max_score: +e.target.value } : null)} className="h-8 text-sm" />
                                    </div>
                                    <div>
                                      <Label className="text-xs">{isAr ? "الوزن %" : "Weight %"}</Label>
                                      <Input type="number" value={editCriterion.weight} onChange={e => setEditCriterion(p => p ? { ...p, weight: +e.target.value } : null)} className="h-8 text-sm" />
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">{isAr ? "الوصف" : "Description"}</Label>
                                    <Textarea value={editCriterion.description || ""} onChange={e => setEditCriterion(p => p ? { ...p, description: e.target.value } : null)} rows={2} className="text-sm" />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setEditCriterion(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                                    <Button size="sm" onClick={handleUpdateCriterion} className="gap-1.5">
                                      <Save className="h-3.5 w-3.5" />
                                      {isAr ? "حفظ" : "Save"}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                /* Display Row */
                                <div className="flex items-center gap-3 rounded-xl border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                                  <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 print:hidden" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium">{isAr && criterion.name_ar ? criterion.name_ar : criterion.name}</p>
                                      {criterion.is_required && (
                                        <Badge variant="destructive" className="text-[9px] h-4 px-1">{isAr ? "مطلوب" : "Required"}</Badge>
                                      )}
                                    </div>
                                    {criterion.description && (
                                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                        {isAr && criterion.description_ar ? criterion.description_ar : criterion.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-center">
                                      <p className="text-xs text-muted-foreground">{isAr ? "أقصى" : "Max"}</p>
                                      <p className="text-sm font-bold">{criterion.max_score}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-muted-foreground">{isAr ? "وزن" : "Wt"}</p>
                                      <p className="text-sm font-bold">{criterion.weight}%</p>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 print:hidden" onClick={() => setEditCriterion(criterion)}>
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive print:hidden" onClick={() => handleDeleteCriterion(criterion.id)}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          {catCriteria.length === 0 && (
                            <p className="text-center text-sm text-muted-foreground py-4">
                              {isAr ? "لا توجد معايير في هذه الفئة" : "No criteria in this category"}
                            </p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
                {(!criteriaData?.categories || criteriaData.categories.length === 0) && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Settings2 className="mx-auto h-10 w-10 text-muted-foreground/30" />
                      <p className="mt-3 font-medium">{isAr ? "لا توجد معايير تقييم" : "No evaluation criteria yet"}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isAr ? "ابدأ بإضافة فئة ومعايير" : "Start by adding a category and criteria"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </Accordion>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
});
