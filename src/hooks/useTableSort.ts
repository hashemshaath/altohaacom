import { useState, useMemo, useCallback } from "react";

export type SortDirection = "asc" | "desc" | null;

interface SortConfig {
  column: string;
  direction: SortDirection;
}

/**
 * Generic hook for sortable table columns.
 * Returns sorted data + helpers for toggling sort on column headers.
 */
export function useTableSort<T>(data: T[], defaultColumn?: string, defaultDir: SortDirection = null) {
  const [sort, setSort] = useState<SortConfig>({
    column: defaultColumn || "",
    direction: defaultDir,
  });

  const toggleSort = useCallback((column: string) => {
    setSort((prev) => {
      if (prev.column !== column) return { column, direction: "asc" };
      if (prev.direction === "asc") return { column, direction: "desc" };
      if (prev.direction === "desc") return { column: "", direction: null };
      return { column, direction: "asc" };
    });
  }, []);

  const sorted = useMemo(() => {
    if (!sort.column || !sort.direction || !data) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as any)[sort.column];
      const bVal = (b as any)[sort.column];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let cmp: number;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else if (typeof aVal === "boolean") {
        cmp = aVal === bVal ? 0 : aVal ? -1 : 1;
      } else {
        cmp = String(aVal).localeCompare(String(bVal), undefined, { sensitivity: "base" });
      }

      return sort.direction === "desc" ? -cmp : cmp;
    });
  }, [data, sort]);

  return {
    sorted,
    sortColumn: sort.column,
    sortDirection: sort.direction,
    toggleSort,
  };
}
