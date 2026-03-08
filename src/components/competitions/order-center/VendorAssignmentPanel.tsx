import { useState, useMemo, useCallback, memo } from "react";
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
import { OrderExportActions } from "./OrderExportActions";
import { OrderSearchFilter } from "./OrderSearchFilter";
import { BulkActionBar } from "./BulkActionBar";
import { useRealtimeOrderUpdates } from "@/hooks/useRealtimeOrderUpdates";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

function getItemName(item: any, isAr: boolean): string {
  if (item.item_id && item.requirement_items) {
    return isAr && item.requirement_items.name_ar ? item.requirement_items.name_ar : item.requirement_items.name;
  }
  return isAr && item.custom_name_ar ? item.custom_name_ar : item.custom_name || "—";
}

export const VendorAssignmentPanel = memo(function VendorAssignmentPanel({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useRealtimeOrderUpdates(competitionId, true);

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
          competitionId, userId: user.id,
          actionType: variables.companyId ? "vendor_assigned" : "vendor_removed",
          entityType: "vendor", entityId: variables.itemId,
          details: { company_name: company ? (isAr && company.name_ar ? company.name_ar : company.name) : "" },
        });
        if (variables.companyId && company) {
          notifyVendorAssigned({ competitionId, assignedBy: user.id, vendorName: isAr && company.name_ar ? company.name_ar : company.name, itemName: "item" });
        }
      }
      toast({ title: isAr ? "تم تحديث المورد" : "Vendor updated" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const bulkAssignVendor = useMutation({
    mutationFn: async (companyId: string) => {
      const ids = Array.from(selectedIds);
      const { error } = await supabase
        .from("requirement_list_items")
        .update({
          assigned_vendor_id: companyId,
          assigned_at: new Date().toISOString(),
          assigned_by: user!.id,
        } as any)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-items", competitionId] });
      setSelectedIds(new Set());
      toast({ title: isAr ? "تم تعيين المورد للعناصر المحددة" : "Vendor assigned to selected items" });
    },
  });

  const bulkUpdateStatus = useMutation({
    mutationFn: async (status: string) => {
      const ids = Array.from(selectedIds);
      const updates: Record<string, unknown> = { status };
      if (status === "delivered") updates.delivered_at = new Date().toISOString();
      const { error } = await supabase.from("requirement_list_items").update(updates).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-items", competitionId] });
      setSelectedIds(new Set());
      toast({ title: isAr ? "تم تحديث العناصر" : "Items updated" });
    },
  });

  // Filtering
  const filteredItems = useMemo(() => {
    if (!allItems) return [];
    return allItems.filter((item) => {
      if (filterCategory !== "all") {
        const cat = item.item_id && (item as any).requirement_items ? (item as any).requirement_items.category : null;
        if (cat !== filterCategory) return false;
      }
      if (statusFilter !== "all" && (item.status || "pending") !== statusFilter) return false;
      if (searchQuery) {
        const name = getItemName(item, isAr).toLowerCase();
        if (!name.includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });
  }, [allItems, filterCategory, statusFilter, searchQuery, isAr]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const items = allItems || [];

  const { totalItems, assignedItems, unassignedItems, assignmentRate, vendorSummary, grouped } = useMemo(() => {
    const total = items.length;
    const assigned = items.filter(i => (i as any).assigned_vendor_id).length;
    const unassigned = total - assigned;
    const rate = total > 0 ? Math.round((assigned / total) * 100) : 0;

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
    const summary = Array.from(vendorMap.entries()).sort((a, b) => b[1].count - a[1].count);

    const grp = lists?.map(list => ({
      ...list,
      title_ar: list.title_ar || null,
      items: filteredItems.filter(i => i.list_id === list.id),
    })).filter(g => g.items.length > 0) || [];

    return { totalItems: total, assignedItems: assigned, unassignedItems: unassigned, assignmentRate: rate, vendorSummary: summary, grouped: grp };
  }, [items, companies, lists, filteredItems]);

  // Export data
  const exportData = items.map(item => {
    const name = getItemName(item, false);
    const vendorId = (item as any).assigned_vendor_id;
    const company = vendorId ? companies?.find(c => c.id === vendorId) : null;
    return { item_name: name, quantity: item.quantity, unit: item.unit, status: item.status || "pending", vendor: company ? company.name : "Unassigned" };
  });

  const exportColumns = [
    { key: "item_name", label: isAr ? "العنصر" : "Item" },
    { key: "quantity", label: isAr ? "الكمية" : "Quantity" },
    { key: "unit", label: isAr ? "الوحدة" : "Unit" },
    { key: "status", label: isAr ? "الحالة" : "Status" },
    { key: "vendor", label: isAr ? "المورد" : "Vendor" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <OrderExportActions data={exportData} filename={`vendor-assignments-${competitionId}`} columns={exportColumns} />
      </div>
      <VendorStatsRow totalItems={totalItems} assignedItems={assignedItems} unassignedItems={unassignedItems} vendorCount={vendorSummary.length} assignmentRate={assignmentRate} isAr={isAr} />
      <VendorSummaryCard vendorSummary={vendorSummary} isAr={isAr} />

      {/* Search & Filter */}
      <OrderSearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        categoryFilter={filterCategory}
        onCategoryChange={setFilterCategory}
        resultCount={filteredItems.length}
        isAr={isAr}
      />

      {/* Select all */}
      {isOrganizer && filteredItems.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
            onCheckedChange={() => {
              if (selectedIds.size === filteredItems.length) setSelectedIds(new Set());
              else setSelectedIds(new Set(filteredItems.map(i => i.id)));
            }}
          />
          <span className="text-xs text-muted-foreground">
            {isAr ? "تحديد الكل" : "Select all"} ({filteredItems.length})
          </span>
        </div>
      )}

      <VendorItemAssignment
        grouped={grouped}
        companies={companies || []}
        onAssign={(itemId, companyId) => assignVendor.mutate({ itemId, companyId })}
        isOrganizer={isOrganizer}
        isAr={isAr}
        language={language}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
      />

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkStatusChange={(status) => bulkUpdateStatus.mutate(status)}
        onBulkVendorAssign={(vendorId) => bulkAssignVendor.mutate(vendorId)}
        vendors={companies?.map(c => ({ id: c.id, name: c.name, name_ar: c.name_ar })) || []}
        isAr={isAr}
        isLoading={bulkAssignVendor.isPending || bulkUpdateStatus.isPending}
      />
    </div>
  );
}
