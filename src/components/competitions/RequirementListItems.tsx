import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Search, Package } from "lucide-react";
import { AIRequirementsSuggest } from "./AIRequirementsSuggest";

import { ORDER_CATEGORIES, ITEM_UNITS } from "./order-center/OrderCenterCategories";

const ITEM_CATEGORIES = ORDER_CATEGORIES.map(c => ({
  value: c.value,
  label: c.label,
  labelAr: c.labelAr,
}));

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-chart-1/10 text-chart-1",
  high: "bg-chart-4/10 text-chart-4",
  critical: "bg-destructive/10 text-destructive",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  sourced: "bg-chart-1/10 text-chart-1",
  sponsored: "bg-chart-2/10 text-chart-2",
  purchased: "bg-chart-3/10 text-chart-3",
  delivered: "bg-chart-5/10 text-chart-5",
};

interface Props {
  listId: string;
  competitionId: string;
  listCategory?: string;
}

export function RequirementListItems({ listId, competitionId, listCategory = "general" }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchCatalog, setSearchCatalog] = useState("");
  const [newItem, setNewItem] = useState({
    custom_name: "", custom_name_ar: "", quantity: 1, unit: "piece",
    estimated_cost: "", priority: "medium", notes: "", category: "equipment",
  });

  const { data: listItems, isLoading } = useQuery({
    queryKey: ["requirement-list-items", listId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_list_items")
        .select("*, requirement_items(*)")
        .eq("list_id", listId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: catalogItems } = useQuery({
    queryKey: ["requirement-catalog", searchCatalog],
    queryFn: async () => {
      let q = supabase.from("requirement_items").select("*").eq("is_active", true).limit(20);
      if (searchCatalog) q = q.or(`name.ilike.%${searchCatalog}%,name_ar.ilike.%${searchCatalog}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: showAddDialog,
  });

  const addItemMutation = useMutation({
    mutationFn: async (itemId?: string) => {
      const payload: Record<string, unknown> = {
        list_id: listId,
        added_by: user!.id,
        quantity: newItem.quantity,
        unit: newItem.unit,
        priority: newItem.priority,
        notes: newItem.notes || null,
        estimated_cost: newItem.estimated_cost ? parseFloat(newItem.estimated_cost) : null,
      };
      if (itemId) {
        payload.item_id = itemId;
      } else {
        payload.custom_name = newItem.custom_name;
        payload.custom_name_ar = newItem.custom_name_ar || null;
      }
      const { error } = await supabase.from("requirement_list_items").insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement-list-items", listId] });
      setShowAddDialog(false);
      setNewItem({ custom_name: "", custom_name_ar: "", quantity: 1, unit: "piece", estimated_cost: "", priority: "medium", notes: "", category: "equipment" });
      toast({ title: language === "ar" ? "تمت إضافة العنصر" : "Item added" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const addCatalogItemToList = useMutation({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement-list-items", listId] });
      toast({ title: language === "ar" ? "تمت إضافة العنصر" : "Item added from catalog" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("requirement_list_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement-list-items", listId] });
      toast({ title: language === "ar" ? "تم حذف العنصر" : "Item removed" });
    },
  });

  const updateItemStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("requirement_list_items").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["requirement-list-items", listId] }),
  });

  // Also create the catalog item if custom
  const addCustomAndInsert = async () => {
    if (!newItem.custom_name) return;
    // Try to insert into catalog first
    const { data: catalogEntry } = await supabase.from("requirement_items").insert([{
      name: newItem.custom_name,
      name_ar: newItem.custom_name_ar || null,
      category: newItem.category,
      unit: newItem.unit,
      default_quantity: newItem.quantity,
      estimated_cost: newItem.estimated_cost ? parseFloat(newItem.estimated_cost) : null,
      created_by: user!.id,
    }]).select().maybeSingle();

    if (catalogEntry) {
      addItemMutation.mutate(catalogEntry.id);
    } else {
      // Item may already exist, add as custom
      addItemMutation.mutate(undefined);
    }
  };

  const totalCost = listItems?.reduce((sum, item) => sum + (Number(item.estimated_cost) || 0) * (item.quantity || 1), 0) || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline">{listItems?.length || 0} {language === "ar" ? "عنصر" : "items"}</Badge>
          {totalCost > 0 && (
            <Badge variant="secondary">
              {language === "ar" ? "التكلفة التقديرية:" : "Est. Cost:"} ${totalCost.toLocaleString()}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <AIRequirementsSuggest
            competitionId={competitionId}
            listId={listId}
            listCategory={listCategory}
            existingItemNames={listItems?.map(item => {
              if (item.item_id && item.requirement_items) {
                return (item.requirement_items as any).name;
              }
              return item.custom_name || "";
            }).filter(Boolean) || []}
            onItemsAdded={() => queryClient.invalidateQueries({ queryKey: ["requirement-list-items", listId] })}
          />
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" />{language === "ar" ? "إضافة عنصر" : "Add Item"}</Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{language === "ar" ? "إضافة عنصر للقائمة" : "Add Item to List"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Search from catalog */}
              <div>
                <Label className="text-base font-medium">{language === "ar" ? "اختر من الكتالوج" : "Pick from Catalog"}</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={language === "ar" ? "بحث في الكتالوج..." : "Search catalog..."}
                    value={searchCatalog}
                    onChange={(e) => setSearchCatalog(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {catalogItems && catalogItems.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded border">
                    {catalogItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between border-b px-3 py-2 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{language === "ar" && item.name_ar ? item.name_ar : item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.category} · {item.unit}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => addCatalogItemToList.mutate(item)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">{language === "ar" ? "أو أضف عنصراً جديداً" : "Or add custom item"}</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>{language === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}</Label>
                  <Input value={newItem.custom_name} onChange={(e) => setNewItem({ ...newItem, custom_name: e.target.value })} />
                </div>
                <div>
                  <Label>{language === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                  <Input value={newItem.custom_name_ar} onChange={(e) => setNewItem({ ...newItem, custom_name_ar: e.target.value })} dir="rtl" />
                </div>
                <div>
                  <Label>{language === "ar" ? "الفئة" : "Category"}</Label>
                  <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ITEM_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{language === "ar" ? c.labelAr : c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === "ar" ? "الأولوية" : "Priority"}</Label>
                  <Select value={newItem.priority} onValueChange={(v) => setNewItem({ ...newItem, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{language === "ar" ? "منخفضة" : "Low"}</SelectItem>
                      <SelectItem value="medium">{language === "ar" ? "متوسطة" : "Medium"}</SelectItem>
                      <SelectItem value="high">{language === "ar" ? "عالية" : "High"}</SelectItem>
                      <SelectItem value="critical">{language === "ar" ? "حرجة" : "Critical"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === "ar" ? "الكمية" : "Quantity"}</Label>
                  <Input type="number" min={1} value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })} />
                </div>
                <div>
                  <Label>{language === "ar" ? "الوحدة" : "Unit"}</Label>
                  <Select value={newItem.unit} onValueChange={(v) => setNewItem({ ...newItem, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["piece", "kg", "liter", "meter", "set", "box", "roll", "pack"].map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === "ar" ? "التكلفة التقديرية" : "Estimated Cost ($)"}</Label>
                  <Input type="number" value={newItem.estimated_cost} onChange={(e) => setNewItem({ ...newItem, estimated_cost: e.target.value })} />
                </div>
              </div>
              <Button onClick={addCustomAndInsert} disabled={!newItem.custom_name} className="w-full">
                {language === "ar" ? "إضافة العنصر" : "Add Item"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !listItems?.length ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">{language === "ar" ? "لا توجد عناصر بعد" : "No items added yet"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === "ar" ? "العنصر" : "Item"}</TableHead>
                <TableHead>{language === "ar" ? "الكمية" : "Qty"}</TableHead>
                <TableHead>{language === "ar" ? "التكلفة" : "Cost"}</TableHead>
                <TableHead>{language === "ar" ? "الأولوية" : "Priority"}</TableHead>
                <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listItems.map((item) => {
                const name = item.item_id && item.requirement_items
                  ? (language === "ar" && (item.requirement_items as any).name_ar ? (item.requirement_items as any).name_ar : (item.requirement_items as any).name)
                  : (language === "ar" && item.custom_name_ar ? item.custom_name_ar : item.custom_name);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{name || "—"}</p>
                      {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                    </TableCell>
                    <TableCell>{item.quantity} {item.unit}</TableCell>
                    <TableCell>{item.estimated_cost ? `$${(Number(item.estimated_cost) * item.quantity).toLocaleString()}` : "—"}</TableCell>
                    <TableCell>
                      <Badge className={PRIORITY_COLORS[item.priority || "medium"]} variant="outline">
                        {item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={item.status || "pending"} onValueChange={(v) => updateItemStatus.mutate({ id: item.id, status: v })}>
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["pending", "sourced", "sponsored", "purchased", "delivered"].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteItemMutation.mutate(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
