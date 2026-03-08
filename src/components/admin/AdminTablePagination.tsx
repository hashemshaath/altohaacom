import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
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

export function AdminTablePagination({
  page, totalPages, totalItems, startItem, endItem,
  pageSize, pageSizeOptions, hasNext, hasPrev,
  onPageChange, onPageSizeChange,
}: AdminTablePaginationProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {isAr
            ? `عرض ${startItem}–${endItem} من ${totalItems}`
            : `Showing ${startItem}–${endItem} of ${totalItems}`}
        </span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-7 w-[70px] text-xs">
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
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!hasPrev} onClick={() => onPageChange(1)}>
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!hasPrev} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs text-muted-foreground px-2 min-w-[60px] text-center">
          {isAr ? `${page} / ${totalPages}` : `${page} / ${totalPages}`}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!hasNext} onClick={() => onPageChange(totalPages)}>
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
