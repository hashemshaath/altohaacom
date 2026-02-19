import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Package, Clock, AlertTriangle, Calendar } from "lucide-react";
import { format, isPast } from "date-fns";
import { ITEM_STATUS_LABELS, getStatusLabel } from "./OrderStatusLabels";
import { logOrderActivity } from "./orderActivityLogger";
import { notifyDeliveryConfirmed } from "./OrderNotifications";
import { OrderSearchFilter } from "./OrderSearchFilter";
import { BulkActionBar } from "./BulkActionBar";
import { OrderEmptyState } from "./OrderEmptyState";
import { ChecklistSkeleton } from "./OrderSkeletonCards";

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

export function DeliveryChecklist({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: lists } = useQuery({
    queryKey: ["requirement-lists-checklist", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_lists")
        .select("id, title, title_ar, category, status")
        .eq("competition_id", competitionId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: allItems, isLoading } = useQuery({
    queryKey: ["checklist-items", competitionId],
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
    staleTime: 60 * 1000,
  });

  const toggleCheck = useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      const updates: Record<string, unknown> = {
        checked,
        checked_by: checked ? user!.id : null,
        checked_at: checked ? new Date().toISOString() : null,
      };
      const { error } = await supabase.from("requirement_list_items").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklist-items", competitionId] });
      if (user && variables.checked) {
        logOrderActivity({ competitionId, userId: user.id, actionType: "item_checked", entityType: "item", entityId: variables.id });
      }
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === "delivered") updates.delivered_at = new Date().toISOString();
      const { error } = await supabase.from("requirement_list_items").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklist-items", competitionId] });
      if (user) {
        logOrderActivity({
          competitionId, userId: user.id,
          actionType: variables.status === "delivered" ? "delivery_confirmed" : "status_changed",
          entityType: "item", entityId: variables.id,
          details: { to_status: variables.status },
        });
        if (variables.status === "delivered") {
          const currentDelivered = (allItems || []).filter(i => i.status === "delivered").length + 1;
          notifyDeliveryConfirmed({ competitionId, confirmedBy: user.id, itemName: "item", totalDelivered: currentDelivered, totalItems: allItems?.length || 0 });
        }
      }
      toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
    },
  });

  const updateDeadline = useMutation({
    mutationFn: async ({ id, deadline }: { id: string; deadline: string | null }) => {
      const { error } = await supabase.from("requirement_list_items").update({ deadline }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-items", competitionId] });
      toast({ title: isAr ? "تم تحديث الموعد النهائي" : "Deadline updated" });
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
      queryClient.invalidateQueries({ queryKey: ["checklist-items", competitionId] });
      setSelectedIds(new Set());
      toast({ title: isAr ? "تم تحديث العناصر المحددة" : "Selected items updated" });
    },
  });

  // Filtering logic
  const filteredItems = useMemo(() => {
    if (!allItems) return [];
    return allItems.filter((item) => {
      if (statusFilter !== "all" && (item.status || "pending") !== statusFilter) return false;
      if (searchQuery) {
        const name = getItemName(item, isAr).toLowerCase();
        if (!name.includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });
  }, [allItems, searchQuery, statusFilter, isAr]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  }, [filteredItems, selectedIds.size]);

  if (isLoading) {
    return <ChecklistSkeleton />;
  }

  if (!allItems?.length) {
    return <OrderEmptyState type="checklist" />;
  }

  const total = allItems.length;
  const delivered = allItems.filter(i => i.status === "delivered").length;
  const overdue = allItems.filter(i => i.deadline && isPast(new Date(i.deadline)) && i.status !== "delivered").length;
  const progress = total > 0 ? Math.round((delivered / total) * 100) : 0;

  const grouped = lists?.map(list => ({
    ...list,
    items: filteredItems.filter(i => i.list_id === list.id),
  })).filter(g => g.items.length > 0) || [];

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <Package className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-xl font-bold">{total}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "إجمالي" : "Total"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <CheckCircle className="mx-auto mb-1 h-5 w-5 text-chart-5" />
            <p className="text-xl font-bold">{delivered}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "تسليم" : "Delivered"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <Clock className="mx-auto mb-1 h-5 w-5 text-chart-4" />
            <p className="text-xl font-bold">{total - delivered}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "انتظار" : "Pending"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <AlertTriangle className="mx-auto mb-1 h-5 w-5 text-destructive" />
            <p className="text-xl font-bold">{overdue}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "متأخر" : "Overdue"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card className="border-border/60">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">{isAr ? "تقدم التسليم" : "Delivery Progress"}</p>
            <p className="text-sm font-bold text-primary">{progress}%</p>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">{delivered}/{total} {isAr ? "تم" : "done"}</p>
        </CardContent>
      </Card>

      {/* Search & Filter */}
      <OrderSearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        resultCount={filteredItems.length}
        isAr={isAr}
        showCategory={false}
      />

      {/* Select All toggle */}
      {isOrganizer && filteredItems.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-xs text-muted-foreground">
            {isAr ? "تحديد الكل" : "Select all"} ({filteredItems.length})
          </span>
        </div>
      )}

      {/* Checklist */}
      {!grouped.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">{isAr ? "لا توجد نتائج" : "No results found"}</p>
          </CardContent>
        </Card>
      ) : (
        grouped.map((list) => (
          <Card key={list.id} className="border-border/60 overflow-hidden">
            <CardHeader className="py-2.5 px-3 sm:px-4 bg-muted/30 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm truncate">
                  {isAr && list.title_ar ? list.title_ar : list.title}
                </CardTitle>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {list.items.filter(i => i.status === "delivered").length}/{list.items.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {list.items.map((item) => {
                const name = getItemName(item, isAr);
                const isOverdue = item.deadline && isPast(new Date(item.deadline)) && item.status !== "delivered";
                const isSelected = selectedIds.has(item.id);
                return (
                  <div key={item.id} className={`flex items-center gap-2 sm:gap-3 border-b last:border-0 px-3 sm:px-4 py-2 ${item.status === "delivered" ? "bg-chart-5/5" : isOverdue ? "bg-destructive/5" : ""} ${isSelected ? "ring-1 ring-inset ring-primary/30 bg-primary/5" : ""}`}>
                    {isOrganizer && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(item.id)}
                        className="shrink-0"
                      />
                    )}
                    <Checkbox
                      checked={!!item.checked}
                      onCheckedChange={(c) => toggleCheck.mutate({ id: item.id, checked: !!c })}
                      disabled={!isOrganizer}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs sm:text-sm ${item.checked ? "line-through text-muted-foreground" : "font-medium"} truncate`}>
                        {name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                        <span>{item.quantity} {item.unit}</span>
                        {isOrganizer ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <Input
                              type="date"
                              className="h-5 w-28 text-[10px] border-dashed px-1"
                              value={item.deadline ? item.deadline.split("T")[0] : ""}
                              onChange={(e) => updateDeadline.mutate({ id: item.id, deadline: e.target.value || null })}
                            />
                          </div>
                        ) : item.deadline ? (
                          <span className={isOverdue ? "text-destructive font-medium" : ""}>
                            {isAr ? "الموعد:" : "Due:"} {format(new Date(item.deadline), "MMM d")}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {isOrganizer && (
                      <Select value={item.status || "pending"} onValueChange={(v) => updateStatus.mutate({ id: item.id, status: v })}>
                        <SelectTrigger className="h-7 w-20 sm:w-24 text-[10px] shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["pending", "sourced", "sponsored", "purchased", "delivered"].map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">{getStatusLabel(ITEM_STATUS_LABELS, s, language)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkStatusChange={(status) => bulkUpdateStatus.mutate(status)}
        isAr={isAr}
        isLoading={bulkUpdateStatus.isPending}
      />
    </div>
  );
}
