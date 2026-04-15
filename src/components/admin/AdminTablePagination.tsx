import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface AdminTablePaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  startItem: number;
  endItem: number;
  pageSize: number;
  pageSizeOptions: number[];
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const AdminTablePagination = memo(function AdminTablePagination({
  page, totalPages, totalItems, startItem, endItem,
  pageSize, pageSizeOptions, hasNext, hasPrev,
  onPageChange, onPageSizeChange,
}: AdminTablePaginationProps) {
  const isAr = useIsAr();

  if (totalItems === 0) return null;

  return (
    <nav className="flex items-center justify-between px-4 py-3 border-t border-border/40" aria-label={isAr ? "التنقل بين الصفحات" : "Table pagination"}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span aria-live="polite">
          {isAr
            ? `عرض ${startItem}–${endItem} من ${totalItems}`
            : `Showing ${startItem}–${endItem} of ${totalItems}`}
        </span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-7 w-[70px] text-xs" aria-label={isAr ? "عدد الصفوف لكل صفحة" : "Rows per page"}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((s) => (
              <SelectItem key={s} value={String(s)}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground/60">{isAr ? "لكل صفحة" : "per page"}</span>
      </div>
      <div className="flex items-center gap-1" role="group" aria-label={isAr ? "أزرار التنقل" : "Page navigation"}>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!hasPrev} onClick={() => onPageChange(1)} aria-label={isAr ? "الصفحة الأولى" : "First page"}>
          <ChevronsLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!hasPrev} onClick={() => onPageChange(page - 1)} aria-label={isAr ? "الصفحة السابقة" : "Previous page"}>
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <span className="text-xs font-medium px-2 min-w-[60px] text-center tabular-nums" aria-current="page">
          <span className="text-foreground">{page}</span>
          <span className="text-muted-foreground/50"> / </span>
          <span className="text-muted-foreground">{totalPages}</span>
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!hasNext} onClick={() => onPageChange(page + 1)} aria-label={isAr ? "الصفحة التالية" : "Next page"}>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!hasNext} onClick={() => onPageChange(totalPages)} aria-label={isAr ? "الصفحة الأخيرة" : "Last page"}>
          <ChevronsRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
});
