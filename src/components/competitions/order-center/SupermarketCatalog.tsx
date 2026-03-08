import { useState, useMemo, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Search, Plus, Trash2, Edit, Package, Save, X, Check,
  ShoppingCart, Beef, Leaf, GlassWater, Flame, Wrench, Shirt,
  ShieldCheck, Droplets, Plug, Wind, Cable, Truck, ClipboardList,
  MapPin, Refrigerator, Sparkles, Store, ListPlus, Filter,
  BookTemplate, ChefHat, CookingPot,
} from "lucide-react";
import { ORDER_CATEGORIES, ITEM_UNITS } from "./OrderCenterCategories";
import { DISH_TEMPLATES } from "@/data/dishTemplates";

/* ── Supermarket aisle definitions ── */
const SUPERMARKET_AISLES = [
  { key: "all", labelEn: "All", labelAr: "الكل", icon: Store },
  { key: "food_ingredients", labelEn: "Grocery", labelAr: "البقالة", icon: ShoppingCart },
  { key: "herbs_spices", labelEn: "Spices", labelAr: "التوابل", icon: Leaf },
  { key: "meat_seafood", labelEn: "Meat", labelAr: "اللحوم", icon: Beef },
  { key: "decoration", labelEn: "Décor", labelAr: "ديكور", icon: Sparkles },
  { key: "light_equipment", labelEn: "Tools", labelAr: "أدوات", icon: Wrench },
  { key: "equipment", labelEn: "Equipment", labelAr: "معدات", icon: Package },
  { key: "cooking_stations", labelEn: "Stations", labelAr: "محطات", icon: Flame },
  { key: "beverage", labelEn: "Drinks", labelAr: "مشروبات", icon: GlassWater },
  { key: "uniforms", labelEn: "Uniforms", labelAr: "زي", icon: Shirt },
  { key: "cleaning", labelEn: "Cleaning", labelAr: "تنظيف", icon: Droplets },
  { key: "safety_hygiene", labelEn: "Safety", labelAr: "سلامة", icon: ShieldCheck },
  { key: "refrigeration", labelEn: "Cooling", labelAr: "تبريد", icon: Refrigerator },
  { key: "venue_setup", labelEn: "Venue", labelAr: "موقع", icon: MapPin },
  { key: "grilling", labelEn: "Grill", labelAr: "شوي", icon: Flame },
  { key: "utilities", labelEn: "Utilities", labelAr: "مرافق", icon: Plug },
  { key: "ventilation", labelEn: "Vent", labelAr: "تهوية", icon: Wind },
  { key: "electrical", labelEn: "Electric", labelAr: "كهرباء", icon: Cable },
  { key: "logistics", labelEn: "Logistics", labelAr: "لوجستيات", icon: Truck },
  { key: "other", labelEn: "Other", labelAr: "أخرى", icon: ClipboardList },
];

interface CatalogItem {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  category: string;
  subcategory: string | null;
  unit: string | null;
  default_quantity: number | null;
  estimated_cost: number | null;
  brand: string | null;
  is_active: boolean | null;
  image_url: string | null;
  tags: string[] | null;
}

