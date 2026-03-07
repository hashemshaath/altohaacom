import { useState, forwardRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  BookTemplate, Plus, Download, Trash2, Globe, Lock,
  Package, Copy, CheckCircle, ChefHat, Edit2, X, Save,
  Search, ShoppingCart, GripVertical, UtensilsCrossed,
} from "lucide-react";
import { ORDER_CATEGORIES } from "./OrderCenterCategories";
import { DISH_TEMPLATES, type DishTemplate, type IngredientItem } from "@/data/dishTemplates";

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

interface TemplateItem {
  custom_name: string;
  custom_name_ar: string;
  quantity: number;
  unit: string;
  estimated_cost: number | null;
  category: string;
}

type ViewMode = "list" | "create" | "edit";

export const RequirementTemplates = forwardRef<HTMLDivElement, Props>(function RequirementTemplates({ competitionId, isOrganizer }, ref) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [view, setView] = useState<ViewMode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", name_ar: "", description: "", description_ar: "",
    category: "general", is_public: false, items: [] as TemplateItem[],
  });
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [showSupermarket, setShowSupermarket] = useState(false);
  const [supermarketSearch, setSupermarketSearch] = useState("");
  const [supermarketCategory, setSupermarketCategory] = useState("all");

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["requirement-templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_templates" as any)
        .select("*")
        .or(`created_by.eq.${user!.id},is_public.eq.true`)
        .order("usage_count", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  // Fetch competition categories for context
  const { data: competition } = useQuery({
    queryKey: ["template-competition-info", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, title, title_ar, competition_types(name, name_ar)")
        .eq("id", competitionId)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  // Fetch supermarket items
  const { data: supermarketItems } = useQuery({
    queryKey: ["supermarket-items-for-template"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_items")
        .select("id, name, name_ar, category, subcategory, unit, default_quantity, estimated_cost, currency, brand, brand_ar, image_url, is_active")
        .eq("is_active", true)
        .order("category")
        .limit(2000);
      if (error) throw error;
      return data;
    },
    enabled: showSupermarket,
  });

  // Filtered supermarket
  const filteredSupermarket = useMemo(() => {
    if (!supermarketItems) return [];
    return supermarketItems.filter(item => {
      if (supermarketCategory !== "all" && item.category !== supermarketCategory) return false;
      if (supermarketSearch) {
        const q = supermarketSearch.toLowerCase();
        return (item.name?.toLowerCase().includes(q) || item.name_ar?.includes(supermarketSearch));
      }
      return true;
    });
  }, [supermarketItems, supermarketCategory, supermarketSearch]);

  const supermarketCategories = useMemo(() => {
    if (!supermarketItems) return [];
    const cats = [...new Set(supermarketItems.map(i => i.category))].filter(Boolean);
    return cats.sort();
  }, [supermarketItems]);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    return templates.filter(t => {
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      if (searchQ) {
        const q = searchQ.toLowerCase();
        return (t.name?.toLowerCase().includes(q) || t.name_ar?.includes(searchQ));
      }
      return true;
    });
  }, [templates, filterCategory, searchQ]);

  // Load dish template into form
  const loadDishTemplate = (dish: DishTemplate) => {
    const items: TemplateItem[] = dish.ingredients.map(ing => ({
      custom_name: ing.name,
      custom_name_ar: ing.nameAr,
      quantity: ing.quantity,
      unit: ing.unit,
      estimated_cost: null,
      category: ing.category,
    }));
    setForm({
      name: dish.name,
      name_ar: dish.nameAr,
      description: dish.description,
      description_ar: dish.descriptionAr,
      category: "food_ingredients",
      is_public: false,
      items,
    });
    setView("create");
  };

  // Load existing template for editing
  const startEdit = (tpl: any) => {
    setEditingId(tpl.id);
    setForm({
      name: tpl.name || "",
      name_ar: tpl.name_ar || "",
      description: tpl.description || "",
      description_ar: tpl.description_ar || "",
      category: tpl.category || "general",
      is_public: tpl.is_public || false,
      items: (tpl.items || []).map((it: any) => ({
        custom_name: it.custom_name || "",
        custom_name_ar: it.custom_name_ar || "",
        quantity: it.quantity || 1,
        unit: it.unit || "unit",
        estimated_cost: it.estimated_cost || null,
        category: it.category || "general",
      })),
    });
    setView("edit");
  };

  const resetForm = () => {
    setForm({ name: "", name_ar: "", description: "", description_ar: "", category: "general", is_public: false, items: [] });
    setEditingId(null);
    setView("list");
    setShowSupermarket(false);
  };

  // Add supermarket item to form items
  const addSupermarketItem = (item: any) => {
    const exists = form.items.some(fi => fi.custom_name === item.name);
    if (exists) {
      toast({ title: isAr ? "العنصر موجود بالفعل" : "Item already added" });
      return;
    }
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        custom_name: item.name,
        custom_name_ar: item.name_ar || "",
        quantity: item.default_quantity || 1,
        unit: item.unit || "unit",
        estimated_cost: item.estimated_cost || null,
        category: item.category || "general",
      }],
    }));
  };

  const removeItem = (idx: number) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((it, i) => i === idx ? { ...it, [field]: value } : it),
    }));
  };

  // Save (create or update)
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        name_ar: form.name_ar || null,
        description: form.description || null,
        category: form.category,
        items: form.items,
        is_public: form.is_public,
        created_by: user!.id,
      };

      if (editingId) {
        const { error } = await supabase
          .from("requirement_templates" as any)
          .update(payload as any)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("requirement_templates" as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement-templates"] });
      resetForm();
      toast({ title: isAr ? (editingId ? "تم تحديث القالب" : "تم حفظ القالب") : (editingId ? "Template updated" : "Template saved") });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  // Apply template to competition
  const applyTemplate = useMutation({
    mutationFn: async (template: any) => {
      const { data: newList, error: listError } = await supabase
        .from("requirement_lists")
        .insert({
          competition_id: competitionId,
          title: isAr && template.name_ar ? template.name_ar : template.name,
          title_ar: template.name_ar || null,
          category: template.category,
          created_by: user!.id,
          description: template.description || null,
        })
        .select("id")
        .single();
      if (listError) throw listError;

      const items = (template.items || []).map((item: any, idx: number) => ({
        list_id: newList.id,
        custom_name: item.custom_name,
        custom_name_ar: item.custom_name_ar || null,
        quantity: item.quantity || 1,
        unit: item.unit || "unit",
        estimated_cost: item.estimated_cost || null,
        sort_order: idx,
      }));

      if (items.length) {
        const { error } = await supabase.from("requirement_list_items").insert(items);
        if (error) throw error;
      }

      await supabase
        .from("requirement_templates" as any)
        .update({ usage_count: (template.usage_count || 0) + 1 } as any)
        .eq("id", template.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement-lists", competitionId] });
      queryClient.invalidateQueries({ queryKey: ["requirement-templates"] });
      toast({ title: isAr ? "تم تطبيق القالب على المسابقة" : "Template applied to competition" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  // Delete
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("requirement_templates" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement-templates"] });
      toast({ title: isAr ? "تم حذف القالب" : "Template deleted" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // ============ CREATE / EDIT VIEW ============
  if (view === "create" || view === "edit") {
    return (
      <div ref={ref} className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookTemplate className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">
              {view === "edit"
                ? (isAr ? "تعديل القالب" : "Edit Template")
                : (isAr ? "إنشاء قالب جديد" : "Create New Template")}
            </h3>
          </div>
          <Button size="sm" variant="ghost" onClick={resetForm}>
            <X className="me-1 h-3.5 w-3.5" />
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
        </div>

        {/* Template Info */}
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? "اسم القالب (إنجليزي)" : "Template Name (English)"}</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-8 text-sm" placeholder="e.g. Mocktail Station" />
              </div>
              <div>
                <Label className="text-xs">{isAr ? "اسم القالب (عربي)" : "Template Name (Arabic)"}</Label>
                <Input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} className="h-8 text-sm" dir="rtl" placeholder="مثال: محطة الموكتيل" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="text-sm min-h-[50px]" />
              </div>
              <div>
                <Label className="text-xs">{isAr ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                <Textarea value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} className="text-sm min-h-[50px]" dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">{isAr ? "الفئة" : "Category"}</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORDER_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value} className="text-xs">
                        {isAr ? c.labelAr : c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  size="sm"
                  variant={form.is_public ? "default" : "outline"}
                  onClick={() => setForm({ ...form, is_public: !form.is_public })}
                  className="h-8 text-xs"
                >
                  {form.is_public ? <Globe className="me-1 h-3 w-3" /> : <Lock className="me-1 h-3 w-3" />}
                  {form.is_public ? (isAr ? "عام" : "Public") : (isAr ? "خاص" : "Private")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Section */}
        <Card>
          <CardHeader className="pb-2 px-4 pt-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                {isAr ? "عناصر القالب" : "Template Items"} ({form.items.length})
              </CardTitle>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowSupermarket(!showSupermarket)}>
                <Package className="me-1 h-3 w-3" />
                {showSupermarket ? (isAr ? "إخفاء السوبرماركت" : "Hide Supermarket") : (isAr ? "إضافة من السوبرماركت" : "Add from Supermarket")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-3">
            {/* Supermarket picker */}
            {showSupermarket && (
              <Card className="border-chart-4/30 bg-chart-4/5">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[150px]">
                      <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={supermarketSearch}
                        onChange={e => setSupermarketSearch(e.target.value)}
                        placeholder={isAr ? "ابحث في السوبرماركت..." : "Search supermarket..."}
                        className="h-7 text-xs ps-7"
                      />
                    </div>
                    <Select value={supermarketCategory} onValueChange={setSupermarketCategory}>
                      <SelectTrigger className="h-7 text-xs w-auto min-w-[100px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">{isAr ? "الكل" : "All"}</SelectItem>
                        {supermarketCategories.map(c => (
                          <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <ScrollArea className="max-h-[200px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {filteredSupermarket.slice(0, 50).map(item => {
                        const alreadyAdded = form.items.some(fi => fi.custom_name === item.name);
                        return (
                          <button
                            key={item.id}
                            onClick={() => !alreadyAdded && addSupermarketItem(item)}
                            disabled={alreadyAdded}
                            className={`flex items-center justify-between rounded-md border px-2 py-1.5 text-start text-xs transition-colors ${
                              alreadyAdded
                                ? "bg-muted/50 text-muted-foreground border-muted cursor-not-allowed"
                                : "border-border hover:bg-primary/5 hover:border-primary/30"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium">{isAr ? (item.name_ar || item.name) : item.name}</p>
                              <p className="text-[10px] text-muted-foreground">{item.category} · {item.default_quantity} {item.unit}</p>
                            </div>
                            {alreadyAdded ? (
                              <CheckCircle className="h-3.5 w-3.5 text-chart-5 shrink-0 ms-1" />
                            ) : (
                              <Plus className="h-3.5 w-3.5 text-primary shrink-0 ms-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <ScrollBar orientation="vertical" />
                  </ScrollArea>
                  {filteredSupermarket.length > 50 && (
                    <p className="text-[10px] text-muted-foreground text-center">
                      {isAr ? `يعرض 50 من ${filteredSupermarket.length}` : `Showing 50 of ${filteredSupermarket.length}`}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Items list */}
            {form.items.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-sm">
                <UtensilsCrossed className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                <p>{isAr ? "لا توجد عناصر. أضف من السوبرماركت أو من قوالب الأطباق" : "No items yet. Add from supermarket or dish templates"}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-xl border border-border/60 p-2 bg-card hover:bg-muted/30 transition-colors">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 hidden sm:block" />
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_1fr_80px_70px] gap-1.5 items-center">
                      <Input
                        value={item.custom_name}
                        onChange={e => updateItem(idx, "custom_name", e.target.value)}
                        className="h-7 text-xs"
                        placeholder="Name"
                      />
                      <Input
                        value={item.custom_name_ar}
                        onChange={e => updateItem(idx, "custom_name_ar", e.target.value)}
                        className="h-7 text-xs"
                        dir="rtl"
                        placeholder="الاسم"
                      />
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateItem(idx, "quantity", Number(e.target.value))}
                        className="h-7 text-xs"
                        min={1}
                      />
                      <Input
                        value={item.unit}
                        onChange={e => updateItem(idx, "unit", e.target.value)}
                        className="h-7 text-xs"
                        placeholder={isAr ? "وحدة" : "unit"}
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
                      onClick={() => removeItem(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Manual add row */}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setForm(prev => ({
                ...prev,
                items: [...prev.items, { custom_name: "", custom_name_ar: "", quantity: 1, unit: "unit", estimated_cost: null, category: "general" }],
              }))}
            >
              <Plus className="me-1 h-3 w-3" />
              {isAr ? "إضافة عنصر يدوي" : "Add Manual Item"}
            </Button>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex gap-2">
          <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
            <Save className="me-1.5 h-4 w-4" />
            {view === "edit" ? (isAr ? "تحديث القالب" : "Update Template") : (isAr ? "حفظ القالب" : "Save Template")}
            {form.items.length > 0 && ` (${form.items.length} ${isAr ? "عنصر" : "items"})`}
          </Button>
          <Button variant="ghost" onClick={resetForm}>{isAr ? "إلغاء" : "Cancel"}</Button>
        </div>
      </div>
    );
  }

  // ============ LIST VIEW ============
  return (
    <div ref={ref} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BookTemplate className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{isAr ? "قوالب الأطباق والمتطلبات" : "Dish & Requirement Templates"}</h3>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setView("create"); }}>
          <Plus className="me-1.5 h-3.5 w-3.5" />
          {isAr ? "إنشاء قالب" : "Create Template"}
        </Button>
      </div>

      {/* Dish Templates Quick Load */}
      <Card className="border-chart-3/20 bg-gradient-to-br from-chart-3/5 to-transparent">
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-chart-3" />
            {isAr ? "قوالب الأطباق الجاهزة" : "Ready Dish Templates"}
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            {isAr ? "اختر طبقاً لتحميل مكوناته كقالب جديد قابل للتعديل" : "Select a dish to load its ingredients as an editable new template"}
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-1">
              {DISH_TEMPLATES.map(dish => {
                const Icon = dish.icon;
                return (
                  <button
                    key={dish.id}
                    onClick={() => loadDishTemplate(dish)}
                    className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-card px-3 py-2.5 min-w-[90px] hover:border-primary/40 hover:shadow-sm transition-all shrink-0"
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-${dish.color}/10`}>
                      <Icon className={`h-4 w-4 text-${dish.color}`} />
                    </div>
                    <span className="text-[11px] font-medium whitespace-nowrap">
                      {isAr ? dish.nameAr : dish.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {dish.ingredients.length} {isAr ? "عنصر" : "items"}
                    </span>
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="h-1" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder={isAr ? "بحث في القوالب..." : "Search templates..."}
            className="h-8 text-xs ps-8"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 text-xs w-auto min-w-[120px]">
            <SelectValue placeholder={isAr ? "الفئة" : "Category"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">{isAr ? "جميع الفئات" : "All Categories"}</SelectItem>
            {ORDER_CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value} className="text-xs">
                {isAr ? c.labelAr : c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {!filteredTemplates.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookTemplate className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">{isAr ? "لا توجد قوالب بعد" : "No templates yet"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? "أنشئ قوالب من الأطباق الجاهزة أو أضف قالباً مخصصاً" : "Create templates from dish presets or add a custom template"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredTemplates.map((tpl: any) => {
            const catDef = ORDER_CATEGORIES.find(c => c.value === tpl.category);
            const itemCount = (tpl.items || []).length;
            const isOwn = tpl.created_by === user?.id;
            return (
              <Card key={tpl.id} className="border-border/60 hover:shadow-sm transition-shadow">
                <CardHeader className="pb-2 px-4 pt-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      {isAr && tpl.name_ar ? tpl.name_ar : tpl.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {tpl.is_public ? (
                        <Badge variant="outline" className="text-[9px] h-4"><Globe className="h-2.5 w-2.5 me-0.5" />{isAr ? "عام" : "Public"}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] h-4"><Lock className="h-2.5 w-2.5 me-0.5" />{isAr ? "خاص" : "Private"}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 flex-wrap">
                    <span>{catDef ? (isAr ? catDef.labelAr : catDef.label) : tpl.category}</span>
                    <span>·</span>
                    <span>{itemCount} {isAr ? "عنصر" : "items"}</span>
                    {tpl.usage_count > 0 && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Copy className="h-2.5 w-2.5" /> {tpl.usage_count}x
                        </span>
                      </>
                    )}
                  </div>
                  {tpl.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{isAr && tpl.description_ar ? tpl.description_ar : tpl.description}</p>
                  )}
                  {/* Preview items */}
                  {itemCount > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(tpl.items || []).slice(0, 4).map((it: any, i: number) => (
                        <Badge key={i} variant="secondary" className="text-[9px] h-4">
                          {isAr ? (it.custom_name_ar || it.custom_name) : it.custom_name}
                        </Badge>
                      ))}
                      {itemCount > 4 && (
                        <Badge variant="secondary" className="text-[9px] h-4">+{itemCount - 4}</Badge>
                      )}
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex items-center gap-2 flex-wrap">
                    {isOrganizer && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => applyTemplate.mutate(tpl)}
                        disabled={applyTemplate.isPending}
                      >
                        <Download className="me-1 h-3 w-3" />
                        {isAr ? "تطبيق على المسابقة" : "Apply to Competition"}
                      </Button>
                    )}
                    {isOwn && (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => startEdit(tpl)}>
                          <Edit2 className="me-1 h-3 w-3" />
                          {isAr ? "تعديل" : "Edit"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => { if (confirm(isAr ? "حذف القالب؟" : "Delete template?")) deleteTemplate.mutate(tpl.id); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
});
