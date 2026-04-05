import { supabase } from "@/integrations/supabase/client";

export type OrderActionType =
  | "item_added"
  | "item_removed"
  | "status_changed"
  | "vendor_assigned"
  | "vendor_removed"
  | "quote_sent"
  | "quote_updated"
  | "suggestion_submitted"
  | "suggestion_reviewed"
  | "deadline_set"
  | "item_checked"
  | "list_created"
  | "list_updated"
  | "delivery_confirmed";

export type OrderEntityType = "item" | "list" | "quote" | "suggestion" | "vendor";

interface LogParams {
  competitionId: string;
  userId: string;
  actionType: OrderActionType;
  entityType: OrderEntityType;
  entityId?: string;
  details?: Record<string, unknown>;
}

export async function logOrderActivity(params: LogParams) {
  try {
    await supabase.from("order_activity_log" as any).insert({
      competition_id: params.competitionId,
      user_id: params.userId,
      action_type: params.actionType,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      details: params.details || {},
    });
  } catch (e) {
    console.error("Failed to log order activity:", e);
  }
}

// Bilingual action labels
export const ACTION_LABELS: Record<string, { en: string; ar: string; icon: string }> = {
  item_added: { en: "Item added to list", ar: "تمت إضافة عنصر للقائمة", icon: "plus" },
  item_removed: { en: "Item removed from list", ar: "تم حذف عنصر من القائمة", icon: "minus" },
  status_changed: { en: "Status updated", ar: "تم تحديث الحالة", icon: "refresh" },
  vendor_assigned: { en: "Vendor assigned", ar: "تم تعيين مورد", icon: "truck" },
  vendor_removed: { en: "Vendor removed", ar: "تم إزالة المورد", icon: "truck-off" },
  quote_sent: { en: "Quote request sent", ar: "تم إرسال طلب عرض أسعار", icon: "send" },
  quote_updated: { en: "Quote status updated", ar: "تم تحديث حالة العرض", icon: "file" },
  suggestion_submitted: { en: "Suggestion submitted", ar: "تم تقديم اقتراح", icon: "lightbulb" },
  suggestion_reviewed: { en: "Suggestion reviewed", ar: "تمت مراجعة الاقتراح", icon: "check" },
  deadline_set: { en: "Deadline set", ar: "تم تحديد الموعد النهائي", icon: "calendar" },
  item_checked: { en: "Item checked off", ar: "تم التحقق من العنصر", icon: "check-square" },
  list_created: { en: "List created", ar: "تم إنشاء قائمة", icon: "list" },
  list_updated: { en: "List updated", ar: "تم تحديث القائمة", icon: "edit" },
  delivery_confirmed: { en: "Delivery confirmed", ar: "تم تأكيد التسليم", icon: "package-check" },
};
