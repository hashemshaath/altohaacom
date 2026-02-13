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

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

export function DeliveryChecklist({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

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
  });

  const { data: allItems, isLoading } = useQuery({
    queryKey: ["checklist-items", competitionId],
    queryFn: async () => {
      if (!lists?.length) return [];
      const listIds = lists.map(l => l.id);
      const { data, error } = await supabase
        .from("requirement_list_items")
        .select("*, requirement_items(name, name_ar, category)")
        .in("list_id", listIds)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!lists?.length,
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
        logOrderActivity({
          competitionId,
          userId: user.id,
          actionType: "item_checked",
          entityType: "item",
          entityId: variables.id,
        });
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
          competitionId,
          userId: user.id,
          actionType: variables.status === "delivered" ? "delivery_confirmed" : "status_changed",
          entityType: "item",
          entityId: variables.id,
          details: { to_status: variables.status },
        });
        if (variables.status === "delivered") {
          const currentDelivered = (allItems || []).filter(i => i.status === "delivered").length + 1;
          notifyDeliveryConfirmed({
            competitionId,
            confirmedBy: user.id,
            itemName: "item",
            totalDelivered: currentDelivered,
            totalItems: allItems?.length || 0,
          });
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

  if (isLoading || !allItems) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const total = allItems.length;
  const delivered = allItems.filter(i => i.status === "delivered").length;
  const checked = allItems.filter(i => i.checked).length;
  const overdue = allItems.filter(i => i.deadline && isPast(new Date(i.deadline)) && i.status !== "delivered").length;
  const progress = total > 0 ? Math.round((delivered / total) * 100) : 0;

  // Group by list
  const grouped = lists?.map(list => ({
    ...list,
    items: allItems.filter(i => i.list_id === list.id),
  })) || [];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <Package className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-xl font-bold">{total}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "إجمالي العناصر" : "Total Items"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <CheckCircle className="mx-auto mb-1 h-5 w-5 text-chart-5" />
            <p className="text-xl font-bold">{delivered}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "تم التسليم" : "Delivered"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <Clock className="mx-auto mb-1 h-5 w-5 text-chart-4" />
            <p className="text-xl font-bold">{total - delivered}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "قيد الانتظار" : "Pending"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <AlertTriangle className="mx-auto mb-1 h-5 w-5 text-destructive" />
            <p className="text-xl font-bold">{overdue}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{isAr ? "متأخرة" : "Overdue"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">{isAr ? "تقدم التسليم" : "Delivery Progress"}</p>
            <p className="text-sm font-bold text-primary">{progress}%</p>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {delivered}/{total} {isAr ? "تم تسليمها" : "delivered"}
          </p>
        </CardContent>
      </Card>

      {/* Checklist by List */}
      {!grouped.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">{isAr ? "لا توجد عناصر للتحقق" : "No items to check"}</p>
          </CardContent>
        </Card>
      ) : (
        grouped.map((list) => (
          <Card key={list.id} className="border-border/60 overflow-hidden">
            <CardHeader className="py-3 px-4 bg-muted/30 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {isAr && list.title_ar ? list.title_ar : list.title}
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {list.items.filter(i => i.status === "delivered").length}/{list.items.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {list.items.map((item) => {
                const name = item.item_id && item.requirement_items
                  ? (isAr && (item.requirement_items as any).name_ar ? (item.requirement_items as any).name_ar : (item.requirement_items as any).name)
                  : (isAr && item.custom_name_ar ? item.custom_name_ar : item.custom_name);
                const isOverdue = item.deadline && isPast(new Date(item.deadline)) && item.status !== "delivered";
                return (
                  <div key={item.id} className={`flex items-center gap-3 border-b last:border-0 px-4 py-2.5 ${item.status === "delivered" ? "bg-chart-5/5" : isOverdue ? "bg-destructive/5" : ""}`}>
                    <Checkbox
                      checked={!!item.checked}
                      onCheckedChange={(c) => toggleCheck.mutate({ id: item.id, checked: !!c })}
                      disabled={!isOrganizer}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${item.checked ? "line-through text-muted-foreground" : "font-medium"}`}>
                        {name || "—"}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
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
                        <SelectTrigger className="h-7 w-24 text-[10px]">
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
    </div>
  );
}