export const SupermarketCatalog = memo(function SupermarketCatalog() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [search, setSearch] = useState("");
  const [activeAisle, setActiveAisle] = useState("all");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showListPicker, setShowListPicker] = useState(false);
  const [showDishTemplates, setShowDishTemplates] = useState(false);
  const [showMobileAisles, setShowMobileAisles] = useState(false);
  const [form, setForm] = useState({
    name: "", name_ar: "", description: "", description_ar: "",
    category: "food_ingredients", subcategory: "", unit: "kg",
    default_quantity: 1, estimated_cost: 0, brand: "",
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["supermarket-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_items")
        .select("id, name, name_ar, description, description_ar, category, subcategory, unit, default_quantity, estimated_cost, brand, is_active, image_url, tags")
        .order("category")
        .order("subcategory")
        .order("name")
        .limit(2000);
      if (error) throw error;
      return data as CatalogItem[];
    },
  });

  const filtered = useMemo(() => {
    let result = items;
    if (activeAisle !== "all") result = result.filter(i => i.category === activeAisle);
    if (activeSubcategory) result = result.filter(i => i.subcategory === activeSubcategory);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(s) ||
        (i.name_ar && i.name_ar.includes(s)) ||
        (i.description && i.description.toLowerCase().includes(s)) ||
        (i.subcategory && i.subcategory.toLowerCase().includes(s))
      );
    }
    return result;
  }, [items, activeAisle, activeSubcategory, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });
    return counts;
  }, [items]);

  const subcategories = useMemo(() => {
    const aisleItems = activeAisle === "all" ? items : items.filter(i => i.category === activeAisle);
    const subs: Record<string, number> = {};
    aisleItems.forEach(i => {
      const sub = i.subcategory || "general";
      subs[sub] = (subs[sub] || 0) + 1;
    });
    return Object.entries(subs).sort((a, b) => b[1] - a[1]);
  }, [items, activeAisle]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editId) {
        const { error } = await supabase.from("requirement_items").update(data).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("requirement_items").insert({ ...data, created_by: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supermarket-catalog"] });
      setShowAdd(false); setEditId(null); resetForm();
      toast({ title: isAr ? "تم الحفظ بنجاح" : "Saved successfully" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("requirement_items").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supermarket-catalog"] });
      setSelectedIds(new Set());
      toast({ title: isAr ? "تم الحذف" : "Deleted" });
    },
  });

  const { data: allLists = [] } = useQuery({
    queryKey: ["all-requirement-lists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_lists")
        .select("id, title, title_ar, competition_id, category")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: showListPicker,
  });

  const addToListMutation = useMutation({
    mutationFn: async (listId: string) => {
      const selectedItems = items.filter(i => selectedIds.has(i.id));
      const inserts = selectedItems.map(item => ({
        list_id: listId,
        item_id: item.id,
        quantity: item.default_quantity || 1,
        unit: item.unit || "piece",
        estimated_cost: item.estimated_cost,
        added_by: user!.id,
      }));
      const { error } = await supabase.from("requirement_list_items").insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement-list-items"] });
      setSelectedIds(new Set());
      setShowListPicker(false);
      toast({ title: isAr ? "تمت إضافة العناصر للقائمة ✓" : "Items added to list ✓" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  // Save selected items as a new template
  const saveAsTemplateMutation = useMutation({
    mutationFn: async (templateName: string) => {
      const selectedItems = items.filter(i => selectedIds.has(i.id));
      const templateItems = selectedItems.map(item => ({
        custom_name: item.name,
        custom_name_ar: item.name_ar || "",
        quantity: item.default_quantity || 1,
        unit: item.unit || "piece",
        estimated_cost: item.estimated_cost,
        category: item.category,
      }));
      const { error } = await supabase.from("requirement_templates" as any).insert({
        name: templateName,
        category: "general",
        items: templateItems,
        created_by: user!.id,
        is_public: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement-templates"] });
      setSelectedIds(new Set());
      toast({ title: isAr ? "تم حفظ القالب ✓" : "Template saved ✓" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const resetForm = () => setForm({
    name: "", name_ar: "", description: "", description_ar: "",
    category: "food_ingredients", subcategory: "", unit: "kg",
    default_quantity: 1, estimated_cost: 0, brand: "",
  });

  const startEdit = (item: CatalogItem) => {
    setEditId(item.id);
    setForm({
      name: item.name, name_ar: item.name_ar || "", description: item.description || "",
      description_ar: item.description_ar || "", category: item.category,
      subcategory: item.subcategory || "", unit: item.unit || "kg",
      default_quantity: item.default_quantity || 1, estimated_cost: item.estimated_cost || 0,
      brand: item.brand || "",
    });
    setShowAdd(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    saveMutation.mutate({
      name: form.name, name_ar: form.name_ar || null,
      description: form.description || null, description_ar: form.description_ar || null,
      category: form.category, subcategory: form.subcategory || null,
      unit: form.unit, default_quantity: form.default_quantity,
      estimated_cost: form.estimated_cost || null, brand: form.brand || null,
      is_active: true,
    });
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(i => i.id)));
    }
  };

  // Load dish template ingredients into selection
  const loadDishTemplate = (templateId: string) => {
    const template = DISH_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    // Match template ingredients to catalog items by name
    const matchedIds = new Set<string>();
    template.ingredients.forEach(ing => {
      const match = items.find(item =>
        item.name.toLowerCase() === ing.name.toLowerCase() ||
        (item.name_ar && item.name_ar === ing.nameAr)
      );
      if (match) matchedIds.add(match.id);
    });
    setSelectedIds(matchedIds);
    setShowDishTemplates(false);
    toast({
      title: isAr ? `تم تحميل قالب ${template.nameAr}` : `Loaded ${template.name} template`,
      description: isAr ? `${matchedIds.size} عنصر مطابق من ${template.ingredients.length}` : `${matchedIds.size} matched from ${template.ingredients.length} ingredients`,
    });
  };

  /* ── Aisle sidebar content (shared between desktop sidebar and mobile sheet) ── */
  const AisleList = () => (
    <div className="space-y-0.5">
      {SUPERMARKET_AISLES.map(aisle => {
        const count = aisle.key === "all" ? items.length : (categoryCounts[aisle.key] || 0);
        if (aisle.key !== "all" && count === 0) return null;
        const AisleIcon = aisle.icon;
        const isActive = activeAisle === aisle.key;
        return (
          <button
            key={aisle.key}
            onClick={() => { setActiveAisle(aisle.key); setActiveSubcategory(null); setShowMobileAisles(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-start text-sm transition-all
              ${isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-foreground"}`}
          >
            <AisleIcon className="h-4 w-4 shrink-0" />
            <span className="truncate flex-1">{isAr ? aisle.labelAr : aisle.labelEn}</span>
            <Badge variant="secondary" className="text-[10px] h-5 min-w-[24px] justify-center">{count}</Badge>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Store className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold truncate">{isAr ? "السوبرماركت" : "Supermarket"}</h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {items.length} {isAr ? "صنف" : "items"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Dish Templates button */}
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setShowDishTemplates(true)}>
            <ChefHat className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? "قوالب الأطباق" : "Dish Templates"}</span>
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setEditId(null); setShowAdd(true); }} className="h-8 text-xs gap-1">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? "إضافة" : "Add"}</span>
          </Button>
        </div>
      </div>

      {/* ── Search + Mobile filter ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isAr ? "ابحث في السوبرماركت..." : "Search supermarket..."}
            value={search} onChange={e => setSearch(e.target.value)}
            className="ps-9 h-9 text-sm"
          />
        </div>
        {/* Mobile aisle filter button */}
        <Sheet open={showMobileAisles} onOpenChange={setShowMobileAisles}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 lg:hidden">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side={isAr ? "right" : "left"} className="w-72 p-4">
            <SheetHeader>
              <SheetTitle>{isAr ? "أقسام السوبرماركت" : "Aisles"}</SheetTitle>
            </SheetHeader>
            <ScrollArea className="mt-4 h-[calc(100vh-120px)]">
              <AisleList />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Floating selection bar ── */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-20 flex items-center gap-2 flex-wrap rounded-xl border border-primary/30 bg-card p-2.5 shadow-lg">
          <Badge variant="default" className="text-xs">
            {selectedIds.size} {isAr ? "محدد" : "selected"}
          </Badge>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowListPicker(true)}>
            <ListPlus className="h-3 w-3" /> {isAr ? "أضف لقائمة" : "Add to List"}
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => {
            const name = prompt(isAr ? "اسم القالب:" : "Template name:");
            if (name) saveAsTemplateMutation.mutate(name);
          }}>
            <BookTemplate className="h-3 w-3" /> {isAr ? "حفظ كقالب" : "Save as Template"}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive" onClick={() => {
            if (confirm(isAr ? `حذف ${selectedIds.size} عنصر؟` : `Delete ${selectedIds.size} items?`))
              deleteMutation.mutate([...selectedIds]);
          }}>
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs ms-auto" onClick={() => setSelectedIds(new Set())}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex gap-4">
        {/* ── Desktop Sidebar ── */}
        <div className="hidden lg:block w-48 shrink-0">
          <p className="text-[10px] font-semibold text-muted-foreground mb-2 px-1 uppercase tracking-wider">
            {isAr ? "الأقسام" : "AISLES"}
          </p>
          <ScrollArea className="max-h-[70vh]">
            <AisleList />
          </ScrollArea>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Mobile aisle chips (horizontal scroll) */}
          <div className="lg:hidden">
            <ScrollArea className="w-full">
              <div className="flex gap-1 pb-1">
                {SUPERMARKET_AISLES.map(aisle => {
                  const count = aisle.key === "all" ? items.length : (categoryCounts[aisle.key] || 0);
                  if (aisle.key !== "all" && count === 0) return null;
                  const AisleIcon = aisle.icon;
                  const isActive = activeAisle === aisle.key;
                  return (
                    <button
                      key={aisle.key}
                      onClick={() => { setActiveAisle(aisle.key); setActiveSubcategory(null); }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all border shrink-0
                        ${isActive ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}
                    >
                      <AisleIcon className="h-3 w-3" />
                      {isAr ? aisle.labelAr : aisle.labelEn}
                      <span className="opacity-60">({count})</span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Subcategory chips */}
          {subcategories.length > 1 && (
            <ScrollArea className="w-full">
              <div className="flex gap-1 pb-1">
                <button
                  onClick={() => setActiveSubcategory(null)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border shrink-0
                    ${!activeSubcategory ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}
                >
                  {isAr ? "الكل" : "All"}
                </button>
                {subcategories.map(([sub, count]) => (
                  <button
                    key={sub}
                    onClick={() => setActiveSubcategory(activeSubcategory === sub ? null : sub)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border capitalize shrink-0
                      ${activeSubcategory === sub ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}
                  >
                    {sub.replace(/_/g, " ")} ({count})
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Select all */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between">
              <button onClick={selectAll} className="text-xs text-primary hover:underline">
                {selectedIds.size === filtered.length ? (isAr ? "إلغاء تحديد الكل" : "Deselect all") : (isAr ? "تحديد الكل" : "Select all")}
              </button>
              <span className="text-xs text-muted-foreground">{filtered.length} {isAr ? "صنف" : "items"}</span>
            </div>
          )}

          {/* Add/Edit form */}
          {showAdd && (
            <Card className="border-primary/20">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm">{editId ? (isAr ? "تعديل صنف" : "Edit Item") : (isAr ? "إضافة صنف جديد" : "Add New Item")}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">{isAr ? "الاسم (إنجليزي)" : "Name (English)"} *</Label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                    <Input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} className="h-8 text-sm" dir="rtl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">{isAr ? "القسم" : "Aisle"}</Label>
                    <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ORDER_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{isAr ? c.labelAr : c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">{isAr ? "الفرعي" : "Sub"}</Label>
                    <Input value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">{isAr ? "الوحدة" : "Unit"}</Label>
                    <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ITEM_UNITS.map(u => <SelectItem key={u.value} value={u.value} className="text-xs">{isAr ? u.labelAr : u.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">{isAr ? "الكمية" : "Qty"}</Label>
                    <Input type="number" value={form.default_quantity} onChange={e => setForm({ ...form, default_quantity: Number(e.target.value) })} className="h-8 text-sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={!form.name || saveMutation.isPending}>
                    <Save className="me-1.5 h-3.5 w-3.5" /> {isAr ? "حفظ" : "Save"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setEditId(null); resetForm(); }}>
                    <X className="me-1 h-3.5 w-3.5" /> {isAr ? "إلغاء" : "Cancel"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items grid - responsive */}
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">{isAr ? "لا توجد أصناف" : "No items found"}</p>
            </CardContent></Card>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {filtered.map(item => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelect(item.id)}
                      className={`group flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all
                        ${isSelected ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" : "border-border/60 hover:bg-muted/50 hover:border-primary/20"}`}
                    >
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all
                        ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{isAr && item.name_ar ? item.name_ar : item.name}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span className="capitalize truncate">{(item.subcategory || item.category).replace(/_/g, " ")}</span>
                          <span>·</span>
                          <span className="shrink-0">{item.default_quantity || 1} {item.unit || "pc"}</span>
                          {item.estimated_cost && <><span>·</span><span className="shrink-0 text-primary font-medium">SAR <AnimatedCounter value={Math.round(Number(item.estimated_cost))} className="inline" /></span></>}
                        </div>
                      </div>
                      <Button
                        size="icon" variant="ghost" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={e => { e.stopPropagation(); startEdit(item); }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* ── Add to List Dialog ── */}
      <Dialog open={showListPicker} onOpenChange={setShowListPicker}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isAr ? "إضافة للقائمة" : "Add to List"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {isAr ? `${selectedIds.size} عنصر محدد` : `${selectedIds.size} items selected`}
          </p>
          {allLists.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {isAr ? "لا توجد قوائم. أنشئ قائمة أولاً." : "No lists available. Create a list first."}
            </p>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-1">
                {allLists.map(list => (
                  <button
                    key={list.id}
                    onClick={() => addToListMutation.mutate(list.id)}
                    disabled={addToListMutation.isPending}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start transition-all hover:bg-muted/50 border border-transparent hover:border-border"
                  >
                    <ClipboardList className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{isAr && list.title_ar ? list.title_ar : list.title}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{list.category?.replace(/_/g, " ")}</p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dish Templates Dialog ── */}
      <Dialog open={showDishTemplates} onOpenChange={setShowDishTemplates}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              {isAr ? "قوالب الأطباق" : "Dish Templates"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            {isAr ? "اختر طبقاً لتحميل مكوناته تلقائياً من السوبرماركت" : "Select a dish to auto-load its ingredients from the supermarket"}
          </p>
          <ScrollArea className="max-h-[400px]">
            <div className="grid grid-cols-1 gap-2">
              {DISH_TEMPLATES.map(dish => {
                const DishIcon = dish.icon;
                return (
                  <button
                    key={dish.id}
                    onClick={() => loadDishTemplate(dish.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-start transition-all hover:bg-muted/50 border border-border hover:border-primary/30"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${dish.color}/10 shrink-0`}>
                      <DishIcon className={`h-5 w-5 text-${dish.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{isAr ? dish.nameAr : dish.name}</p>
                      <p className="text-[11px] text-muted-foreground">{isAr ? dish.descriptionAr : dish.description}</p>
                      <p className="text-[10px] text-primary mt-0.5">{dish.ingredients.length} {isAr ? "مكون" : "ingredients"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
});
