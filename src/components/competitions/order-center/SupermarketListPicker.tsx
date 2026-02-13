import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search, Plus, Check, ShoppingCart, Store, Leaf, Beef, Sparkles,
  Wrench, Package, Flame, GlassWater, Shirt, ShieldCheck, Droplets,
  Plug, Wind, Cable, Truck, ClipboardList, MapPin, Refrigerator,
} from "lucide-react";

const AISLES = [
  { key: "all", labelEn: "All", labelAr: "الكل", icon: Store },
  { key: "food_ingredients", labelEn: "Grocery", labelAr: "البقالة", icon: ShoppingCart },
  { key: "herbs_spices", labelEn: "Spices", labelAr: "التوابل", icon: Leaf },
  { key: "meat_seafood", labelEn: "Meat & Seafood", labelAr: "اللحوم", icon: Beef },
  { key: "decoration", labelEn: "Decoration", labelAr: "الديكور", icon: Sparkles },
  { key: "light_equipment", labelEn: "Tools", labelAr: "الأدوات", icon: Wrench },
  { key: "equipment", labelEn: "Equipment", labelAr: "المعدات", icon: Package },
  { key: "cooking_stations", labelEn: "Stations", labelAr: "المحطات", icon: Flame },
  { key: "beverage", labelEn: "Beverages", labelAr: "المشروبات", icon: GlassWater },
  { key: "uniforms", labelEn: "Uniforms", labelAr: "الزي", icon: Shirt },
  { key: "cleaning", labelEn: "Cleaning", labelAr: "التنظيف", icon: Droplets },
  { key: "safety_hygiene", labelEn: "Safety", labelAr: "السلامة", icon: ShieldCheck },
  { key: "refrigeration", labelEn: "Cooling", labelAr: "التبريد", icon: Refrigerator },
  { key: "venue_setup", labelEn: "Venue", labelAr: "الموقع", icon: MapPin },
  { key: "utilities", labelEn: "Utilities", labelAr: "المرافق", icon: Plug },
  { key: "ventilation", labelEn: "Ventilation", labelAr: "التهوية", icon: Wind },
  { key: "electrical", labelEn: "Electrical", labelAr: "الكهرباء", icon: Cable },
  { key: "logistics", labelEn: "Logistics", labelAr: "اللوجستيات", icon: Truck },
  { key: "other", labelEn: "Other", labelAr: "أخرى", icon: ClipboardList },
];

interface SupermarketListPickerProps {
  listId: string;
  existingItemIds?: string[];
  onItemAdded?: () => void;
}

export function SupermarketListPicker({ listId, existingItemIds = [], onItemAdded }: SupermarketListPickerProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [search, setSearch] = useState("");
  const [activeAisle, setActiveAisle] = useState("all");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["supermarket-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_items")
        .select("*")
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
      toast({ title: isAr ? "تمت الإضافة للقائمة ✓" : "Added to list ✓" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const isAlreadyAdded = (id: string) => existingItemIds.includes(id) || addedIds.has(id);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Store className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold">{isAr ? "أضف من السوبرماركت" : "Add from Supermarket"}</h3>
        <Badge variant="secondary" className="text-[10px]">{items.length} {isAr ? "صنف" : "items"}</Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={isAr ? "ابحث في السوبرماركت..." : "Search supermarket..."}
          value={search} onChange={e => setSearch(e.target.value)}
          className="ps-9 h-9 text-sm"
        />
      </div>

      {/* Aisle chips */}
      <div className="flex flex-wrap gap-1">
        {AISLES.map(a => {
          const count = a.key === "all" ? items.length : (categoryCounts[a.key] || 0);
          if (a.key !== "all" && count === 0) return null;
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              onClick={() => setActiveAisle(a.key)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-all border
                ${activeAisle === a.key ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}
            >
              <Icon className="h-3 w-3" />
              {isAr ? a.labelAr : a.labelEn}
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Items grid */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">{isAr ? "لا توجد أصناف" : "No items found"}</p>
      ) : (
        <ScrollArea className="max-h-[400px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {filtered.map(item => {
              const added = isAlreadyAdded(item.id);
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                    ${added ? "bg-primary/5 border-primary/20 opacity-60" : "border-border/60 hover:bg-muted/50 hover:border-primary/30"}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{isAr && item.name_ar ? item.name_ar : item.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="capitalize">{(item.subcategory || item.category).replace(/_/g, " ")}</span>
                      <span>·</span>
                      <span>{item.default_quantity || 1} {item.unit || "piece"}</span>
                      {item.estimated_cost && <><span>·</span><span>${Number(item.estimated_cost).toLocaleString()}</span></>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={added ? "secondary" : "outline"}
                    className="h-7 px-2 text-xs shrink-0"
                    disabled={added || addToListMutation.isPending}
                    onClick={() => addToListMutation.mutate(item)}
                  >
                    {added ? <><Check className="h-3 w-3 me-1" />{isAr ? "تمت" : "Added"}</> : <><Plus className="h-3 w-3 me-1" />{isAr ? "أضف" : "Add"}</>}
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
