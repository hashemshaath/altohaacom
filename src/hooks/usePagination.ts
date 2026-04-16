import { useState, useMemo, useCallback } from "react";

interface UsePaginationOptions {
  defaultPageSize?: number;
  pageSizeOptions?: number[];
}

export function usePagination<T>(data: T[], options: UsePaginationOptions = {}) {
  const { defaultPageSize = 15, pageSizeOptions = [10, 15, 25, 50, 100] } = options;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  // Reset to page 1 when data shrinks
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(
    () => data.slice((safePage - 1) * pageSize, safePage * pageSize),
    [data, safePage, pageSize]
  );

  const goTo = useCallback((p: number) => setPage(Math.max(1, Math.min(p, totalPages))), [totalPages]);
  const next = useCallback(() => goTo(safePage + 1), [safePage, goTo]);
  const prev = useCallback(() => goTo(safePage - 1), [safePage, goTo]);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  return {
    paginated,
    page: safePage,
    pageSize,
    totalPages,
    totalItems: data.length,
    startItem: data.length === 0 ? 0 : (safePage - 1) * pageSize + 1,
    endItem: Math.min(safePage * pageSize, data.length),
    goTo,
    next,
    prev,
    changePageSize,
    pageSizeOptions,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}
