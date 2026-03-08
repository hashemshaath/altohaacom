import { useState, useMemo, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, Plus, Check, ShoppingCart, Store, Leaf, Beef, Sparkles,
  Wrench, Package, Flame, GlassWater, Shirt, ShieldCheck, Droplets,
  Plug, Wind, Cable, Truck, ClipboardList, MapPin, Refrigerator, ChefHat,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DISH_TEMPLATES } from "@/data/dishTemplates";

const AISLES = [
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
  { key: "utilities", labelEn: "Utilities", labelAr: "مرافق", icon: Plug },
  { key: "ventilation", labelEn: "Vent", labelAr: "تهوية", icon: Wind },
  { key: "electrical", labelEn: "Electric", labelAr: "كهرباء", icon: Cable },
  { key: "logistics", labelEn: "Logistics", labelAr: "لوجستيات", icon: Truck },
  { key: "other", labelEn: "Other", labelAr: "أخرى", icon: ClipboardList },
];

interface SupermarketListPickerProps {
  listId: string;
  existingItemIds?: string[];
  onItemAdded?: () => void;
}

export const SupermarketListPicker = memo(function SupermarketListPicker({ listId, existingItemIds = [], onItemAdded }: SupermarketListPickerProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [search, setSearch] = useState("");
  const [activeAisle, setActiveAisle] = useState("all");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [showDishPicker, setShowDishPicker] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["supermarket-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_items")
        .select("id, name, name_ar, description, description_ar, category, subcategory, unit, estimated_cost, currency, default_quantity, brand, brand_ar, image_url, is_active, tags, alternatives, size, size_ar, material, material_ar")
        .eq("is_active", true)
        .order("category")
        .order("name")
        .limit(2000);
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    let result = items;
    if (activeAisle !== "all") result = result.filter(i => i.category === activeAisle);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(s) ||
        (i.name_ar && i.name_ar.includes(s)) ||
        (i.subcategory && i.subcategory.toLowerCase().includes(s))
      );
    }
    return result;
  }, [items, activeAisle, search]);

  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    items.forEach(i => { c[i.category] = (c[i.category] || 0) + 1; });
    return c;
  }, [items]);

  const addToListMutation = useMutation({
    mutationFn: async (item: { id: string; default_quantity: number | null; unit: string | null; estimated_cost: number | null }) => {
      const { error } = await supabase.from("requirement_list_items").insert({
        list_id: listId,
        item_id: item.id,
        quantity: item.default_quantity || 1,
        unit: item.unit || "piece",
        estimated_cost: item.estimated_cost,
        added_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: (_, item) => {
      setAddedIds(prev => new Set(prev).add(item.id));
      queryClient.invalidateQueries({ queryKey: ["requirement-list-items", listId] });
      onItemAdded?.();
      toast({ title: isAr ? "تمت الإضافة ✓" : "Added ✓" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  // Batch add dish template ingredients
  const addDishMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const template = DISH_TEMPLATES.find(t => t.id === templateId);
      if (!template) throw new Error("Template not found");

      const inserts: any[] = [];
      for (const ing of template.ingredients) {
        const match = items.find(item =>
          item.name.toLowerCase() === ing.name.toLowerCase() ||
          (item.name_ar && item.name_ar === ing.nameAr)
        );
        if (match && !existingItemIds.includes(match.id) && !addedIds.has(match.id)) {
          inserts.push({
            list_id: listId,
            item_id: match.id,
            quantity: ing.quantity,
            unit: ing.unit,
            estimated_cost: match.estimated_cost,
            added_by: user!.id,
          });
        }
      }

      // Also add unmatched as custom items
      for (const ing of template.ingredients) {
        const match = items.find(item =>
          item.name.toLowerCase() === ing.name.toLowerCase() ||
          (item.name_ar && item.name_ar === ing.nameAr)
        );
        if (!match) {
          inserts.push({
            list_id: listId,
            custom_name: ing.name,
            custom_name_ar: ing.nameAr,
            quantity: ing.quantity,
            unit: ing.unit,
            added_by: user!.id,
          });
        }
      }

      if (inserts.length) {
        const { error } = await supabase.from("requirement_list_items").insert(inserts);
        if (error) throw error;
      }
      return inserts.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["requirement-list-items", listId] });
      onItemAdded?.();
      setShowDishPicker(false);
      toast({ title: isAr ? `تمت إضافة ${count} عنصر ✓` : `Added ${count} items ✓` });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const isAlreadyAdded = (id: string) => existingItemIds.includes(id) || addedIds.has(id);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{isAr ? "السوبرماركت" : "Supermarket"}</h3>
          <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowDishPicker(true)}>
          <ChefHat className="h-3 w-3" />
          {isAr ? "قالب طبق" : "Dish Template"}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={isAr ? "ابحث..." : "Search..."}
          value={search} onChange={e => setSearch(e.target.value)}
          className="ps-9 h-8 text-sm"
        />
      </div>

      {/* Aisle chips - horizontal scroll */}
      <ScrollArea className="w-full">
        <div className="flex gap-1 pb-1">
          {AISLES.map(a => {
            const count = a.key === "all" ? items.length : (categoryCounts[a.key] || 0);
            if (a.key !== "all" && count === 0) return null;
            const Icon = a.icon;
            return (
              <button
                key={a.key}
                onClick={() => setActiveAisle(a.key)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all border shrink-0
                  ${activeAisle === a.key ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}
              >
                <Icon className="h-2.5 w-2.5" />
                {isAr ? a.labelAr : a.labelEn}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Items */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-4">{isAr ? "لا توجد أصناف" : "No items found"}</p>
      ) : (
        <ScrollArea className="max-h-[350px]">
          <div className="grid grid-cols-1 gap-1">
            {filtered.map(item => {
              const added = isAlreadyAdded(item.id);
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all
                    ${added ? "bg-primary/5 border-primary/20 opacity-60" : "border-border/60 hover:bg-muted/50 hover:border-primary/30"}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{isAr && item.name_ar ? item.name_ar : item.name}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="capitalize truncate">{(item.subcategory || item.category).replace(/_/g, " ")}</span>
                      <span>·</span>
                      <span>{item.default_quantity || 1} {item.unit || "pc"}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={added ? "secondary" : "outline"}
                    className="h-7 px-2 text-xs shrink-0"
                    disabled={added || addToListMutation.isPending}
                    onClick={() => addToListMutation.mutate(item)}
                  >
                    {added ? <><Check className="h-3 w-3 me-1" />{isAr ? "تم" : "Added"}</> : <><Plus className="h-3 w-3 me-1" />{isAr ? "أضف" : "Add"}</>}
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Dish Template Picker Dialog */}
      <Dialog open={showDishPicker} onOpenChange={setShowDishPicker}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              {isAr ? "أضف من قالب طبق" : "Add from Dish Template"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            {isAr ? "أضف جميع مكونات الطبق دفعة واحدة" : "Bulk-add all dish ingredients at once"}
          </p>
          <ScrollArea className="max-h-[350px]">
            <div className="space-y-1.5">
              {DISH_TEMPLATES.map(dish => {
                const DishIcon = dish.icon;
                return (
                  <button
                    key={dish.id}
                    onClick={() => addDishMutation.mutate(dish.id)}
                    disabled={addDishMutation.isPending}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl text-start transition-all hover:bg-muted/50 border border-border hover:border-primary/30"
                  >
                    <DishIcon className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{isAr ? dish.nameAr : dish.name}</p>
                      <p className="text-[10px] text-muted-foreground">{dish.ingredients.length} {isAr ? "مكون" : "ingredients"}</p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
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
