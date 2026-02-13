import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Building2, Truck, CheckCircle, Clock, Package,
  UserPlus, Star, AlertTriangle,
} from "lucide-react";
import { ITEM_STATUS_LABELS, getStatusLabel } from "./OrderStatusLabels";
import { ORDER_CATEGORIES } from "./OrderCenterCategories";
import { logOrderActivity } from "./orderActivityLogger";

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

export function VendorAssignmentPanel({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Get requirement lists
  const { data: lists } = useQuery({
    queryKey: ["vendor-lists", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_lists")
        .select("id, title, title_ar, category, status")
        .eq("competition_id", competitionId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  // Get all list items with their assigned vendors
  const { data: allItems, isLoading } = useQuery({
    queryKey: ["vendor-items", competitionId],
    queryFn: async () => {
      if (!lists?.length) return [];
      const { data, error } = await supabase
        .from("requirement_list_items")
        .select("*, requirement_items(name, name_ar, category)")
        .in("list_id", lists.map(l => l.id))
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!lists?.length,
  });

  // Get active companies
  const { data: companies } = useQuery({
    queryKey: ["vendor-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, name_ar, type, logo_url")
        .eq("status", "active")
        .order("name")
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Assign vendor mutation
  const assignVendor = useMutation({
    mutationFn: async ({ itemId, companyId }: { itemId: string; companyId: string | null }) => {
      const { error } = await supabase
        .from("requirement_list_items")
        .update({
          assigned_vendor_id: companyId,
          assigned_at: companyId ? new Date().toISOString() : null,
          assigned_by: companyId ? user!.id : null,
        } as any)
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-items", competitionId] });
      const company = companies?.find(c => c.id === variables.companyId);
      if (user) {
        logOrderActivity({
          competitionId,
          userId: user.id,
          actionType: variables.companyId ? "vendor_assigned" : "vendor_removed",
          entityType: "vendor",
          entityId: variables.itemId,
          details: { company_name: company ? (isAr && company.name_ar ? company.name_ar : company.name) : "" },
        });
      }
      toast({ title: isAr ? "تم تحديث المورد" : "Vendor updated" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const items = allItems || [];
  const totalItems = items.length;
  const assignedItems = items.filter(i => (i as any).assigned_vendor_id).length;
  const unassignedItems = totalItems - assignedItems;
  const deliveredItems = items.filter(i => i.status === "delivered").length;
  const assignmentRate = totalItems > 0 ? Math.round((assignedItems / totalItems) * 100) : 0;

  // Vendor summary
  const vendorMap = new Map<string, { name: string; nameAr: string; count: number; delivered: number }>();
  items.forEach(item => {
    const vendorId = (item as any).assigned_vendor_id;
    if (!vendorId) return;
    const company = companies?.find(c => c.id === vendorId);
    if (!company) return;
    const existing = vendorMap.get(vendorId) || { name: company.name, nameAr: company.name_ar || company.name, count: 0, delivered: 0 };
    existing.count += 1;
    if (item.status === "delivered") existing.delivered += 1;
    vendorMap.set(vendorId, existing);
  });
  const vendorSummary = Array.from(vendorMap.entries()).sort((a, b) => b[1].count - a[1].count);

  // Filter items by category
  const filteredItems = filterCategory === "all"
    ? items
    : items.filter(i => {
        const cat = i.item_id && (i as any).requirement_items
          ? (i as any).requirement_items.category
          : null;
        return cat === filterCategory;
      });

  // Group by list
  const grouped = lists?.map(list => ({
    ...list,
    items: filteredItems.filter(i => i.list_id === list.id),
  })).filter(g => g.items.length > 0) || [];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <Package className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-xl font-bold">{totalItems}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "إجمالي العناصر" : "Total Items"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <UserPlus className="mx-auto mb-1 h-5 w-5 text-chart-1" />
            <p className="text-xl font-bold">{assignedItems}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "تم التعيين" : "Assigned"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <AlertTriangle className="mx-auto mb-1 h-5 w-5 text-chart-4" />
            <p className="text-xl font-bold">{unassignedItems}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "غير معين" : "Unassigned"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <Building2 className="mx-auto mb-1 h-5 w-5 text-chart-5" />
            <p className="text-xl font-bold">{vendorSummary.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "الموردين" : "Vendors"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Progress */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">{isAr ? "نسبة التعيين" : "Assignment Rate"}</p>
            <p className="text-sm font-bold text-primary">{assignmentRate}%</p>
          </div>
          <Progress value={assignmentRate} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {assignedItems}/{totalItems} {isAr ? "عنصر معين لمورد" : "items assigned to vendors"}
          </p>
        </CardContent>
      </Card>

      {/* Vendor Summary */}
      {vendorSummary.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2 px-4 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-chart-4" />
              {isAr ? "ملخص الموردين" : "Vendor Summary"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {vendorSummary.map(([vendorId, info]) => {
              const fulfillment = info.count > 0 ? Math.round((info.delivered / info.count) * 100) : 0;
              return (
                <div key={vendorId} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{isAr ? info.nameAr : info.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {info.count} {isAr ? "عنصر" : "items"} · {info.delivered} {isAr ? "تم التسليم" : "delivered"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={fulfillment} className="h-1.5 w-16" />
                    <span className="text-xs font-medium w-8 text-end">{fulfillment}%</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">{isAr ? "تعيين الموردين" : "Assign Vendors"}</h4>
        <div className="ms-auto">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">{isAr ? "جميع الفئات" : "All Categories"}</SelectItem>
              {ORDER_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value} className="text-xs">
                  {isAr ? cat.labelAr : cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Item Assignment */}
      {!grouped.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">{isAr ? "لا توجد عناصر لتعيين موردين" : "No items to assign vendors"}</p>
          </CardContent>
        </Card>
      ) : (
        grouped.map(list => (
          <Card key={list.id} className="border-border/60 overflow-hidden">
            <CardHeader className="py-3 px-4 bg-muted/30 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {isAr && list.title_ar ? list.title_ar : list.title}
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {list.items.filter(i => (i as any).assigned_vendor_id).length}/{list.items.length} {isAr ? "معين" : "assigned"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {list.items.map(item => {
                const name = item.item_id && (item as any).requirement_items
                  ? (isAr && (item as any).requirement_items.name_ar ? (item as any).requirement_items.name_ar : (item as any).requirement_items.name)
                  : (isAr && item.custom_name_ar ? item.custom_name_ar : item.custom_name);
                const currentVendor = (item as any).assigned_vendor_id;
                return (
                  <div key={item.id} className={`flex items-center gap-3 border-b last:border-0 px-4 py-2.5 ${currentVendor ? "bg-chart-1/5" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name || "—"}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{item.quantity} {item.unit}</span>
                        <Badge variant="outline" className="text-[9px] h-4">
                          {getStatusLabel(ITEM_STATUS_LABELS, item.status || "pending", language)}
                        </Badge>
                      </div>
                    </div>
                    {isOrganizer ? (
                      <Select
                        value={currentVendor || "none"}
                        onValueChange={(v) => assignVendor.mutate({ itemId: item.id, companyId: v === "none" ? null : v })}
                      >
                        <SelectTrigger className="h-7 w-40 text-[10px]">
                          <Building2 className="me-1 h-3 w-3 shrink-0" />
                          <SelectValue placeholder={isAr ? "تعيين مورد..." : "Assign vendor..."} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">{isAr ? "بدون مورد" : "No vendor"}</SelectItem>
                          {companies?.map(c => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">
                              {isAr && c.name_ar ? c.name_ar : c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : currentVendor ? (
                      <Badge variant="secondary" className="text-[10px]">
                        <Building2 className="me-1 h-3 w-3" />
                        {(() => {
                          const c = companies?.find(c => c.id === currentVendor);
                          return c ? (isAr && c.name_ar ? c.name_ar : c.name) : "—";
                        })()}
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">{isAr ? "غير معين" : "Unassigned"}</span>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}