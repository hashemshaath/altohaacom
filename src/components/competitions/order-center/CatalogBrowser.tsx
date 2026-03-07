import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Package, Image as ImageIcon, Filter, Plus, ListPlus } from "lucide-react";
import { ORDER_CATEGORIES } from "./OrderCenterCategories";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

export function CatalogBrowser({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: items, isLoading } = useQuery({
    queryKey: ["catalog-browse", search, categoryFilter],
    queryFn: async () => {
      let q = supabase
        .from("requirement_items")
        .select("id, name, name_ar, category, subcategory, description, description_ar, unit, brand, brand_ar, size, size_ar, material, material_ar, image_url, estimated_cost, currency, default_quantity, alternatives, tags, is_active")
        .eq("is_active", true)
        .order("category")
        .order("name")
        .limit(100);

      if (search) q = q.or(`name.ilike.%${search}%,name_ar.ilike.%${search}%`);
      if (categoryFilter !== "all") q = q.eq("category", categoryFilter);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: lists } = useQuery({
    queryKey: ["catalog-lists", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_lists")
        .select("id, title, title_ar")
        .eq("competition_id", competitionId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const addToList = useMutation({
    mutationFn: async ({ itemId, listId, item }: { itemId: string; listId: string; item: any }) => {
      const { error } = await supabase.from("requirement_list_items").insert({
        list_id: listId,
        item_id: itemId,
        quantity: item.default_quantity || 1,
        unit: item.unit || "piece",
        estimated_cost: item.estimated_cost,
        added_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement-list-items"] });
      queryClient.invalidateQueries({ queryKey: ["checklist-items"] });
      toast({ title: isAr ? "تمت إضافة العنصر للقائمة" : "Item added to list" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  // Group items by category
  const grouped = items?.reduce((acc, item) => {
    const cat = item.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof items>) || {};

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isAr ? "بحث في الكتالوج..." : "Search catalog..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <Filter className="me-1.5 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "جميع الفئات" : "All Categories"}</SelectItem>
            {ORDER_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Summary Cards */}
      {categoryFilter === "all" && !search && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {ORDER_CATEGORIES.slice(0, 8).map((cat) => {
            const CatIcon = cat.icon;
            const count = grouped[cat.value]?.length || 0;
            return (
              <Card
                key={cat.value}
                className={`cursor-pointer border-border/60 transition-all hover:shadow-md hover:-translate-y-0.5 ${categoryFilter === (cat.value as string) ? "border-primary" : ""}`}
                onClick={() => setCategoryFilter(cat.value as string)}
              >
                <CardContent className="p-3 text-center">
                  <CatIcon className="mx-auto mb-1.5 h-5 w-5 text-primary" />
                  <p className="text-xs font-medium truncate">{isAr ? cat.labelAr : cat.label}</p>
                  <p className="text-[10px] text-muted-foreground">{count} {isAr ? "عنصر" : "items"}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Items List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !items?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">{isAr ? "لا توجد عناصر في الكتالوج" : "No items in catalog"}</p>
            <p className="text-xs text-muted-foreground mt-1">{isAr ? "أضف عناصر من قوائم المتطلبات" : "Add items from requirement lists"}</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => {
          const catInfo = ORDER_CATEGORIES.find(c => c.value === cat);
          const CatIcon = catInfo?.icon || Package;
          return (
            <div key={cat} className="space-y-2">
              <div className="flex items-center gap-2 pt-2">
                <CatIcon className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold">{isAr ? catInfo?.labelAr : catInfo?.label || cat}</h4>
                <Badge variant="outline" className="text-[10px]">{catItems!.length}</Badge>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {catItems!.map((item) => (
                  <Card key={item.id} className="border-border/60 overflow-hidden">
                    <CardContent className="flex items-start gap-3 p-3">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted shrink-0">
                          <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {isAr && item.name_ar ? item.name_ar : item.name}
                        </p>
                        {item.description && (
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{isAr && item.description_ar ? item.description_ar : item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-[10px]">{item.unit}</Badge>
                          {item.estimated_cost && (
                            <span className="text-[10px] text-muted-foreground">$<AnimatedCounter value={Math.round(Number(item.estimated_cost))} className="inline" /></span>
                          )}
                          {item.brand && (
                            <span className="text-[10px] text-muted-foreground">{item.brand}</span>
                          )}
                        </div>
                      </div>
                      {isOrganizer && lists && lists.length > 0 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                              <ListPlus className="h-4 w-4 text-primary" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-1" align="end">
                            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                              {isAr ? "إضافة إلى قائمة" : "Add to list"}
                            </p>
                            {lists.map((list) => (
                              <Button
                                key={list.id}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-xs"
                                onClick={() => addToList.mutate({ itemId: item.id, listId: list.id, item })}
                              >
                                {isAr && list.title_ar ? list.title_ar : list.title}
                              </Button>
                            ))}
                          </PopoverContent>
                        </Popover>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
