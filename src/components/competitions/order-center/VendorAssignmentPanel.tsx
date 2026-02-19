import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { logOrderActivity } from "./orderActivityLogger";
import { notifyVendorAssigned } from "./OrderNotifications";
import { VendorStatsRow } from "./VendorStatsRow";
import { VendorSummaryCard } from "./VendorSummaryCard";
import { VendorItemAssignment } from "./VendorItemAssignment";

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
        if (variables.companyId && company) {
          notifyVendorAssigned({
            competitionId,
            assignedBy: user.id,
            vendorName: isAr && company.name_ar ? company.name_ar : company.name,
            itemName: "item",
          });
        }
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
  const assignmentRate = totalItems > 0 ? Math.round((assignedItems / totalItems) * 100) : 0;

  // Build vendor summary
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

  // Filter & group
  const filteredItems = filterCategory === "all"
    ? items
    : items.filter(i => {
        const cat = i.item_id && (i as any).requirement_items ? (i as any).requirement_items.category : null;
        return cat === filterCategory;
      });

  const grouped = lists?.map(list => ({
    ...list,
    title_ar: list.title_ar || null,
    items: filteredItems.filter(i => i.list_id === list.id),
  })).filter(g => g.items.length > 0) || [];

  return (
    <div className="space-y-6">
      <VendorStatsRow
        totalItems={totalItems}
        assignedItems={assignedItems}
        unassignedItems={unassignedItems}
        vendorCount={vendorSummary.length}
        assignmentRate={assignmentRate}
        isAr={isAr}
      />
      <VendorSummaryCard vendorSummary={vendorSummary} isAr={isAr} />
      <VendorItemAssignment
        grouped={grouped}
        companies={companies || []}
        filterCategory={filterCategory}
        onFilterChange={setFilterCategory}
        onAssign={(itemId, companyId) => assignVendor.mutate({ itemId, companyId })}
        isOrganizer={isOrganizer}
        isAr={isAr}
        language={language}
      />
    </div>
  );
}
