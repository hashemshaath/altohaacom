import { useState, memo } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, Plus, Trash2, Edit, Package, Image as ImageIcon, Save, X, Check,
} from "lucide-react";
import { ORDER_CATEGORIES, ITEM_UNITS } from "./OrderCenterCategories";

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

export const AdminCatalogManager = memo(function AdminCatalogManager() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    name: "", name_ar: "", description: "", description_ar: "",
    category: "food_ingredients", subcategory: "", unit: "kg",
    default_quantity: 1, estimated_cost: 0, brand: "",
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-catalog", search, categoryFilter],
    queryFn: async () => {
      let q = supabase
        .from("requirement_items")
        .select("id, name, name_ar, description, description_ar, category, subcategory, unit, default_quantity, estimated_cost, brand, is_active, image_url, tags")
        .order("category")
        .order("name")
        .limit(500);
      if (search) q = q.or(`name.ilike.%${search}%,name_ar.ilike.%${search}%,description.ilike.%${search}%`);
      if (categoryFilter !== "all") q = q.eq("category", categoryFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as CatalogItem[];
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["admin-catalog"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-browse"] });
      setShowAdd(false);
      setEditId(null);
      resetForm();
      toast({ title: isAr ? (editId ? "تم تحديث العنصر" : "تمت إضافة العنصر") : (editId ? "Item updated" : "Item added") });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("requirement_items").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-catalog"] });
      setSelectedIds(new Set());
      toast({ title: isAr ? "تم حذف العناصر" : "Items deleted" });
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

  const selectAll = () => {
    if (selectedIds.size === items.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map(i => i.id)));
  };

  // Group by category for stats
  const catCounts = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {ORDER_CATEGORIES.slice(0, 6).map(cat => {
          const CatIcon = cat.icon;
          return (
            <Card key={cat.value} className={`cursor-pointer border-border/60 transition-all hover:shadow-sm ${categoryFilter === cat.value ? "border-primary ring-1 ring-primary/20" : ""}`}
              onClick={() => setCategoryFilter(categoryFilter === cat.value ? "all" : cat.value)}>
              <CardContent className="p-2.5 text-center">
                <CatIcon className="mx-auto mb-1 h-4 w-4 text-primary" />
                <p className="text-[10px] font-medium truncate">{isAr ? cat.labelAr : cat.label}</p>
                <p className="text-xs font-bold">{catCounts[cat.value] || 0}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={isAr ? "بحث بالاسم أو الوصف..." : "Search by name or description..."} value={search} onChange={e => setSearch(e.target.value)} className="ps-9 h-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "جميع الفئات" : "All Categories"}</SelectItem>
            {ORDER_CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value} className="text-xs">{isAr ? c.labelAr : c.label} ({catCounts[c.value] || 0})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => { resetForm(); setEditId(null); setShowAdd(true); }} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> {isAr ? "إضافة عنصر" : "Add Item"}
        </Button>
        {selectedIds.size > 0 && (
          <Button size="sm" variant="destructive" onClick={() => {
            if (confirm(isAr ? `حذف ${selectedIds.size} عنصر؟` : `Delete ${selectedIds.size} items?`))
              deleteMutation.mutate([...selectedIds]);
          }} className="gap-1.5">
            <Trash2 className="h-3.5 w-3.5" /> {selectedIds.size}
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2 px-4 pt-3">
            <CardTitle className="text-sm">{editId ? (isAr ? "تعديل عنصر" : "Edit Item") : (isAr ? "إضافة عنصر جديد" : "Add New Item")}</CardTitle>
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
                <Label className="text-xs">{isAr ? "الوصف (إنجليزي)" : "Description"}</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="text-sm min-h-[50px]" />
              </div>
              <div>
                <Label className="text-xs">{isAr ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                <Textarea value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} className="text-sm min-h-[50px]" dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <Label className="text-xs">{isAr ? "الفئة" : "Category"}</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORDER_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{isAr ? c.labelAr : c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
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
                <Label className="text-xs">{isAr ? "الكمية الافتراضية" : "Default Qty"}</Label>
                <Input type="number" value={form.default_quantity} onChange={e => setForm({ ...form, default_quantity: Number(e.target.value) })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">{isAr ? "التكلفة التقديرية" : "Est. Cost"}</Label>
                <Input type="number" value={form.estimated_cost} onChange={e => setForm({ ...form, estimated_cost: Number(e.target.value) })} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? "الفئة الفرعية" : "Subcategory"}</Label>
                <Input value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })} className="h-8 text-sm" placeholder={isAr ? "خضروات، بهارات..." : "vegetables, spices..."} />
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

      {/* Items Table */}
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">{isAr ? "لا توجد عناصر" : "No items found"}</p>
        </CardContent></Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{items.length} {isAr ? "عنصر" : "items"}</p>
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox checked={selectedIds.size === items.length && items.length > 0} onCheckedChange={selectAll} />
                  </TableHead>
                  <TableHead className="text-xs">{isAr ? "العنصر" : "Item"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "الفئة" : "Category"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "الفئة الفرعية" : "Sub"}</TableHead>
                  <TableHead className="text-xs text-center">{isAr ? "الكمية" : "Qty"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "الوحدة" : "Unit"}</TableHead>
                  <TableHead className="text-xs">{isAr ? "التكلفة" : "Cost"}</TableHead>
                  <TableHead className="text-xs w-20">{isAr ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => {
                  const catDef = ORDER_CATEGORIES.find(c => c.value === item.category);
                  return (
                    <TableRow key={item.id} className={selectedIds.has(item.id) ? "bg-primary/5" : ""}>
                      <TableCell><Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} /></TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{isAr && item.name_ar ? item.name_ar : item.name}</p>
                          {item.description && <p className="text-[10px] text-muted-foreground line-clamp-1">{isAr && item.description_ar ? item.description_ar : item.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[9px]">{catDef ? (isAr ? catDef.labelAr : catDef.label) : item.category}</Badge></TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">{item.subcategory || "—"}</TableCell>
                      <TableCell className="text-center text-xs">{item.default_quantity || "—"}</TableCell>
                      <TableCell className="text-xs">{item.unit || "—"}</TableCell>
                      <TableCell className="text-xs">{item.estimated_cost ? <>SAR <AnimatedCounter value={Math.round(Number(item.estimated_cost))} className="inline" /></> : "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(item)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => {
                            if (confirm(isAr ? "حذف هذا العنصر؟" : "Delete this item?")) deleteMutation.mutate([item.id]);
                          }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
