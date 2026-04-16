import { useState, useCallback, useMemo } from "react";

/**
 * Generic hook for admin bulk selection & actions on table rows.
 *
 * Usage:
 * ```ts
 * const { selected, toggleOne, toggleAll, clearSelection, isAllSelected, count } = useAdminBulkActions(items);
 * ```
 */
export function useAdminBulkActions<T extends { id: string }>(items: T[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === items.length) return new Set();
      return new Set(items.map((i) => i.id));
    });
  }, [items]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const isAllSelected = useMemo(
    () => items.length > 0 && selected.size === items.length,
    [selected.size, items.length]
  );

  const selectedItems = useMemo(
    () => items.filter((i) => selected.has(i.id)),
    [items, selected]
  );

  return {
    selected,
    toggleOne,
    toggleAll,
    clearSelection,
    isAllSelected,
    count: selected.size,
    selectedItems,
    isSelected: (id: string) => selected.has(id),
  };
}
