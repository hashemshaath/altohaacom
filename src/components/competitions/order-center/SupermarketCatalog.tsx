import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Search, Plus, Trash2, Edit, Package, Save, X, ChevronDown, ChevronRight,
  ShoppingCart, Apple, Beef, Leaf, GlassWater, Flame, Wrench, Shirt,
  ShieldCheck, Droplets, Plug, Wind, Cable, Truck, ClipboardList,
  MapPin, Refrigerator, Sparkles, Store,
} from "lucide-react";
import { ORDER_CATEGORIES, ITEM_UNITS } from "./OrderCenterCategories";

/* ── Supermarket aisle definitions ── */
const SUPERMARKET_AISLES = [
  { key: "all", labelEn: "All Aisles", labelAr: "جميع الأقسام", icon: Store, color: "text-primary" },
  { key: "food_ingredients", labelEn: "Grocery & Pantry", labelAr: "البقالة والمؤن", icon: ShoppingCart, color: "text-orange-500" },
  { key: "herbs_spices", labelEn: "Herbs & Spices", labelAr: "الأعشاب والتوابل", icon: Leaf, color: "text-green-600" },
  { key: "meat_seafood", labelEn: "Meat & Seafood", labelAr: "اللحوم والمأكولات البحرية", icon: Beef, color: "text-red-500" },
  { key: "decoration", labelEn: "Decoration & Serving", labelAr: "الديكور والتقديم", icon: Sparkles, color: "text-purple-500" },
  { key: "light_equipment", labelEn: "Tools & Utensils", labelAr: "الأدوات والمعدات", icon: Wrench, color: "text-slate-600" },
  { key: "equipment", labelEn: "Heavy Equipment", labelAr: "المعدات الثقيلة", icon: Package, color: "text-blue-600" },
  { key: "cooking_stations", labelEn: "Cooking Stations", labelAr: "محطات الطهي", icon: Flame, color: "text-amber-600" },
  { key: "beverage", labelEn: "Beverages", labelAr: "المشروبات", icon: GlassWater, color: "text-cyan-500" },
  { key: "uniforms", labelEn: "Uniforms", labelAr: "الزي الرسمي", icon: Shirt, color: "text-indigo-500" },
  { key: "cleaning", labelEn: "Cleaning", labelAr: "التنظيف", icon: Droplets, color: "text-sky-500" },
  { key: "safety_hygiene", labelEn: "Safety & Hygiene", labelAr: "السلامة والنظافة", icon: ShieldCheck, color: "text-emerald-600" },
  { key: "refrigeration", labelEn: "Refrigeration", labelAr: "التبريد", icon: Refrigerator, color: "text-blue-400" },
  { key: "venue_setup", labelEn: "Venue Setup", labelAr: "الموقع", icon: MapPin, color: "text-pink-500" },
  { key: "grilling", labelEn: "Grilling", labelAr: "الشوي", icon: Flame, color: "text-orange-600" },
  { key: "utilities", labelEn: "Utilities", labelAr: "المرافق", icon: Plug, color: "text-yellow-600" },
  { key: "ventilation", labelEn: "Ventilation", labelAr: "التهوية", icon: Wind, color: "text-teal-500" },
  { key: "electrical", labelEn: "Electrical", labelAr: "الكهرباء", icon: Cable, color: "text-zinc-500" },
  { key: "logistics", labelEn: "Logistics", labelAr: "اللوجستيات", icon: Truck, color: "text-stone-600" },
  { key: "other", labelEn: "Other", labelAr: "أخرى", icon: ClipboardList, color: "text-muted-foreground" },
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

export function SupermarketCatalog() {
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [form, setForm] = useState({
    name: "", name_ar: "", description: "", description_ar: "",
    category: "food_ingredients", subcategory: "", unit: "kg",
    default_quantity: 1, estimated_cost: 0, brand: "",
  });

  // Fetch all items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["supermarket-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_items")
        .select("*")
        .order("category")
        .order("subcategory")
        .order("name")
        .limit(2000);
      if (error) throw error;
      return data as CatalogItem[];
    },
  });

  // Filtered items
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

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });
    return counts;
  }, [items]);

  // Subcategory list for active aisle
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
      queryClient.invalidateQueries({ queryKey: ["catalog-browse"] });
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

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{isAr ? "السوبرماركت" : "Supermarket"}</h2>
            <p className="text-xs text-muted-foreground">
              {items.length} {isAr ? "صنف" : "items"} · {subcategories.length} {isAr ? "تصنيف فرعي" : "subcategories"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={viewMode === "grid" ? "default" : "outline"} onClick={() => setViewMode("grid")} className="h-8 px-2.5 text-xs">
            {isAr ? "بطاقات" : "Grid"}
          </Button>
          <Button size="sm" variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")} className="h-8 px-2.5 text-xs">
            {isAr ? "قائمة" : "List"}
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setEditId(null); setShowAdd(true); }} className="gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" /> {isAr ? "إضافة صنف" : "Add Item"}
          </Button>
          {selectedIds.size > 0 && (
            <Button size="sm" variant="destructive" className="gap-1 h-8" onClick={() => {
              if (confirm(isAr ? `حذف ${selectedIds.size} عنصر؟` : `Delete ${selectedIds.size} items?`))
                deleteMutation.mutate([...selectedIds]);
            }}>
              <Trash2 className="h-3.5 w-3.5" /> {selectedIds.size}
            </Button>
          )}
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={isAr ? "ابحث في السوبرماركت... (اسم، فئة، وصف)" : "Search supermarket... (name, category, description)"}
          value={search} onChange={e => { setSearch(e.target.value); }}
          className="ps-9 h-10"
        />
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* ── Sidebar: Aisles ── */}
        <div className="w-full lg:w-56 shrink-0 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">{isAr ? "أقسام السوبرماركت" : "SUPERMARKET AISLES"}</p>
          <ScrollArea className="max-h-[600px]">
            {SUPERMARKET_AISLES.map(aisle => {
              const count = aisle.key === "all" ? items.length : (categoryCounts[aisle.key] || 0);
              const AisleIcon = aisle.icon;
              const isActive = activeAisle === aisle.key;
              return (
                <button
                  key={aisle.key}
                  onClick={() => { setActiveAisle(aisle.key); setActiveSubcategory(null); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-start text-sm transition-all mb-0.5
                    ${isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-foreground"}`}
                >
                  <AisleIcon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : aisle.color}`} />
                  <span className="truncate flex-1">{isAr ? aisle.labelAr : aisle.labelEn}</span>
                  <Badge variant="secondary" className="text-[10px] h-5 min-w-[28px] justify-center">{count}</Badge>
                </button>
              );
            })}
          </ScrollArea>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Subcategory chips */}
          {subcategories.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveSubcategory(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border
                  ${!activeSubcategory ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}
              >
                {isAr ? "الكل" : "All"} ({activeAisle === "all" ? items.length : (categoryCounts[activeAisle] || 0)})
              </button>
              {subcategories.map(([sub, count]) => (
                <button
                  key={sub}
                  onClick={() => setActiveSubcategory(activeSubcategory === sub ? null : sub)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border capitalize
                    ${activeSubcategory === sub ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}
                >
                  {sub.replace(/_/g, " ")} ({count})
                </button>
              ))}
            </div>
          )}

          {/* Add/Edit form */}
          {showAdd && (
            <Card className="border-primary/20">
              <CardHeader className="pb-2 px-4 pt-3">
                <CardTitle className="text-sm">{editId ? (isAr ? "تعديل صنف" : "Edit Item") : (isAr ? "إضافة صنف جديد" : "Add New Item")}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">{isAr ? "الاسم (إنجليزي)" : "Name (English)"} *</Label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                    <Input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} className="h-8 text-sm" dir="rtl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">{isAr ? "الوصف" : "Description"}</Label>
                    <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="text-sm min-h-[50px]" />
                  </div>
                  <div>
                    <Label className="text-xs">{isAr ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                    <Textarea value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} className="text-sm min-h-[50px]" dir="rtl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                    <Label className="text-xs">{isAr ? "التصنيف الفرعي" : "Subcategory"}</Label>
                    <Input value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })} className="h-8 text-sm" placeholder={isAr ? "خضروات، بهارات..." : "vegetables, spices..."} />
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">{isAr ? "التكلفة التقديرية" : "Est. Cost"}</Label>
                    <Input type="number" value={form.estimated_cost} onChange={e => setForm({ ...form, estimated_cost: Number(e.target.value) })} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">{isAr ? "العلامة التجارية" : "Brand"}</Label>
                    <Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="h-8 text-sm" />
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

          {/* Items */}
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">{isAr ? "لا توجد أصناف" : "No items found"}</p>
            </CardContent></Card>
          ) : viewMode === "grid" ? (
            <div>
              <p className="text-xs text-muted-foreground mb-2">{filtered.length} {isAr ? "صنف" : "items"}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {filtered.map(item => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <Card
                      key={item.id}
                      className={`group cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary border-primary" : "border-border/60"}`}
                      onClick={() => toggleSelect(item.id)}
                    >
                      <CardContent className="p-3 space-y-1.5">
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-sm font-medium leading-tight line-clamp-2">{isAr && item.name_ar ? item.name_ar : item.name}</p>
                          <Button
                            size="icon" variant="ghost" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                            onClick={e => { e.stopPropagation(); startEdit(item); }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                        {item.description && (
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{isAr && item.description_ar ? item.description_ar : item.description}</p>
                        )}
                        <div className="flex items-center justify-between gap-1">
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5 capitalize">{item.subcategory?.replace(/_/g, " ") || item.category.replace(/_/g, " ")}</Badge>
                          <span className="text-[10px] text-muted-foreground">{item.default_quantity} {item.unit}</span>
                        </div>
                        {item.estimated_cost ? (
                          <p className="text-[10px] font-medium text-primary">${Number(item.estimated_cost).toLocaleString()}</p>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground mb-2">{filtered.length} {isAr ? "صنف" : "items"}</p>
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-1">
                  {filtered.map(item => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all
                          ${isSelected ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/50"}`}
                        onClick={() => toggleSelect(item.id)}
                      >
                        <Checkbox checked={isSelected} className="shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{isAr && item.name_ar ? item.name_ar : item.name}</p>
                          {item.description && <p className="text-[10px] text-muted-foreground truncate">{isAr && item.description_ar ? item.description_ar : item.description}</p>}
                        </div>
                        <Badge variant="outline" className="text-[9px] shrink-0 capitalize">{item.subcategory?.replace(/_/g, " ") || "—"}</Badge>
                        <span className="text-xs text-muted-foreground shrink-0">{item.default_quantity} {item.unit}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={e => { e.stopPropagation(); startEdit(item); }}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-destructive" onClick={e => {
                          e.stopPropagation();
                          if (confirm(isAr ? "حذف؟" : "Delete?")) deleteMutation.mutate([item.id]);
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
