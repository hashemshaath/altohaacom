/**
 * Shared utilities for Order Center components.
 * Reduces duplication across panels.
 */

/** Extract bilingual item name from a requirement list item */
export function getItemDisplayName(item: any, isAr: boolean): string {
  if (item.item_id && item.requirement_items) {
    const ri = item.requirement_items;
    return isAr && ri.name_ar ? ri.name_ar : ri.name || "—";
  }
  return isAr && item.custom_name_ar ? item.custom_name_ar : item.custom_name || "—";
}

/** Get item category from nested requirement_items */
export function getItemCategory(item: any): string | null {
  return item.item_id && item.requirement_items ? item.requirement_items.category : null;
}

/** Calculate stats from an array of order items */
export function calcOrderStats(items: any[]) {
  const total = items.length;
  const delivered = items.filter(i => i.status === "delivered").length;
  const pending = items.filter(i => !i.status || i.status === "pending").length;
  const overdue = items.filter(i => i.deadline && new Date(i.deadline) < new Date() && i.status !== "delivered").length;
  const assigned = items.filter(i => (i as any).assigned_vendor_id).length;
  const progress = total > 0 ? Math.round((delivered / total) * 100) : 0;

  return { total, delivered, pending, overdue, assigned, unassigned: total - assigned, progress };
}

/** Standard loading spinner for Order Center panels */
export function OrderPanelLoader() {
  return (
    <div className="flex justify-center py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
