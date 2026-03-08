import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Package, Store, ChevronDown, ChevronUp } from "lucide-react";
import { AIRequirementsSuggest } from "./AIRequirementsSuggest";
import { SupermarketListPicker } from "./order-center/SupermarketListPicker";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ITEM_STATUS_LABELS, PRIORITY_LABELS, getStatusLabel } from "./order-center/OrderStatusLabels";
import { formatCurrency } from "@/lib/currencyFormatter";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-chart-1/10 text-chart-1",
  high: "bg-chart-4/10 text-chart-4",
  critical: "bg-destructive/10 text-destructive",
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
  const [showSupermarket, setShowSupermarket] = useState(false);

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

  const totalCost = listItems?.reduce((sum, item) => sum + (Number(item.estimated_cost) || 0) * (item.quantity || 1), 0) || 0;
  const existingItemIds = listItems?.map(item => item.item_id).filter(Boolean) as string[] || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline">{listItems?.length || 0} {language === "ar" ? "عنصر" : "items"}</Badge>
          {totalCost > 0 && (
            <Badge variant="secondary">
              {language === "ar" ? "التكلفة التقديرية:" : "Est. Cost:"} {formatCurrency(totalCost, language as "en" | "ar")}
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
          <Button
            size="sm"
            variant={showSupermarket ? "default" : "outline"}
            onClick={() => setShowSupermarket(!showSupermarket)}
            className="gap-1.5"
          >
            <Store className="h-4 w-4" />
            {language === "ar" ? "السوبرماركت" : "Supermarket"}
            {showSupermarket ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Inline Supermarket Picker */}
      {showSupermarket && (
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <SupermarketListPicker
              listId={listId}
              existingItemIds={existingItemIds}
              onItemAdded={() => queryClient.invalidateQueries({ queryKey: ["requirement-list-items", listId] })}
            />
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !listItems?.length ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">{language === "ar" ? "لا توجد عناصر بعد" : "No items added yet"}</p>
            {!showSupermarket && (
              <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => setShowSupermarket(true)}>
                <Store className="h-4 w-4" /> {language === "ar" ? "تصفح السوبرماركت" : "Browse Supermarket"}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border">
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
                    <TableCell>{item.estimated_cost ? formatCurrency(Number(item.estimated_cost) * item.quantity, language as "en" | "ar") : "—"}</TableCell>
                    <TableCell>
                      <Badge className={PRIORITY_COLORS[item.priority || "medium"]} variant="outline">
                        {getStatusLabel(PRIORITY_LABELS, item.priority || "medium", language)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={item.status || "pending"} onValueChange={(v) => updateItemStatus.mutate({ id: item.id, status: v })}>
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["pending", "sourced", "sponsored", "purchased", "delivered"].map((s) => (
                            <SelectItem key={s} value={s}>{getStatusLabel(ITEM_STATUS_LABELS, s, language)}</SelectItem>
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
