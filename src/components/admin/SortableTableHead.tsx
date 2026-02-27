import { TableHead } from "@/components/ui/table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortDirection } from "@/hooks/useTableSort";

interface SortableTableHeadProps {
  column: string;
  label: string;
  sortColumn: string;
  sortDirection: SortDirection;
  onSort: (column: string) => void;
  className?: string;
}

export function SortableTableHead({
  column,
  label,
  sortColumn,
  sortDirection,
  onSort,
  className,
}: SortableTableHeadProps) {
  const isActive = sortColumn === column;

  return (
    <TableHead
      className={cn("cursor-pointer select-none hover:text-foreground transition-colors", className)}
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && sortDirection === "asc" && <ArrowUp className="h-3 w-3" />}
        {isActive && sortDirection === "desc" && <ArrowDown className="h-3 w-3" />}
        {!isActive && <ArrowUpDown className="h-3 w-3 opacity-30" />}
      </span>
    </TableHead>
  );
}
